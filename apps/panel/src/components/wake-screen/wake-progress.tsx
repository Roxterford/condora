"use client";

import { cn } from "@/lib/utils";

type WakeProgressProps = {
  elapsedMs: number;
  finished: boolean;
  failed: boolean;
  className?: string;
};

const TWEEN_MS = 2_200;
const CEILING = 92;

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Barra de progreso del encendido.
 *
 * Mismo enfoque asintótico que `TopProgressBar`: crece deprisa al principio y
 * nunca llega al 100% por su cuenta, porque llegar al 100 significa "la API
 * respondió". La ondulación va con un seno en vez de aleatorio para que el
 * movimiento sea continuo entre ticks y no dé tirones.
 */
export function WakeProgress({ elapsedMs, finished, failed, className }: WakeProgressProps) {
  const eased = 88 * (1 - Math.exp(-elapsedMs / TWEEN_MS));
  const ripple = finished || failed ? 0 : Math.sin(elapsedMs / 420) * 1.2;
  // Al fallar la barra se queda donde llegó, en rojo: llenarla al 100%
  // diría "terminado", y no lo está.
  const width = finished ? 100 : Math.min(CEILING, eased + ripple);

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
