"use client";

/**
 * Lanterne en laiton (photo détourée, public/images/lanterne.webp) animée en relief :
 * - balancement lent depuis le haut de la chaîne ;
 * - rotation 3D légère qui suit le pointeur et le scroll ;
 * - halo chaud qui vacille derrière, ombre douce au sol.
 * Réduction des animations : lanterne immobile, halo fixe.
 */
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Lantern() {
  const hostRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const tilt = tiltRef.current;
    if (!host || !tilt || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ry = gsap.quickTo(tilt, "rotateY", { duration: 1.2, ease: "power3.out" });
    const rx = gsap.quickTo(tilt, "rotateX", { duration: 1.2, ease: "power3.out" });
    let scrollTurn = 0;
    let pointerX = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = host.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ry(scrollTurn + pointerX * 14);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
    };
    const onLeave = () => {
      pointerX = 0;
      ry(scrollTurn);
      rx(0);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    // En traversant la section, la lanterne pivote doucement sur elle-même.
    const st = ScrollTrigger.create({
      trigger: host,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        scrollTurn = (self.progress - 0.5) * 24;
        ry(scrollTurn + pointerX * 14);
      },
    });

    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      st.kill();
    };
  }, []);

  return (
    <div ref={hostRef} className="lantern relative h-full w-full" aria-hidden="true">
      <div className="lantern-glow pointer-events-none absolute inset-0" />
      <div className="lantern-floor pointer-events-none absolute bottom-[1%] left-1/2 h-[5%] w-[46%] -translate-x-1/2" />
      {/* Pivot en haut de la chaîne : la lanterne se balance comme un objet suspendu. */}
      <div className="lantern-sway absolute inset-x-0 top-0 bottom-[6%] [perspective:1200px]">
        <div ref={tiltRef} className="relative mx-auto h-full w-fit [transform-style:preserve-3d]">
          <Image
            src="/images/lanterne.webp"
            alt=""
            width={560}
            height={1371}
            sizes="(min-width: 1024px) 18rem, 40vw"
            className="lantern-img h-full w-auto"
          />
        </div>
      </div>
    </div>
  );
}
