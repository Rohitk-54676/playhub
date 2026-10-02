import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PlayHub — Play together";
export const size = { width: 1200, height: 630 };
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
          background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 30,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
              fontWeight: 700,
              color: "#a855f7",
            }}
          >
            P
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "white",
              letterSpacing: -2,
            }}
          >
            PlayHub
          </div>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 42,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Play together.
        </div>
      </div>
    ),
    { ...size }
  );
}