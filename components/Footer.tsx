import { Logo } from "./Logo";

const links = [
  { href: "#le-riad", label: "Le riad" },
  { href: "#chambres", label: "Nos chambres" },
  { href: "#art-de-vivre", label: "L’âme du riad" },
  { href: "#galerie", label: "Galerie" },
];

export function Footer() {
  return (
    <footer className="border-t border-sable/80 bg-[#f1e9dc] px-5 pb-8 pt-[clamp(3.5rem,6vw,5rem)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col items-center text-center">
          <span className="block h-[clamp(64px,8vw,92px)]">
            <Logo />
          </span>
          <p className="script mt-4 text-[clamp(2.2rem,1.8rem+1.6vw,3.2rem)] text-terracotta-fonce">
            Un refuge au cœur de Marrakech.
          </p>
        </div>

        <nav aria-label="Liens du pied de page" className="mt-10">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="eyebrow inline-flex min-h-[44px] items-center !text-brun hover:!text-terracotta-fonce">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-sable/80 pt-6 text-[0.85rem] text-brun-logo sm:flex-row">
          <p>Marrakech, Maroc</p>
          <a href="#top" className="btn-ghost !min-h-[42px] !px-5">
            <span aria-hidden="true">↑</span>
            Retour en haut
          </a>
        </div>
      </div>
    </footer>
  );
}
