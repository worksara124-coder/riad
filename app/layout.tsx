import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/latin-200.css";
import "@fontsource/poppins/latin-300.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/allison/latin-400.css";
import "./globals.css";
import { introBootScript } from "@/components/Intro";

export const metadata: Metadata = {
  title: "Riad Noor — Un refuge au cœur de Marrakech",
  description:
    "Poussez la porte du Riad Noor : un patio paisible, des chambres aux matières naturelles et une autre façon de vivre Marrakech.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F2E9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" data-intro="play" suppressHydrationWarning>
      <head>
        {/* Première image visible : chargée en priorité, avant tout script. */}
        <link
          rel="preload"
          as="image"
          href="/images/scene-01-debut.webp"
          media="(min-width: 768px)"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/images/scene-01-debut-mobile.webp"
          media="(max-width: 767px)"
          fetchPriority="high"
        />
        {/* Décide avant le premier affichage si l'intro doit être jouée (évite tout clignotement). */}
        <script dangerouslySetInnerHTML={{ __html: introBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
