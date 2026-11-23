"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { scenes, tourConfig } from "@/config/media";
import { createTourEngine, type TourSceneElements } from "@/lib/tourEngine";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

const HERO_TEXT = "Un riad, un refuge, une autre façon de vivre Marrakech.";

function HeroText({ animated }: { animated: boolean }) {
  return (
    <>
      {/* Un seul H1 : « Une porte s’ouvre sur votre prochaine escapade », en capitales + manuscrit. */}
      <h1 className="title-duo text-brun">
        <span className="display text-[clamp(2rem,1.3rem+2vw,3rem)]">Une porte s’ouvre</span>
        <span className="script text-[clamp(2.7rem,1.8rem+2.6vw,4.3rem)]">sur votre prochaine escapade</span>
      </h1>
      <p className="mt-4 max-w-[34ch] text-[clamp(1.02rem,0.95rem+0.35vw,1.2rem)] leading-relaxed text-brun-logo">
        {HERO_TEXT}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <a href="#chambres" className="btn-ghost">
          Voir les chambres
          <span aria-hidden="true">→</span>
        </a>
        {animated && (
          <p className="flex items-center gap-2 text-[0.9rem] tracking-wide text-brun-logo">
            <span className="scroll-cue inline-block" aria-hidden="true">
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="1" y="1" width="12" height="18" rx="6" />
                <path d="M7 5v4" strokeLinecap="round" />
              </svg>
            </span>
            Faites défiler pour découvrir
          </p>
        )}
      </div>
    </>
  );
}

/** Variante sans animation (prefers-reduced-motion) : images fixes dans un défilement normal. */
function StaticTour() {
  return (
    <section id="le-riad" aria-label="Le riad" className="bg-creme">
      {scenes.map((scene, i) => (
        <div key={scene.id} className="relative h-[100svh] min-h-[520px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scene.fallbackImage}
            alt={scene.alt}
            className="tour-media"
            style={{ "--focus-d": scene.focus.desktop, "--focus-m": scene.focus.mobile } as CSSProperties}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          <div className="tour-veil pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-[max(2.5rem,6svh)] sm:px-8 lg:px-12">
            {i === 0 ? (
              <div className="max-w-[min(34rem,88vw)] lg:max-w-[min(31rem,31vw)]">
                <HeroText animated={false} />
              </div>
            ) : (
              scene.message && (
                <p className="title-duo max-w-[min(36rem,86vw)] text-brun">
                  <span className="display text-[clamp(2rem,1.3rem+2.6vw,3.6rem)]">{scene.message.display}</span>{" "}
                  <span className="script text-[clamp(3rem,1.9rem+3.8vw,5.6rem)]">{scene.message.script}</span>
                </p>
              )
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export function ImmersiveExperience() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const startRefs = useRef<(HTMLImageElement | null)[]>([]);
  const endRefs = useRef<(HTMLImageElement | null)[]>([]);
  const messageRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;
    const elements: TourSceneElements[] = scenes.map((_, i) => ({
      layer: layerRefs.current[i]!,
      video: videoRefs.current[i]!,
      posterStart: startRefs.current[i]!,
      posterEnd: endRefs.current[i]!,
      message: messageRefs.current[i] ?? null,
    }));
    const destroy = createTourEngine({
      section: sectionRef.current,
      hero: heroRef.current,
      scenes,
      elements,
      config: tourConfig,
    });
    return destroy;
  }, [reducedMotion]);

  if (reducedMotion) return <StaticTour />;

  const sectionStyle = {
    "--tour-d": tourConfig.scrollDistance.desktop,
    "--tour-m": tourConfig.scrollDistance.mobile,
  } as CSSProperties;

  return (
    <section id="le-riad" ref={sectionRef} aria-label="Visite du riad" className="tour relative" style={sectionStyle}>
      <div className="tour-stage sticky top-0 overflow-hidden bg-sable">
        <p className="sr-only">
          Visite en images : la porte du riad s’ouvre sur le patio et sa fontaine, puis la caméra entre dans une
          chambre.
        </p>

        {scenes.map((scene, i) => (
          <div
            key={scene.id}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            className="absolute inset-0"
            style={
              {
                opacity: i === 0 ? 1 : 0,
                zIndex: i === 0 ? 2 : 0,
                "--focus-d": scene.focus.desktop,
                "--focus-m": scene.focus.mobile,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            {/* Image d'attente : identique au temps d'entrée de la vidéo (version recadrée sur mobile). */}
            <picture>
              {scene.posterStartMobile && (
                <source
                  media={`(max-width: ${tourConfig.mobileBreakpoint - 1}px)`}
                  srcSet={scene.posterStartMobile}
                />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={(el) => {
                  startRefs.current[i] = el;
                }}
                src={scene.posterStart}
                alt=""
                className="tour-media"
                decoding="async"
                fetchPriority={i === 0 ? "high" : "low"}
              />
            </picture>
            {/* Image de fin, chargée uniquement en mode images de repli. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={(el) => {
                endRefs.current[i] = el;
              }}
              alt=""
              className="tour-media"
              style={{ opacity: 0 }}
              decoding="async"
            />
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              className="tour-media"
              style={{ opacity: 0 }}
              muted
              playsInline
              preload="none"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
            />
          </div>
        ))}

        {tourConfig.grain > 0 && (
          <div
            className="tour-grain pointer-events-none absolute inset-0 z-[3]"
            style={{ opacity: tourConfig.grain }}
            aria-hidden="true"
          />
        )}
        <div className="tour-veil pointer-events-none absolute inset-0 z-[3]" aria-hidden="true" />

        <div className="absolute inset-x-0 bottom-0 z-[4] mx-auto max-w-[1440px] px-5 pb-[max(2rem,6svh)] sm:px-8 lg:px-12">
          <div ref={heroRef} className="relative max-w-[min(34rem,88vw)] lg:max-w-[min(31rem,31vw)]">
            {/* Apparition douce en CSS dès le premier affichage (pas d'attente du JavaScript). */}
            <div className="hero-in">
              <HeroText animated />
            </div>
          </div>
          {scenes.map(
            (scene, i) =>
              scene.message && (
                <p
                  key={scene.id}
                  ref={(el) => {
                    messageRefs.current[i] = el;
                  }}
                  className="title-duo pointer-events-none absolute bottom-[max(2rem,6svh)] left-5 max-w-[min(36rem,86vw)] text-brun sm:left-8 lg:left-12"
                  style={{ opacity: 0, visibility: "hidden" }}
                >
                  <span className="display text-[clamp(2rem,1.3rem+2.6vw,3.6rem)]">{scene.message.display}</span>{" "}
                  <span className="script text-[clamp(3rem,1.9rem+3.8vw,5.6rem)]">{scene.message.script}</span>
                </p>
              ),
          )}
        </div>
      </div>
    </section>
  );
}
