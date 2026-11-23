import Image from "next/image";
import type { Room } from "@/data/rooms";

function formatPrice(price: NonNullable<Room["pricePerNight"]>) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.amount);
}

interface RoomCardProps {
  room: Room;
  index: number;
  onBook: (roomId: string, trigger: HTMLButtonElement) => void;
}

/** Carte éditoriale : grande photo, numéro, nom en capitales, description, demande de réservation. */
export function RoomCard({ room, index, onBook }: RoomCardProps) {
  const details: string[] = [];
  if (room.capacity != null) details.push(`${room.capacity} voyageur${room.capacity > 1 ? "s" : ""} max.`);
  if (room.surface != null) details.push(`${room.surface} m²`);

  return (
    <article data-room-card className="group flex h-full flex-col">
      <div className="arch-frame relative aspect-[4/5] bg-sable">
        {/* Le cadre intérieur bouge légèrement au scroll (parallaxe). */}
        <div data-parallax className="absolute inset-x-0 -top-[8%] h-[116%]">
          <Image
            src={room.image}
            alt={room.imageAlt}
            fill
            sizes="(min-width: 1100px) 31vw, (min-width: 680px) 46vw, 92vw"
            className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-doux)] group-hover:scale-[1.04] motion-reduce:transform-none"
            style={{ objectPosition: room.imagePosition ?? "50% 50%" }}
          />
        </div>
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-creme/90 px-3 py-1 text-[0.72rem] font-medium tracking-[0.2em] text-brun">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-6">
        <h3 className="display text-[clamp(1.35rem,1.15rem+0.8vw,1.8rem)] text-brun">{room.name}</h3>
        <p className="mt-3 max-w-[38ch] text-[0.95rem] text-brun-logo">{room.description}</p>

        {(details.length > 0 || room.pricePerNight) && (
          <dl className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[0.9rem]">
            {details.length > 0 && (
              <div>
                <dt className="sr-only">Caractéristiques</dt>
                <dd className="text-brun-logo">{details.join(" · ")}</dd>
              </div>
            )}
            {room.pricePerNight && (
              <div>
                <dt className="sr-only">Prix par nuit</dt>
                <dd>
                  <span className="font-medium text-brun">{formatPrice(room.pricePerNight)}</span>
                  <span className="text-brun-logo"> / nuit</span>
                </dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={(e) => onBook(room.id, e.currentTarget)}
            className="btn-dark w-full sm:w-auto"
            aria-label={`Réserver votre séjour — ${room.name}`}
          >
            Réserver votre séjour
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
