"use client";

import { cn } from "@/lib/utils";

type WakeProgressProps = {
  elapsedMs: number;
  finished: boolean;
  failed: boolean;
  className?: string;
};

/** Techo de espera antes de dar el arranque por fallido. */
export const MAX_WAIT_MS = 90_000;

const CEILING = 96;
const SETTLE_GAIN = 62;
const CREEP_GAIN = 34;

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Barra de progreso del encendido.
 *
 * El ancho es estrictamente monótono. Antes llevaba una ondulación con un
 * seno para fingir que seguía avanzando, pero se combinaba con un
 * `transition-[width] duration-500` reevaluado cada 250 ms: cada tick
 * reobjetivaba la transición antes de que terminara, así que la barra se
 * frenaba y daba marcha atrás sin parar. Dos animaciones peleando por la
 * misma propiedad. El brillo del `top-progress-sheen` ya comunica que hay
 * algo en marcha y no compite con el ancho.
 *
 * La curva suma dos tramos monótonos: uno asintótico que da movimiento
 * inmediato al arrancar, y uno lineal que cubre la espera larga. Un solo
 * asintótico se queda clavado en su asíntota a los 5 segundos y pasa los
 * 85 segundos restantes sin avanzar un píxel, que se lee como colgado.
 */
export function WakeProgress({ elapsedMs, finished, failed, className }: WakeProgressProps) {
  const settle = SETTLE_GAIN * (1 - Math.exp(-elapsedMs / 1_800));
  const creep = CREEP_GAIN * (elapsedMs / MAX_WAIT_MS);
  // Al fallar la barra se queda donde llegó, en rojo: llenarla al 100%
  // diría "terminado", y no lo está.
  const width = finished ? 100 : Math.min(CEILING, settle + creep);

  return (
    <div className={cn("w-full", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
        aria-label="Progreso del arranque de los servidores"
        className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/10"
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-full overflow-hidden rounded-r-full transition-[width] duration-500 ease-out",
            failed
              ? "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.6)]"
              : "bg-gradient-to-r from-teal-600 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(20,184,166,0.7)]",
          )}
          style={{ width: `${width}%` }}
        >
          <span className="top-progress-sheen" />
        </div>
        <div
          aria-hidden
          className={cn(
            "absolute left-0 top-0 h-full rounded-full blur-[6px]",
            failed ? "bg-destructive/50" : "bg-teal-400/50",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
