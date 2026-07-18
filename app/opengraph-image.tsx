import { ImageResponse } from "next/og";

export const alt = "Cercle d'Échecs de Bischwiller — Penser, jouer, transmettre";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", color: "#f3f0e8", background: "#11151d", padding: "72px 80px", fontFamily: "serif" }}>
      <div style={{ position: "absolute", right: -50, top: -140, width: 680, height: 680, border: "1px solid #364158", borderRadius: "50%" }} />
      <div style={{ position: "absolute", right: 40, top: 120, display: "flex", fontSize: 240, lineHeight: 1, letterSpacing: -24, color: "#1d2430" }}>CEB</div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", color: "#91adf1", fontFamily: "sans-serif", fontSize: 22, letterSpacing: 6 }}>DEPUIS 1981 · BISCHWILLER</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 780, fontSize: 76, lineHeight: 0.92 }}>
            <div style={{ display: "flex" }}>Cercle d&apos;Échecs</div>
            <div style={{ display: "flex" }}>de Bischwiller</div>
          </div>
          <div style={{ display: "flex", marginTop: 34, color: "#aeb5c1", fontFamily: "sans-serif", fontSize: 25, letterSpacing: 4 }}>PENSER. JOUER. TRANSMETTRE.</div>
        </div>
      </div>
    </div>,
    size,
  );
}
