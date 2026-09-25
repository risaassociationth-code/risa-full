"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import styles from "./RisingLineEntrance.module.css";

type Scene = { render: (progress: number) => void; dispose: () => void };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };

export function RisingLineEntrance({ children, locale }: { children: ReactNode; locale: string }) {
  const pathname = usePathname();
  const home = pathname.replace(/\/$/, "") === `/${locale}`;
  const stage = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const th = locale === "th";

  useEffect(() => {
    if (!home || !stage.current || !host.current || !navigation.current) return;
    const element = stage.current, mount = host.current, nav = navigation.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const abort = new AbortController();
    let scene: Scene | undefined, frame = 0, disposed = false, generation = 0;
    let simple = motion.matches || !!connection?.saveData;
    let progress = 0;

    function paint() {
      frame = 0;
      const bounds = element.getBoundingClientRect();
      const height = element.firstElementChild?.clientHeight || window.innerHeight;
      progress = simple ? 1 : clamp(-bounds.top / Math.max(1, element.offsetHeight - height));
      element.style.setProperty("--progress", String(progress));
      element.style.setProperty("--collage", String(simple ? .23 : .18 + .28 * ease(progress / .24) - .23 * ease((progress - .40) / .36)));
      element.style.setProperty("--copy", String(1 - ease((progress - .08) / .19)));
      element.style.setProperty("--rise", `${ease((progress - .08) / .19) * -36}px`);
      element.style.setProperty("--identity", String(simple ? 1 : ease((progress - .76) / .12)));
      element.style.setProperty("--light-x", `${-30 + ease((progress - .43) / .35) * 160}%`);
      element.style.setProperty("--light", String(simple ? 0 : Math.sin(clamp((progress - .43) / .35) * Math.PI) * .22));
      element.style.setProperty("--trace", String(clamp(.025 + progress / .42)));
      element.style.setProperty("--fallback", String(simple ? 1 : ease((progress - .32) / .25)));
      element.dataset.phase = progress < .28 ? "line" : progress < .76 ? "form" : "identity";
      const visible = simple || progress >= .91;
      element.dataset.entered = String(visible);
      nav.dataset.visible = String(visible);
      nav.inert = !visible;
      nav.setAttribute("aria-hidden", String(!visible));
      // No continuous animation loop: draw only when the scene is on screen.
      if (bounds.bottom > 0 && bounds.top < window.innerHeight && !document.hidden) scene?.render(progress);
    }
    function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(paint); }
    function fallback() {
      simple = true;
      element.dataset.simple = "true";
      element.dataset.ready = "false";
      scene?.dispose(); scene = undefined;
      schedule();
    }
    async function loadScene() {
      const current = ++generation;
      scene?.dispose(); scene = undefined;
      simple = motion.matches || !!connection?.saveData;
      element.dataset.simple = String(simple);
      element.dataset.ready = "false";
      if (simple) { schedule(); return; }
      try {
        const { createRisingLineScene } = await import("./rising-line-scene");
        if (disposed || current !== generation) return;
        const next = await createRisingLineScene(mount, abort.signal, fallback);
        if (disposed || current !== generation) { next.dispose(); return; }
        scene = next;
        element.dataset.ready = "true";
        schedule();
      } catch {
        if (!disposed && current === generation) fallback();
      }
    }
    paint();
    void loadScene();
    const observer = new ResizeObserver(schedule);
    observer.observe(element); observer.observe(mount);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", loadScene);
    return () => {
      disposed = true; generation++; abort.abort(); cancelAnimationFrame(frame);
      observer.disconnect(); scene?.dispose();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", loadScene);
      nav.inert = false; nav.removeAttribute("aria-hidden");
    };
  }, [home, pathname]);

  function enter() {
    const main = document.getElementById("main");
    if (!main) return;
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }

  return <>
    <div ref={navigation} className={home ? styles.homeNav : styles.normalNav} data-visible={home ? undefined : "true"}>
      {children}
    </div>
    {home && <section ref={stage} className={styles.stage} aria-label={th ? "RISA — จากความคิดสู่ความก้าวหน้า" : "RISA — a new direction"}>
      <div className={styles.scene}>
        <div className={styles.collage} aria-hidden="true">
          {["student-presentation", "discussion", "award-group", "event-room"].map((photo) => (
            <div key={photo} className={styles.photo}>
              <Image src={`/images/msic-2026/${photo}.jpg`} alt="" fill sizes="(max-width: 700px) 65vw, 45vw" quality={70} />
            </div>
          ))}
        </div>
        <div className={styles.lightSweep} aria-hidden />
        <div className={styles.topbar}>
          <a href="#main" onClick={(e) => { e.preventDefault(); enter(); }} className={styles.skip}>
            {th ? "เข้าสู่เว็บไซต์" : "Enter website"}<span aria-hidden>↗</span>
          </a>
        </div>
        <div className={styles.opening}>
          <h2 lang="en"><span>Research. Industry.</span><span>Standards. <em>Advancing.</em></span></h2>
        </div>
        <div ref={host} className={styles.canvas} aria-hidden="true" />
        <div className={styles.fallbackVisual} aria-hidden="true">
          <svg className={styles.trace} viewBox="0 0 1250 340" fill="none">
            <path d="M12 280H654L800 64Q810 48 823 66L943 247Q949 259 961 243L1090 49" pathLength="1" />
          </svg>
          {/* An immediate image fallback also covers unavailable WebGL / data-saving mode. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/risa-wordmark.png" alt="" width="1250" height="300" />
        </div>
        <div className={styles.identity}>
          <p className={styles.eyebrow}>RESEARCH AND INDUSTRY STANDARDS ADVANCEMENT ASSOCIATION</p>
          <a href="#main" onClick={(e) => { e.preventDefault(); enter(); }}>{th ? "สำรวจข่าวสารล่าสุด" : "Explore the latest news"}<span aria-hidden>↓</span></a>
        </div>
        <div className={styles.bottom}>
          <span className={styles.scrollHint}>{th ? "เลื่อนเพื่อสำรวจ" : "SCROLL TO EXPLORE"}<span aria-hidden>↓</span></span>
        </div>
        <div className={styles.progress} aria-hidden><span /></div>
      </div>
    </section>}
    <noscript><style>{`.${styles.homeNav}{opacity:1!important;visibility:visible!important;position:sticky!important}.${styles.stage}{display:none!important}`}</style></noscript>
  </>;
}
