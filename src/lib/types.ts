/** Fields written by the ESP32 to /live */
export interface Live {
  distance: number;
  status: "safe" | "alert" | "nosensor" | "disarmed";
  rssi: number;
  uptime: number;
  events: number;
  lastEventMin: number;
  ts: number;
}

/** Fields written by the website to /control, read by the ESP32 */
export interface Control {
  minCm: number;
  maxCm: number;
  buzzerEnabled: boolean;
  armed: boolean;
  ledOn?: boolean;
}

/** A single alarm log entry (written by ESP32 under /logs/{pushId}) */
export interface LogEntry {
  minDistance: number;
  durationMs: number;
  ts: number;
}

/** LogEntry with its Firebase push ID attached */
export interface LogEntryWithId extends LogEntry {
  id: string;
}

