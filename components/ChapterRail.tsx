"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters } from "./SectionHeading";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sommaire fixe (grands écrans) : relie les sections entre elles comme les chapitres d'un livre.
 * La ligne se remplit avec la lecture ; le chapitre en cours affiche son titre.
 * Il anime aussi le glissement lent du motif de fond (--motif-y).
 */
export function ChapterRail() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const triggers = chapters.map((c, i) => {
      const el = document.getElementById(c.id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setActive(i),
      });
    });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const page = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        setProgress(self.progress);
        if (!reduced) document.documentElement.style.setProperty("--motif-y", `${(-self.scroll() * 0.08).toFixed(1)}px`);
      },
    });
    return () => {
      triggers.forEach((t) => t?.kill());
      page.kill();
    };
  }, []);

  return (
    <nav
      aria-label="Chapitres"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <div className="relative rounded-full bg-creme/80 px-2 py-4 shadow-[0_4px_24px_-10px_rgb(53_39_31/0.35)] backdrop-blur-[2px]">
        <span className="absolute bottom-6 left-1/2 top-6 w-px -translate-x-1/2 bg-sable" aria-hidden="true" />
        <span
          className="absolute left-1/2 top-6 w-px -translate-x-1/2 bg-terracotta transition-[height] duration-300"
          style={{ height: `calc((100% - 3rem) * ${progress})` }}
          aria-hidden="true"
        />
        <ul className="relative flex flex-col gap-3">
          {chapters.map((c, i) => {
            const isActive = i === active;
            return (
              <li key={c.id} className="group relative flex justify-center">
                <a
                  href={`#${c.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[0.68rem] font-medium tracking-wider transition-colors ${
                    isActive ? "bg-brun text-creme" : "bg-creme text-brun-logo hover:bg-sable/60"
                  }`}
                >
                  {c.number}
                  <span className="sr-only"> — {c.label}</span>
                </a>
                <span
                  className={`pointer-events-none absolute right-[calc(100%+0.9rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-creme/95 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-brun shadow-sm transition-opacity duration-500 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  aria-hidden="true"
                >
                  {c.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
