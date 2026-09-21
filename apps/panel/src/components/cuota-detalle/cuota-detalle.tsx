"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EstadoDeudaTag } from "@/components/estado-deuda-tag";
import { TipoCuotaTag } from "@/components/tipo-cuota-tag";
import { money } from "@/lib/money-display";
import { useDrawer } from "@/contexts/drawer-context";
import { graphql } from "@/providers/graphql";
import {
  CuotaDetalleQuery as CuotaDetalleQueryResult,
  EstadoDeProyecto,
  Mes,
  TipoDeCuota,
} from "@/providers/graphql/graphql";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ReceiptText } from "lucide-react";
import Link from "next/link";

export const CuotaDetalleQuery = graphql(/* GraphQL */ `
  query CuotaDetalle($cuota_id: String!) {
    cuota: obtenerCuota(id: $cuota_id) {
      __typename
      ... on CuotaRegular {
        id
        monto
        mes
        anio
        registro
        actualizacion
        recaudacion {
          moneda
          monto_estimado
          monto_recaudado
          monto_pendiente
          pagos_asociados
          unidades
          unidades_aplicadas
          unidades_solventes
          unidades_pendientes
        }
        gastos {
          __typename
          ... on Gasto {
            operacion
            concepto
            moneda
            monto
            fecha
            tasa
            total
          }
          ... on GastoAProveedor {
            proveedor {
              id
              nombre
            }
          }
        }
      }
      ... on CuotaEspecial {
        id
        monto
        mes
        anio
        registro
        actualizacion
        detalles {
          titulo
          descripcion
          justificacion
          fecha_limite
          estado
        }
        recaudacion {
          moneda
          monto_estimado
          monto_recaudado
          monto_pendiente
          pagos_asociados
          unidades
          unidades_aplicadas
          unidades_solventes
          unidades_pendientes
        }
        gastos {
          __typename
          ... on Gasto {
            operacion
            concepto
            moneda
            monto
            fecha
            tasa
            total
          }
          ... on GastoAProveedor {
            proveedor {
              id
              nombre
            }
          }
        }
      }
      ... on CuotaSemilla {
        id
        monto
        mes
        anio
        registro
        actualizacion
        recaudacion {
          moneda
          monto_estimado
          monto_recaudado
          monto_pendiente
          pagos_asociados
          unidades
          unidades_aplicadas
          unidades_solventes
          unidades_pendientes
        }
        gastos {
          __typename
          ... on Gasto {
            operacion
            concepto
            moneda
            monto
            fecha
            tasa
            total
          }
          ... on GastoAProveedor {
            proveedor {
              id
              nombre
            }
          }
        }
      }
    }
    deudas: obtenerDeudas(
      filtro: { cuota: { eq: $cuota_id }, estado: { neq: "SALDADA" } }
    ) {
      data {
        id
        deuda
        estado
        unidad {
          codigo
        }
        titular {
          display_name
        }
      }
    }
  }
`);

type CuotaDetalleCuota = NonNullable<CuotaDetalleQueryResult["cuota"]>;
type CuotaDetalleDeuda = CuotaDetalleQueryResult["deudas"]["data"][number];
type Recaudacion = CuotaDetalleCuota["recaudacion"];
type GastoAProveedorDeCuota = Extract<
  CuotaDetalleCuota["gastos"][number],
  { __typename: "GastoAProveedor" }
>;

export type CuotaDetalleData = {
  cuota: CuotaDetalleCuota;
  deudasPendientes: CuotaDetalleDeuda[];
};

const NOMBRE_DE_MES: Record<Mes, string> = {
  [Mes.Enero]: "Enero",
  [Mes.Febrero]: "Febrero",
  [Mes.Marzo]: "Marzo",
  [Mes.Abril]: "Abril",
  [Mes.Mayo]: "Mayo",
  [Mes.Junio]: "Junio",
  [Mes.Julio]: "Julio",
  [Mes.Agosto]: "Agosto",
  [Mes.Septiembre]: "Septiembre",
  [Mes.Octubre]: "Octubre",
  [Mes.Noviembre]: "Noviembre",
  [Mes.Diciembre]: "Diciembre",
};

export function CuotaDetalle({ cuota, deudasPendientes }: CuotaDetalleData) {
  const { close } = useDrawer();

  return (
    <div className="space-y-6 p-6">
      <TagSection cuota={cuota} />
      <ResumenBoxes cuota={cuota} />
      <DetalleDeLaCuota cuota={cuota} />
      <RecaudacionSection recaudacion={cuota.recaudacion} />
      {cuota.__typename === "CuotaEspecial" && (
        <ProyectoSection cuota={cuota} />
      )}
      <SectionTitle>Desglose de gastos</SectionTitle>
      <GastosSection gastos={cuota.gastos} />
      {deudasPendientes.length > 0 && (
        <PendientesSection deudas={deudasPendientes} cerrar={close} />
      )}
      <Link href={`/cuotas/${cuota.id}`} onClick={close} className="block">
        <Button variant="outline" className="w-full">
          Ir a detalles de la cuota
        </Button>
      </Link>
    </div>
  );
}

function TagSection({ cuota }: { cuota: CuotaDetalleCuota }) {
  const tipo =
    cuota.__typename === "CuotaEspecial"
      ? TipoDeCuota.Especial
      : cuota.__typename === "CuotaSemilla"
        ? TipoDeCuota.Semilla
        : TipoDeCuota.Regular;

  return (
    <div className="flex flex-wrap gap-2">
      <TipoCuotaTag type={tipo} />
      <EstadoRecaudacionTag recaudacion={cuota.recaudacion} />
    </div>
  );
}

function EstadoRecaudacionTag({ recaudacion }: { recaudacion: Recaudacion }) {
  const porcentaje = calcularPorcentaje(recaudacion);

  if (porcentaje >= 100) {
    return <Badge className="bg-green-100 text-green-700">Recaudada</Badge>;
  }
  if (porcentaje > 0) {
    return <Badge className="bg-yellow-100 text-yellow-700">En curso</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-600">Sin recaudación</Badge>;
}

function ResumenBoxes({ cuota }: { cuota: CuotaDetalleCuota }) {
  const recaudacion = cuota.recaudacion;
  const porcentaje = calcularPorcentaje(recaudacion);

  return (
    <div className="grid grid-cols-3 divide-x divide-border">
      <Box titulo="Monto por unidad">
        <p className="text-sm font-semibold">{money(cuota.monto)}</p>
      </Box>
      <Box titulo="Total estimado">
        <p className="text-sm font-semibold">
          {money(recaudacion.monto_estimado, recaudacion.moneda)}
        </p>
      </Box>
      <Box titulo="Recaudado">
        <p
          className={[
            "text-sm font-semibold",
            porcentaje >= 100 ? "text-green-700" : "text-yellow-700",
          ].join(" ")}
        >
          {money(recaudacion.monto_recaudado, recaudacion.moneda)}
        </p>
      </Box>
    </div>
  );
}

function DetalleDeLaCuota({ cuota }: { cuota: CuotaDetalleCuota }) {
  return (
    <section>
      <SectionTitle>Detalle de la cuota</SectionTitle>
      <dl>
        <Fila
          label="Tipo"
          value={
            cuota.__typename === "CuotaEspecial"
              ? "Especial"
              : cuota.__typename === "CuotaSemilla"
                ? "Semilla"
                : "Regular"
          }
        />
        <Fila
          label="Mes / Año"
          value={`${NOMBRE_DE_MES[cuota.mes]} ${cuota.anio}`}
        />
        <Fila
          label="Registro"
          value={format(cuota.registro, "d MMM yyyy '\u00b7' HH:mm", {
            locale: es,
          })}
        />
        <Fila label="Monto unitario" value={money(cuota.monto)} />
        <Fila
          label="Total estimado"
          value={money(
            cuota.recaudacion.monto_estimado,
            cuota.recaudacion.moneda,
          )}
        />
        {cuota.__typename === "CuotaEspecial" && (
          <Fila label="Proyecto" value={cuota.detalles.titulo} strong />
        )}
      </dl>
    </section>
  );
}

function RecaudacionSection({ recaudacion }: { recaudacion: Recaudacion }) {
  const porcentaje = calcularPorcentaje(recaudacion);

  return (
    <section>
      <SectionTitle>Recaudación</SectionTitle>
      <dl>
        <Fila
          label="Pagos recibidos"
          value={`${recaudacion.unidades_solventes}/${recaudacion.unidades_aplicadas}`}
        />
        <Fila
          label="Unidades pendientes"
          value={String(recaudacion.unidades_pendientes)}
        />
        <Fila
          label="Pagos asociados"
          value={String(recaudacion.pagos_asociados)}
        />
        <Fila
          label="Monto pendiente"
          value={money(recaudacion.monto_pendiente, recaudacion.moneda)}
        />
      </dl>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={porcentaje} className="flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {porcentaje.toFixed(2)}%
        </span>
      </div>
    </section>
  );
}

function ProyectoSection({
  cuota,
}: {
  cuota: Extract<CuotaDetalleCuota, { __typename: "CuotaEspecial" }>;
}) {
  return (
    <section>
      <SectionTitle>Detalle del proyecto</SectionTitle>
      <dl>
        <Fila label="Título" value={cuota.detalles.titulo} strong />
        <Fila
          label="Estado"
          value={etiquetaDeEstadoProyecto(cuota.detalles.estado)}
        />
        <Fila
          label="Fecha límite"
          value={format(cuota.detalles.fecha_limite, "d MMM yyyy", {
            locale: es,
          })}
        />
      </dl>
      {cuota.detalles.descripcion && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">Descripción</p>
          <p className="text-sm font-medium mt-0.5">
            {cuota.detalles.descripcion}
          </p>
        </div>
      )}
      {cuota.detalles.justificacion && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">Justificación</p>
          <p className="text-sm font-medium mt-0.5">
            {cuota.detalles.justificacion}
          </p>
        </div>
      )}
    </section>
  );
}

function GastosSection({ gastos }: { gastos: CuotaDetalleCuota["gastos"] }) {
  const desglosables = gastos.filter(
    (g): g is GastoAProveedorDeCuota => g.__typename === "GastoAProveedor",
  );

  if (!desglosables.length) {
    return (
      <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg">
            <ReceiptText className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Sin gastos asociados
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {desglosables.map((gasto) => (
        <div
          key={gasto.operacion}
          className="flex items-center justify-between gap-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{gasto.concepto}</p>
            <p className="text-xs text-muted-foreground truncate">
              {gasto.proveedor.nombre}
            </p>
          </div>
          <p className="text-sm font-semibold shrink-0 tabular-nums">
            {money(gasto.total, gasto.moneda)}
          </p>
        </div>
      ))}
    </div>
  );
}

function PendientesSection({
  deudas,
  cerrar,
}: {
  deudas: CuotaDetalleDeuda[];
  cerrar: () => void;
}) {
  const VISIBLES = 5;
  const visibles = deudas.slice(0, VISIBLES);
  const restantes = deudas.length - visibles.length;

  return (
    <section>
      <SectionTitle>Unidades pendientes</SectionTitle>
      <div
        className={[
          "divide-y divide-gray-100",
          restantes > 0 &&
            "[mask-image:linear-gradient(to_bottom,black_65%,transparent_100%)]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {visibles.map((deuda) => (
          <div
            key={deuda.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <Link
              href={`/villas/${deuda.unidad.codigo}`}
              onClick={cerrar}
              className="min-w-0"
            >
              <p className="text-sm font-medium truncate">
                {deuda.unidad.codigo}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {deuda.titular?.display_name ?? "Sin titular"}
              </p>
            </Link>
            <div className="flex items-center gap-3 shrink-0">
              <EstadoDeudaTag state={deuda.estado} />
              <p className="text-sm font-semibold tabular-nums">
                {money(deuda.deuda)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {restantes > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Más de {VISIBLES} unidades
        </p>
      )}
    </section>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function Fila({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
      <dd
        className={[
          "text-sm font-medium text-right min-w-0 break-all",
          strong && "font-semibold text-foreground",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function calcularPorcentaje(recaudacion: Recaudacion): number {
  if (!recaudacion.monto_estimado) return 0;
  return (recaudacion.monto_recaudado / recaudacion.monto_estimado) * 100;
}

function etiquetaDeEstadoProyecto(estado: EstadoDeProyecto): string {
  switch (estado) {
    case EstadoDeProyecto.Activo:
      return "Activo";
    case EstadoDeProyecto.Cerrado:
      return "Cerrado";
    case EstadoDeProyecto.Borrador:
      return "Borrador";
  }
}
