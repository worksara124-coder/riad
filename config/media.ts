/**
 * Configuration des médias de la visite immersive.
 *
 * Tous les réglages de raccord, de durée de scroll et de cadrage se font ici :
 * aucun composant n'a besoin d'être modifié pour remplacer une vidéo.
 * Voir le README (section « Réglages de la visite ») pour le détail.
 */

export type SceneId = "entree" | "patio" | "chambre";

export interface SceneMessage {
  /** Partie en capitales (style éditorial). */
  display: string;
  /** Partie manuscrite qui suit. Les deux forment la phrase lue par les lecteurs d'écran. */
  script: string;
  /** Début d'apparition, en fraction de la scène (0 = début, 1 = fin). */
  from: number;
  /** Fin d'affichage, en fraction de la scène. Une valeur ≥ 1 garde le texte jusqu'à la fin. */
  to: number;
}

export interface SceneConfig {
  id: SceneId;
  /** Vidéo principale (écrans ≥ 768 px). */
  src: string;
  /** Version allégée pour les petits écrans. Facultative : `src` est utilisée à défaut. */
  srcMobile?: string;
  /** Image affichée immédiatement et tant que la vidéo n'a pas d'image prête (= image au temps d'entrée). */
  posterStart: string;
  /** Image de la fin de scène (= image au temps de sortie). Sert au mode images de repli. */
  posterEnd: string;
  /** Images d'attente de la version mobile (extraites de `srcMobile`, qui est recadrée). */
  posterStartMobile?: string;
  posterEndMobile?: string;
  /** Photo de secours si les posters manquent, et image utilisée avec « réduction des animations ». */
  fallbackImage: string;
  /** Texte alternatif de l'image fixe (mode réduction des animations). */
  alt: string;
  /** Temps d'entrée dans la vidéo, en secondes. */
  inPoint: number;
  /** Temps de sortie, en secondes. `null` = jusqu'à la fin réelle de la vidéo. */
  outPoint: number | null;
  /** Durée utilisée tant que les métadonnées ne sont pas chargées (mettre la durée réelle du fichier). */
  fallbackDuration: number;
  /**
   * Part de scroll attribuée à la scène. `null` = proportionnelle à la durée lue (outPoint − inPoint),
   * calculée sur les durées réelles après chargement des métadonnées.
   */
  scrollWeight: number | null;
  /**
   * Fondu d'entrée depuis la scène précédente, en fraction de la progression totale (0 = coupe franche).
   * Garder une valeur très faible (≤ 0.03) : au-delà, deux architectures différentes se superposent.
   */
  crossfade: number;
  /**
   * Point de cadrage (CSS object-position). Les vidéos mobiles livrées sont déjà recadrées
   * en résolution native (1216 × 1080) autour du sujet : leur cadrage reste centré.
   */
  focus: { desktop: string; mobile: string };
  message: SceneMessage | null;
}

export interface TourConfig {
  /**
   * Distance de scroll consacrée à la visite, en % de hauteur d'écran (svh),
   * en plus de l'écran maintenu. 300 = trois hauteurs d'écran de défilement.
   */
  scrollDistance: { desktop: number; mobile: number };
  /** Largeur (px) sous laquelle on utilise `srcMobile`, `focus.mobile` et `scrollDistance.mobile`. */
  mobileBreakpoint: number;
  /** Fraction finale pendant laquelle la dernière image reste stable avant la section suivante. */
  endHold: number;
  /** Fraction initiale pendant laquelle le titre d'accueil s'efface. */
  heroFadeOut: number;
  /** Lissage de la progression (0.05 = très doux, 1 = aucun lissage). */
  smoothing: number;
  /** Au-delà de cette latence (ms) sur une vidéo déjà chargée, une recherche est jugée lente. */
  slowSeekMs: number;
  /** Nombre de recherches lentes consécutives avant de basculer sur le mode images. */
  slowSeekLimit: number;
  /**
   * Grain photographique très léger superposé aux vidéos (0 = désactivé, 0.04–0.07 conseillé).
   * Il casse l'aspect trop lisse des images de synthèse et masque les dégradés en escalier.
   */
  grain: number;
}

export const tourConfig: TourConfig = {
  scrollDistance: { desktop: 380, mobile: 300 },
  mobileBreakpoint: 768,
  endHold: 0.05,
  heroFadeOut: 0.06,
  smoothing: 0.16,
  slowSeekMs: 650,
  slowSeekLimit: 6,
  grain: 0.06,
};

export const scenes: SceneConfig[] = [
  {
    id: "entree",
    src: "/videos/scene-01-entree.mp4",
    srcMobile: "/videos/scene-01-entree-mobile.mp4",
    posterStart: "/images/scene-01-debut.webp",
    posterEnd: "/images/scene-01-fin.webp",
    posterStartMobile: "/images/scene-01-debut-mobile.webp",
    posterEndMobile: "/images/scene-01-fin-mobile.webp",
    fallbackImage: "/images/porte-fermee.webp",
    alt: "La grande porte en bois sculpté du Riad Noor, fermée, encadrée de deux oliviers en jarre.",
    inPoint: 0,
    // La vidéo continue au-delà de 4,25 s, mais c'est le cadrage le plus proche
    // du début de la scène 2 (portes sur les côtés, fontaine au centre).
    outPoint: 4.25,
    fallbackDuration: 5.833,
    scrollWeight: null,
    crossfade: 0,
    focus: { desktop: "50% 50%", mobile: "50% 50%" },
    message: null,
  },
  {
    id: "patio",
    src: "/videos/scene-02-patio.mp4",
    srcMobile: "/videos/scene-02-patio-mobile.mp4",
    posterStart: "/images/scene-02-debut.webp",
    posterEnd: "/images/scene-02-fin.webp",
    posterStartMobile: "/images/scene-02-debut-mobile.webp",
    posterEndMobile: "/images/scene-02-fin-mobile.webp",
    fallbackImage: "/images/patio.webp",
    alt: "Le patio du riad, sa fontaine en zellige vert, ses palmiers et ses arcades.",
    inPoint: 0,
    outPoint: null,
    fallbackDuration: 5.97,
    scrollWeight: null,
    crossfade: 0.02,
    focus: { desktop: "50% 50%", mobile: "50% 50%" },
    message: { display: "Le calme,", script: "au cœur de Marrakech.", from: 0.18, to: 0.82 },
  },
  {
    id: "chambre",
    src: "/videos/scene-03-chambre.mp4",
    srcMobile: "/videos/scene-03-chambre-mobile.mp4",
    posterStart: "/images/scene-03-debut.webp",
    posterEnd: "/images/scene-03-fin.webp",
    posterStartMobile: "/images/scene-03-debut-mobile.webp",
    posterEndMobile: "/images/scene-03-fin-mobile.webp",
    fallbackImage: "/images/chambre.webp",
    alt: "Une chambre lumineuse avec tête de lit en bois sculpté, lanternes et linge clair.",
    inPoint: 0,
    outPoint: null,
    fallbackDuration: 7.93,
    scrollWeight: null,
    // Le dernier plan du patio et le premier plan de la chambre se raccordent : coupe franche.
    crossfade: 0,
    focus: { desktop: "50% 50%", mobile: "50% 50%" },
    message: { display: "Un cocon", script: "pensé pour votre repos.", from: 0.5, to: 1 },
  },
];
