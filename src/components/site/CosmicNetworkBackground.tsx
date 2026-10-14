"use client";

import { useEffect, useRef, useState } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  color: "cyan" | "gold" | "violet";
}

export function CosmicNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [introProgress, setIntroProgress] = useState(0);

  // Track scroll position relative to the intro stage
  useEffect(() => {
    const updateProgress = () => {
      const stage = document.querySelector<HTMLElement>(
        "section[class*='stage']"
      );
      if (!stage) {
        setIntroProgress(1);
        return;
      }
      const bounds = stage.getBoundingClientRect();
      const vh = window.innerHeight;

      // During the intro (bounds.bottom >= vh), keep background at 0% opacity
      // As intro scrolls out of view, smoothly transition opacity to 100%
      if (bounds.bottom >= vh) {
        setIntroProgress(0);
      } else if (bounds.bottom <= 0) {
        setIntroProgress(1);
      } else {
        const factor = (vh - bounds.bottom) / (vh * 0.7);
        setIntroProgress(Math.max(0, Math.min(1, factor)));
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = motionQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    motionQuery.addEventListener("change", handleMotionChange);

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -9999, y: -9999, radius: 180 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    let nodes: Node[] = [];

    const initNodes = () => {
      const count = Math.min(Math.floor((width * height) / 16000), 85);
      nodes = [];
      const colors: ("cyan" | "gold" | "violet")[] = [
        "cyan",
        "cyan",
        "gold",
        "violet",
      ];

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.38,
          vy: (Math.random() - 0.5) * 0.38,
          radius: Math.random() * 1.8 + 1.2,
          baseAlpha: Math.random() * 0.45 + 0.45,
          phase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initNodes();

    let lastTime = performance.now();
    const maxDistance = 160;

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const nodeCount = nodes.length;
      for (let i = 0; i < nodeCount; i++) {
        const a = nodes[i];

        if (!isReducedMotion) {
          a.x += a.vx * dt * 60;
          a.y += a.vy * dt * 60;

          if (a.x < 0) {
            a.x = 0;
            a.vx *= -1;
          } else if (a.x > width) {
            a.x = width;
            a.vx *= -1;
          }
          if (a.y < 0) {
            a.y = 0;
            a.vy *= -1;
          } else if (a.y > height) {
            a.y = height;
            a.vy *= -1;
          }
        }

        // Connect proximate nodes with geometric constellation lines
        for (let j = i + 1; j < nodeCount; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistance * maxDistance) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(140, 195, 245, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Interactive mouse connection
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < mouse.radius * mouse.radius) {
          const mDist = Math.sqrt(mDistSq);
          const mAlpha = (1 - mDist / mouse.radius) * 0.45;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(214, 191, 145, ${mAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw node with glowing halos
        const pulse = Math.sin(time * 0.002 + a.phase) * 0.25 + 0.75;
        const alpha = a.baseAlpha * pulse;

        let fill = `rgba(190, 230, 255, ${alpha})`;
        let glow = `rgba(120, 190, 255, ${alpha * 0.5})`;
        if (a.color === "gold") {
          fill = `rgba(235, 210, 160, ${alpha})`;
          glow = `rgba(214, 191, 145, ${alpha * 0.5})`;
        } else if (a.color === "violet") {
          fill = `rgba(205, 185, 255, ${alpha})`;
          glow = `rgba(175, 140, 245, ${alpha * 0.5})`;
        }

        // Outer glow
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius * 3.0, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-500 ease-out"
      style={{ opacity: introProgress }}
      aria-hidden="true"
    >
      {/* Deep cosmic base texture & nebular glow — dominant on homepage */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-65 mix-blend-screen"
        style={{
          backgroundImage: "url('/images/cosmic-network-bg.jpg')",
          filter: "contrast(1.22) brightness(1.05)",
        }}
      />
      {/* Nebular radial depth gradients */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 80% 25%, rgba(100, 60, 180, 0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 15% 65%, rgba(20, 80, 150, 0.38) 0%, transparent 65%), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8, 20, 38, 0.85) 0%, transparent 100%)",
        }}
      />
      {/* Micro geometric horizon grid */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(214, 191, 145, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(214, 191, 145, 0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 80%)",
        }}
      />
      {/* Interactive Constellation Nodes Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-90"
      />
      {/* Vignette read-layer for crisp card typography */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(7, 12, 24, 0.25) 0%, rgba(7, 12, 24, 0.05) 35%, rgba(7, 12, 24, 0.55) 75%, rgba(7, 12, 24, 0.95) 100%)",
        }}
      />
    </div>
  );
}
