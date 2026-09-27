import { getGraphqlEndpoint } from "@/lib/env";
import type { TypedDocumentString } from "./graphql";

interface Error {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, unknown>;
}

interface GraphqlResponse<TResult> {
  data: TResult | null;
  errors?: Error[];
}

const GQLGEN_ERROR_RE = /^\[(\w+)\]:\s*(.*)/;

const DATE_FIELD_KEYS = new Set([
  "fecha",
  "registro",
  "actualizacion",
  "fecha_limite",
  "creado_en",
  "actualizado_en",
]);

function toDate(value: string): Date | string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date;
}

function transformDateTimeOutput<T>(value: T): T {
  if (value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(transformDateTimeOutput) as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (DATE_FIELD_KEYS.has(key) && typeof child === "string") {
        result[key] = toDate(child);
      } else {
        result[key] = transformDateTimeOutput(child);
      }
    }
    return result as T;
  }
  return value;
}

function normalizeErrors(errors?: Error[]): Error[] | undefined {
  if (!errors) return undefined;
  return errors.map((e) => {
    const match = e.message.match(GQLGEN_ERROR_RE);
    if (match) {
      return {
        ...e,
        message: match[2],
        extensions: {
          ...e.extensions,
          code: match[1],
        },
      };
    }
    return e;
  });
}

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<GraphqlResponse<TResult>>;

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  options: RequestInit,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<GraphqlResponse<TResult>>;

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  optionsOrVariables?:
    | RequestInit
    | (TVariables extends Record<string, never> ? never : TVariables),
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<GraphqlResponse<TResult>> {
  const isOptions =
    optionsOrVariables &&
    typeof optionsOrVariables === "object" &&
    "headers" in optionsOrVariables;
  const options = isOptions ? (optionsOrVariables as RequestInit) : undefined;
  const vars = isOptions
    ? (variables as TVariables extends Record<string, never>
        ? never
        : TVariables)
    : (optionsOrVariables as TVariables);

  const endpoint = getGraphqlEndpoint();

  let token: string | undefined;

  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    token = cookieStore.get("api_token")?.value;
  } else {
    token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("api_token="))
      ?.split("=")[1];
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/graphql-response+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    body: JSON.stringify({
      query,
      variables: vars,
    }),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    throw new Error("Respuesta inválida del servidor");
  }

  if (!response.ok) {
    const parsed = body as { data?: unknown; errors?: Error[] };
    if (parsed.errors || parsed.data !== undefined) {
      return {
        data: transformDateTimeOutput((parsed.data ?? null) as TResult),
        errors: normalizeErrors(parsed.errors) ?? [
          { message: `HTTP ${response.status}: ${response.statusText}` },
        ],
      } as GraphqlResponse<TResult>;
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = body as { data: TResult; errors?: Error[] };
  return {
    data: transformDateTimeOutput(result.data),
    errors: normalizeErrors(result.errors),
  } as GraphqlResponse<TResult>;
}
