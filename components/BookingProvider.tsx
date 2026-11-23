"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { rooms } from "@/data/rooms";
import { BookingModal } from "./BookingModal";

interface BookingContextValue {
  /** Ouvre la fenêtre de demande, chambre préremplie ; le focus revient sur `trigger` à la fermeture. */
  openBooking: (roomId: string, trigger?: HTMLElement | null) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking doit être utilisé dans <BookingProvider>.");
  return ctx;
}

/** Une seule fenêtre de réservation pour toute la page (cartes, appel à l'action, etc.). */
export function BookingProvider({ bookingEnabled, children }: { bookingEnabled: boolean; children: ReactNode }) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const openBooking = useCallback((id: string, trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    setRoomId(id);
  }, []);

  const close = useCallback(() => {
    setRoomId(null);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  return (
    <BookingContext.Provider value={{ openBooking }}>
      {children}
      <BookingModal rooms={rooms} roomId={roomId} onClose={close} bookingEnabled={bookingEnabled} />
    </BookingContext.Provider>
  );
}
