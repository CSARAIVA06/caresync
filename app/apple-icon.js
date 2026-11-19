import { ImageResponse } from "next/og";

// Ícone para "Adicionar à tela de início" no iPhone/iPad (PNG 180×180, mesmo desenho de app/icon.svg).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e3a8a" }}>
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
    ),
    size
  );
}
