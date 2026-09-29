const DEV_GRAPHQL_ENDPOINT = "http://localhost:8081/query";

const MISSING_ENDPOINT_MESSAGE =
	"Endpoint de GraphQL no configurado. Define GRAPHQL_ENDPOINT (servidor) y/o " +
	"NEXT_PUBLIC_GRAPHQL_ENDPOINT (navegador) en el archivo .env de la raíz del monorepo. " +
	"Consulta apps/panel/.env.example.";

function assertConfigured(): string {
	if (process.env.NODE_ENV === "production") {
		throw new Error(MISSING_ENDPOINT_MESSAGE);
	}
	return DEV_GRAPHQL_ENDPOINT;
}

export function getGraphqlEndpoint(): string {
	if (typeof window === "undefined") {
		return (
			process.env.GRAPHQL_ENDPOINT ||
			process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
			assertConfigured()
		);
	}
	return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || assertConfigured();
}

export function getApiOrigin(): string {
	return getGraphqlEndpoint().replace(/\/query\/?$/, "");
}

const FALSY_VALUES = new Set(["false", "0", "no", "off"]);

/**
 * Indica si debe mostrarse la pantalla de encendido de la API.
 *
 * Solo se evalúa en el servidor (layout raíz). La variable es deliberadamente
 * server-only: al ser el SSR quien decide si arma la pantalla, no hace falta
 * exponerla en el bundle del navegador.
 *
 * Sin definir, el comportamiento depende del entorno: activada en producción
 * (donde la API duerme) y desactivada en desarrollo (donde el API local está
 * siempre de pie y solo añadiría un sondeo inútil).
 */
export function isWakeScreenEnabled(): boolean {
	const raw = process.env.WAKE_SCREEN_ENABLED?.trim().toLowerCase();

	if (raw === undefined || raw === "") {
		return process.env.NODE_ENV === "production";
	}
	return !FALSY_VALUES.has(raw);
}
