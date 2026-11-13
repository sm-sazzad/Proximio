# Proximo — Real-Time Distance Monitoring

> **Proximity, in real time.** An ESP32 + ultrasonic sensor system with a premium live web dashboard.

College project (Microcontroller-Based Systems). The goal is a working IoT system that is also the best-looking, most feature-rich project in the class. Everything is built with **free tools only**.

---

## 1. What the system does

An ultrasonic sensor measures distance. If an object enters a configurable range, a buzzer sounds and an alarm event is recorded. The website shows everything live and lets the user change the settings from any phone or laptop.

```
HC-SR04 sensor ─┐
Buzzer ─────────┼─► ESP32 ──WiFi──► Firebase Realtime DB ◄──► Next.js dashboard (Vercel)
16x2 LCD ───────┘      ▲                                          │
                       └────────── /control (settings) ◄──────────┘
```

- The ESP32 writes `/live` (about every 1 s, and instantly when the alarm state changes) and `/logs` (one entry per finished alarm event).
- The ESP32 reads `/control` about every 3 s.
- The website only **reads** `/live` and `/logs`, and only **writes** `/control`.
- There is no custom backend. The browser talks to Firebase directly.

## 2. Hardware (finished and working — do not change)

ESP32-WROOM DevKit, HC-SR04 ultrasonic sensor, active buzzer, 16x2 LCD, breadboard. Firmware is complete and maintained outside this repo. WiFi is set from a phone via WiFiManager. The alarm triggers when `armed && minCm <= distance <= maxCm`, and the ALERT state stays for 1.5 s after the object leaves.

## 3. Firebase Realtime Database schema (the contract)

Do not rename, remove or restructure these fields. The firmware depends on them.

### `/live` (written by ESP32)

| Field          | Type   | Meaning                                                      |
| -------------- | ------ | ------------------------------------------------------------ |
| `distance`     | number | Distance in cm. `-1` means no echo / no reading.             |
| `status`       | string | `"safe"`, `"alert"`, `"nosensor"` or `"disarmed"`            |
| `rssi`         | number | WiFi signal in dBm (closer to 0 is better; -50 is excellent) |
| `uptime`       | number | Seconds since the ESP32 booted                               |
| `events`       | number | Count of alarm events since boot (resets on reboot)          |
| `lastEventMin` | number | Closest distance (cm) of the latest alarm event              |
| `ts`           | number | Server timestamp in ms of the last update                    |

### `/control` (written by the website, read by ESP32)

| Field           | Type    | Meaning                                                  |
| --------------- | ------- | -------------------------------------------------------- |
| `minCm`         | number  | Lower bound of the alert range (>= 0)                    |
| `maxCm`         | number  | Upper bound of the alert range (> minCm, <= 400)         |
| `buzzerEnabled` | boolean | If false, the alarm is shown but the buzzer stays silent |
| `armed`         | boolean | If false, the system never alarms                        |

Defaults created by the firmware: `minCm 10`, `maxCm 50`, `buzzerEnabled true`, `armed true`.

### `/logs` (written by ESP32, one push-id entry per finished alarm event)

| Field         | Type   | Meaning                                      |
| ------------- | ------ | -------------------------------------------- |
| `minDistance` | number | Closest distance (cm) during the event       |
| `durationMs`  | number | How long the object stayed in range          |
| `ts`          | number | Server timestamp when the event was recorded |

### Notes

- **Device online** = `serverNow - live.ts < 10 s`. Use Firebase's `/.info/serverTimeOffset` to compute `serverNow`, so a wrong clock on the viewer's phone does not break the status.
- The ultrasonic sensor works from about 2 cm to 400 cm.
- Data rate is about 1 sample per second. Never claim real-time precision beyond that.

## 4. Tech stack and constraints

- **Next.js (App Router) + TypeScript + Tailwind CSS**, deployed on Vercel (free plan).
- **Firebase JS SDK** (Realtime Database) in the browser. No Cloud Functions, no paid Firebase features.
- **Recharts** for charts, **Framer Motion** for animation, **lucide-react** for icons, **shadcn/ui** as the component base.
- Subscribe to each Firebase path **once** (React context) and share the data. Never create duplicate listeners.
- Keep Firebase reads small. Do not store extra history in Firebase. Charts use a client-side rolling buffer.
- UI language is English only.
- Secrets live in `.env.local` (never committed, never hardcoded).
- Ask before adding any new dependency, and list every package you add.

## 5. Design direction (very important)

Proximo must look like a **premium commercial product**, not a student template. Many teams are competing, so visual quality is a core requirement of every step.

**Mood:** deep ocean, sonar, radar. Dark, calm, precise, with a glowing cyan accent.

**Design tokens (dark theme only):**

| Role          | Value                    |
| ------------- | ------------------------ |
| Background    | `#0A0F1C`                |
| Card          | `#121A2B`                |
| Border        | `rgba(255,255,255,0.08)` |
| Text          | `#E6EDF7`                |
| Muted text    | `#8A97AD`                |
| Accent (cyan) | `#22D3EE`                |
| Success       | `#34D399`                |
| Warning       | `#F59E0B`                |
| Danger        | `#F43F5E`                |

**Rules:**

- One main accent color. Use success/warning/danger only for status meaning.
- Glass-style cards with subtle borders, soft glow and gentle hover/spotlight effects. A faint grid or aurora background, low contrast and cheap to render.
- Large, confident typography (Inter). Big numbers for the key data. Generous spacing. Consistent radius and spacing scale.
- Meaningful motion only (Framer Motion springs, number tickers, a sweeping radar, a pulsing alert glow). Respect `prefers-reduced-motion`.
- Mobile-first. Must look great at 360 px wide as well as on desktop.
- Every data component needs loading (skeleton), empty and error states.
- Accessible: sufficient contrast, focus rings, aria labels, never color alone.
- **Explore for inspiration and components before building:** 21st.dev, Aceternity UI, Magic UI and shadcn/ui. Adapt their patterns (animated cards, number tickers, glow/spotlight effects, bento layouts, backgrounds) to the Proximo style. Check each component's license, keep dependencies minimal, and never copy images or brand assets. The result must feel unique, not like a pasted template.

## 6. Scope

**In scope:** live dashboard, radar gauge, live chart, control panel, alarm history and analytics, smart insights, About page, Vercel deployment.

**Out of scope (do not build unless a step explicitly asks):** login/authentication, demo or simulation mode, language toggle, QR code, light theme, PWA, people counter, heatmap, scheduling, remote restart, Cloud Functions, any paid service. Telegram alerts are done in the ESP32 firmware, not in this repo.

## 7. Build plan

Work **one step at a time**. After each step the user tests it, then asks for the next step.

### Progress

- [x] Step 1 — Foundation
- [x] Step 2 — App shell and design system
- [x] Step 3 — Live dashboard
- [x] Step 4 — Live chart
- [x] Step 5 — Control panel
- [x] Step 6 — History and analytics
- [x] Step 7 — Smart insights
- [x] Step 8 — About page and polish
- [x] Step 8b — Developer page
- [ ] Step 9 — Deploy to Vercel

### Step 1 — Foundation

**Build:** `.env.local.example` (variable names only), `lib/firebase.ts` (single init, `databaseURL` required, region asia-southeast1), `lib/types.ts` (Live, Control, LogEntry), hooks `useLive()`, `useControl()` (with `updateControl(partial)`) and `useLogs(limit)` (newest first, with ids), a temporary debug page at `/`, the design tokens in `globals.css`, Inter font, page title "Proximo".
**Done when:** after the user adds `.env.local`, live values update about every second on the debug page, with an online/offline indicator and "updated Xs ago".

### Step 2 — App shell and design system

**Build:** initialize shadcn/ui; app layout with a sidebar on desktop and a bottom tab bar on mobile (Dashboard, Control, History, About); Proximo wordmark with a small SVG logo and favicon; React context providers so `/live`, `/control` and `/logs` each have one subscription; reusable components (GlassCard, StatCard, StatusPill, ConnectionBadge, SectionHeader, Skeleton, EmptyState); subtle ambient background; smooth page transitions; the four routes with polished placeholders.
**Done when:** navigation works at 360 px and on desktop, the shell already looks premium, and no component creates its own Firebase listener.

### Step 3 — Live dashboard (home)

**Build:**

- Hero distance card with an animated number ticker.
- Status card with four states: safe (green), alert (red, pulsing glow), no sensor (amber), disarmed (grey).
- Device card: online/offline, last update, WiFi signal bars from `rssi`, formatted uptime.
- **Radar gauge:** SVG half-circle, sweeping line, a blip that glides smoothly to the current distance, with the alert range (`minCm` to `maxCm`) drawn as a highlighted arc. The blip turns red during an alert and dims when there is no echo.
- Cards for "alerts since boot" and "closest approach".

**Done when:** moving a hand in front of the sensor visibly moves the blip and changes the status within about a second.

### Step 4 — Live chart

**Build:** an area/line chart of the last 5 minutes of `live.distance`, collected in a client-side rolling buffer; reference lines and a shaded band for `minCm` and `maxCm`; window buttons (1 min / 5 min); pause/resume; styled tooltip; gaps for `-1` readings; min / max / average chips; no extra Firebase reads.
**Done when:** the chart scrolls smoothly in real time and the alert band matches the control values.

### Step 5 — Control panel

**Build:** dual-handle range slider for `minCm` and `maxCm` with numeric inputs (min < max, 2 to 400 cm); presets (Near, Medium, Wide); a buzzer toggle; a large arm/disarm switch; an Apply button with saving state and a toast ("Saved. The device applies changes within about 3 s"); a live distance marker on the slider track; a warning when the device is offline. The website writes only to `/control`.
**Done when:** changing values updates Firebase and the ESP32 reacts within about 3 s.

### Step 6 — History and analytics

**Build:** stat cards (total events, closest ever, average duration, last event) from the latest 100 logs; a timeline/list of alarm events with local time, closest distance and duration; a bar chart of alerts per hour (last 24 h); a donut chart of events by closeness (near / mid / far, from the control range); CSV export; empty state.
**Done when:** a new alarm appears in the list within a couple of seconds and the stats update.

### Step 7 — Smart insights

**Build (all client-side):** direction and speed (approaching / moving away / steady, in cm/s) from the last few live samples; a time-to-contact estimate; zone indicator (Danger / Caution / Clear) derived from the control range; a toast and optional sound when `live.events` increases (sound is opt-in via a toggle, using Web Audio after a user gesture); the browser tab title shows a warning during an alert. State the 1-second data-rate limitation honestly in the UI copy.

### Step 8 — About page and polish

**Build:** an About / How it works page with an animated architecture flow (ESP32 → Firebase → Dashboard), hardware list, pin map table, tech stack and an editable team section; then a full polish pass: skeletons and error states everywhere, responsive check at 360 / 768 / 1280 px, keyboard focus, aria labels, reduced motion, metadata and OG image, remove all debug leftovers, micro-interactions.
**Done when:** desktop Lighthouse performance and accessibility are 90 or higher.

### Step 8b — Developer page

**Build:** an in-app `/developer` profile page featuring a round avatar from `/developer.png` (with initials fallback), bio, educational credentials, social links (portfolio, CV, GitHub, LinkedIn, email), grouped technical skills matrix, and compact cards for selected projects. Single editable source of truth in `src/config/project.ts`. Desktop sidebar bottom item and 5th mobile bottom tab bar item with touch targets >= 44px.

### Step 9 — Deploy to Vercel

**Build:** GitHub repo, Vercel import, environment variables, production check on a phone while the ESP32 runs on a hotspot, and the live URL added to this README. Database security rules are handled by the user outside the agent. Do not change them.

## 8. Working agreement for AI agents

See `AGENTS.md`. In short: read this file first, do **only** the step the user names, then stop and report.
