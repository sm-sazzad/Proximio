/**
 * Subtle ambient background — faint grid + soft cyan radial glow.
 * Pure CSS, very cheap to render. Fixed behind all content.
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Soft cyan radial glow — top center */}
      <div
        className="absolute -top-[30%] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(ellipse, #22D3EE 0%, transparent 70%)",
        }}
      />
      {/* Secondary subtle glow — bottom right */}
      <div
        className="absolute -bottom-[20%] -right-[10%] h-[400px] w-[500px] rounded-full opacity-[0.04]"
        style={{
          background: "radial-gradient(ellipse, #22D3EE 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

