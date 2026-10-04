"use client";

import { AvatarIniciales } from "@/components/avatar-iniciales/avatar-iniciales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/money-display";
import {
  OperacionesPageQuery,
  UnidadTitularQuery,
} from "@/providers/graphql/graphql";
import { useDrawer } from "@/contexts/drawer-context";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Box as BoxIcon } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button/copy-button";

export type Operacion = OperacionesPageQuery["operaciones"]["data"][number];
type OperacionConActualizacion = Operacion & { actualizado_en?: Date };
type UnidadTitular = NonNullable<
  UnidadTitularQuery["unidad"]
>["titular_primario"];

export function acortarId(id: string): string {
  const MAX = 12;
  if (id.length <= MAX) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function OperacionDetalle({
  operacion,
  unidadTitular,
}: {
  operacion: Operacion;
  unidadTitular?: UnidadTitular;
}) {
  return (
    <div className="space-y-6 p-6">
      <TagSection operacion={operacion} />
      <ResumenBoxes operacion={operacion} />
      <CajasDeDetalle operacion={operacion} />
      {operacion.__typename === "GastoAProveedor" && (
        <ProveedorSection proveedor={operacion.proveedor} />
      )}
      {operacion.__typename === "Pago" && (
        <UnidadSection unidad={operacion.unidad} titular={unidadTitular} />
      )}
    </div>
  );
}

function TagSection({ operacion }: { operacion: Operacion }) {
  if (operacion.__typename === "Pago") {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-green-100 text-green-700">Pago</Badge>
        <Badge variant="secondary">Unidad {operacion.unidad.codigo}</Badge>
      </div>
    );
  }

  if (operacion.__typename === "GastoAProveedor") {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-yellow-200 text-yellow-700">Gasto</Badge>
        <Badge variant="secondary">{operacion.proveedor.nombre}</Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-yellow-200 text-yellow-700">Gasto</Badge>
      <Badge variant="secondary">Condominio</Badge>
    </div>
  );
}

function ResumenBoxes({ operacion }: { operacion: Operacion }) {
  const positivo = operacion.__typename === "Pago";

  return (
    <div className="detail-grid">
      <Box titulo="Total">
        <p
          className={[
            "text-sm font-semibold",
            positivo ? "text-green-700" : "text-yellow-700",
          ].join(" ")}
        >
          {money(operacion.total)}
        </p>
      </Box>
      <Box titulo="Tasa">
        <p className="text-sm font-semibold">
          Bs. {formatearTasa(operacion.tasa)}
        </p>
      </Box>
      <Box titulo="Fecha">
        <p className="text-sm font-semibold">
          {format(operacion.fecha, "d MMM", { locale: es })}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(operacion.fecha, {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </Box>
    </div>
  );
}

function CajasDeDetalle({ operacion }: { operacion: Operacion }) {
  const actualizadoEn = (operacion as OperacionConActualizacion).actualizado_en;

  return (
    <div className="space-y-4">
      <Box titulo="Concepto">
        <p className="text-sm font-medium text-foreground">
          {operacion.concepto}
        </p>
      </Box>

      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
        <Box titulo="Monto">
          <p
            className={[
              "text-sm font-semibold",
              operacion.__typename === "Pago"
                ? "text-green-700"
                : "text-yellow-700",
            ].join(" ")}
          >
            {money(operacion.monto, operacion.moneda)}
          </p>
        </Box>
        <Box titulo="Registro">
          <p className="text-sm font-medium">
            {format(operacion.registro, "d MMM yyyy '·' HH:mm", {
              locale: es,
            })}
          </p>
        </Box>
      </div>

      {actualizadoEn && (
        <Box titulo="Actualización">
          <p className="text-sm font-medium">
            {format(actualizadoEn, "d MMM yyyy '·' HH:mm", { locale: es })}
          </p>
        </Box>
      )}

      <Box titulo="ID">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-xs break-all min-w-0 flex-1">
            {operacion.operacion}
          </p>
          <CopyButton value={operacion.operacion} what="ID" />
        </div>
      </Box>
    </div>
  );
}

function Box({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function ProveedorSection({
  proveedor,
}: {
  proveedor: Extract<Operacion, { __typename: "GastoAProveedor" }>["proveedor"];
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Proveedor
      </h3>
      <div className="mt-3">
        <AvatarIniciales nombre={proveedor.nombre} shape="rounded" />
      </div>
      <dl className="mt-3">
        <Fila label="Nombre" value={proveedor.nombre} strong />
        <Fila label="RIF" value={proveedor.rif} mono />
        <Fila label="Teléfono" value={proveedor.telefono ?? "—"} />
        <Fila
          label="Correo"
          value={proveedor.email ?? "—"}
          href={proveedor.email ? `mailto:${proveedor.email}` : undefined}
        />
      </dl>
    </section>
  );
}

function UnidadSection({
  unidad,
  titular,
}: {
  unidad: Extract<Operacion, { __typename: "Pago" }>["unidad"];
  titular?: UnidadTitular;
}) {
  const { close } = useDrawer();

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Unidad
      </h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="bg-primary/10 rounded-lg p-2">
          <BoxIcon className="size-10 text-primary" />
        </div>
        <div className="grid gap-1">
          <p className="font-medium text-nowrap">{unidad.codigo}</p>
          <p className="font-mono text-xs text-muted-foreground">{unidad.id}</p>
        </div>
      </div>
      {titular && (
        <dl className="mt-4">
          <Fila label="Titular primario" value={titular.display_name} strong />
          <Fila label="Cédula" value={titular.cedula} />
          <Fila
            label="Correo"
            value={titular.email ?? "—"}
            href={titular.email ? `mailto:${titular.email}` : undefined}
          />
          <Fila label="Teléfono" value={titular.telefono ?? "—"} />
        </dl>
      )}
      <Link
        href={`/villas/${unidad.codigo}`}
        onClick={close}
        className="mt-4 block"
      >
        <Button variant="outline" size="sm" className="w-full">
          Ir a detalles de la unidad
        </Button>
      </Link>
    </section>
  );
}

function Fila({
  label,
  value,
  strong = false,
  mono = false,
  href,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
      <dd
        className={[
          "text-sm font-medium text-right min-w-0 break-all",
          strong && "font-semibold text-foreground",
          mono && "font-mono text-xs",
          href && "text-blue-600 underline-offset-2 hover:underline",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {href ? (
          <a href={href} className="min-w-0 break-all">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function formatearTasa(tasa: number): string {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tasa);
}
