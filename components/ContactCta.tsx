"use client";

import { rooms } from "@/data/rooms";
import { useBooking } from "./BookingProvider";
import { SectionHeading } from "./SectionHeading";

/** « Une question ? » : ouvre la fenêtre de demande (aucune coordonnée inventée). */
export function ContactCta() {
  const { openBooking } = useBooking();
  return (
    <section id="votre-sejour" aria-labelledby="contact-titre" className="motif motif-sides bg-creme px-5 py-[clamp(5rem,10vw,8rem)] text-center sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <SectionHeading
          id="contact-titre"
          chapter="06"
          label="Votre séjour"
          title="Parlons de votre séjour"
          accent="en toute simplicité"
          intro="Indiquez vos dates, le nombre de voyageurs et vos envies : votre demande est le premier pas vers votre séjour au Riad Noor."
        />
        <button type="button" className="btn-solid mt-8" onClick={(e) => openBooking(rooms[0].id, e.currentTarget)}>
          Faire une demande
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
