"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Accroche éditoriale + collage de tirages photo inclinés qui glissent à des vitesses
 * différentes au scroll (effet de profondeur).
 */
const prints = [
  {
    src: "/images/terrasse.webp",
    alt: "Terrasse au coucher du soleil, banquettes, thé à la menthe et vue sur les toits de Marrakech.",
    className: "left-0 top-[6%] w-[64%] sm:w-[52%]",
    rotate: -3,
    speed: -12,
    position: "50% 50%",
    ratio: "aspect-[4/3]",
  },
  {
    src: "/images/galerie/fontaine.webp",
    alt: "La fontaine en zellige vert au cœur du patio.",
    className: "right-0 top-0 w-[44%] sm:w-[34%]",
    rotate: 4,
    speed: 18,
    position: "50% 70%",
    ratio: "aspect-[4/5]",
  },
  {
    src: "/images/suite-noor.webp",
    alt: "Le salon de la Suite Noor ouvert sur le patio.",
    className: "right-[10%] bottom-0 w-[48%] sm:right-[16%] sm:w-[36%]",
    rotate: -1.5,
    speed: 30,
    position: "25% 50%",
    ratio: "aspect-[4/3]",
  },
];

export function CollageSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-print]").forEach((el) => {
        const speed = Number(el.dataset.speed ?? 0);
        const rotate = Number(el.dataset.rotate ?? 0);
        gsap.fromTo(
          el,
          { yPercent: speed, rotate: rotate * 1.8 },
          {
            yPercent: -speed,
            rotate,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
      });
      gsap.from("[data-tagline] > *", {
        y: 50,
        autoAlpha: 0,
        duration: 1.3,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: { trigger: "[data-tagline]", start: "top 80%", once: true },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="accroche-titre"
      className="relative overflow-hidden bg-[#f1e9dc] px-5 py-[clamp(5rem,10vw,9rem)] sm:px-8 lg:px-12"
    >
      {/* Ombre de palmes sur le mur, comme dans le patio. */}
      <div className="palm-shadow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1320px]">
        <h2 id="accroche-titre" data-tagline className="title-duo items-center text-center text-brun">
          <span className="display text-[clamp(2.4rem,1.4rem+4.4vw,6.2rem)]">Venez pour le patio</span>
          <span className="script -mt-[0.28em] text-[clamp(3.6rem,2.2rem+6.4vw,9.5rem)]">restez pour la lumière</span>
        </h2>

        <div className="relative mx-auto mt-[clamp(3rem,6vw,5rem)] h-[clamp(380px,62vw,760px)] max-w-[1100px]">
          {prints.map((p) => (
            <figure
              key={p.src}
              data-print
              data-speed={p.speed}
              data-rotate={p.rotate}
              className={`print absolute ${p.className}`}
              style={{ transform: `rotate(${p.rotate}deg)` }}
            >
              <div className={`relative ${p.ratio} overflow-hidden rounded-[2px]`}>
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 640px) 50vw, 64vw" className="object-cover" style={{ objectPosition: p.position }} />
              </div>
            </figure>
          ))}
          <p
            className="script pointer-events-none absolute bottom-[8%] left-[4%] z-10 rotate-[-6deg] text-[clamp(2.4rem,1.6rem+3vw,4.6rem)] text-terracotta-fonce"
            aria-hidden="true"
          >
            Rêver de Marrakech
          </p>
        </div>

        <div className="mx-auto mt-[clamp(3rem,6vw,5rem)] flex max-w-[46ch] flex-col items-center text-center">
          <p className="text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] text-brun-logo">
            Derrière la porte, le bruit de la ville s’efface. Il reste le murmure de la fontaine, l’ombre des palmes sur
            les murs et la douceur d’un thé au coucher du soleil.
          </p>
          <a href="#chambres" className="btn-ghost mt-8">
            Découvrir les chambres
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
