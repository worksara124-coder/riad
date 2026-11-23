# Riad Noor — page d'accueil immersive

Une seule page en français : visite vidéo pilotée par le scroll (porte → patio → chambre), puis la section « Nos chambres » et une fenêtre de demande de réservation.

Stack : Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · GSAP 3 + ScrollTrigger. Polices auto-hébergées : Poppins (titres en capitales fines, textes) et Allison (accents manuscrits), sans requête vers Google Fonts via `@fontsource` : aucune requête vers Google Fonts.

## Lancer le projet

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production
npm start          # sert le build
npm run typecheck  # vérification TypeScript
```

Node.js 20.9 ou plus récent est requis.

## Intro

À chaque visite, le logo apparaît en fondu sur fond crème, souligné d'un fin trait terracotta, puis l'écran s'efface (environ 2,7 s). Le code se trouve dans `components/Intro.tsx` et les styles `.intro*` dans `app/globals.css`.
- Elle n'attend aucun chargement : le site se charge en même temps, dessous.
- Le premier scroll, toucher, clic ou appui sur une touche l'accélère. Elle n'est pas jouée avec la réduction des animations.
- Pour ne la jouer qu'une fois par session : `ONCE_PER_SESSION = true` dans `components/Intro.tsx`.
- Pour la raccourcir : réduisez le délai de `intro-out` (1.9s) sur `.intro` et celui de `html[data-intro="play"] .hero-in`.

## Direction artistique et sections

Inspirée d'une mise en page éditoriale : titres en capitales fines (Poppins 300, lettres espacées) chevauchés d'un mot manuscrit (Allison), header « Menu » / logo centré / « Réserver », menu plein écran. Les classes `.display`, `.script`, `.title-duo`, `.eyebrow` et `.btn-*` sont dans `app/globals.css`.

Ordre de la page :
1. **Intro** : logo en fondu.
2. **Visite** pilotée par le scroll (porte → patio → chambre).
3. **Nos chambres** (`RoomsSection`) : grille éditoriale décalée, photos en parallaxe.
4. **Accroche** (`CollageSection`) : « Venez pour le patio / restez pour la lumière », tirages photo inclinés qui glissent à des vitesses différentes.
5. **L'âme du riad** (`SpiritSection`, `Lantern`) : la lanterne en laiton (photo détourée `public/images/lanterne.webp`) se balance depuis sa chaîne, pivote en relief sous la souris et au scroll, avec un halo chaud qui vacille. Trois cartes « matières » basculent en 3D.
6. **Bandeau** (`MarqueeBand`) : mots géants qui défilent sur fond olive.
7. **Galerie** (`Gallery3D`) : anneau de photos en 3D qui tourne au scroll.
8. **Une question ?** (`ContactCta`) : ouvre la fenêtre de demande (aucune coordonnée inventée).
9. **Footer**.

La photo de la terrasse (`terrasse.webp`) est utilisée dans l'accroche et la galerie. Retirez-la de `CollageSection.tsx` et `Gallery3D.tsx` si le riad n'a pas de terrasse.

Avec la réduction des animations, toutes ces sections restent lisibles, sans mouvement.

## Formulaire de réservation

Fenêtre en deux panneaux sur ordinateur : la photo de la chambre choisie avec le nombre de nuits, et le formulaire. Sur mobile, elle s'ouvre en plein écran.
- La chambre se choisit parmi des vignettes rondes (boutons radio natifs, utilisables au clavier).
- Le nombre de voyageurs se règle avec un compteur − / +, limité à la capacité si elle est renseignée.
- Le bouton « Envoyer ma demande » reste toujours visible en bas de la fenêtre.
- Les champs sont arrondis sur fond sable, avec les erreurs affichées sous chaque champ.

## Organisation

```
app/
  layout.tsx                 polices, métadonnées, préchargement de la 1re image
  page.tsx                   assemblage de la page
  globals.css                palette, typographie, styles de la visite
  icon.png                   favicon (arche + étoile, découpée dans le logo)
  api/reservation/route.ts   point d'intégration serveur des demandes
components/
  Intro.tsx  Header.tsx  ImmersiveExperience.tsx  RoomsSection.tsx
  CollageSection.tsx  SpiritSection.tsx  Lantern.tsx  MarqueeBand.tsx  Gallery3D.tsx  ContactCta.tsx  BookingProvider.tsx
  RoomCard.tsx  BookingModal.tsx  Footer.tsx  Logo.tsx
config/media.ts              réglages vidéo : raccords, durée de scroll, cadrages, textes
data/rooms.ts                informations des chambres
lib/tourEngine.ts            moteur de la visite (scroll → temps vidéo)
lib/booking.ts               validation partagée navigateur/serveur
public/images, public/videos
```

## Médias fournis et préparation effectuée

| Fichier | Origine |
|---|---|
| `images/logo-riad-noor.png` | logo fourni ; seules les marges transparentes ont été réduites (dessin et proportions intacts) pour qu'il ne paraisse pas minuscule dans le header |
| `images/porte-fermee.webp`, `patio.webp`, `chambre.webp` | photos fournies, converties en WebP |
| `images/chambre-classique.webp`, `chambre-superieure.webp`, `suite-noor.webp` | photos des chambres fournies |
| `images/terrasse.webp`, `images/lanterne.webp` | photo de la terrasse et lanterne détourée fournies |
| `images/scene-0X-debut(-mobile).webp` / `-fin(-mobile).webp` | images extraites des vidéos au temps d'entrée et de sortie de chaque scène |
| `videos/scene-0X-*.mp4` | vidéos fournies, réencodées en haute qualité pour le scroll (1920 × 1080) |
| `videos/scene-0X-*-mobile.mp4` | recadrage vertical **en résolution native** (1216 × 1080) autour du sujet de chaque scène, pour les écrans < 768 px |

Aucun fichier ne manque.

La photo `porte-fermee.png` fournie ne correspond pas pixel pour pixel à la première image de la vidéo 1. Pour que la vidéo démarre exactement au même cadrage, le premier écran affiche donc `scene-01-debut.webp` (la première image de la vidéo). Les photos fournies servent pour le mode « réduction des animations » et en dernier recours.

## Remplacer les contenus

- **Logo** : remplacez `public/images/logo-riad-noor.png` (PNG transparent, marges réduites). Si son ratio change, mettez à jour `width`/`height` dans `components/Logo.tsx`.
- **Photos des chambres** : remplacez les trois fichiers sous le même nom (format paysage, ≥ 1600 px de large). Le cadrage dans la carte se règle via `imagePosition` dans `data/rooms.ts`.
- **Informations des chambres** : `data/rooms.ts`. `capacity`, `surface` et `pricePerNight` valent `null`, car aucune donnée réelle n'a été fournie. Un champ à `null` n'est pas affiché. Une fois renseignée, la capacité est aussi contrôlée dans le formulaire.
  ```ts
  capacity: 2,
  surface: 24,
  pricePerNight: { amount: 1200, currency: "MAD" },
  ```
- **Vidéos** : déposez les nouveaux fichiers dans `public/videos/`, puis régénérez les images d'attente et mettez à jour `fallbackDuration` dans `config/media.ts` (commandes ci-dessous).

### Encodage conseillé pour le contrôle au scroll

Pour afficher une image précise, le navigateur doit repartir de l'image clé précédente. Les fichiers d'origine n'avaient qu'une ou deux images clés par vidéo : le scroll saccaderait. Les fichiers livrés sont en H.264 avec une image clé toutes les 0,5 s, sans piste audio et avec `faststart`.

**Qualité :** à partir de CRF 22, l'encodeur lisse les textures fines (enduit des murs, ombres des feuillages) et l'image prend un aspect plastique. Les vidéos sont donc encodées en CRF 20 avec `aq-mode=3`, qui protège les aplats beiges contre les dégradés en escalier. Sur mobile, la vidéo est recadrée plutôt que réduite : un téléphone en portrait n'affiche qu'une bande verticale de l'image, et réduire puis agrandir cette bande la rendait floue.

```bash
X="aq-mode=3:aq-strength=0.9:deblock=-1,-1:psy-rd=1.0,0.15"
# Desktop (1920 × 1080)
ffmpeg -i source.mp4 -an -c:v libx264 -preset slower -crf 20 -g 12 -keyint_min 12 -sc_threshold 0 -bf 2 \
  -pix_fmt yuv420p -x264-params $X -movflags +faststart scene-01-entree.mp4
# Mobile : recadrage natif 1216 × 1080 (x = position gauche du recadrage : 352 / 381 / 544 pour les scènes 1 / 2 / 3)
ffmpeg -i source.mp4 -an -vf "crop=1216:1080:352:0" -c:v libx264 -preset slower -crf 22 -g 12 -keyint_min 12 \
  -sc_threshold 0 -bf 2 -pix_fmt yuv420p -x264-params $X -movflags +faststart scene-01-entree-mobile.mp4
# Images d'attente : à extraire des fichiers encodés (desktop et mobile), au temps d'entrée et de sortie
ffmpeg -ss 0 -i scene-01-entree.mp4 -frames:v 1 -c:v libwebp -quality 90 scene-01-debut.webp
ffmpeg -ss 4.25 -i scene-01-entree.mp4 -frames:v 1 -c:v libwebp -quality 90 scene-01-fin.webp
# Durée réelle, à reporter dans fallbackDuration
ffprobe -v error -show_entries format=duration -of csv=p=0 scene-01-entree.mp4
```

**Poids :** 10,5 à 14,3 Mo par scène en desktop et 5,6 à 6,9 Mo en mobile. Les vidéos sont chargées l'une après l'autre, jamais toutes au premier affichage. Pour alléger, passez à CRF 21 (environ −15 %) ; au-delà, la texture se dégrade visiblement.

**Grain :** un grain photographique fixe et très léger (`tourConfig.grain`, 0.06) est superposé aux vidéos. Il casse l'aspect trop lisse propre aux images générées. Mettez `0` pour le retirer.

Même bien encodé, un MP4 ne garantit pas un défilement parfaitement fluide sur tous les appareils : cela dépend du décodeur et du navigateur. C'est pour cette raison qu'un mode images de repli existe.

## Réglages de la visite (`config/media.ts`)

**Pour l'ensemble de la visite (`tourConfig`)**

| Réglage | Rôle | Valeur actuelle |
|---|---|---|
| `scrollDistance.desktop` / `.mobile` | longueur de défilement de la visite, en % de hauteur d'écran | 380 / 300 |
| `endHold` | dernière portion de la visite pendant laquelle la dernière image reste fixe avant l'arrivée des chambres | 0.05 |
| `heroFadeOut` | portion de la visite pendant laquelle le titre d'accueil s'efface | 0.06 |
| `smoothing` | lissage de la progression (plus la valeur est basse, plus c'est doux) | 0.16 |
| `slowSeekMs` / `slowSeekLimit` | seuil de bascule en mode images si les recherches vidéo restent lentes alors que la vidéo est déjà chargée | 650 ms / 6 recherches |

**Pour chaque scène (`scenes`)**

| Réglage | Rôle |
|---|---|
| `inPoint` / `outPoint` | temps d'entrée et de sortie en secondes (`null` = fin réelle de la vidéo) |
| `scrollWeight` | part de scroll de la scène ; `null` = proportionnelle à la durée lue |
| `crossfade` | fondu depuis la scène précédente, en fraction de la visite (0 = coupe franche) |
| `focus.desktop` / `.mobile` | point de cadrage (`object-position`) ; les vidéos mobiles étant déjà recadrées, `.mobile` reste à `50% 50%` |
| `posterStart` / `posterEnd` (+ `…Mobile`) / `fallbackImage` | image d'attente, image de fin, photo de secours |
| `message` | texte affiché, avec `from` / `to` exprimés en fraction de la scène |

**Raccords retenus avec les vidéos fournies :**
- **Scène 1 → 2** : les deux vidéos ne montrent pas tout à fait la même architecture. La scène 1 est coupée à 4,25 s, au cadrage le plus proche du début de la scène 2 (portes sur les côtés, fontaine au centre), avec un fondu très court (`crossfade: 0.02`). Si vous régénérez les vidéos pour qu'elles se raccordent exactement, passez `outPoint` à `null` et `crossfade` à `0`.
- **Scène 2 → 3** : la fin du patio et le début de la chambre se raccordent, d'où une coupe franche.

**Fonctionnement :**
- La progression vient du scroll natif via ScrollTrigger. La section est maintenue à l'écran avec `position: sticky` en hauteur `100svh`, ce qui évite les sauts dus aux barres du navigateur mobile. Rien n'intercepte la molette ni le tactile.
- Les changements de `currentTime` passent par `requestAnimationFrame`, avec une seule recherche en cours par vidéo. Les demandes arrivées entre-temps sont fusionnées, et une recherche bloquée est relancée.
- Chaque vidéo n'est rendue visible qu'une fois sa première image affichée. Tant que la scène suivante n'a rien à montrer, la précédente reste à l'écran : pas de flash noir, pas de retour visible à la première image.
- Chargement progressif : la vidéo 1 est chargée tout de suite, la vidéo 2 dès que la 1 est prête, la vidéo 3 seulement à l'entrée dans le patio.
- Mode images (début → fin de chaque scène) : il s'active si une vidéo est absente ou en erreur, si les recherches restent lentes, ou si l'économiseur de données / une connexion 2G est détecté.
- Avec `prefers-reduced-motion`, la page affiche trois photos fixes dans un défilement normal, sans section maintenue ni vidéo. Le contenu et la réservation restent identiques.

## Connecter le formulaire à un vrai service

Pour l'instant, la fenêtre affiche « Mode démonstration ». Une demande valide n'est **pas** transmise et le visiteur en est informé : aucun envoi réussi n'est simulé.

1. Créez un point de réception qui accepte un `POST` JSON : webhook Make, Zapier ou n8n, CRM, ou votre propre API qui envoie un e-mail.
2. Copiez `.env.example` en `.env.local` en local, ou déclarez les variables chez votre hébergeur :
   ```
   RESERVATION_WEBHOOK_URL=https://…
   RESERVATION_WEBHOOK_SECRET=une-valeur-longue-et-aléatoire   # facultatif
   ```
3. Reconstruisez le site (`npm run build`) : la page étant statique, elle lit la présence de l'URL au moment du build.

La route `app/api/reservation/route.ts` revalide toutes les données côté serveur, ignore les robots grâce à un champ piège, puis transmet :

```json
{ "type": "demande_de_reservation", "receivedAt": "…", "room": { "id": "suite-noor", "name": "Suite Noor" },
  "arrival": "2027-03-10", "departure": "2027-03-14", "guests": 2,
  "fullName": "…", "phone": "…", "email": "…", "message": "…" }
```

Si `RESERVATION_WEBHOOK_SECRET` est défini, il est envoyé dans l'en-tête `X-Riad-Noor-Secret`. Aucune de ces valeurs n'arrive au navigateur. Le visiteur ne voit « demande transmise » que si le service répond avec un code 2xx. Pour une mise en production, ajoutez une limitation du nombre d'envois (au niveau de l'hébergeur ou du service récepteur).

## Hébergement

Le site s'exécute avec Node.js (`npm run build && npm start`) ou sur Vercel. La route `/api/reservation` a besoin d'un serveur : un hébergement purement statique ne convient pas si vous voulez activer l'envoi.
