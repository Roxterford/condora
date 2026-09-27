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
