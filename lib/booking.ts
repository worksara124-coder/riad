/**
 * Validation des demandes de réservation, partagée entre le navigateur
 * (BookingModal) et le serveur (app/api/reservation/route.ts).
 */
import { getRoom } from "@/data/rooms";

export const bookingFields = [
  "roomId",
  "arrival",
  "departure",
  "guests",
  "fullName",
  "phone",
  "email",
  "message",
] as const;

export type BookingField = (typeof bookingFields)[number];

export type BookingValues = Record<BookingField, string>;

export type BookingErrors = Partial<Record<BookingField, string>>;

export const MESSAGE_MAX_LENGTH = 1500;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// Volontairement simple : un texte, une arobase, un domaine avec un point.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS = /^[+()\d\s.\-]+$/;

/** Date du jour au format AAAA-MM-JJ, dans le fuseau du navigateur ou en UTC. */
export function isoDate(date: Date, utc = false): string {
  const y = utc ? date.getUTCFullYear() : date.getFullYear();
  const m = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
  const d = utc ? date.getUTCDate() : date.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return isoDate(date, true);
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function emptyBooking(roomId = ""): BookingValues {
  return {
    roomId,
    arrival: "",
    departure: "",
    guests: "",
    fullName: "",
    phone: "",
    email: "",
    message: "",
  };
}

/**
 * @param minArrival date d'arrivée minimale (AAAA-MM-JJ), en général aujourd'hui.
 */
export function validateBooking(values: BookingValues, minArrival: string): BookingErrors {
  const errors: BookingErrors = {};
  const v = (field: BookingField) => (values[field] ?? "").trim();

  const room = getRoom(v("roomId"));
  if (!v("roomId")) errors.roomId = "Choisissez une chambre.";
  else if (!room) errors.roomId = "Cette chambre n'existe pas. Choisissez-en une dans la liste.";

  const arrival = v("arrival");
  if (!arrival) errors.arrival = "Indiquez votre date d'arrivée.";
  else if (!isValidIsoDate(arrival)) errors.arrival = "Cette date n'est pas valide.";
  else if (arrival < minArrival) errors.arrival = "La date d'arrivée ne peut pas être déjà passée.";

  const departure = v("departure");
  if (!departure) errors.departure = "Indiquez votre date de départ.";
  else if (!isValidIsoDate(departure)) errors.departure = "Cette date n'est pas valide.";
  else if (!errors.arrival && departure <= arrival)
    errors.departure = "La date de départ doit être postérieure à la date d'arrivée.";

  const guestsRaw = v("guests");
  if (!guestsRaw) errors.guests = "Indiquez le nombre de voyageurs.";
  else if (!/^\d+$/.test(guestsRaw) || Number(guestsRaw) < 1)
    errors.guests = "Indiquez un nombre entier de voyageurs, au moins 1.";
  else if (room?.capacity != null && Number(guestsRaw) > room.capacity)
    errors.guests = `Cette chambre accueille au maximum ${room.capacity} voyageur${room.capacity > 1 ? "s" : ""}.`;

  const fullName = v("fullName");
  if (!fullName) errors.fullName = "Indiquez votre nom complet.";
  else if (fullName.length < 2 || fullName.length > 120) errors.fullName = "Indiquez un nom complet valide.";

  const phone = v("phone");
  const phoneDigits = phone.replace(/\D/g, "");
  if (!phone) errors.phone = "Indiquez votre numéro de téléphone.";
  else if (!PHONE_CHARS.test(phone) || phoneDigits.length < 6 || phoneDigits.length > 20)
    errors.phone = "Indiquez un numéro de téléphone valide, par exemple +212 6 00 00 00 00.";

  const email = v("email");
  if (!email) errors.email = "Indiquez votre adresse e-mail.";
  else if (!EMAIL.test(email) || email.length > 254)
    errors.email = "Indiquez une adresse e-mail valide, par exemple nom@domaine.com.";

  if (v("message").length > MESSAGE_MAX_LENGTH)
    errors.message = `Votre message ne doit pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`;

  return errors;
}
