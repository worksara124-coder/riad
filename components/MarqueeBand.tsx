/**
 * Bandeau de couleur avec mots géants qui défilent et accent manuscrit superposé.
 * Animation CSS pure, arrêtée avec la réduction des animations.
 */
const words = ["Patio", "Chambres", "Lumière", "Zellige", "Terrasse", "Bois sculpté"];

function Row() {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {words.map((w) => (
        <span key={w} className="flex items-center">
          <span className="display whitespace-nowrap px-[0.35em] text-[clamp(3.5rem,2rem+7vw,9rem)] text-creme/45">{w}</span>
          <span className="text-[clamp(1.2rem,1rem+1vw,2rem)] text-creme/50">+</span>
        </span>
      ))}
    </div>
  );
}

export function MarqueeBand() {
  return (
    <section aria-label="L’esprit Riad Noor" className="relative overflow-hidden bg-olive py-[clamp(4rem,8vw,7rem)]">
      <p className="script relative z-10 px-6 text-[clamp(3rem,2rem+4vw,6.5rem)] text-creme sm:px-12">
        Le temps d’un séjour
      </p>
      <div className="relative -mt-[clamp(1.5rem,3vw,3rem)]">
        <div className="marquee-track motion-reduce:animate-none">
          <Row />
          <Row />
        </div>
      </div>
      <p className="sr-only">Patio, chambres, lumière, zellige, terrasse, bois sculpté.</p>
    </section>
  );
}
