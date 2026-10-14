"use client";

import { useEffect, useRef } from "react";

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

    const mouse = { x: -9999, y: -9999, radius: 160 };

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
      // Density based on viewport size, capped for performance
      const count = Math.min(Math.floor((width * height) / 18000), 75);
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
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 1.5 + 1.2,
          baseAlpha: Math.random() * 0.45 + 0.35,
          phase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initNodes();

    let lastTime = performance.now();
    const maxDistance = 140;

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Connect nodes
      const nodeCount = nodes.length;
      for (let i = 0; i < nodeCount; i++) {
        const a = nodes[i];

        // Position update
        if (!isReducedMotion) {
          a.x += a.vx * dt * 60;
          a.y += a.vy * dt * 60;

          // Bounce off edges smoothly
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

        // Draw connections to nearby nodes
        for (let j = i + 1; j < nodeCount; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistance * maxDistance) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxDistance) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(140, 185, 230, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Mouse interaction line
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < mouse.radius * mouse.radius) {
          const mDist = Math.sqrt(mDistSq);
          const mAlpha = (1 - mDist / mouse.radius) * 0.35;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(214, 191, 145, ${mAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw node
        const pulse = Math.sin(time * 0.002 + a.phase) * 0.2 + 0.8;
        const alpha = a.baseAlpha * pulse;

        let fill = `rgba(180, 220, 255, ${alpha})`;
        let glow = `rgba(100, 180, 255, ${alpha * 0.4})`;
        if (a.color === "gold") {
          fill = `rgba(225, 200, 150, ${alpha})`;
          glow = `rgba(214, 191, 145, ${alpha * 0.4})`;
        } else if (a.color === "violet") {
          fill = `rgba(195, 175, 245, ${alpha})`;
          glow = `rgba(165, 130, 235, ${alpha * 0.4})`;
        }

        // Outer glow
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius * 2.4, 0, Math.PI * 2);
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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Deep cosmic base texture & nebular glow */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
        style={{
          backgroundImage: "url('/images/cosmic-network-bg.jpg')",
          filter: "contrast(1.15) brightness(0.9)",
        }}
      />
      {/* Nebular radial gradients for depth */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 75% 20%, rgba(68, 45, 120, 0.22) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 20% 60%, rgba(18, 55, 95, 0.25) 0%, transparent 65%), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8, 20, 38, 0.8) 0%, transparent 100%)",
        }}
      />
      {/* Micro geometric horizon grid lines */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(214, 191, 145, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(214, 191, 145, 0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 80%)",
        }}
      />
      {/* Interactive Constellation Nodes Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-85"
      />
      {/* Vignette / read-layer so all text remains crisp */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11, 20, 34, 0.3) 0%, rgba(11, 20, 34, 0.1) 40%, rgba(11, 20, 34, 0.6) 80%, rgba(11, 20, 34, 0.95) 100%)",
        }}
      />
    </div>
  );
}
