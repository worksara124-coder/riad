/**
 * Point d'intégration serveur des demandes de réservation.
 *
 * Par défaut, aucun service n'est configuré : la route répond 503 et ne
 * transmet rien. Pour activer l'envoi, définissez côté serveur :
 *   RESERVATION_WEBHOOK_URL     URL qui recevra la demande en JSON (POST)
 *   RESERVATION_WEBHOOK_SECRET  (facultatif) envoyé dans l'en-tête X-Riad-Noor-Secret
 * puis reconstruisez le site. Voir README, « Connecter le formulaire ».
 *
 * Ces variables ne sont jamais exposées au navigateur (pas de préfixe NEXT_PUBLIC_).
 */
import { NextResponse } from "next/server";
import { getRoom } from "@/data/rooms";
import {
  addDays,
  bookingFields,
  emptyBooking,
  isoDate,
  validateBooking,
  type BookingValues,
} from "@/lib/booking";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 10_000;

export async function POST(request: Request) {
  const webhookUrl = process.env.RESERVATION_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, code: "not_configured", message: "L'envoi des demandes n'est pas encore activé." },
      { status: 503 },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, code: "too_large" }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }

  // Champ piège invisible pour les robots : s'il est rempli, on ignore la demande.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: false, code: "rejected" }, { status: 400 });
  }

  const values: BookingValues = emptyBooking();
  for (const field of bookingFields) {
    const value = body[field];
    values[field] = typeof value === "string" ? value.trim() : "";
  }

  // Tolérance d'un jour : le visiteur peut se trouver dans un fuseau en avance sur le serveur.
  const minArrival = addDays(isoDate(new Date(), true), -1);
  const errors = validateBooking(values, minArrival);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, code: "invalid", errors }, { status: 422 });
  }

  const room = getRoom(values.roomId);
  const payload = {
    type: "demande_de_reservation",
    receivedAt: new Date().toISOString(),
    room: { id: values.roomId, name: room?.name ?? values.roomId },
    arrival: values.arrival,
    departure: values.departure,
    guests: Number(values.guests),
    fullName: values.fullName,
    phone: values.phone,
    email: values.email,
    message: values.message,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.RESERVATION_WEBHOOK_SECRET) {
    headers["X-Riad-Noor-Secret"] = process.env.RESERVATION_WEBHOOK_SECRET;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[reservation] Le service a répondu ${response.status}`);
      return NextResponse.json({ ok: false, code: "upstream_error" }, { status: 502 });
    }
  } catch (error) {
    console.error("[reservation] Échec de l'envoi", error);
    return NextResponse.json({ ok: false, code: "upstream_unreachable" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
