/**
 * En-tête commun à toutes les sections : numéro de chapitre, ornement (l'arche étoilée du logo),
 * titre en capitales + accent manuscrit, introduction. C'est le fil conducteur de la page.
 */
import Image from "next/image";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  chapter: string;
  label: string;
  title: string;
  accent?: string;
  intro?: ReactNode;
  align?: "center" | "left";
  tone?: "dark" | "light";
}

export function SectionHeading({ id, chapter, label, title, accent, intro, align = "center", tone = "dark" }: SectionHeadingProps) {
  const centered = align === "center";
  const light = tone === "light";
  return (
    <header data-reveal className={`flex flex-col ${centered ? "items-center text-center" : "items-start text-left"}`}>
      <div className={`ornament ${centered ? "" : "before:hidden"} ${light ? "!text-creme" : ""}`}>
        <Image src="/images/arche.png" alt="" width={22} height={24} className={light ? "brightness-[3] opacity-80" : ""} />
      </div>
      <p className={`eyebrow mt-4 ${light ? "!text-creme/80" : ""}`}>
        <span className={light ? "text-creme" : "text-terracotta-fonce"}>{chapter}</span>
        <span className="mx-2 opacity-50">—</span>
        {label}
      </p>
      <h2 id={id} className={`title-duo mt-4 ${centered ? "items-center" : ""} ${light ? "text-creme" : "text-brun"}`}>
        <span className="display text-[clamp(2.4rem,1.6rem+3.2vw,4.6rem)]">{title}</span>
        {accent && (
          <span
            className={`script -mt-[0.28em] text-[clamp(3.8rem,2.6rem+4.8vw,7.2rem)] ${light ? "!text-creme/90" : ""}`}
            aria-hidden="true"
          >
            {accent}
          </span>
        )}
      </h2>
      {intro && (
        <p className={`mt-6 max-w-[46ch] text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] ${light ? "text-creme/85" : "text-brun-logo"}`}>
          {intro}
        </p>
      )}
    </header>
  );
}

/** Liste des chapitres, partagée par le sommaire latéral. */
export const chapters = [
  { id: "le-riad", number: "01", label: "La porte" },
  { id: "chambres", number: "02", label: "Les chambres" },
  { id: "lumiere", number: "03", label: "La lumière" },
  { id: "art-de-vivre", number: "04", label: "L’âme du riad" },
  { id: "galerie", number: "05", label: "En images" },
  { id: "votre-sejour", number: "06", label: "Votre séjour" },
] as const;
