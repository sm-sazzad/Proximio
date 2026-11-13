import { ImageResponse } from "next/og";

export const alt = "Proximo — Real-Time IoT Distance Telemetry";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0F1C",
          color: "#E2E8F0",
          fontFamily: "sans-serif",
          padding: "60px",
          border: "12px solid #121A2B",
        }}
      >
        {/* Radar Emblem */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "96px",
            height: "96px",
            borderRadius: "28px",
            backgroundColor: "rgba(34, 211, 238, 0.12)",
            border: "2px solid rgba(34, 211, 238, 0.4)",
            marginBottom: "24px",
          }}
        >
          <svg
            width="54"
            height="54"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22D3EE"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10" />
            <path d="M12 6a6 6 0 1 0 6 6" />
            <path d="M12 10a2 2 0 1 0 2 2" />
            <circle cx="12" cy="12" r="1.5" fill="#22D3EE" />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "900",
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
            marginBottom: "8px",
          }}
        >
          Proximo
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "26px",
            fontWeight: "600",
            color: "#22D3EE",
            letterSpacing: "-0.01em",
            marginBottom: "20px",
          }}
        >
          Proximity, in real time.
        </div>

        {/* Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "18px",
            color: "#8A97AD",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            padding: "10px 24px",
            borderRadius: "9999px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span>ESP32 Edge Node</span>
          <span>•</span>
          <span>Firebase RTDB</span>
          <span>•</span>
          <span>Next.js Dashboard</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
