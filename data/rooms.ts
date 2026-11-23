/**
 * Informations des chambres.
 *
 * Les champs `capacity`, `surface` et `pricePerNight` sont volontairement à `null` :
 * aucune donnée réelle n'a été fournie. Renseignez-les ici ; un champ à `null`
 * n'est simplement pas affiché sur la carte (et la capacité n'est pas contrôlée
 * dans le formulaire tant qu'elle est inconnue).
 *
 * Photos : `chambre-classique.webp`, `chambre-superieure.webp`, `suite-noor.webp`
 * (format 4:3, recadrées en portrait dans les cartes via `imagePosition`).
 */

export type Currency = "MAD" | "EUR";

export interface Room {
  id: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Point de cadrage de la photo dans la carte (CSS object-position). */
  imagePosition?: string;
  /** Nombre maximal de voyageurs. `null` = non renseigné. */
  capacity: number | null;
  /** Superficie en m². `null` = non renseignée. */
  surface: number | null;
  /** Prix par nuit. `null` = non communiqué (aucun prix n'est affiché). */
  pricePerNight: { amount: number; currency: Currency } | null;
}

export const rooms: Room[] = [
  {
    id: "chambre-classique",
    name: "Chambre Classique",
    description:
      "Des matières naturelles et une atmosphère paisible pour savourer votre séjour à Marrakech.",
    image: "/images/chambre-classique.webp",
    imageAlt: "Chambre Classique : lit au linge clair, tête de lit sculptée et portes ouvertes sur la fontaine du patio.",
    imagePosition: "58% 50%",
    capacity: null,
    surface: null,
    pricePerNight: null,
  },
  {
    id: "chambre-superieure",
    name: "Chambre Supérieure",
    description:
      "Un espace accueillant où le charme marocain rencontre le confort contemporain.",
    image: "/images/chambre-superieure.webp",
    imageAlt: "Chambre Supérieure : jeté vert olive, coussins terracotta et arche ouverte sur le patio.",
    imagePosition: "62% 50%",
    capacity: null,
    surface: null,
    pricePerNight: null,
  },
  {
    id: "suite-noor",
    name: "Suite Noor",
    description: "Une parenthèse intime, entre détails artisanaux et douceur de vivre.",
    image: "/images/suite-noor.webp",
    imageAlt: "Suite Noor : lit sous une alcôve, salon avec plateau à thé et grandes portes sur le patio.",
    imagePosition: "62% 50%",
    capacity: null,
    surface: null,
    pricePerNight: null,
  },
];

export function getRoom(id: string): Room | undefined {
  return rooms.find((room) => room.id === id);
}
