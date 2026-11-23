"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeading } from "./SectionHeading";

gsap.registerPlugin(ScrollTrigger);

/**
 * « Le riad en images » : anneau de photos en 3D (CSS 3D + GSAP) qui tourne avec le scroll.
 * Aucune section maintenue : la rotation suit simplement la traversée de la section.
 * Réduction des animations : grille de photos classique.
 */
const photos = [
  { src: "/images/galerie/porte.webp", alt: "La porte en bois sculpté du riad, fermée." },
  { src: "/images/galerie/seuil.webp", alt: "Les battants ouverts sur le patio et sa fontaine." },
  { src: "/images/galerie/fontaine.webp", alt: "La fontaine en zellige vert au centre du patio." },
  { src: "/images/galerie/chambre-classique.webp", alt: "La Chambre Classique et ses portes sculptées." },
  { src: "/images/galerie/galerie-chambre.webp", alt: "Une porte sculptée ouverte sur une chambre depuis le patio." },
  { src: "/images/galerie/chambre-superieure.webp", alt: "La Chambre Supérieure ouverte sur le patio." },
  { src: "/images/galerie/lit.webp", alt: "Une tête de lit en bois ciselé et des coussins terracotta." },
  { src: "/images/galerie/suite-noor.webp", alt: "La Suite Noor, son salon et son alcôve." },
  { src: "/images/galerie/terrasse.webp", alt: "La terrasse au coucher du soleil, face aux toits de Marrakech." },
];

const STEP = 360 / photos.length;

export function Gallery3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const ring = ringRef.current;
    if (!section || !ring || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const figures = Array.from(ring.querySelectorAll<HTMLElement>("[data-panel]"));
    const state = { angle: 25 };

    const apply = () => {
      ring.style.setProperty("--angle", `${state.angle}deg`);
      // Les photos de face sont nettes et lumineuses, celles du fond s'estompent.
      figures.forEach((fig, i) => {
        const rel = (((i * STEP + state.angle) % 360) + 540) % 360 - 180; // −180…180, 0 = face
        const facing = Math.cos((rel * Math.PI) / 180); // 1 face, −1 dos
        fig.style.setProperty("--light", (0.55 + 0.45 * Math.max(0, facing)).toFixed(3));
        fig.style.zIndex = String(Math.round((facing + 1) * 10));
        fig.style.visibility = Math.abs(rel) > 95 ? "hidden" : "visible";
      });
    };
    apply();

    const tween = gsap.to(state, {
      angle: 25 - 225,
      ease: "none",
      onUpdate: apply,
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.8 },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      id="galerie"
      ref={sectionRef}
      aria-labelledby="galerie-titre"
      className="motif motif-sides relative overflow-hidden bg-[#f1e9dc] py-[clamp(4rem,8vw,7rem)]"
    >
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading
          id="galerie-titre"
          chapter="05"
          label="En images"
          title="Le riad en images"
          accent="un tour d’horizon"
          intro="De la porte au patio, du patio à la chambre : un tour d’horizon en faisant défiler."
        />
      </div>

      <div className="ring-stage mx-auto mt-[clamp(2.5rem,5vw,4rem)]">
        <div ref={ringRef} className="ring">
          {photos.map((photo, i) => (
            <figure
              key={photo.src}
              data-panel
              className="ring-panel"
              style={{ "--i": i, "--step": `${STEP}deg` } as React.CSSProperties}
            >
              {/* Panneau portrait taillé dans une photo paysage : l'image affichée est ≈ 1,8 × plus large. */}
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 90vw, 46vw" quality={90} className="object-cover" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
