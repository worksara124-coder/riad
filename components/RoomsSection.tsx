"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { rooms } from "@/data/rooms";
import { RoomCard } from "./RoomCard";
import { useBooking } from "./BookingProvider";

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
      className="relative bg-creme px-5 pb-[clamp(5rem,9vw,8rem)] pt-[clamp(4rem,8vw,7rem)] sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-[1320px]">
        <header className="mx-auto flex max-w-3xl flex-col items-center text-center" data-reveal>
          <p className="eyebrow">Riad Noor · Marrakech</p>
          <h2 id="chambres-titre" className="title-duo mt-5 items-center text-brun">
            <span className="display text-[clamp(2.6rem,1.8rem+3.4vw,5rem)]">Nos chambres</span>
            <span className="script -mt-[0.3em] text-[clamp(4rem,2.8rem+5vw,8rem)]" aria-hidden="true">
              votre cocon
            </span>
          </h2>
          <p className="mt-6 max-w-[44ch] text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] text-brun-logo">
            Choisissez le cocon de votre prochain séjour à Marrakech.
          </p>
        </header>

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
