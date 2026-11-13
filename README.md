<div align="center">

# 📡 Proximo

### Proximity, in real time.

An advanced IoT ultrasonic proximity monitoring system powered by **ESP32**, **Firebase Realtime Database**, and a high-performance **Next.js** glassmorphic dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFA611?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![ESP32](https://img.shields.io/badge/ESP32-WROOM_32-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)

[**Live Demo (proximo-zeta.vercel.app)**](https://proximo-zeta.vercel.app/) • [**Architecture**](#-system-architecture) • [**Pin Mapping**](#-hardware--pin-map) • [**Getting Started**](#-getting-started) • [**Team**](#-project-team)

</div>

---

## 🌟 Overview

**Proximo** bridges embedded hardware and modern web technologies. An ESP32 microcontroller with an HC-SR04 ultrasonic sensor continuously samples distances at high frequency. Distance data, system health, and alarm events stream with sub-second latency to Google Firebase Realtime Database. The companion web application delivers live telemetry, radar visualization, telemetry analytics, and bidirectional threshold control from any smartphone, tablet, or PC.

Built for the **Microcontroller-Based Systems Design And Development** course at **Kushtia Polytechnic Institute** (Diploma in Computer Science & Technology).

---

## 🏗️ System Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │                     EDGE HARDWARE TIER                      │
  │  [HC-SR04 Sensor] ──> [ESP32-WROOM] ──> [Buzzer + 16x2 LCD] │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ WiFi (Telemetry ~1 Hz)
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    REALTIME CLOUD TIER                      │
  │              Google Firebase Realtime Database              │
  │       • /live (Telemetry)        • /logs (Alarm Events)     │
  │       • /control (Thresholds & Arm State)                   │
  └──────────────────────────────▲──────────────────────────────┘
                                 │ Bidirectional Sync
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                   WEB PRESENTATION TIER                     │
  │         Proximo Web Dashboard (Next.js on Vercel)           │
  │   Radar Gauge • Live Area Chart • Analytics • Remote Config │
  └─────────────────────────────────────────────────────────────┘
```

- **ESP32 to Cloud**: Streams distance, RSSI, status, and uptime every ~1s (instantly on state change) to `/live`. Writes alarm event records to `/logs`.
- **Cloud to ESP32**: Microcontroller reads user-defined thresholds (`minCm`, `maxCm`), buzzer mute toggle, and armed status from `/control` every ~3s.
- **Client Web App**: Directly synchronizes with Firebase via single-subscription React contexts—zero server overhead and zero polling loops.

---

## ⚡ Key Features

- **🎯 Real-Time Radar Gauge:** Half-circle sweeping SVG radar with dynamic object blip, active alert zone arc, and responsive range boundaries.
- **📈 Rolling Live Telemetry Chart:** Recharts-powered 5-minute and 1-minute streaming area chart with min/max threshold reference lines and shaded alert bands.
- **🧠 Kinematic Smart Insights:** Real-time client-side linear regression computing target velocity ($\text{cm/s}$), approach/recede direction, time-to-impact estimate, and proximity zone classification.
- **🎛️ Bidirectional Control Panel:** Remote configuration of alert thresholds ($2\text{ cm}$ to $400\text{ cm}$), buzzer mute toggle, and global arm/disarm switch with draft/reset state management.
- **📊 Historical Event Analytics:** Filterable history log (Last 24h / All), 24-hour hourly alert distribution bar chart, proximity classification donut chart, and one-click CSV export.
- **📱 Responsive Glassmorphic UI:** Deep dark theme designed with Tailwind CSS, custom glassmorphism tokens, accessible contrast, and full mobile optimization (tested down to $360\text{ px}$).

---

## 🔌 Hardware & Pin Map

| Component | Pin / Terminal | ESP32 GPIO | Description / Notes |
|:---|:---|:---|:---|
| **HC-SR04** | VCC | `3V3` | Ultrasonic sensor power |
| **HC-SR04** | Trig | `GPIO 25` | Ultrasonic trigger pulse output |
| **HC-SR04** | Echo | `GPIO 26` | Ultrasonic echo return input |
| **HC-SR04** | GND | `GND` | Common ground |
| **Active Buzzer** | Positive (+) | `GPIO 27` | Audible alarm control |
| **Active Buzzer** | Negative (-) | `GND` | Ground |
| **16x2 LCD** | RS | `GPIO 22` | Register select (4-bit mode) |
| **16x2 LCD** | E | `GPIO 23` | Enable signal |
| **16x2 LCD** | D4, D5, D6, D7 | `GPIO 21, 19, 18, 17` | 4-bit parallel data lines |
| **16x2 LCD** | RW | `GND` | Read/Write tied to ground (Write mode) |
| **16x2 LCD** | VDD | `5V (VIN)` | Logic power supply |
| **Potentiometer** | Wiper -> V0 | Contrast adjust | LCD contrast potentiometer |

---

## 🗄️ Firebase Database Contract

### `/live` *(Written by ESP32, read by Web App)*
| Field | Type | Description |
|:---|:---|:---|
| `distance` | `number` | Current distance in centimeters (`-1` indicates no echo / sensor fault) |
| `status` | `string` | System status: `"safe"`, `"alert"`, `"nosensor"`, or `"disarmed"` |
| `rssi` | `number` | WiFi signal strength in dBm |
| `uptime` | `number` | Continuous operating uptime in seconds |
| `events` | `number` | Total alarm events triggered since boot |
| `lastEventMin` | `number` | Closest object approach (cm) during the latest event |
| `ts` | `number` | Epoch timestamp in milliseconds |

### `/control` *(Written by Web App, read by ESP32)*
| Field | Type | Description |
|:---|:---|:---|
| `minCm` | `number` | Lower boundary of alert range ($0 \le \text{minCm} < \text{maxCm}$) |
| `maxCm` | `number` | Upper boundary of alert range ($\text{minCm} < \text{maxCm} \le 400$) |
| `buzzerEnabled` | `boolean` | Enable / mute the onboard buzzer |
| `armed` | `boolean` | Master arming toggle for the detection alarm |

### `/logs` *(Appended by ESP32 on event completion)*
| Field | Type | Description |
|:---|:---|:---|
| `minDistance` | `number` | Closest detected distance during the proximity incident (cm) |
| `durationMs` | `number` | Total duration of the alarm state (ms) |
| `ts` | `number` | Timestamp when the event finished |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- Google Firebase account with a Realtime Database instance

### 1. Clone the Repository
```bash
git clone https://github.com/sm-sazzad/proximo.git
cd proximo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in your Firebase Realtime Database credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 👥 Project Team

**Institution:** Kushtia Polytechnic Institute  
**Department:** Computer Science and Technology (CST)  
**Course:** Microcontroller-Based Systems Design And Development  

| Name | Role | Responsibilities |
|:---|:---|:---|
| **Sheikh Md Sazzad Hossain** | **Team Lead & Full-Stack / IoT Developer** *(Admin)* | Project setup, ESP32 firmware integration, web dashboard, and system architecture |
| **Adnan Karim Riad** | Hardware Assembly & Circuit Testing | Breadboard wiring, circuit continuity verification, and pin diagnostics |
| **AL Imran Jony** | Embedded Systems & Sensor Calibration | HC-SR04 timing calibration, deadzone verification, and sensor testing |
| **Antora Sarkar** | Technical Documentation & Analysis | Project reporting, requirements gathering, and workflow analysis |
| **Hamim Kefayet** | Hardware Prototyping & Power Testing | Prototyping breadboard circuits and power stability verification |
| **Riad** | Component Integration & Quality Check | Component stress testing and hardware-to-MCU pin mapping validation |
| **Samira Islam** | UI/UX Research & Presentation | Dashboard usability testing, layout review, and defense presentation |
| **Sanzidur Rahman Santo** | IoT Telemetry & Network Testing | WiFi latency benchmarking and Firebase Realtime DB stream inspection |
| **Shakibul Islam** | Firmware Verification & System Testing | Alarm edge-case testing, buzzer mute logic, and system stress runs |

---

## 👨‍💻 Developer & Author

<div align="center">

**Sheikh Md Sazzad Hossain**  
*Web Developer & CST Student*  
Kushtia Polytechnic Institute • Kushtia, Bangladesh

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit%20Site-06b6d4?style=flat-square&logo=vercel)](https://sazzad-dev.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-sm--sazzad-181717?style=flat-square&logo=github)](https://github.com/sm-sazzad)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-sm--sazzad-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/sm-sazzad/)
[![Email](https://img.shields.io/badge/Email-sazzadhossain5758%40gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:sazzadhossain5758@gmail.com)

</div>

---

## 📄 License

This project is created for educational and academic evaluation purposes. Free to use for learning and research.
