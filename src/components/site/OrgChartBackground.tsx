"use client";

export function OrgChartBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Deep Obsidian base tone */}
      <div className="absolute inset-0 bg-[#050a16]" />

      {/* Luminous nebular gradients */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(214, 191, 145, 0.14) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 85% 55%, rgba(56, 189, 248, 0.12) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 15% 75%, rgba(139, 92, 246, 0.12) 0%, transparent 65%)",
        }}
      />

      {/* Micro-precision constellation circuit grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(214, 191, 145, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(214, 191, 145, 0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 90% 70% at 50% 40%, black 30%, transparent 90%)",
        }}
      />

      {/* Ambient subtle constellation stars */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d6bf91" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d6bf91" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cyanStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient star nodes */}
        <circle cx="12%" cy="18%" r="1.5" fill="#d6bf91" />
        <circle cx="12%" cy="18%" r="6" fill="url(#starGlow)" />
        <circle cx="28%" cy="12%" r="1.2" fill="#38bdf8" />
        <circle cx="75%" cy="15%" r="2" fill="#d6bf91" />
        <circle cx="75%" cy="15%" r="8" fill="url(#starGlow)" />
        <circle cx="88%" cy="28%" r="1.5" fill="#38bdf8" />
        <circle cx="88%" cy="28%" r="7" fill="url(#cyanStarGlow)" />
        <circle cx="18%" cy="52%" r="1.5" fill="#d6bf91" />
        <circle cx="82%" cy="65%" r="1.8" fill="#38bdf8" />
        <circle cx="82%" cy="65%" r="8" fill="url(#cyanStarGlow)" />
        <circle cx="35%" cy="85%" r="1.2" fill="#d6bf91" />
        <circle cx="68%" cy="90%" r="1.5" fill="#38bdf8" />

        {/* Delicate constellation connecting lines */}
        <line x1="12%" y1="18%" x2="28%" y2="12%" stroke="rgba(214, 191, 145, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="75%" y1="15%" x2="88%" y2="28%" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="18%" y1="52%" x2="12%" y2="18%" stroke="rgba(214, 191, 145, 0.12)" strokeWidth="1" />
        <line x1="88%" y1="28%" x2="82%" y2="65%" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
      </svg>

      {/* Vignette smoothing for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5, 10, 22, 0.3) 0%, rgba(5, 10, 22, 0.1) 40%, rgba(5, 10, 22, 0.7) 85%, #050a16 100%)",
        }}
      />
    </div>
  );
}
