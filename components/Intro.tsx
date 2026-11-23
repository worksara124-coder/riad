"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";

/**
 * Intro simple : le logo apparaît en fondu sur fond crème, souligné d'un fin trait,
 * puis l'écran s'efface et laisse place au site (déjà chargé dessous). Environ 2,7 s.
 *
 * - Jouée à chaque visite (réglable avec ONCE_PER_SESSION).
 * - Jamais jouée avec « réduction des animations ».
 * - N'attend aucun chargement : c'est une ouverture, pas un écran de chargement.
 * - Le moindre geste (scroll, toucher, clic, touche) l'accélère.
 * - Sans JavaScript, l'animation CSS se joue puis disparaît d'elle-même.
 */
const INTRO_KEY = "riad-noor-intro";
/** Passez à true pour ne jouer l'intro qu'une fois par session de navigation. */
const ONCE_PER_SESSION = false;

/** Script exécuté dans <head> avant le premier affichage. */
export const introBootScript = `(function(){try{var d=document.documentElement;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||(${ONCE_PER_SESSION}&&sessionStorage.getItem('${INTRO_KEY}'))){d.setAttribute('data-intro','skip')}}catch(e){}})();`;

const END_ANIMATIONS = new Set(["intro-out", "intro-out-fast"]);

export function Intro() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!el || root.dataset.intro !== "play") {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* navigation privée : l'intro se rejouera, sans conséquence */
    }

    const finish = () => {
      root.dataset.intro = "done";
      setGone(true);
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.target === el && END_ANIMATIONS.has(e.animationName)) finish();
    };
    const skip = () => {
      el.classList.add("intro-fast");
      root.dataset.intro = "fast";
      gestures.forEach((type) => window.removeEventListener(type, skip));
    };
    const gestures = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    el.addEventListener("animationend", onEnd);
    gestures.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    // Filet de sécurité si une animation était interrompue par le navigateur.
    const safety = window.setTimeout(finish, 5000);

    return () => {
      el.removeEventListener("animationend", onEnd);
      gestures.forEach((type) => window.removeEventListener(type, skip));
      window.clearTimeout(safety);
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={ref} className="intro" aria-hidden="true">
      <span className="intro-logo">
        <Logo priority />
      </span>
      <span className="intro-line" />
    </div>
  );
}
