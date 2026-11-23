"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { rooms } from "@/data/rooms";
import { RoomCard } from "./RoomCard";
import { useBooking } from "./BookingProvider";
import { SectionHeading } from "./SectionHeading";

gsap.registerPlugin(ScrollTrigger);

export function RoomsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { openBooking } = useBooking();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Apparition des blocs.
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      gsap.set(items, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", stagger: 0.15, overwrite: true }),
      });
      // Parallaxe douce des photos.
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="chambres"
      ref={sectionRef}
      aria-labelledby="chambres-titre"
      className="motif relative z-[5] bg-creme px-5 pb-[clamp(5rem,9vw,8rem)] pt-[clamp(2.5rem,5vw,4rem)] sm:px-8 lg:px-12"
    >
      {/* L'arche crème monte par-dessus la dernière image de la visite : on passe la porte. */}
      <svg className="arch-rise text-creme" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 120 V112 C210 110 360 92 440 52 C470 36 488 18 500 0 C512 18 530 36 560 52 C640 92 790 110 1000 112 V120 Z"
          fill="currentColor"
        />
      </svg>
      <div className="mx-auto max-w-[1320px]">
        <SectionHeading
          id="chambres-titre"
          chapter="02"
          label="Les chambres"
          title="Nos chambres"
          accent="votre cocon"
          intro="Choisissez le cocon de votre prochain séjour à Marrakech."
        />

        {/* Grille éditoriale décalée : la colonne centrale descend, comme une mise en page de magazine. */}
        <ul className="mt-[clamp(3rem,6vw,5rem)] grid grid-cols-1 gap-x-8 gap-y-14 min-[680px]:grid-cols-2 min-[1100px]:grid-cols-3 min-[1100px]:gap-x-10">
          {rooms.map((room, i) => (
            <li
              key={room.id}
              data-reveal
              className={`${i === 1 ? "min-[1100px]:mt-28" : ""} ${i === 2 ? "min-[1100px]:mt-10" : ""} min-[680px]:max-[1099px]:last:odd:col-span-2 min-[680px]:max-[1099px]:last:odd:mx-auto min-[680px]:max-[1099px]:last:odd:w-[calc(50%-1rem)]`}
            >
              <RoomCard room={room} index={i} onBook={openBooking} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
