"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getOutboxDlqEvents,
  getOutboxStats,
  getPendingOutboxEvents,
  retryOutboxDlqEvent,
} from "@/lib/outbox-admin";

import { OutboxStatCard } from "./outbox-stat-card";
import { OutboxPendingTable } from "./outbox-pending-table";
import { OutboxDlqTable } from "./outbox-dlq-table";

export function OutboxAdminView() {
  const queryClient = useQueryClient();

  const stats = useQuery({
    queryKey: ["outbox", "stats"],
    queryFn: getOutboxStats,
  });

  const pending = useQuery({
    queryKey: ["outbox", "pending"],
    queryFn: () => getPendingOutboxEvents(100),
  });

  const dlq = useQuery({
    queryKey: ["outbox", "dlq"],
    queryFn: () => getOutboxDlqEvents(100),
  });

  const retryMutation = useMutation({
    mutationFn: retryOutboxDlqEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbox"] });
      toast.success("Evento movido de nuevo al outbox");
    },
    onError: (error) => {
      toast.error(`No se pudo reintentar: ${error.message}`);
    },
  });

  const loading = stats.isLoading || pending.isLoading || dlq.isLoading;

  return (
    <div className="mt-8 space-y-6">
      {/* Stat cards */}
      <div className="statcards">
        <OutboxStatCard
          title="Eventos pendientes"
          value={stats.data?.pending}
          loading={loading}
          color="bg-blue-100"
          icon={<Inbox className="text-blue-600" />}
        />
        <OutboxStatCard
          title="En cola DLQ"
          value={stats.data?.dlq_count}
          loading={loading}
          color="bg-red-100"
          icon={<AlertTriangle className="text-red-600" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dlq">
        <div className="flex items-center justify-between gap-3">
          <div className="tabs-scroll min-w-0">
            <TabsList>
              <TabsTrigger value="dlq">
                Dead Letter Queue
                <Badge variant="destructive" className="ml-1">
                  {dlq.data?.count ?? "-"}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes
                <Badge variant="outline" className="ml-1">
                  {pending.data?.count ?? "-"}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          <button
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["outbox"] })
            }
          >
            <RefreshCw className="size-4" />
            Refrescar
          </button>
        </div>

        <TabsContent
          value="dlq"
          className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/10"
        >
          {dlq.isLoading ? (
            <p className="text-center text-gray-500 py-8">Cargando...</p>
          ) : dlq.isError ? (
            <p className="text-center text-red-500 py-8">
              Error al cargar la cola DLQ
            </p>
          ) : dlq.data ? (
            <OutboxDlqTable
              events={dlq.data.events}
              retryingId={
                retryMutation.isPending
                  ? (retryMutation.variables ?? null)
                  : null
              }
              onRetry={(id) => retryMutation.mutate(id)}
            />
          ) : null}
        </TabsContent>

        <TabsContent
          value="pending"
          className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/10"
        >
          {pending.isLoading ? (
            <p className="text-center text-gray-500 py-8">Cargando...</p>
          ) : pending.isError ? (
            <p className="text-center text-red-500 py-8">
              Error al cargar los eventos pendientes
            </p>
          ) : pending.data ? (
            <OutboxPendingTable events={pending.data.events} />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
