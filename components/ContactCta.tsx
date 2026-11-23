"use client";

import { rooms } from "@/data/rooms";
import { useBooking } from "./BookingProvider";

/** « Une question ? » : ouvre la fenêtre de demande (aucune coordonnée inventée). */
export function ContactCta() {
  const { openBooking } = useBooking();
  return (
    <section aria-labelledby="contact-titre" className="bg-creme px-5 py-[clamp(5rem,10vw,8rem)] text-center sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <h2 id="contact-titre" className="title-duo items-center text-brun">
          <span className="script text-[clamp(4rem,2.8rem+4.6vw,7rem)]" style={{ marginTop: 0, transform: "rotate(-4deg)" }}>
            Une question ?
          </span>
          <span className="display -mt-2 text-[clamp(1.9rem,1.3rem+2.4vw,3.4rem)]">Parlons de votre séjour</span>
        </h2>
        <p className="mt-6 max-w-[48ch] text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] text-brun-logo">
          Indiquez vos dates, le nombre de voyageurs et vos envies : votre demande est le premier pas vers votre séjour
          au Riad Noor.
        </p>
        <button type="button" className="btn-solid mt-8" onClick={(e) => openBooking(rooms[0].id, e.currentTarget)}>
          Faire une demande
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
