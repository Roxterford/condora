"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Por qué el arranque tarda. Es la parte que evita que el usuario piense que
 * la aplicación está rota: sin contexto, 40 segundos de espera se leen como un
 * cuelgue.
 */
const NOTES = [
  {
    title: "El servidor se apaga solo",
    body: "Nuestro hosting lo suspende tras 15 minutos sin actividad para no pagar recursos que nadie está usando.",
  },
  {
    title: "Levantarlo lleva tiempo",
    body: "Encender el servidor, la base de datos y la caché suele tomar entre 20 y 60 segundos la primera vez del día.",
  },
  {
    title: "Ya casi",
    body: "No cierres esta pestaña. En cuanto la API responda, te llevamos directo a la pantalla desde la que entraste.",
  },
] as const;

const ROTATE_MS = 4_500;

/**
 * La rotación se congela mientras el usuario está leyendo. Hay dos
 * mecanismos distintos porque en táctil no existe hover: `pointerenter` se
 * dispara al tocar y `pointerleave` no llega de forma fiable al soltar, así
 * que en móvil quedaría pausada para siempre.
 *
 * - Puntero fino (ratón/lápiz): basta con pasar por encima.
 * - Puntero grueso (táctil): un toque alterna el bloqueo, y se puede volver
 *   a desbloquear con otro toque.
 * - En ambos, con la pestaña en segundo plano se congela sola.
 */
export function WakeNotes() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [locked, setLocked] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(hover: none)").matches);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const paused = locked || tabHidden || (coarsePointer ? false : hovered);

  // El intervalo se reconstruye al cambiar `paused`. Al reanudar arranca
  // el ciclo completo, así que la nota se queda donde la dejó el usuario en
  // lugar de saltar a la siguiente.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % NOTES.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const note = NOTES[index];

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center gap-2.5">
        <p className="font-mono text-[10px] tracking-[0.2em] text-teal-400/80 uppercase">
          Por qué tarda
        </p>
        {/* Indicador de congelado, sin texto: un glyph de pausa dentro de una
            pastilla verde ya dice "detenido" sin ocupar ancho ni traducirse.
            Deliberadamente no usa `wake-dot`, que late: latir implicaría que
            algo sigue en marcha, y aquí justamente se ha parado. */}
        {locked ? (
          <span
            aria-hidden
            className="wake-badge inline-flex size-[18px] shrink-0 items-center justify-center rounded-full bg-teal-400/15 ring-1 ring-teal-400/70"
          >
            <span className="flex items-center gap-[2px]">
              <span className="block h-[7px] w-[2px] rounded-[1px] bg-teal-400" />
              <span className="block h-[7px] w-[2px] rounded-[1px] bg-teal-400" />
            </span>
          </span>
        ) : null}
      </div>

      {/* El bloque entero es el control: pulsarlo congela o reanuda. `role="button"`
          con `aria-pressed` cubre el equivalente de teclado, que si no dejaría
          la rotación sin forma de detenerse sin ratón. */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={locked}
        aria-label={
          locked
            ? "Reanudar la rotación de las explicaciones"
            : "Fijar la explicación para poder leerla"
        }
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => setLocked((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setLocked((value) => !value);
          }
        }}
        className="mt-2 w-full cursor-pointer touch-manipulation rounded-lg px-2 py-1 select-none outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70"
      >
        {/* Las notas rotativas están fuera del árbol de accesibilidad: un lector
            de pantalla anunciaría el cambio cada 4,5 s y eso es ruido. El texto
            completo queda disponible de forma estática en el resumen. */}
        <div aria-hidden className="min-h-[4.75rem]">
          {/* `key` cambia con el índice, así que React remonta la nota y la
              animación de entrada vuelve a dispararse en cada rotación. */}
          <div key={note.title} className="wake-note">
            <p className="text-[0.9375rem] font-medium text-white/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)]">
              {note.title}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-pretty text-[13px] leading-relaxed text-white/55 drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)]">
              {note.body}
            </p>
          </div>
        </div>

        <p className="sr-only">
          {NOTES.map((item) => `${item.title}. ${item.body}`).join(" ")}
        </p>

        <div className="mt-3 flex justify-center gap-1.5">
          {NOTES.map((item, itemIndex) => (
            <span
              key={item.title}
              className={cn(
                "wake-dot h-1 rounded-full transition-all duration-500",
                itemIndex === index ? "w-5 bg-teal-400" : "w-1 bg-white/25",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
