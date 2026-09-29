"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { WakeBackdrop } from "@/components/wake-screen/wake-backdrop";
import { WakeNotes } from "@/components/wake-screen/wake-notes";
import { WakeProgress, formatElapsed } from "@/components/wake-screen/wake-progress";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS = 90_000;
const TICK_MS = 250;
const READY_HOLD_MS = 400;
const EXIT_MS = 500;

type Phase = "connecting" | "ready" | "failed" | "exiting";

type ProbeResult = {
  awake: boolean;
  elapsedMs: number;
  reason: string;
  status: number | null;
  detail: string;
};

const REASON_TEXT: Record<string, string> = {
  timeout: "sin respuesta",
  network: "conexión rechazada",
  unconfigured: "endpoint sin configurar",
  http: "respuesta inesperada",
  ok: "en línea",
};

type WakeScreenProps = {
  onDismiss: () => void;
};

export function WakeScreen({ onDismiss }: WakeScreenProps) {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [probe, setProbe] = useState<ProbeResult | null>(null);

  const startedAtRef = useRef(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const retryButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isExiting = phase === "exiting";
  const isFailed = phase === "failed";
  const isReady = phase === "ready";

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
      const elapsed = performance.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      if (elapsed >= MAX_WAIT_MS) {
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
    setElapsedMs(0);
    setProbe(null);
    setPhase("connecting");
  }, []);

  const statusLabel = isFailed ? "SIN RESPUESTA" : isReady ? "EN LÍNEA" : "CONECTANDO";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] overflow-hidden bg-[#05070a] transition-opacity duration-500 ease-out",
        isExiting ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <WakeBackdrop />

      <div className="relative flex h-full w-full items-center justify-center px-5 py-10">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label="Estado del arranque de los servidores"
          className="wake-panel w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/50 backdrop-blur-xl outline-none sm:p-9"
        >
          {/* Región viva aparte y solo con el mensaje de fase. Si el panel
              entero fuera `role="status"`, el reloj y la barra —que cambian
              cuatro veces por segundo— se anunciarían sin parar. */}
          <p role="status" aria-live="polite" className="sr-only">
            {isFailed
              ? "No se pudo encender los servidores."
              : isReady
                ? "Servidores encendidos. Cargando el panel."
                : "Encendiendo los servidores."}
          </p>

          <div className="flex items-center justify-between gap-4">
            <Image
              src="/condora_blanco.svg"
              alt="Condora"
              width={132}
              height={26}
              priority
              className="h-6 w-auto opacity-95"
            />

            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] uppercase",
                isFailed
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : isReady
                    ? "border-teal-400/40 bg-teal-400/10 text-teal-300"
                    : "border-white/15 bg-white/5 text-white/70",
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
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-[-0.01em] text-white sm:text-[1.75rem]">
            {isFailed ? "No pudimos encender los servidores" : "Encendiendo los servidores"}
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-white/60">
            {isFailed
              ? "El arranque está tardando más de lo previsto. Puede ser una caída del servicio o una conexión inestable entre tu dispositivo y nuestros servidores."
              : "Estamos despertando la infraestructura de Condora. Es el paso previo a cargar tu panel."}
          </p>

          <div className="mt-7">
            <WakeProgress
              elapsedMs={elapsedMs}
              finished={isReady}
              failed={isFailed}
            />
          </div>

          {isFailed ? (
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Button ref={retryButtonRef} onClick={retry} className="sm:flex-1">
                Reintentar
              </Button>
              <Button variant="ghost" onClick={finish} className="sm:flex-1 text-white/70 hover:text-white">
                Continuar de todos modos
              </Button>
            </div>
          ) : (
            <div className="mt-7">
              <WakeNotes />
            </div>
          )}

          <div
            aria-hidden
            className="mt-7 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/8 pt-4 font-mono text-[10.5px] tracking-wide text-white/35"
          >
            <span className="tabular-nums">{formatElapsed(elapsedMs)}</span>
            <span className="truncate">
              {isReady
                ? `GET /health/live → ${probe?.detail ?? "en línea"}`
                : isFailed
                  ? "GET /health/live → agotado"
                  : `GET /health/live → ${REASON_TEXT[probe?.reason ?? ""] ?? "esperando"}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
