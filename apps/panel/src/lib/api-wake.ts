import { getApiOrigin } from "@/lib/env";

/**
 * Endpoint de la API usado para saber si el servicio está despierto.
 *
 * `/health/live` es el correcto para este propósito: no depende de la base de
 * datos y responde en cuanto el servidor HTTP acepta conexiones, que es
 * exactamente el momento en que el proveedor considera el servicio arrancado.
 *
 * No se puede llamar desde el navegador: en `apps/api/http/server.go` las rutas
 * de health se registran FUERA de `CORSMiddleware`, así que un `fetch`
 * cross-origin sin cabeceras CORS rebotaría indistinguible de un servidor
 * dormido. Por eso el sondeo se expone vía Route Handler (`/api/wake`).
 */
export const WAKE_PROBE_PATH = "/health/live";

/** Timeout corto para el render del servidor: no bloquear la primera respuesta. */
export const SSR_PROBE_TIMEOUT_MS = 2_000;

/** Timeout más holgado para el sondeo del cliente, vía Route Handler. */
export const ROUTE_PROBE_TIMEOUT_MS = 5_000;

/**
 * Durante este tiempo damos por despierta la API sin volver a sondear. Evita
 * pagar un round-trip extra en cada navegación cuando el servicio está sano.
 */
const PROBE_CACHE_TTL_MS = 30_000;

export type WakeProbeReason =
	| "ok"
	| "timeout"
	| "network"
	| "unconfigured"
	| "http";

export type WakeProbeResult = {
	awake: boolean;
	elapsedMs: number;
	reason: WakeProbeReason;
	status: number | null;
	detail: string;
};

let probeCache: { at: number; result: WakeProbeResult } | null = null;

function getProbeUrl(): string {
	return `${getApiOrigin()}${WAKE_PROBE_PATH}`;
}

/**
 * Intenta despertar/verificar la API. Nunca lanza: un fallo es un resultado
 * válido (la pantalla de encendido existe justamente para ese caso).
 */
export async function probeApi(timeoutMs: number): Promise<WakeProbeResult> {
	const startedAt = performance.now();
	const elapsed = () => Math.round(performance.now() - startedAt);

	let url: string;
	try {
		url = getProbeUrl();
	} catch (error) {
		return {
			awake: false,
			elapsedMs: elapsed(),
			reason: "unconfigured",
			status: null,
			detail: error instanceof Error ? error.message : String(error),
		};
	}

	try {
		const response = await fetch(url, {
			method: "GET",
			cache: "no-store",
			redirect: "follow",
			signal: AbortSignal.timeout(timeoutMs),
			headers: { Accept: "text/plain" },
		});

		if (!response.ok) {
			return {
				awake: false,
				elapsedMs: elapsed(),
				reason: "http",
				status: response.status,
				detail: `HTTP ${response.status}`,
			};
		}

		return {
			awake: true,
			elapsedMs: elapsed(),
			reason: "ok",
			status: response.status,
			detail: `HTTP ${response.status}`,
		};
	} catch (error) {
		const isTimeout =
			error instanceof Error &&
			(error.name === "TimeoutError" || error.name === "AbortError");

		return {
			awake: false,
			elapsedMs: elapsed(),
			reason: isTimeout ? "timeout" : "network",
			status: null,
			detail: isTimeout
				? `sin respuesta en ${timeoutMs} ms`
				: error instanceof Error
					? error.message
					: String(error),
		};
	}
}

/** rememberProbe para que los renders siguientes no repitan el sondeo. */
export function rememberProbe(result: WakeProbeResult): WakeProbeResult {
	probeCache = { at: Date.now(), result };
	return result;
}

/**
 * Sondeo con memoria corta para el render del servidor.
 *
 * En la ruta caliente (API ya despierta) el coste es un solo fetch por ventana
 * de 30 s, no uno por navegación. Si la API está dormida se sondea siempre:
 * es precisamente el sondeo el que dispara el arranque en el proveedor.
 */
export async function probeApiForRender(): Promise<WakeProbeResult> {
	const fresh =
		probeCache && Date.now() - probeCache.at < PROBE_CACHE_TTL_MS
			? probeCache.result
			: null;

	if (fresh) {
		return fresh;
	}

	return rememberProbe(await probeApi(SSR_PROBE_TIMEOUT_MS));
}
