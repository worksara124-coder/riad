"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { Room } from "@/data/rooms";
import {
  addDays,
  emptyBooking,
  isoDate,
  MESSAGE_MAX_LENGTH,
  validateBooking,
  type BookingErrors,
  type BookingField,
  type BookingValues,
} from "@/lib/booking";

interface BookingModalProps {
  rooms: Room[];
  /** Chambre choisie sur la carte ; `null` = fenêtre fermée. */
  roomId: string | null;
  onClose: () => void;
  /** true uniquement si un service d'envoi est configuré côté serveur. */
  bookingEnabled: boolean;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "demo" }
  | { kind: "error"; message: string };

const fieldOrder: BookingField[] = ["roomId", "arrival", "departure", "guests", "fullName", "phone", "email", "message"];

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });
const formatDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFormat.format(new Date(Date.UTC(y, m - 1, d)));
};
const nightsBetween = (a: string, b: string) => {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
};

export function BookingModal({ rooms, roomId, onClose, bookingEnabled }: BookingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const descId = useId();
  const open = roomId !== null;

  const [values, setValues] = useState<BookingValues>(() => emptyBooking());
  const [errors, setErrors] = useState<BookingErrors>({});
  const [touched, setTouched] = useState<Partial<Record<BookingField, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [today, setToday] = useState("");
  const [website, setWebsite] = useState(""); // champ piège anti-robots, invisible

  // Ouverture / fermeture du <dialog> natif (fond inerte, Échap).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setValues((prev) => ({ ...emptyBooking(roomId ?? ""), ...keepContact(prev) }));
      setErrors({});
      setTouched({});
      setStatus({ kind: "idle" });
      setToday(isoDate(new Date()));
      lockScroll();
      dialog.showModal();
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[name='arrival']")?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, roomId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault(); // Échap : on passe par onClose pour rendre le focus
      onClose();
    };
    const onNativeClose = () => unlockScroll();
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onNativeClose);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onNativeClose);
      unlockScroll();
    };
  }, [onClose]);

  const room = rooms.find((r) => r.id === values.roomId);
  const minDeparture = values.arrival ? addDays(values.arrival, 1) : today ? addDays(today, 1) : undefined;
  const nights =
    values.arrival && values.departure && values.departure > values.arrival
      ? nightsBetween(values.arrival, values.departure)
      : 0;

  function update(field: BookingField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (status.kind === "demo" || status.kind === "error") setStatus({ kind: "idle" });
    if (touched[field] || errors[field]) {
      const all = validateBooking(next, today);
      setErrors((prev) => {
        const out = { ...prev, [field]: all[field] };
        // Les deux dates, et la chambre et sa capacité, dépendent l'une de l'autre.
        if (field === "arrival" && (touched.departure || prev.departure)) out.departure = all.departure;
        if (field === "roomId" && (touched.guests || prev.guests)) out.guests = all.guests;
        return out;
      });
    }
  }

  function blur(field: BookingField, e: React.FocusEvent) {
    // Pas d'erreur « champ obligatoire » au simple passage dans un champ vide,
    // ni juste avant l'envoi (le bouton se déplacerait sous le pointeur) : l'envoi valide tout.
    const next = e.relatedTarget as HTMLElement | null;
    if (next?.getAttribute("type") === "submit") return;
    if (!values[field].trim() && !errors[field]) return;
    setTouched((t) => ({ ...t, [field]: true }));
    const all = validateBooking(values, today);
    setErrors((prev) => ({ ...prev, [field]: all[field] }));
  }

  function stepGuests(delta: number) {
    const current = Number.parseInt(values.guests, 10);
    const base = Number.isFinite(current) ? current : 0;
    const max = room?.capacity ?? 20;
    const next = Math.min(max, Math.max(1, base + delta));
    setTouched((t) => ({ ...t, guests: true }));
    update("guests", String(next));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "sending") return;
    const all = validateBooking(values, today);
    setErrors(all);
    setTouched(Object.fromEntries(fieldOrder.map((f) => [f, true])));
    const firstError = fieldOrder.find((f) => all[f]);
    if (firstError) {
      formRef.current?.querySelector<HTMLElement>(`[name='${firstError}']`)?.focus();
      return;
    }

    // Aucun service configuré : rien n'est transmis, on l'indique clairement.
    if (!bookingEnabled) {
      setStatus({ kind: "demo" });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website }),
      });
      if (response.ok) {
        setStatus({ kind: "sent" });
        return;
      }
      const data = (await response.json().catch(() => null)) as { code?: string; errors?: BookingErrors } | null;
      if (data?.code === "invalid" && data.errors) {
        setErrors(data.errors);
        setStatus({ kind: "error", message: "Certaines informations sont à corriger." });
      } else if (data?.code === "not_configured") {
        setStatus({ kind: "demo" });
      } else {
        setStatus({ kind: "error", message: "L’envoi n’a pas abouti. Veuillez réessayer dans un instant." });
      }
    } catch {
      setStatus({ kind: "error", message: "Connexion impossible. Vérifiez votre réseau puis réessayez." });
    }
  }

  // Tabulation maintenue dans la fenêtre (la fenêtre modale native laisse sortir vers le navigateur).
  function trapFocus(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([tabindex='-1']):not([type='radio']), input[type='radio']:checked, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((el) => el.getClientRects().length > 0 || el === document.activeElement);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const err = (field: BookingField) => (touched[field] || status.kind !== "idle" ? errors[field] : undefined);
  const control = (field: BookingField, extra = "") => fieldClass(Boolean(err(field)), extra);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onKeyDown={trapFocus}
      className="booking m-0 h-[100dvh] w-full bg-transparent p-0 text-brun md:m-auto md:h-fit md:w-[min(66rem,calc(100vw-3rem))]"
    >
      {open && (
        <div className="flex h-full max-h-[100dvh] overflow-hidden bg-creme shadow-[0_30px_80px_-30px_rgb(53_39_31/0.55)] md:max-h-[min(46rem,calc(100dvh-3rem))] md:rounded-[28px]">
          {/* Visuel de la chambre choisie (écrans moyens et grands). */}
          <aside className="relative hidden w-[40%] shrink-0 overflow-hidden bg-sable md:block" aria-hidden="true">
            {room && (
              <Image
                key={room.id}
                src={room.image}
                alt=""
                fill
                sizes="62rem"
                quality={90}
                className="booking-photo object-cover"
                style={{ objectPosition: room.imagePosition ?? "50% 50%" }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brun/70 via-brun/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-creme">
              <p className="text-[0.78rem] font-medium uppercase tracking-[0.18em] text-creme/80">Votre chambre</p>
              <p className="mt-1.5 font-display text-[1.9rem] font-light leading-tight tracking-[-0.02em]">{room?.name}</p>
              {room && <p className="mt-2 max-w-[30ch] text-[0.92rem] leading-relaxed text-creme/85">{room.description}</p>}
              {nights > 0 && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-creme/15 px-4 py-2 text-[0.88rem] backdrop-blur-sm">
                  {nights} nuit{nights > 1 ? "s" : ""} · du {formatDay(values.arrival)} au {formatDay(values.departure)}
                </p>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-9 sm:pt-8">
              <div>
                <h2 id={titleId} className="font-display text-[clamp(1.6rem,1.35rem+1vw,2.1rem)] font-light leading-tight tracking-[-0.02em] text-brun">
                  Réserver votre séjour
                </h2>
                <p id={descId} className="mt-1.5 max-w-[42ch] text-[0.95rem] text-brun-logo">
                  Indiquez vos dates et vos coordonnées pour nous transmettre votre demande.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#efe7da] text-brun transition-colors hover:bg-sable"
                aria-label="Fermer la fenêtre de réservation"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>

            {status.kind === "sent" ? (
              <div role="status" className="m-5 rounded-[22px] bg-[#efe7da] px-6 py-8 sm:mx-9">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brun/30" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 10.5l4 4 8-9" /></svg>
                </span>
                <p className="mt-4 font-display text-xl font-normal text-brun">Merci, votre demande a bien été transmise.</p>
                <p className="mt-2 text-brun-logo">
                  Il s’agit d’une demande et non d’une réservation confirmée : le riad reviendra vers vous pour confirmer les
                  disponibilités.
                </p>
                <button type="button" onClick={onClose} className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-brun px-7 font-medium text-creme hover:bg-terracotta-fonce">
                  Fermer
                </button>
              </div>
            ) : (
              <form ref={formRef} noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-9">

                  <Section index="01" title="Votre séjour">
                    {/* Choix de la chambre : vignettes rondes, boutons radio natifs. */}
                    <fieldset aria-describedby={err("roomId") ? "booking-roomId-erreur" : undefined}>
                      <legend className="mb-2.5 text-[0.85rem] font-medium text-brun">Chambre</legend>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {rooms.map((r) => {
                          const checked = values.roomId === r.id;
                          return (
                            <label
                              key={r.id}
                              className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-[20px] border px-2 pb-3 pt-3 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta-fonce ${
                                checked ? "border-brun/60 bg-[#fbf8f2]" : "border-transparent bg-[#efe7da] hover:bg-[#e9dfcf]"
                              }`}
                            >
                              <input
                                type="radio"
                                name="roomId"
                                id={`booking-roomId-${r.id}`}
                                value={r.id}
                                checked={checked}
                                onChange={() => update("roomId", r.id)}
                                className="sr-only"
                              />
                              <span className="relative block h-14 w-14 overflow-hidden rounded-full bg-sable sm:h-16 sm:w-16">
                                <Image src={r.image} alt="" fill sizes="96px" quality={90} className="object-cover" style={{ objectPosition: r.imagePosition ?? "50% 50%" }} />
                              </span>
                              <span className="text-[0.8rem] font-medium leading-tight text-brun sm:text-[0.85rem]">{r.name}</span>
                              {checked && (
                                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brun text-creme" aria-hidden="true">
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 6.5l2.3 2.3L9.5 3.5" /></svg>
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      <ErrorText id="booking-roomId-erreur" error={err("roomId")} />
                    </fieldset>

                    <div className="mt-5 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
                      <Field label="Date d’arrivée" field="arrival" error={err("arrival")}>
                        {(a11y) => (
                          <input
                            {...a11y}
                            type="date"
                            min={today || undefined}
                            value={values.arrival}
                            onChange={(e) => update("arrival", e.target.value)}
                            onBlur={(e) => blur("arrival", e)}
                            className={control("arrival")}
                            required
                          />
                        )}
                      </Field>
                      <Field label="Date de départ" field="departure" error={err("departure")}>
                        {(a11y) => (
                          <input
                            {...a11y}
                            type="date"
                            min={minDeparture}
                            value={values.departure}
                            onChange={(e) => update("departure", e.target.value)}
                            onBlur={(e) => blur("departure", e)}
                            className={control("departure")}
                            required
                          />
                        )}
                      </Field>
                    </div>
                    {nights > 0 && (
                      <p className="mt-2 text-[0.85rem] text-brun-logo md:hidden" aria-live="polite">
                        {nights} nuit{nights > 1 ? "s" : ""} · du {formatDay(values.arrival)} au {formatDay(values.departure)}
                      </p>
                    )}

                    <div className="mt-4">
                      <Field
                        label="Nombre de voyageurs"
                        field="guests"
                        error={err("guests")}
                        hint={room?.capacity != null ? `Jusqu’à ${room.capacity} voyageur${room.capacity > 1 ? "s" : ""}` : undefined}
                      >
                        {(a11y) => (
                          <div className={`flex h-12 w-full max-w-[13rem] items-center justify-between rounded-full px-1.5 ${err("guests") ? "bg-terracotta/10 ring-1 ring-terracotta-fonce" : "bg-[#efe7da]"}`}>
                            <StepButton label="Retirer un voyageur" onClick={() => stepGuests(-1)}>
                              <path d="M4 9h10" />
                            </StepButton>
                            <input
                              {...a11y}
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={room?.capacity ?? undefined}
                              step={1}
                              placeholder="–"
                              value={values.guests}
                              onChange={(e) => update("guests", e.target.value)}
                              onBlur={(e) => blur("guests", e)}
                              className="w-14 appearance-none bg-transparent text-center text-base font-medium text-brun outline-none [-moz-appearance:textfield] placeholder:text-brun-logo/60 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-terracotta-fonce [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              required
                            />
                            <StepButton label="Ajouter un voyageur" onClick={() => stepGuests(1)}>
                              <path d="M4 9h10M9 4v10" />
                            </StepButton>
                          </div>
                        )}
                      </Field>
                    </div>
                  </Section>

                  <Section index="02" title="Vos coordonnées">
                    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
                      <Field label="Nom complet" field="fullName" error={err("fullName")} className="min-[420px]:col-span-2">
                        {(a11y) => (
                          <input
                            {...a11y}
                            type="text"
                            autoComplete="name"
                            value={values.fullName}
                            onChange={(e) => update("fullName", e.target.value)}
                            onBlur={(e) => blur("fullName", e)}
                            className={control("fullName")}
                            required
                          />
                        )}
                      </Field>
                      <Field label="Téléphone" field="phone" error={err("phone")}>
                        {(a11y) => (
                          <input
                            {...a11y}
                            type="tel"
                            autoComplete="tel"
                            value={values.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            onBlur={(e) => blur("phone", e)}
                            className={control("phone")}
                            required
                          />
                        )}
                      </Field>
                      <Field label="E-mail" field="email" error={err("email")}>
                        {(a11y) => (
                          <input
                            {...a11y}
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            onChange={(e) => update("email", e.target.value)}
                            onBlur={(e) => blur("email", e)}
                            className={control("email")}
                            required
                          />
                        )}
                      </Field>
                      <Field label="Message" field="message" optional error={err("message")} className="min-[420px]:col-span-2">
                        {(a11y) => (
                          <textarea
                            {...a11y}
                            rows={3}
                            maxLength={MESSAGE_MAX_LENGTH}
                            placeholder="Une occasion particulière, une heure d’arrivée…"
                            value={values.message}
                            onChange={(e) => update("message", e.target.value)}
                            onBlur={(e) => blur("message", e)}
                            className={control("message", "rounded-[22px] py-3.5 resize-y min-h-[104px]")}
                          />
                        )}
                      </Field>
                    </div>
                  </Section>

                  {/* Champ piège : invisible pour les visiteurs, souvent rempli par les robots. */}
                  <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                    <label>
                      Site web
                      <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </label>
                  </div>

                  <div aria-live="polite">
                    {status.kind === "demo" && (
                      <p role="status" className="mt-2 rounded-[18px] bg-olive/10 px-4 py-3 text-[0.9rem] text-brun">
                        Votre demande est complète, mais elle <strong className="font-semibold">n’a pas été envoyée</strong> : le
                        service d’envoi n’est pas encore activé sur ce site.
                      </p>
                    )}
                    {status.kind === "error" && (
                      <p role="alert" className="mt-2 rounded-[18px] bg-terracotta/10 px-4 py-3 text-[0.9rem] text-brun">
                        {status.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Barre d'envoi toujours visible, même sur petit écran. */}
                <div className="flex flex-col-reverse gap-3 border-t border-sable/70 bg-creme px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-9">
                  <p className="text-[0.8rem] text-brun-logo">Une demande, pas une réservation confirmée.</p>
                  <button
                    type="submit"
                    disabled={status.kind === "sending"}
                    className="inline-flex min-h-[50px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brun px-8 text-[0.95rem] font-medium text-creme transition-colors duration-300 hover:bg-terracotta-fonce disabled:cursor-wait disabled:opacity-70"
                  >
                    {status.kind === "sending" ? "Envoi en cours…" : "Envoyer ma demande"}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

/* ---------- Éléments de formulaire ---------- */

function fieldClass(invalid: boolean, extra = "") {
  return `w-full rounded-full border px-5 text-[0.95rem] text-brun transition-colors placeholder:text-brun-logo/55 focus:bg-[#fbf8f2] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-fonce ${
    extra || "h-12"
  } ${invalid ? "border-terracotta-fonce bg-terracotta/5" : "border-transparent bg-[#efe7da] hover:bg-[#e9dfcf]"}`;
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="mb-4 flex items-center gap-3 text-[0.95rem] font-medium text-brun">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brun/25 text-[0.75rem] font-medium text-brun-logo" aria-hidden="true">
          {index}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-creme text-brun shadow-[0_1px_3px_rgb(53_39_31/0.12)] transition-colors hover:bg-white"
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 pl-1 text-[0.85rem] font-medium text-terracotta-fonce">
      {error}
    </p>
  );
}

interface A11yProps {
  id: string;
  name: BookingField;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
}

function Field({
  label,
  field,
  error,
  hint,
  optional,
  className = "",
  children,
}: {
  label: string;
  field: BookingField;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: (props: A11yProps) => ReactNode;
}) {
  const id = `booking-${field}`;
  const errorId = `${id}-erreur`;
  const hintId = `${id}-aide`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={id} className="mb-1.5 pl-1 text-[0.85rem] font-medium text-brun">
        {label}
        {optional ? <span className="font-normal text-brun-logo"> (facultatif)</span> : null}
      </label>
      {children({ id, name: field, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="mt-1 pl-1 text-[0.8rem] text-brun-logo">
          {hint}
        </p>
      )}
      <ErrorText id={errorId} error={error} />
    </div>
  );
}

/* ---------- Utilitaires ---------- */

/** Garde les coordonnées déjà saisies si le visiteur rouvre la fenêtre pour une autre chambre. */
function keepContact(prev: BookingValues): Partial<BookingValues> {
  return { fullName: prev.fullName, phone: prev.phone, email: prev.email };
}

let scrollLocked = false;
function lockScroll() {
  if (scrollLocked) return;
  scrollLocked = true;
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.overflow = "hidden";
  if (scrollbar > 0) document.documentElement.style.paddingRight = `${scrollbar}px`;
}
function unlockScroll() {
  if (!scrollLocked) return;
  scrollLocked = false;
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
}
