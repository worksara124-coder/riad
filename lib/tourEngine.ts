/**
 * Moteur de la visite contrôlée par le scroll.
 *
 * Principe :
 * - ScrollTrigger lit la progression native du scroll sur la section (aucun
 *   défilement simulé, aucun blocage de la molette ou du tactile).
 * - La progression est lissée puis convertie en (scène, temps vidéo) selon les
 *   durées réelles lues dans les métadonnées.
 * - Les mises à jour de `currentTime` sont regroupées dans requestAnimationFrame
 *   et une seule recherche est en cours par vidéo : les demandes intermédiaires
 *   sont fusionnées.
 * - Chaque scène a une image d'attente sous sa vidéo : la vidéo n'est rendue
 *   visible qu'après avoir affiché une vraie image (pas d'écran noir), et la
 *   couche précédente reste visible tant que la suivante n'a rien à montrer.
 * - Si la vidéo est absente, en erreur, trop lente ou si l'économiseur de
 *   données est actif, la scène passe en mode images (début → fin).
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SceneConfig, TourConfig } from "@/config/media";

gsap.registerPlugin(ScrollTrigger);

export interface TourSceneElements {
  layer: HTMLElement;
  video: HTMLVideoElement;
  posterStart: HTMLImageElement;
  posterEnd: HTMLImageElement;
  message: HTMLElement | null;
}

export interface TourEngineOptions {
  section: HTMLElement;
  hero: HTMLElement | null;
  scenes: SceneConfig[];
  elements: TourSceneElements[];
  config: TourConfig;
}

interface SceneState {
  cfg: SceneConfig;
  el: TourSceneElements;
  duration: number | null;
  srcAssigned: boolean;
  failed: boolean;
  hasFrame: boolean;
  seeking: boolean;
  pending: boolean;
  seekStartedAt: number;
  posterReady: boolean;
  endPosterAssigned: boolean;
  primeTimer: number | null;
}

interface Segment {
  start: number;
  end: number;
  inPoint: number;
  outPoint: number;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function createTourEngine(options: TourEngineOptions): () => void {
  const { section, hero, config } = options;
  const isMobile = window.matchMedia(`(max-width: ${config.mobileBreakpoint - 1}px)`).matches;

  type NetworkInfo = { saveData?: boolean; effectiveType?: string };
  const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  let imagesOnly =
    !!connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "") ||
    typeof HTMLVideoElement === "undefined";

  const states: SceneState[] = options.scenes.map((cfg, i) => ({
    cfg,
    el: options.elements[i],
    duration: null,
    srcAssigned: false,
    failed: false,
    hasFrame: false,
    seeking: false,
    pending: false,
    seekStartedAt: 0,
    posterReady: false,
    endPosterAssigned: false,
    primeTimer: null,
  }));

  let segments: Segment[] = [];
  let target = 0;
  let current = 0;
  let rafId: number | null = null;
  let lastFrame = 0;
  let slowSeeks = 0;
  let shownIndex = 0;
  let destroyed = false;
  const cleanups: Array<() => void> = [];

  const listen = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ) => {
    el.addEventListener(type, fn as EventListener);
    cleanups.push(() => el.removeEventListener(type, fn as EventListener));
  };

  /* ---------- Segments : progression globale → (scène, temps) ---------- */

  function computeSegments() {
    const spans = states.map((s) => {
      const duration = s.duration ?? s.cfg.fallbackDuration;
      const outPoint = clamp(s.cfg.outPoint ?? duration, 0, duration);
      const inPoint = clamp(s.cfg.inPoint, 0, outPoint);
      return { inPoint, outPoint, weight: s.cfg.scrollWeight ?? Math.max(outPoint - inPoint, 0.1) };
    });
    const total = spans.reduce((sum, s) => sum + s.weight, 0);
    const usable = 1 - clamp(config.endHold, 0, 0.3);
    let acc = 0;
    segments = spans.map((s) => {
      const start = (acc / total) * usable;
      acc += s.weight;
      return { start, end: (acc / total) * usable, inPoint: s.inPoint, outPoint: s.outPoint };
    });
  }

  function locate(p: number): { index: number; local: number } {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (p < seg.end || i === segments.length - 1) {
        return { index: i, local: clamp((p - seg.start) / (seg.end - seg.start)) };
      }
    }
    return { index: 0, local: 0 };
  }

  /* ---------- Chargement progressif des vidéos ---------- */

  function useImages(s: SceneState) {
    return imagesOnly || s.failed;
  }

  function assignEndPoster(s: SceneState) {
    if (s.endPosterAssigned) return;
    s.endPosterAssigned = true;
    s.el.posterEnd.src = isMobile && s.cfg.posterEndMobile ? s.cfg.posterEndMobile : s.cfg.posterEnd;
  }

  function ensureLoaded(index: number) {
    const s = states[index];
    if (!s || s.srcAssigned || useImages(s)) return;
    s.srcAssigned = true;
    const v = s.el.video;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = isMobile && s.cfg.srcMobile ? s.cfg.srcMobile : s.cfg.src;
    v.load();
  }

  function markFailed(s: SceneState) {
    if (s.failed) return;
    s.failed = true;
    s.seeking = false;
    s.pending = false;
    s.el.video.style.opacity = "0";
    s.el.video.removeAttribute("src");
    assignEndPoster(s);
    kick();
  }

  function switchToImages() {
    if (imagesOnly) return;
    imagesOnly = true;
    states.forEach((s) => {
      s.el.video.style.opacity = "0";
      s.el.video.pause();
      assignEndPoster(s);
    });
    section.dataset.tourMode = "images";
    kick();
  }

  states.forEach((s, i) => {
    const v = s.el.video;

    listen(v, "loadedmetadata", () => {
      if (Number.isFinite(v.duration) && v.duration > 0) {
        s.duration = v.duration;
        computeSegments();
      }
      // Certains navigateurs mobiles ne chargent aucune image tant que la vidéo
      // n'a pas été « lue » une fois : amorçage muet et immédiatement interrompu.
      s.primeTimer = window.setTimeout(() => {
        if (v.readyState < 2 && !s.failed) {
          v.play().then(() => v.pause()).catch(() => undefined);
        }
      }, 1200);
      kick();
    });

    listen(v, "loadeddata", () => {
      // La première image décodée correspond-elle au temps d'entrée ? Sinon on attend la recherche.
      if (Math.abs(v.currentTime - (segments[i]?.inPoint ?? 0)) < 0.05) s.hasFrame = true;
      // Scène 1 prête : on prépare la suivante sans attendre le scroll.
      if (i === 0) ensureLoaded(1);
      kick();
    });

    listen(v, "seeked", () => {
      const latency = performance.now() - s.seekStartedAt;
      s.seeking = false;
      s.hasFrame = true;
      const buffered = isTimeBuffered(v, v.currentTime);
      if (buffered && latency > config.slowSeekMs) slowSeeks += 1;
      else if (buffered) slowSeeks = Math.max(0, slowSeeks - 1);
      if (slowSeeks >= config.slowSeekLimit) switchToImages();
      kick();
    });

    listen(v, "error", () => markFailed(s));
    // Lecture jamais autonome : toute lecture (amorçage compris) est stoppée.
    listen(v, "playing", () => v.pause());

    const onPosterLoad = () => {
      s.posterReady = true;
      kick();
    };
    const onPosterError = () => {
      const img = s.el.posterStart;
      if (!img.dataset.fallback) {
        img.dataset.fallback = "1";
        // Image servie par <picture> : on retire les sources pour que la photo de secours s'affiche.
        img.parentElement?.querySelectorAll("source").forEach((source) => source.remove());
        img.src = s.cfg.fallbackImage;
      } else {
        img.style.visibility = "hidden";
        s.posterReady = true; // rien de mieux à afficher : on n'empêche pas l'avancée
        kick();
      }
    };
    listen(s.el.posterStart, "load", onPosterLoad);
    listen(s.el.posterStart, "error", onPosterError);
    if (s.el.posterStart.complete) {
      if (s.el.posterStart.naturalWidth > 0) s.posterReady = true;
      else onPosterError();
    }
    listen(s.el.posterEnd, "error", () => {
      const img = s.el.posterEnd;
      if (!img.dataset.fallback) {
        img.dataset.fallback = "1";
        img.src = s.cfg.fallbackImage;
      } else img.style.visibility = "hidden";
    });
  });

  function isTimeBuffered(v: HTMLVideoElement, t: number) {
    for (let r = 0; r < v.buffered.length; r++) {
      if (t >= v.buffered.start(r) && t <= v.buffered.end(r)) return true;
    }
    return false;
  }

  /* ---------- Recherches vidéo maîtrisées ---------- */

  function seek(s: SceneState, time: number, now: number) {
    const v = s.el.video;
    if (useImages(s) || !s.srcAssigned || v.readyState < 1) return;
    const max = (s.duration ?? s.cfg.fallbackDuration) - 0.05;
    const t = clamp(time, 0, Math.max(0, max));

    if (s.seeking) {
      if (now - s.seekStartedAt < 2500) {
        s.pending = true; // fusionnée : sera traitée au prochain « seeked »
        return;
      }
      s.seeking = false; // recherche bloquée : on relance
    }
    s.pending = false;
    if (Math.abs(v.currentTime - t) < 1 / 48 && s.hasFrame) return;
    s.seeking = true;
    s.seekStartedAt = now;
    v.currentTime = t;
  }

  /* ---------- Rendu ---------- */

  const styleCache = new WeakMap<HTMLElement, Record<string, string>>();
  function setStyle(el: HTMLElement, key: "opacity" | "zIndex" | "transform" | "visibility", value: string) {
    let cache = styleCache.get(el);
    if (!cache) styleCache.set(el, (cache = {}));
    if (cache[key] === value) return;
    cache[key] = value;
    el.style[key] = value;
  }

  function canShow(s: SceneState) {
    return s.posterReady || (s.hasFrame && !useImages(s));
  }

  function render(p: number, now: number) {
    if (!segments.length) computeSegments();
    const { index, local } = locate(p);
    const active = states[index];
    const seg = segments[index];

    ensureLoaded(index);
    ensureLoaded(index + 1);

    // Temps vidéo de la scène active ; la précédente reste figée sur son point de sortie.
    seek(active, seg.inPoint + local * (seg.outPoint - seg.inPoint), now);

    // Fondu d'entrée éventuel depuis la scène précédente (très court, réglable).
    const fade = active.cfg.crossfade;
    const fadeT = index > 0 && fade > 0 ? clamp((p - seg.start) / fade) : 1;
    if (index > 0 && fadeT < 1) seek(states[index - 1], segments[index - 1].outPoint, now);

    // On ne change de couche que si la nouvelle a quelque chose à montrer.
    const showActive = canShow(active);
    if (showActive) shownIndex = index;
    const under = index > 0 && fadeT < 1 ? index - 1 : -1;

    states.forEach((s, i) => {
      let opacity = 0;
      let z = 0;
      if (showActive) {
        if (i === index) {
          opacity = fadeT;
          z = 2;
        } else if (i === under) {
          opacity = 1;
          z = 1;
        }
      } else if (i === shownIndex) {
        // La scène demandée n'a encore rien à afficher : on garde l'image précédente.
        opacity = 1;
        z = 1;
      }
      setStyle(s.el.layer, "opacity", opacity.toFixed(3));
      setStyle(s.el.layer, "zIndex", String(z));

      const videoVisible = !useImages(s) && s.hasFrame;
      setStyle(s.el.video, "opacity", videoVisible ? "1" : "0");

      // Mode images : passage doux de l'image de début à l'image de fin (même architecture).
      if (useImages(s)) {
        assignEndPoster(s);
        const l = i < index ? 1 : i > index ? 0 : local;
        setStyle(s.el.posterEnd, "opacity", smoothstep(0.3, 0.7, l).toFixed(3));
      } else {
        setStyle(s.el.posterEnd, "opacity", "0");
      }
    });

    // Textes : un seul message à la fois.
    if (hero) {
      const h = 1 - smoothstep(0, config.heroFadeOut, p);
      setStyle(hero, "opacity", h.toFixed(3));
      setStyle(hero, "transform", `translate3d(0, ${((1 - h) * -18).toFixed(1)}px, 0)`);
      setStyle(hero, "visibility", h <= 0.001 ? "hidden" : "visible");
    }
    states.forEach((s, i) => {
      const el = s.el.message;
      const msg = s.cfg.message;
      if (!el || !msg) return;
      let o = 0;
      if (i === index) {
        const edge = 0.1;
        o = smoothstep(msg.from, msg.from + edge, local);
        if (msg.to < 1) o *= 1 - smoothstep(msg.to - edge, msg.to, local);
      }
      setStyle(el, "opacity", o.toFixed(3));
      setStyle(el, "transform", `translate3d(0, ${((1 - o) * 14).toFixed(1)}px, 0)`);
      setStyle(el, "visibility", o <= 0.001 ? "hidden" : "visible");
    });
  }

  function tick(now: number) {
    rafId = null;
    if (destroyed) return;
    const dt = lastFrame ? Math.min(now - lastFrame, 100) : 16.7;
    lastFrame = now;
    const k = 1 - Math.pow(1 - clamp(config.smoothing, 0.01, 1), dt / 16.7);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0003) current = target;

    render(current, now);

    const busy = states.some((s) => s.seeking || s.pending);
    if (current !== target || busy) rafId = requestAnimationFrame(tick);
    else lastFrame = 0;
  }

  function kick() {
    if (destroyed || rafId !== null) return;
    rafId = requestAnimationFrame(tick);
  }

  /* ---------- Liaison au scroll natif ---------- */

  ScrollTrigger.config({ ignoreMobileResize: true });
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      target = self.progress;
      kick();
    },
    onRefresh: (self) => {
      target = self.progress;
      kick();
    },
  });

  if (imagesOnly) section.dataset.tourMode = "images";
  computeSegments();
  target = current = trigger.progress;
  ensureLoaded(0);
  render(current, performance.now());

  return () => {
    destroyed = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    trigger.kill();
    cleanups.forEach((fn) => fn());
    states.forEach((s) => {
      if (s.primeTimer !== null) window.clearTimeout(s.primeTimer);
      const v = s.el.video;
      v.pause();
      v.removeAttribute("src");
      v.load(); // libère la mémoire tampon
    });
  };
}
