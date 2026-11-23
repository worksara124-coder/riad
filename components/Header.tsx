"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Logo } from "./Logo";

gsap.registerPlugin(ScrollTrigger);

const links = [
  { href: "#le-riad", label: "Le riad", accent: "la visite" },
  { href: "#chambres", label: "Nos chambres", accent: "votre cocon" },
  { href: "#art-de-vivre", label: "L’âme du riad", accent: "les matières" },
  { href: "#galerie", label: "Galerie", accent: "en images" },
];

/**
 * Header éditorial : « Menu » à gauche, logo centré, « Réserver » à droite.
 * Le menu s'ouvre en plein écran (focus contenu, Échap, retour du focus).
 */
export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Au-dessus de la visite : éléments posés sur des pastilles. Après : bandeau crème.
  useEffect(() => {
    const tour = document.getElementById("le-riad");
    if (!tour) return;
    const trigger = ScrollTrigger.create({
      trigger: tour,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setSolid(self.progress >= 1),
      onRefresh: (self) => setSolid(self.progress >= 1),
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    requestAnimationFrame(() => overlayRef.current?.querySelector<HTMLElement>("a")?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !overlayRef.current) return;
      // Focus contenu entre le bouton de fermeture et les liens du menu.
      const items = [buttonRef.current, ...overlayRef.current.querySelectorAll<HTMLElement>("a")].filter(
        Boolean,
      ) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onOverlay = open || !solid;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-[background-color,border-color] duration-700 ${
          solid && !open ? "border-b border-sable/70 bg-creme" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <div>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls="menu-principal"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full bg-brun px-4 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-creme shadow-[0_2px_12px_rgb(53_39_31/0.15)] transition-colors hover:bg-terracotta-fonce sm:px-5"
            >
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
                {open ? (
                  <path d="M4 1l10 10M14 1L4 11" />
                ) : (
                  <>
                    <path d="M1 3.5c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0" />
                    <path d="M1 9.5c2.5-2.5 5-2.5 8 0s5.5 2.5 8 0" />
                  </>
                )}
              </svg>
              {open ? "Fermer" : "Menu"}
            </button>
          </div>

          <a
            href="#le-riad"
            onClick={() => setOpen(false)}
            aria-label="Riad Noor — retour au début de la visite"
            className={`flex h-[46px] items-center rounded-full px-4 transition-colors duration-700 md:h-[54px] ${
              onOverlay && !open ? "bg-creme/85 shadow-[0_1px_10px_rgb(53_39_31/0.08)]" : ""
            }`}
          >
            <span className="block h-[32px] md:h-[40px]">
              <Logo priority />
            </span>
          </a>

          <div className="flex justify-end">
            <a
              href="#chambres"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-terracotta-fonce px-4 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-creme shadow-[0_2px_12px_rgb(53_39_31/0.15)] transition-colors hover:bg-brun sm:px-5"
            >
              Réserver
            </a>
          </div>
        </div>
      </header>

      <div
        id="menu-principal"
        ref={overlayRef}
        data-open={open}
        aria-hidden={!open}
        inert={!open}
        className="menu-overlay fixed inset-0 z-40 flex flex-col bg-creme pt-[calc(var(--header-h)+2rem)]"
      >
        <nav aria-label="Navigation principale" className="flex flex-1 items-center justify-center px-6">
          <ul className="flex flex-col items-center gap-[clamp(0.6rem,2.2vh,1.6rem)] text-center">
            {links.map((link, i) => (
              <li key={link.href} className="menu-item" style={{ "--d": i } as React.CSSProperties}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="group relative inline-flex flex-col items-center text-brun"
                >
                  <span className="display text-[clamp(2.2rem,1.4rem+3.6vw,4.6rem)] transition-colors group-hover:text-terracotta-fonce">
                    {link.label}
                  </span>
                  <span
                    className="script -mt-2 text-[clamp(2.6rem,2rem+2.4vw,4rem)] text-terracotta opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden="true"
                  >
                    {link.accent}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="menu-item eyebrow pb-8 text-center" style={{ "--d": links.length } as React.CSSProperties}>
          Marrakech, Maroc
        </p>
      </div>
    </>
  );
}
