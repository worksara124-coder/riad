"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lantern } from "./Lantern";
import { SectionHeading } from "./SectionHeading";

gsap.registerPlugin(ScrollTrigger);

/**
 * « L'âme du riad » : lanterne en laiton animée en relief et trois matières présentées en cartes 3D.
 * Les textes décrivent uniquement ce que montrent les photos et vidéos du riad.
 */
const materials = [
  {
    title: "Bois sculpté",
    text: "Portes et têtes de lit ciselées de motifs géométriques, dans un bois aux tons chauds.",
    image: "/images/galerie/porte.webp",
    position: "50% 40%",
  },
  {
    title: "Zellige",
    text: "Le vert d’eau de la fontaine, au cœur du patio, et le murmure de l’eau.",
    image: "/images/galerie/fontaine.webp",
    position: "50% 85%",
  },
  {
    title: "Lumière",
    text: "Lanternes en laiton et ombres de palmes qui dessinent les murs au fil du jour.",
    image: "/images/galerie/lit.webp",
    position: "88% 30%",
  },
];

export function SpiritSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Entrée des cartes : elles basculent en 3D depuis l'arrière.
      gsap.from("[data-material]", {
        rotateX: -38,
        rotateY: 8,
        y: 70,
        z: -120,
        autoAlpha: 0,
        transformPerspective: 1100,
        transformOrigin: "50% 100%",
        duration: 1.3,
        ease: "power3.out",
        stagger: 0.14,
        scrollTrigger: { trigger: "[data-materials]", start: "top 82%", once: true },
      });
      gsap.from("[data-spirit-text] > *", {
        y: 28,
        autoAlpha: 0,
        duration: 1.1,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-spirit-text]", start: "top 80%", once: true },
      });
    }, section);

    // Inclinaison 3D des cartes sous le pointeur (souris / stylet uniquement).
    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-tilt]"));
    const cleanups = cards.map((card) => {
      const rx = gsap.quickTo(card, "rotateX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotateY", { duration: 0.6, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 14);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
        card.style.setProperty("--shine-x", `${((e.clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty("--shine-y", `${((e.clientY - r.top) / r.height) * 100}%`);
      };
      const leave = () => {
        rx(0);
        ry(0);
      };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      return () => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
      };
    });

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="art-de-vivre"
      ref={sectionRef}
      aria-labelledby="art-de-vivre-titre"
      className="motif relative overflow-hidden bg-creme px-5 py-[clamp(4rem,8vw,7.5rem)] sm:px-8 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div data-spirit-text>
          <SectionHeading
            id="art-de-vivre-titre"
            chapter="04"
            label="L’âme du riad"
            title="L’âme du riad"
            accent="tout en douceur"
            align="left"
            intro="Des lanternes en laiton, du bois sculpté, du zellige : chaque détail invite à ralentir et à savourer Marrakech autrement."
          />
        </div>

        {/* Lanterne en laiton, animée en relief */}
        <div className="relative row-span-2 mx-auto h-[clamp(440px,70vh,720px)] w-full max-w-[520px] lg:max-w-none">
          <Lantern />
        </div>

        <ul data-materials className="grid gap-4 sm:grid-cols-3 lg:gap-5" style={{ perspective: "1100px" }}>
          {materials.map((m) => (
            <li key={m.title} data-material className="[transform-style:preserve-3d]">
              <article
                data-tilt
                className="tilt-card group relative h-full overflow-hidden rounded-[6px] border border-sable/80 bg-creme shadow-[0_18px_40px_-26px_rgb(53_39_31/0.45)] [transform-style:preserve-3d]"
              >
                <div className="arch-frame relative m-3 mb-0 aspect-[4/3.4]">
                  <Image
                    src={m.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 40vw, 100vw"
                    quality={90}
                    className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-doux)] group-hover:scale-[1.06]"
                    style={{ objectPosition: m.position }}
                  />
                </div>
                <div className="p-5 [transform:translateZ(30px)]">
                  <h3 className="display text-[1.05rem] text-brun">{m.title}</h3>
                  <p className="mt-1.5 text-[0.88rem] leading-relaxed text-brun-logo">{m.text}</p>
                </div>
                <span className="tilt-shine pointer-events-none absolute inset-0" aria-hidden="true" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
