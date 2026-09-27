import { getApiOrigin } from "@/lib/env";

export interface OutboxStats {
  pending: number;
  dlq_count: number;
  timestamp: string;
}

export interface OutboxPendingEvent {
  ID: string;
  EventName: string;
  Payload: string;
  CorrelationID: string;
  CausationID: string;
  OccurredAt: string;
  CreatedAt: string;
  PublishedAt?: string | null;
  Retries: number;
}

export interface OutboxDlqEvent {
  ID: string;
  EventName: string;
  Payload: string;
  CorrelationID: string;
  CausationID: string;
  OccurredAt: string;
  CreatedAt: string;
  FailedAt: string;
  ErrorMessage: string;
  Retries: number;
}

export interface OutboxEventsResponse<T> {
  events: T[];
  count: number;
  timestamp: string;
}

export interface OutboxRetryResponse {
  status: string;
  id: string;
  timestamp: string;
}

async function getToken(): Promise<string | undefined> {
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get("api_token")?.value;
  }
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("api_token="))
    ?.split("=")[1];
}

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  return fetch(`${getApiOrigin()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
}

export async function getOutboxStats(): Promise<OutboxStats> {
  const res = await adminFetch("/admin/outbox/stats");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function getPendingOutboxEvents(
  limit = 100,
): Promise<OutboxEventsResponse<OutboxPendingEvent>> {
  const res = await adminFetch(`/admin/outbox/pending?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function getOutboxDlqEvents(
  limit = 100,
): Promise<OutboxEventsResponse<OutboxDlqEvent>> {
  const res = await adminFetch(`/admin/outbox/dlq?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function retryOutboxDlqEvent(
  id: string,
): Promise<OutboxRetryResponse> {
  const res = await adminFetch(
    `/admin/outbox/dlq/retry?id=${encodeURIComponent(id)}`,
    { method: "POST" },
  );
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Evento DLQ no encontrado");
    }
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export function decodePayload(payload: string): string {
  try {
    const decoded = atob(payload);
    return JSON.stringify(JSON.parse(decoded), null, 2);
  } catch {
    try {
      return atob(payload);
    } catch {
      return payload;
    }
  }
}
