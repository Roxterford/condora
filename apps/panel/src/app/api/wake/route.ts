import { ROUTE_PROBE_TIMEOUT_MS, WAKE_PROBE_PATH, probeApi, rememberProbe } from "@/lib/api-wake";

export const dynamic = "force-dynamic";

/**
 * Sondeo de disponibilidad de la API para la pantalla de encendido.
 *
 * Existe porque `/health/live` está fuera del `CORSMiddleware` de la API, así
 * que el navegador no puede consultarlo directamente. Este handler hace de
 * puente: same-origin, sin CORS, y con un timeout acotado para que un arranque
 * en frío no bloquee esta petición durante los 30-60s que tarda Render.
 *
 * Siempre responde 200 con el resultado en el cuerpo. Un 503 obligaría al
 * cliente a distinguir "API dormida" de "error de red" leyendo el cuerpo de la
 * respuesta fallida, que es justo lo que el sondeo intenta evitar.
 */
export async function GET() {
	const result = rememberProbe(await probeApi(ROUTE_PROBE_TIMEOUT_MS));

	return Response.json(
		{
			awake: result.awake,
			elapsedMs: result.elapsedMs,
			reason: result.reason,
			status: result.status,
			detail: result.detail,
			probePath: WAKE_PROBE_PATH,
			timeoutMs: ROUTE_PROBE_TIMEOUT_MS,
		},
		{
			headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate",
			},
		},
	);
}
