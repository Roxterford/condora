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

export function WakeNotes() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % NOTES.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const note = NOTES[index];

  return (
    <div className="relative w-full">
      <p className="font-mono text-[10px] tracking-[0.2em] text-teal-400/80 uppercase">
        Por qué tarda
      </p>

      {/* Las notas rotativas están fuera del árbol de accesibilidad: un lector
          de pantalla anunciaría el cambio cada 4,5 s y eso es ruido. El texto
          completo queda disponible de forma estática en el resumen. */}
      <div aria-hidden className="mt-3 min-h-[4.75rem]">
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

      <div className="mt-4 flex justify-center gap-1.5">
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
  );
}
