// ESP32 Distance Monitor - Step 2 (v2: fast events)
// WiFiManager + Firebase Realtime Database (REST)
//
// New in v2:
//  - sensor read every 100 ms
//  - Firebase is updated immediately when an alarm starts/ends
//  - every alarm event is logged with closest distance + duration
//  - ALERT stays visible for 1.5 s after the object leaves
//  - live update every 1 s, controls read every 3 s
//
// Libraries (Library Manager):
//   WiFiManager (tzapu), ArduinoJson (v7), LiquidCrystal (Arduino, Adafruit)

#include <WiFi.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>

// ---------------- Settings ----------------
const char* DB_URL  = "https://distance-monitor-1c7b9-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* AP_NAME = "DistMon-Setup";

const unsigned long SENSOR_INTERVAL_MS  = 100;    // sensor read period
const unsigned long LIVE_INTERVAL_MS    = 1000;   // regular live update
const unsigned long CONTROL_INTERVAL_MS = 3000;   // read controls from Firebase
const unsigned long ALERT_HOLD_MS       = 1500;   // keep ALERT after object leaves

// ---------------- Pins ----------------
LiquidCrystal lcd(22, 23, 21, 19, 18, 17);        // RS, E, D4, D5, D6, D7
const int TRIG_PIN      = 25;
const int ECHO_PIN      = 26;
const int BUZZER_PIN    = 27;
const int RESET_BTN_PIN = 0;                      // BOOT button

// ---------------- Shared state (sensor loop <-> cloud task) ----------------
volatile float         g_distance      = -1;
volatile bool          g_alarm         = false;
volatile int           g_minCm         = 10;
volatile int           g_maxCm         = 50;
volatile bool          g_buzzerEnabled = true;
volatile bool          g_armed         = true;
volatile bool          g_forcePush     = false;   // push live data right now
volatile unsigned long g_eventCount    = 0;       // total alarm events since boot
volatile float         g_lastEventMin  = 0;       // closest distance of latest event

// Queue of finished alarm events waiting to be sent to /logs
struct AlarmEvent {
  float minCm;
  unsigned long durationMs;
};
const int QUEUE_SIZE = 8;
AlarmEvent g_queue[QUEUE_SIZE];
volatile int g_qHead = 0;   // written by sensor loop
volatile int g_qTail = 0;   // read by cloud task

void queuePush(float minCm, unsigned long durationMs) {
  int next = (g_qHead + 1) % QUEUE_SIZE;
  if (next == g_qTail) return;                    // queue full: drop
  g_queue[g_qHead].minCm = minCm;
  g_queue[g_qHead].durationMs = durationMs;
  g_qHead = next;
}

// ---------------- Helpers ----------------
void showMessage(const char* line1, const char* line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

void configModeCallback(WiFiManager* wm) {
  showMessage("Connect phone to", AP_NAME);
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  return duration * 0.0343 / 2.0;
}

const char* statusLabel() {                       // shown on LCD
  if (!g_armed) return "Disarmed";
  if (g_distance < 0) return "No echo";
  if (g_alarm) return "ALERT!";
  return "Safe";
}

const char* statusKey() {                         // sent to Firebase
  if (!g_armed) return "disarmed";
  if (g_alarm) return "alert";
  if (g_distance < 0) return "nosensor";
  return "safe";
}

void updateLcd(float d) {
  char buf[17];
  char out[17];

  if (d < 0) strcpy(buf, "Dist: -- cm");
  else snprintf(buf, sizeof(buf), "Dist: %.1f cm", d);
  snprintf(out, sizeof(out), "%-16s", buf);
  lcd.setCursor(0, 0);
  lcd.print(out);

  bool wifiOk = (WiFi.status() == WL_CONNECTED);
  snprintf(out, sizeof(out), "%-8s%s", statusLabel(), wifiOk ? "WiFi:OK" : "No WiFi");
  lcd.setCursor(0, 1);
  lcd.print(out);
}

// Hold BOOT button for 3 seconds to forget saved WiFi
void handleResetButton() {
  static unsigned long pressedAt = 0;
  if (digitalRead(RESET_BTN_PIN) == LOW) {
    if (pressedAt == 0) pressedAt = millis();
    if (millis() - pressedAt > 3000) {
      showMessage("WiFi reset...", "Release BOOT btn");
      WiFiManager wm;
      wm.resetSettings();
      while (digitalRead(RESET_BTN_PIN) == LOW) delay(50);
      delay(500);
      ESP.restart();
    }
  } else {
    pressedAt = 0;
  }
}

// ---------------- Firebase (REST, connection reused) ----------------
WiFiClientSecure g_client;
HTTPClient g_http;

// path must already contain ".json" (and optional query)
bool firebaseRequest(const char* method, const String& path, const String& body, String* response = nullptr) {
  for (int attempt = 0; attempt < 2; attempt++) {
    g_client.setInsecure();                       // OK for a college project
    if (!g_http.begin(g_client, String(DB_URL) + path)) return false;
    g_http.setReuse(true);
    g_http.setTimeout(5000);
    g_http.addHeader("Content-Type", "application/json");
    int code = g_http.sendRequest(method, body);
    if (response && code > 0) *response = g_http.getString();
    g_http.end();
    if (code > 0) return code >= 200 && code < 300;
    g_client.stop();                              // connection broke: retry once
  }
  return false;
}

void pushLive() {
  char body[260];
  snprintf(body, sizeof(body),
           "{\"distance\":%.1f,\"status\":\"%s\",\"rssi\":%d,\"uptime\":%lu,"
           "\"events\":%lu,\"lastEventMin\":%.1f,\"ts\":{\".sv\":\"timestamp\"}}",
           (float)g_distance, statusKey(), WiFi.RSSI(), millis() / 1000,
           (unsigned long)g_eventCount, (float)g_lastEventMin);
  firebaseRequest("PUT", "/live.json?print=silent", body);
}

void pullControl() {
  String res;
  if (!firebaseRequest("GET", "/control.json", "", &res)) return;

  if (res == "null") {                            // first run: create defaults
    firebaseRequest("PUT", "/control.json?print=silent",
                    "{\"minCm\":10,\"maxCm\":50,\"buzzerEnabled\":true,\"armed\":true}");
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, res)) return;

  int mn = doc["minCm"] | 10;
  int mx = doc["maxCm"] | 50;
  if (mn >= 0 && mx > mn && mx <= 400) {
    g_minCm = mn;
    g_maxCm = mx;
  }
  g_buzzerEnabled = doc["buzzerEnabled"] | true;
  g_armed         = doc["armed"] | true;
}

void pushLogs() {
  while (g_qTail != g_qHead) {
    AlarmEvent e = g_queue[g_qTail];
    char body[160];
    snprintf(body, sizeof(body),
             "{\"minDistance\":%.1f,\"durationMs\":%lu,\"ts\":{\".sv\":\"timestamp\"}}",
             e.minCm, e.durationMs);
    if (!firebaseRequest("POST", "/logs.json?print=silent", body)) break;
    g_qTail = (g_qTail + 1) % QUEUE_SIZE;
  }
}

// Runs on the other core so sensor + buzzer never wait for the network
void cloudTask(void* param) {
  unsigned long lastLive = 0;
  unsigned long lastControl = 0;

  for (;;) {
    if (WiFi.status() == WL_CONNECTED) {
      unsigned long now = millis();

      if (g_forcePush || now - lastLive >= LIVE_INTERVAL_MS) {
        g_forcePush = false;
        pushLive();
        lastLive = millis();
      }

      pushLogs();

      if (now - lastControl >= CONTROL_INTERVAL_MS) {
        pullControl();
        lastControl = millis();
      }
    } else {
      WiFi.reconnect();
      vTaskDelay(2000 / portTICK_PERIOD_MS);
    }
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

// ---------------- Arduino entry points ----------------
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(RESET_BTN_PIN, INPUT_PULLUP);

  lcd.begin(16, 2);
  showMessage("Distance Monitor", "Starting...");
  delay(1200);

  showMessage("WiFi connecting", "Please wait...");
  WiFiManager wm;
  wm.setAPCallback(configModeCallback);
  wm.setConfigPortalTimeout(180);                 // give up after 3 minutes

  if (wm.autoConnect(AP_NAME)) {
    showMessage("WiFi connected", WiFi.localIP().toString().c_str());
  } else {
    WiFi.mode(WIFI_STA);
    WiFi.begin();
    showMessage("Offline mode", "Local alarm only");
  }
  delay(1500);

  WiFi.setAutoReconnect(true);
  xTaskCreatePinnedToCore(cloudTask, "cloud", 12288, NULL, 1, NULL, 0);
}

void loop() {
  static bool          eventActive = false;
  static unsigned long eventStart  = 0;
  static unsigned long lastInRange = 0;
  static unsigned long holdUntil   = 0;
  static float         eventMin    = 0;

  handleResetButton();

  float d = readDistanceCm();
  g_distance = d;
  unsigned long now = millis();

  bool inRange = g_armed && (d >= 0) && (d >= g_minCm) && (d <= g_maxCm);
  if (inRange) {
    holdUntil = now + ALERT_HOLD_MS;
    lastInRange = now;
  }
  bool alarm = g_armed && (inRange || now < holdUntil);

  // Event start
  if (alarm && !eventActive) {
    eventActive = true;
    eventStart  = now;
    eventMin    = d;
    g_eventCount = g_eventCount + 1;
    g_lastEventMin = d;
  }

  // Track closest distance during the event
  if (eventActive && inRange && d < eventMin) {
    eventMin = d;
    g_lastEventMin = d;
  }

  // Event end -> queue a log entry
  if (!alarm && eventActive) {
    eventActive = false;
    unsigned long dur = lastInRange - eventStart;
    if (dur < SENSOR_INTERVAL_MS) dur = SENSOR_INTERVAL_MS;
    queuePush(eventMin, dur);
  }

  // Tell the cloud task right away if the alarm state changed
  bool changed = (alarm != g_alarm);
  g_alarm = alarm;
  if (changed) g_forcePush = true;

  digitalWrite(BUZZER_PIN, (alarm && g_buzzerEnabled) ? HIGH : LOW);
  updateLcd(d);

  Serial.print("Distance: ");
  Serial.print(d, 1);
  Serial.print(" cm | status: ");
  Serial.println(statusKey());

  delay(SENSOR_INTERVAL_MS);
}
