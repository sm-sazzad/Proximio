// ESP32 Distance Monitor - Step 2
// WiFiManager (WiFi chosen from phone) + Firebase Realtime Database (REST)
//
// Libraries to install (Library Manager):
//   - WiFiManager        by tzapu
//   - ArduinoJson        by Benoit Blanchon (v7)
//   - LiquidCrystal      by Arduino, Adafruit

#include <WiFi.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>

// ---------------- Settings ----------------
const char* DB_URL  = "https://distance-monitor-1c7b9-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* AP_NAME = "DistMon-Setup";            // setup hotspot name
const unsigned long SYNC_INTERVAL_MS = 3000;      // how often to talk to Firebase

// ---------------- Pins ----------------
LiquidCrystal lcd(22, 23, 21, 19, 18, 17);        // RS, E, D4, D5, D6, D7
const int TRIG_PIN      = 25;
const int ECHO_PIN      = 26;
const int BUZZER_PIN    = 27;
const int RESET_BTN_PIN = 0;                      // BOOT button

// ---------------- Shared state (sensor loop <-> cloud task) ----------------
volatile float g_distance       = -1;
volatile bool  g_alarm          = false;
volatile int   g_minCm          = 10;
volatile int   g_maxCm          = 50;
volatile bool  g_buzzerEnabled  = true;
volatile bool  g_armed          = true;
volatile bool  g_logPending     = false;
volatile float g_logDistance    = 0;

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
  if (g_distance < 0) return "nosensor";
  if (g_alarm) return "alert";
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

// ---------------- Firebase (REST) ----------------
bool firebaseRequest(const char* method, const String& path, const String& body, String* response = nullptr) {
  WiFiClientSecure client;
  client.setInsecure();                           // OK for a college project
  HTTPClient http;
  if (!http.begin(client, String(DB_URL) + path + ".json")) return false;
  http.setTimeout(6000);
  http.addHeader("Content-Type", "application/json");
  int code = http.sendRequest(method, body);
  if (response && code > 0) *response = http.getString();
  http.end();
  return code >= 200 && code < 300;
}

void pushLive() {
  char body[200];
  snprintf(body, sizeof(body),
           "{\"distance\":%.1f,\"status\":\"%s\",\"rssi\":%d,\"uptime\":%lu,\"ts\":{\".sv\":\"timestamp\"}}",
           (float)g_distance, statusKey(), WiFi.RSSI(), millis() / 1000);
  firebaseRequest("PUT", "/live", body);
}

void pullControl() {
  String res;
  if (!firebaseRequest("GET", "/control", "", &res)) return;

  if (res == "null") {                            // first run: create defaults
    firebaseRequest("PUT", "/control",
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

void pushLog() {
  char body[120];
  snprintf(body, sizeof(body),
           "{\"distance\":%.1f,\"ts\":{\".sv\":\"timestamp\"}}", (float)g_logDistance);
  if (firebaseRequest("POST", "/logs", body)) g_logPending = false;
}

// Runs on the other core so sensor + buzzer never wait for the network
void cloudTask(void* param) {
  for (;;) {
    if (WiFi.status() == WL_CONNECTED) {
      if (g_logPending) pushLog();
      pushLive();
      pullControl();
    } else {
      WiFi.reconnect();
    }
    vTaskDelay(SYNC_INTERVAL_MS / portTICK_PERIOD_MS);
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
  handleResetButton();

  float d = readDistanceCm();
  g_distance = d;

  bool inRange = (d >= 0) && (d >= g_minCm) && (d <= g_maxCm);
  bool alarm   = g_armed && inRange;

  if (alarm && !g_alarm) {                        // alarm just started
    g_logDistance = d;
    g_logPending  = true;
  }
  g_alarm = alarm;

  digitalWrite(BUZZER_PIN, (alarm && g_buzzerEnabled) ? HIGH : LOW);
  updateLcd(d);

  Serial.print("Distance: ");
  Serial.print(d, 1);
  Serial.print(" cm | status: ");
  Serial.println(statusKey());

  delay(300);
}
