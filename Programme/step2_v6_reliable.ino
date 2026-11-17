// ESP32 Distance Monitor - Step 2 (v6: reliable cloud sync)
// WiFiManager + Firebase Realtime Database (REST) + Telegram bot notifications
//
// Changed in v6 (fixes the website randomly showing "Offline"):
//  - Telegram runs in its OWN task, so a slow Telegram call can never delay
//    the live Firebase update
//  - WiFi power-save is turned off (more stable with phone hotspots)
//  - short network timeouts, one attempt per cycle (no 10 second stalls)
//  - self-healing: if nothing reaches Firebase for 45 s the WiFi is
//    reconnected, and after 3 minutes the board restarts
//  - LCD line 2 shows "Web:OK" or "Web:ERR" (is data really reaching Firebase?)
//  - Serial Monitor prints heap memory and any slow/failed request
//
// Libraries (Library Manager):
//   WiFiManager (tzapu), ArduinoJson (v7), LiquidCrystal (Arduino, Adafruit)
//
// SECURITY: this file contains your bot token. Do NOT upload it to GitHub or
// share it. If it leaks, open @BotFather and use /revoke to get a new token.

#include <WiFi.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>
#include <time.h>

// ---------------- Settings ----------------
const char* DB_URL  = "https://distance-monitor-1c7b9-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* AP_NAME = "DistMon-Setup";

// Telegram: paste your own values here
const char* TG_BOT_TOKEN = "PASTE_BOT_TOKEN_HERE";   // from @BotFather
const char* TG_CHAT_ID   = "PASTE_CHAT_ID_HERE";     // your chat or group id
const char* DASHBOARD_URL = "";                      // your Vercel link (must start with https://), or leave empty
const unsigned long TG_COOLDOWN_MS = 15000;          // min gap between alert messages
const bool TG_SEND_CLEARED   = true;                 // send an "all clear" reply when the object leaves
const bool TG_CLEARED_SILENT = true;                 // "all clear" arrives without notification sound
const long TZ_OFFSET_SEC = 6 * 3600;                 // Bangladesh = UTC+6

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

// ---------------- Shared state ----------------
volatile float         g_distance      = -1;
volatile bool          g_alarm         = false;
volatile int           g_minCm         = 10;
volatile int           g_maxCm         = 50;
volatile bool          g_buzzerEnabled = true;
volatile bool          g_armed         = true;
volatile bool          g_tgEnabled     = true;    // Telegram on/off (from /control)
volatile bool          g_forcePush     = false;   // push live data right now
volatile unsigned long g_eventCount    = 0;       // total alarm events since boot
volatile float         g_lastEventMin  = 0;       // closest distance of latest event

volatile bool          g_controlLoaded = false;   // first /control read succeeded
volatile unsigned long g_lastLiveOkMs  = 0;       // last successful live push
volatile int           g_liveFails     = 0;       // consecutive failed live pushes

// Events sent from the sensor loop to the Telegram task
struct TgEvent {
  uint8_t type;              // 1 = alert started, 2 = alert ended
  float distance;            // start: distance, end: closest distance
  unsigned long durationMs;  // end only
  unsigned long eventNo;
};
QueueHandle_t g_tgQueue = NULL;

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

// LCD line 2 right side: "No WiFi", "Web:OK" (data reaches Firebase) or "Web:ERR"
const char* netLabel() {
  if (WiFi.status() != WL_CONNECTED) return "No WiFi";
  if (g_lastLiveOkMs != 0 && millis() - g_lastLiveOkMs < 10000) return "Web:OK";
  return "Web:ERR";
}

void updateLcd(float d) {
  char buf[17];
  char out[17];

  if (d < 0) strcpy(buf, "Dist: -- cm");
  else snprintf(buf, sizeof(buf), "Dist: %.1f cm", d);
  snprintf(out, sizeof(out), "%-16s", buf);
  lcd.setCursor(0, 0);
  lcd.print(out);

  snprintf(out, sizeof(out), "%-9s%s", statusLabel(), netLabel());
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

// path must already contain ".json" (and optional query). One attempt only.
bool firebaseRequest(const char* method, const String& path, const String& body, String* response = nullptr) {
  unsigned long t0 = millis();
  g_client.setInsecure();                         // OK for a college project
  if (!g_http.begin(g_client, String(DB_URL) + path)) return false;
  g_http.setReuse(true);
  g_http.setConnectTimeout(3000);
  g_http.setTimeout(3000);
  g_http.addHeader("Content-Type", "application/json");
  int code = g_http.sendRequest(method, body);
  if (response && code > 0) *response = g_http.getString();
  g_http.end();
  if (code < 0) g_client.stop();                  // broken connection: reconnect next time

  unsigned long took = millis() - t0;
  if (code < 200 || code >= 300 || took > 1500) { // log only problems
    Serial.printf("[fb] %s %s -> %d (%lu ms)\n", method, path.c_str(), code, took);
  }
  return code >= 200 && code < 300;
}

bool pushLive() {
  char body[260];
  snprintf(body, sizeof(body),
           "{\"distance\":%.1f,\"status\":\"%s\",\"rssi\":%d,\"uptime\":%lu,"
           "\"events\":%lu,\"lastEventMin\":%.1f,\"ts\":{\".sv\":\"timestamp\"}}",
           (float)g_distance, statusKey(), WiFi.RSSI(), millis() / 1000,
           (unsigned long)g_eventCount, (float)g_lastEventMin);
  return firebaseRequest("PUT", "/live.json?print=silent", body);
}

void pullControl() {
  String res;
  if (!firebaseRequest("GET", "/control.json", "", &res)) return;
  g_controlLoaded = true;

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
  g_tgEnabled     = doc["telegramEnabled"] | true;   // missing field = enabled
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

// ---------------- Telegram: message building ----------------
const char* signalLabel(int rssi) {
  if (rssi >= -55) return "Excellent";
  if (rssi >= -67) return "Good";
  if (rssi >= -80) return "Fair";
  return "Weak";
}

// Local time like "13 Nov 2026, 03:45:12 PM" (empty if time is not synced yet)
String nowString() {
  struct tm t;
  if (!getLocalTime(&t, 100)) return "";
  char buf[32];
  strftime(buf, sizeof(buf), "%d %b %Y, %I:%M:%S %p", &t);
  return String(buf);
}

// Same rule as the website: nearest third of the alert range = DANGER
bool zoneIsDanger(float d) {
  float third = (g_maxCm - g_minCm) / 3.0;
  return d <= g_minCm + third;
}

String buildAlertText(float d, unsigned long eventNo) {
  int rssi = WiFi.RSSI();
  String t;
  t += "🚨 <b>PROXIMO ALERT</b>\n";
  t += "━━━━━━━━━━━━━━\n";
  t += "📏 <b>Distance</b>   <code>" + String(d, 1) + " cm</code>\n";
  t += zoneIsDanger(d) ? "🔴 <b>Zone</b>   DANGER\n" : "🟠 <b>Zone</b>   CAUTION\n";
  t += "🎯 <b>Alert range</b>   <code>" + String((int)g_minCm) + " to " + String((int)g_maxCm) + " cm</code>\n";
  t += "🔔 <b>Alert no.</b>   " + String(eventNo) + "\n";
  t += "📶 <b>WiFi</b>   " + String(signalLabel(rssi)) + " (" + String(rssi) + " dBm)\n";
  String ts = nowString();
  if (ts.length()) t += "🕒 " + ts + "\n";
  return t;
}

// Short follow-up, sent as a reply to the alert message
String buildClearedText(float minD, unsigned long durMs, unsigned long eventNo) {
  String t;
  t += "✅ <b>ALL CLEAR</b>   ·   Alert no. " + String(eventNo) + "\n";
  t += "📏 <b>Closest</b>   <code>" + String(minD, 1) + " cm</code>\n";
  t += "⏱ <b>Lasted</b>   <code>" + String(durMs / 1000.0, 1) + " s</code>\n";
  String ts = nowString();
  if (ts.length()) t += "🕒 Cleared at " + ts + "\n";
  return t;
}

String buildOnlineText() {
  int rssi = WiFi.RSSI();
  String t;
  t += "🟢 <b>PROXIMO ONLINE</b>\n";
  t += "━━━━━━━━━━━━━━\n";
  t += "🛡 <b>Monitoring</b>   ";
  t += g_armed ? "Armed\n" : "Disarmed\n";
  t += "🎯 <b>Alert range</b>   <code>" + String((int)g_minCm) + " to " + String((int)g_maxCm) + " cm</code>\n";
  t += "🔊 <b>Buzzer</b>   ";
  t += g_buzzerEnabled ? "On\n" : "Off\n";
  t += "📶 <b>WiFi</b>   " + String(signalLabel(rssi)) + " (" + String(rssi) + " dBm)\n";
  String ts = nowString();
  if (ts.length()) t += "🕒 " + ts + "\n";
  return t;
}

// ---------------- Telegram: sending ----------------
bool telegramConfigured() {
  return strncmp(TG_BOT_TOKEN, "PASTE", 5) != 0 && strncmp(TG_CHAT_ID, "PASTE", 5) != 0;
}

// Calls a Bot API method. Returns the message_id on success (1 if unknown), 0 on failure.
long telegramCall(const char* method, JsonDocument& doc) {
  if (!telegramConfigured()) return 0;

  String body;
  serializeJson(doc, body);

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  String url = String("https://api.telegram.org/bot") + TG_BOT_TOKEN + "/" + method;
  if (!http.begin(client, url)) return 0;
  http.setConnectTimeout(5000);
  http.setTimeout(8000);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(body);
  long messageId = 0;
  if (code == 200) {
    JsonDocument resp;
    if (!deserializeJson(resp, http.getString())) {
      messageId = resp["result"]["message_id"] | 0L;
    }
  }
  http.end();

  Serial.printf("[tg] %s -> %d\n", method, code);

  if (code != 200) return 0;
  return messageId > 0 ? messageId : 1;
}

void fillCommon(JsonDocument& doc, const String& text) {
  doc["chat_id"] = TG_CHAT_ID;
  doc["text"] = text;
  doc["parse_mode"] = "HTML";
  doc["disable_web_page_preview"] = true;

  if (strlen(DASHBOARD_URL) > 8) {                // optional inline button
    JsonArray rows = doc["reply_markup"]["inline_keyboard"].to<JsonArray>();
    JsonArray row = rows.add<JsonArray>();
    JsonObject btn = row.add<JsonObject>();
    btn["text"] = "🌐 Open Dashboard";
    btn["url"] = DASHBOARD_URL;
  }
}

long sendTelegramText(const String& text) {
  JsonDocument doc;
  fillCommon(doc, text);
  return telegramCall("sendMessage", doc);
}

// New message shown as a reply to an earlier one. The earlier message is untouched.
bool sendTelegramReply(long replyToId, const String& text, bool silent) {
  JsonDocument doc;
  fillCommon(doc, text);
  doc["reply_parameters"]["message_id"] = replyToId;
  doc["reply_parameters"]["allow_sending_without_reply"] = true;
  if (silent) doc["disable_notification"] = true;
  return telegramCall("sendMessage", doc) > 0;
}

// ---------------- Tasks ----------------
// Firebase task: ONLY talks to Firebase, never waits for Telegram
void cloudTask(void* param) {
  unsigned long lastLive = 0;
  unsigned long lastControl = 0;
  unsigned long lastDebug = 0;
  unsigned long lastKick = 0;
  g_lastLiveOkMs = millis();

  for (;;) {
    unsigned long now = millis();

    if (WiFi.status() == WL_CONNECTED) {

      // Self-healing when nothing reaches Firebase
      unsigned long sinceOk = now - g_lastLiveOkMs;
      if (sinceOk > 180000UL) {
        Serial.println("[net] no cloud connection for 3 min -> restarting");
        delay(200);
        ESP.restart();
      } else if (sinceOk > 45000UL && now - lastKick > 30000UL) {
        Serial.println("[net] no cloud data for 45 s -> reconnecting WiFi");
        lastKick = now;
        WiFi.disconnect();
        WiFi.reconnect();
        vTaskDelay(3000 / portTICK_PERIOD_MS);
        continue;
      }

      if (g_forcePush || now - lastLive >= LIVE_INTERVAL_MS) {
        g_forcePush = false;
        if (pushLive()) {
          g_lastLiveOkMs = millis();
          g_liveFails = 0;
        } else {
          g_liveFails = g_liveFails + 1;
        }
        lastLive = millis();
      }

      pushLogs();

      if (now - lastControl >= CONTROL_INTERVAL_MS) {
        pullControl();
        lastControl = millis();
      }

      if (now - lastDebug >= 5000) {
        lastDebug = now;
        Serial.printf("[net] heap=%u min=%u live_ok=%lus ago fails=%d rssi=%d\n",
                      ESP.getFreeHeap(), ESP.getMinFreeHeap(),
                      (millis() - g_lastLiveOkMs) / 1000, (int)g_liveFails, WiFi.RSSI());
      }
    } else {
      WiFi.reconnect();
      vTaskDelay(2000 / portTICK_PERIOD_MS);
    }
    vTaskDelay(50 / portTICK_PERIOD_MS);
  }
}

// Telegram task: waits for events from the sensor loop
void telegramTask(void* param) {
  long alertMsgId = 0;                            // Telegram message of the current alert
  unsigned long alertEventNo = 0;
  unsigned long lastAlertMsg = 0;
  bool bootDone = false;

  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      xQueueReset(g_tgQueue);                     // do not send old alerts late
      vTaskDelay(1000 / portTICK_PERIOD_MS);
      continue;
    }

    if (!bootDone) {                              // one "online" message
      bootDone = true;
      configTime(TZ_OFFSET_SEC, 0, "pool.ntp.org", "time.google.com");
      unsigned long t0 = millis();
      while (!g_controlLoaded && millis() - t0 < 6000) {
        vTaskDelay(100 / portTICK_PERIOD_MS);     // wait for real settings
      }
      struct tm t;
      getLocalTime(&t, 3000);                     // wait up to 3 s for the clock
      sendTelegramText(buildOnlineText());
    }

    TgEvent ev;
    if (xQueueReceive(g_tgQueue, &ev, 1000 / portTICK_PERIOD_MS) != pdTRUE) continue;

    if (ev.type == 1) {                           // alert started
      alertMsgId = 0;
      if (g_tgEnabled && (lastAlertMsg == 0 || millis() - lastAlertMsg >= TG_COOLDOWN_MS)) {
        alertMsgId = sendTelegramText(buildAlertText(ev.distance, ev.eventNo));
        alertEventNo = ev.eventNo;
        lastAlertMsg = millis();
      }
    } else if (ev.type == 2) {                    // alert ended
      if (TG_SEND_CLEARED && alertMsgId > 0 && ev.eventNo == alertEventNo) {
        sendTelegramReply(alertMsgId, buildClearedText(ev.distance, ev.durationMs, ev.eventNo), TG_CLEARED_SILENT);
      }
      alertMsgId = 0;
    }
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
  WiFi.setSleep(false);                           // no WiFi power-save: more stable on hotspots

  g_tgQueue = xQueueCreate(8, sizeof(TgEvent));
  xTaskCreatePinnedToCore(cloudTask, "cloud", 14336, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(telegramTask, "telegram", 20480, NULL, 1, NULL, 0);
}

void loop() {
  static bool          eventActive = false;
  static unsigned long eventStart  = 0;
  static unsigned long lastInRange = 0;
  static unsigned long holdUntil   = 0;
  static unsigned long eventNo     = 0;
  static float         eventMin    = 0;
  static int           printCount  = 0;

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
    eventNo = g_eventCount;
    g_lastEventMin = d;

    TgEvent ev = {1, d, 0, eventNo};              // tell the Telegram task
    xQueueSend(g_tgQueue, &ev, 0);
  }

  // Track closest distance during the event
  if (eventActive && inRange && d < eventMin) {
    eventMin = d;
    g_lastEventMin = d;
  }

  // Event end -> queue a log entry and tell Telegram
  if (!alarm && eventActive) {
    eventActive = false;
    unsigned long dur = lastInRange - eventStart;
    if (dur < SENSOR_INTERVAL_MS) dur = SENSOR_INTERVAL_MS;
    queuePush(eventMin, dur);

    TgEvent ev = {2, eventMin, dur, eventNo};
    xQueueSend(g_tgQueue, &ev, 0);
  }

  // Tell the cloud task right away if the alarm state changed
  bool changed = (alarm != g_alarm);
  g_alarm = alarm;
  if (changed) g_forcePush = true;

  digitalWrite(BUZZER_PIN, (alarm && g_buzzerEnabled) ? HIGH : LOW);
  updateLcd(d);

  if (++printCount >= 10) {                       // about once per second
    printCount = 0;
    Serial.print("Distance: ");
    Serial.print(d, 1);
    Serial.print(" cm | status: ");
    Serial.println(statusKey());
  }

  delay(SENSOR_INTERVAL_MS);
}
