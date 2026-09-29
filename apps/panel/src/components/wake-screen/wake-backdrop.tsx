"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const POSTER_SRC = "/assets/wake/loading-poster.webp";
const VIDEO_WEBM_SRC = "/assets/wake/loading.webm";
const VIDEO_MP4_SRC = "/assets/wake/loading.mp4";

type WakeBackdropProps = {
  className?: string;
};

/**
 * Fondo de la pantalla de encendido, en tres capas para que nunca haya un
 * salto ni un frame vacío:
 *
 *  1. Capa CSS (0 bytes de red). Se pinta en el primer render, antes de que
 *     el navegador llegue a pedir nada. Es lo que el usuario ve los primeros
 *     ~100 ms, cuando ni siquiera el logo ha terminado de cargar.
 *  2. Poster (10 KB). Aparece encima al decodificarse.
 *  3. Video (~206 KB webm / ~278 KB mp4, el navegador descarga solo uno).
 *     Se revela en `canplay`, no antes: hasta ese punto el elemento puede
 *     tener el primer frame a medio pintar.
 *
 * El poster es un frame del propio video, así que el cruce 2 -> 3 no produce
 * un corte visible aunque el contenido se mueva.
 *
 * Si el video no carga (red lenta, códec no soportado, `prefers-reduced-motion`),
 * el poster queda como fondo final. La pantalla nunca queda en negro.
 */
export function WakeBackdrop({ className }: WakeBackdropProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [posterVisible, setPosterVisible] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Con movimiento reducido no hay reproducción: el poster es el fondo final.
    if (media.matches) {
      setPosterVisible(true);
      video.pause();
      return;
    }

    const reveal = () => setVideoVisible(true);

    video.addEventListener("canplay", reveal);
    video.addEventListener("playing", reveal);
    // `play()` puede rechazar por política de autoplay aunque esté en muted;
    // si el elemento ya tiene frames, lo revelamos igual.
    void video.play().then(reveal, () => undefined);

    return () => {
      video.removeEventListener("canplay", reveal);
      video.removeEventListener("playing", reveal);
    };
  }, []);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-[#05070a]", className)}>
      {/* Capa 1 — fondo animado, CSS puro */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -left-[20%] -top-[25%] h-[75vmin] w-[75vmin] rounded-full bg-teal-500/18 blur-[90px] animate-[wake-drift-a_28s_ease-in-out_infinite]" />
        <div className="absolute -right-[15%] top-[10%] h-[65vmin] w-[65vmin] rounded-full bg-cyan-500/14 blur-[100px] animate-[wake-drift-b_36s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-30%] left-[25%] h-[70vmin] w-[70vmin] rounded-full bg-sky-400/10 blur-[110px] animate-[wake-drift-c_44s_ease-in-out_infinite]" />

        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,7,10,0.75)_100%)]" />
      </div>

      {/* Capa 2 — poster. `unoptimized` evita el round-trip por el Image
          Optimizer, que en esta pantalla sería solo latencia añadida. */}
      <Image
        src={POSTER_SRC}
        alt=""
        fill
        sizes="100vw"
        unoptimized
        priority
        aria-hidden
        onLoad={() => setPosterVisible(true)}
        className={cn(
          "object-cover transition-opacity duration-700 ease-out",
          posterVisible ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Capa 3 — video */}
      <video
        ref={videoRef}
        aria-hidden
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out motion-reduce:hidden",
          videoVisible ? "opacity-100" : "opacity-0",
        )}
      >
        <source src={VIDEO_WEBM_SRC} type="video/webm" />
        <source src={VIDEO_MP4_SRC} type="video/mp4" />
      </video>

      {/* Velo para legibilidad del texto sobre cualquier fotograma */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,7,10,0.55)_0%,rgba(5,7,10,0.86)_70%)]"
      />
    </div>
  );
}
