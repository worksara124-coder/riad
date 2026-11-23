import { Header } from "@/components/Header";
import { ImmersiveExperience } from "@/components/ImmersiveExperience";
import { RoomsSection } from "@/components/RoomsSection";
import { CollageSection } from "@/components/CollageSection";
import { SpiritSection } from "@/components/SpiritSection";
import { MarqueeBand } from "@/components/MarqueeBand";
import { Gallery3D } from "@/components/Gallery3D";
import { ContactCta } from "@/components/ContactCta";
import { Footer } from "@/components/Footer";
import { Intro } from "@/components/Intro";
import { BookingProvider } from "@/components/BookingProvider";

export default function HomePage() {
  // Lu côté serveur uniquement : l'URL et le secret ne sont jamais envoyés au navigateur.
  // La page est statique : après avoir défini la variable, reconstruisez le site (npm run build).
  const bookingEnabled = Boolean(process.env.RESERVATION_WEBHOOK_URL);

  return (
    <BookingProvider bookingEnabled={bookingEnabled}>
      <div id="top" />
      <a
        href="#chambres"
        className="sr-only z-[70] rounded-full bg-brun px-5 py-3 text-creme focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Passer la visite et aller aux chambres
      </a>
      <Intro />
      <Header />
      <main>
        <ImmersiveExperience />
        <RoomsSection />
        <CollageSection />
        <SpiritSection />
        <MarqueeBand />
        <Gallery3D />
        <ContactCta />
      </main>
      <Footer />
    </BookingProvider>
  );
}
