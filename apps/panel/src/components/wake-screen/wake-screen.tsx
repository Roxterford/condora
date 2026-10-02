"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { WakeBackdrop } from "@/components/wake-screen/wake-backdrop";
import { WakeNotes } from "@/components/wake-screen/wake-notes";
import { WakeProgress, formatElapsed, MAX_WAIT_MS } from "@/components/wake-screen/wake-progress";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 3_000;
const TICK_MS = 250;
const READY_HOLD_MS = 400;
const EXIT_MS = 500;
/** A partir de aquí la espera deja de ser "un instante" y se pide paciencia. */
const SLOW_AFTER_MS = 12_000;

type Phase = "connecting" | "ready" | "failed" | "exiting";

type ProbeResult = {
  awake: boolean;
  elapsedMs: number;
  reason: string;
  status: number | null;
  detail: string;
};

const REASON_TEXT: Record<string, string> = {
  timeout: "sin conexión todavía",
  network: "conexión no disponible",
  unconfigured: "sin conexión",
  http: "conexión interrumpida",
  ok: "todo listo",
};

const TITLE = {
  connecting: "Conectando con tu condominio…",
  slow: "Conectando con tu condominio…",
  ready: "Todo listo",
  failed: "No pudimos conectar con tu condominio en este momento.",
};

const SUBTITLE = {
  connecting: "Estamos preparando la información y los avisos más recientes de tu comunidad.",
  slow: "Primera conexión del día: estamos asegurando tus datos, solo tomará unos segundos más.",
  ready: "Ya entrando a tu condominio.",
  failed: "Por favor, intenta actualizar la página.",
};

type WakeScreenProps = {
  onDismiss: () => void;
};

export function WakeScreen({ onDismiss }: WakeScreenProps) {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [probe, setProbe] = useState<ProbeResult | null>(null);

  const startedAtRef = useRef(0);
  // El reloj se detiene en cuanto el arranque se resuelve, para que ni la
  // barra ni el contador sigan avanzando en los estados ya decididos.
  const settledRef = useRef(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const retryButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isExiting = phase === "exiting";
  const isFailed = phase === "failed";
  const isReady = phase === "ready";
  const isSlow = !isFailed && !isReady && elapsedMs >= SLOW_AFTER_MS;
  const copyKey = isFailed ? "failed" : isReady ? "ready" : isSlow ? "slow" : "connecting";

  // El foco se devuelve al elemento que lo tenía antes de la pantalla, en el
  // cleanup del efecto que lo captura (o sea, al desmontar).
  const finish = useCallback(() => onDismiss(), [onDismiss]);

  // Retención breve antes de cerrar: la respuesta de la API y la llegada del
  // HTML de la página no son simultáneas, y desmontar en seco deja ver un hueco.
  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => setPhase("exiting"), READY_HOLD_MS);
    return () => clearTimeout(timer);
  }, [isReady]);

  useEffect(() => {
    if (!isExiting) return;
    const timer = setTimeout(finish, EXIT_MS);
    return () => clearTimeout(timer);
  }, [finish, isExiting]);

  useEffect(() => {
    if (phase !== "connecting") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      timer = setTimeout(run, POLL_INTERVAL_MS);
    };

    async function run() {
      try {
        const response = await fetch("/api/wake", { cache: "no-store" });
        const body = (await response.json()) as ProbeResult;
        if (cancelled) return;
        setProbe(body);
        if (body.awake) {
          settledRef.current = true;
          setPhase("ready");
          return;
        }
      } catch {
        // El propio handler nunca falla; si falla es la red entre navegador y
        // panel, que es un motivo más para seguir esperando.
        if (cancelled) return;
      }
      schedule();
    }

    void run();

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [phase]);

  useEffect(() => {
    startedAtRef.current = performance.now();

    const timer = setInterval(() => {
      if (settledRef.current) return;
      const elapsed = performance.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= MAX_WAIT_MS) {
        settledRef.current = true;
        setPhase((current) => (current === "connecting" ? "failed" : current));
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, []);

  // El foco entra en la pantalla para que quien navega con teclado no se quede
  // en un documento que detrás es inaccesible.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previousFocusRef.current?.focus?.();
  }, []);

  useEffect(() => {
    if (isFailed) retryButtonRef.current?.focus();
  }, [isFailed]);

  const retry = useCallback(() => {
    startedAtRef.current = performance.now();
    settledRef.current = false;
    setElapsedMs(0);
    setProbe(null);
    setPhase("connecting");
  }, []);

  const statusLabel = isFailed ? "SIN CONEXIÓN" : isReady ? "LISTO" : "CONECTANDO";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] overflow-hidden bg-[#05070a] transition-opacity duration-500 ease-out",
        isExiting ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <WakeBackdrop />

      {/* Sin card, el texto va directo sobre el video. Estos dos velos dan el
          contraste en los bordes contra un fotograma que cambia en bucle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#05070a]/90 via-[#05070a]/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#05070a]/90 via-[#05070a]/40 to-transparent"
      />

      <header className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10 sm:py-8">
        <Image
          src="/condora_blanco.svg"
          alt="Condora"
          width={132}
          height={26}
          priority
          className="h-6 w-auto drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)] sm:h-7"
        />

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase backdrop-blur-md",
            isFailed
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : isReady
                ? "border-teal-400/40 bg-teal-400/10 text-teal-300"
                : "border-white/15 bg-black/25 text-white/70",
          )}
        >
          <span className="relative flex size-1.5">
            <span
              className={cn(
                "wake-dot absolute inline-flex size-full rounded-full",
                isFailed ? "bg-destructive" : "bg-teal-400",
              )}
            />
          </span>
          {statusLabel}
        </span>
      </header>

      <div className="relative flex h-full w-full items-center justify-center px-6 py-28 sm:px-10">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label="Estado de la conexión con tu condominio"
          className="w-full max-w-2xl text-center outline-none"
        >
          {/* Región viva aparte y solo con el mensaje de fase. Si el panel
              entero fuera `role="status"`, el reloj y la barra —que cambian
              cuatro veces por segundo— se anunciarían sin parar. */}
          <p role="status" aria-live="polite" className="sr-only">
            {TITLE[copyKey]}. {SUBTITLE[copyKey]}
          </p>

          <h1 className="text-balance text-[2.125rem] font-semibold tracking-[-0.025em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.75)] sm:text-5xl">
            {TITLE[copyKey]}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-white/65 drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)]">
            {SUBTITLE[copyKey]}
          </p>

          <div className="mx-auto mt-10 max-w-md">
            <WakeProgress elapsedMs={elapsedMs} finished={isReady} failed={isFailed} />
          </div>

          {isFailed ? (
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button ref={retryButtonRef} onClick={retry} className="sm:min-w-36">
                Reintentar
              </Button>
              <Button
                variant="ghost"
                onClick={finish}
                className="text-white/65 hover:bg-white/10 hover:text-white sm:min-w-36"
              >
                Continuar de todos modos
              </Button>
            </div>
          ) : (
            <div className="mx-auto mt-9 max-w-lg">
              <WakeNotes />
            </div>
          )}
        </div>
      </div>

      <footer
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 border-t border-white/10 px-6 py-4 font-mono text-[10.5px] tracking-wide text-white/40 sm:px-10"
      >
        <span className="hidden sm:inline">CONDORA · GESTIÓN DE CONDOMINIOS</span>
        <span className="tabular-nums sm:hidden">{formatElapsed(elapsedMs)}</span>
        <span className="truncate">
          {isReady
            ? `CONEXIÓN · ${REASON_TEXT[probe?.reason ?? ""] ?? "todo listo"}`
            : isFailed
              ? "CONEXIÓN · sin conexión"
              : `CONEXIÓN · ${REASON_TEXT[probe?.reason ?? ""] ?? "conectando"}`}
        </span>
        <span className="hidden tabular-nums sm:inline">{formatElapsed(elapsedMs)}</span>
      </footer>
    </div>
  );
}
