import { ImageResponse } from "next/og";
import { profile } from "./data";

export const alt = `${profile.name} — Senior DevOps & Platform Engineer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#07141d",
          color: "#eff7f8",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 80px",
          width: "100%"
        }}
      >
        <div style={{ color: "#63d2ee", display: "flex", fontSize: 26, letterSpacing: 4 }}>
          {profile.domain.toUpperCase()}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, letterSpacing: -4, lineHeight: 1 }}>Cloud platforms.</div>
          <div style={{ color: "#63d2ee", fontSize: 92, letterSpacing: -4, lineHeight: 1.1 }}>
            Engineered to hold.
          </div>
        </div>

        <div style={{ alignItems: "center", display: "flex", gap: 24, justifyContent: "space-between" }}>
          <div style={{ color: "#9aadb7", display: "flex", fontSize: 28 }}>
            {profile.name} · {profile.role} · {profile.location}
          </div>
          <div style={{ color: "#d8ff53", display: "flex", fontSize: 24, letterSpacing: 2 }}>
            AWS · AZURE · KUBERNETES
          </div>
        </div>
      </div>
    ),
    size
  );
}
