import Image from "next/image";

/**
 * Logo RIAD NOOR fourni (fond transparent). Le fichier public/images/logo-riad-noor.png
 * est l'original dont seules les marges transparentes ont été réduites :
 * proportions et dessin intacts. La hauteur est fixée, la largeur suit le ratio.
 */
export const LOGO_RATIO = 840 / 290;

export function Logo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/logo-riad-noor.png"
      alt="Riad Noor"
      width={840}
      height={290}
      priority={priority}
      sizes="200px"
      className={`h-full w-auto ${className}`}
    />
  );
}
