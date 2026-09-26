"use client";;
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CuotaEspecial,
  CuotaRegular,
  CuotaSemilla,
  Mes,
  Moneda,
  Proyecto,
  TipoDeCuota,
} from "@/providers/graphql/graphql";
import { useDrawer } from "@/contexts/drawer-context";
import { execute } from "@/providers/graphql/execute";
import { useRouter } from "next/navigation";
import { useSingleDoubleClick } from "@/hooks/useSingleDoubleClick";
import {
  CuotaDetalle,
  CuotaDetalleQuery,
} from "@/components/cuota-detalle/cuota-detalle";
import { TipoCuotaTag } from "@/components/tipo-cuota-tag";
import { money } from "@/lib/money-display";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/table-skeleton/table-skeleton";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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

export type CuotasTableType = "regular" | "especial" | "default";

export interface CuotasTableData<
  T extends CuotasTableType = "default",
> extends Pick<
  CuotaEspecial | CuotaRegular | CuotaSemilla,
  "id" | "__typename" | "monto" | "mes" | "anio" | "registro" | "actualizacion"
> {
  detalles: T extends "regular"
    ? never
    : T extends "especial"
      ? Pick<Proyecto, "titulo" | "descripcion">
      : never;
  pagos_recibidos: number;
  pagos_esperados: number;
  monto_recaudado: number;
  monto_estimado: number;
  moneda: Moneda;
}

export interface CuotasTableProps {
  type?: CuotasTableType;
  data: CuotasTableData[];
  loading?: boolean;
  loadingRows?: number;
}

type ColumnConfig = {
  label: string;
  getValue: (cuota: CuotasTableData) => ReactNode;
  className?: string;
};

const detallesDeLaCuota = (c: CuotasTableData) => {
  if (c.__typename !== "CuotaEspecial") return undefined;
  return (c as unknown as { detalles?: { titulo: string } }).detalles;
};

const porcentajeDeRecaudacion = (c: CuotasTableData) =>
  c.monto_estimado > 0 ? (c.monto_recaudado / c.monto_estimado) * 100 : 0;

const COLUMNS: ColumnConfig[] = [
  {
    label: "Cuota",
    getValue: (c) => {
      const detalles = detallesDeLaCuota(c);
      return detalles ? (
        <div className="flex min-w-48 flex-col">
          <span className="font-medium text-foreground">{detalles.titulo}</span>
          <span className="text-xs text-muted-foreground">
            {NOMBRE_DE_MES[c.mes]} {c.anio}
          </span>
        </div>
      ) : (
        <div className="flex min-w-48 flex-col">
          <span className="font-medium text-foreground">
            {NOMBRE_DE_MES[c.mes]} {c.anio}
          </span>
          <span className="text-xs text-muted-foreground">Mensualidad</span>
        </div>
      );
    },
  },
  {
    label: "Tipo",
    getValue: (c) => (
      <TipoCuotaTag
        type={
          c.__typename === "CuotaEspecial"
            ? TipoDeCuota.Especial
            : c.__typename === "CuotaSemilla"
              ? TipoDeCuota.Semilla
              : TipoDeCuota.Regular
        }
      />
    ),
  },
  {
    label: "Monto",
    getValue: (c) => (
      <span className="tabular-nums">{money(c.monto, c.moneda)}</span>
    ),
  },
  {
    label: "Progreso",
    getValue: (c) => {
      const pct = porcentajeDeRecaudacion(c);
      return (
        <div className="flex items-center justify-center gap-2">
          <Progress value={pct} className="h-2 w-24" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {c.pagos_recibidos}/{c.pagos_esperados} {pct.toFixed(0)}%
          </span>
        </div>
      );
    },
    className: "text-center",
  },
  {
    label: "Estado",
    getValue: (c) => {
      const pct = porcentajeDeRecaudacion(c);
      if (pct >= 100)
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Recaudada
          </span>
        );
      if (pct > 0)
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            En curso
          </span>
        );
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          Sin recaudar
        </span>
      );
    },
    className: "text-center",
  },
];

function tipoDeCuota(cuota: CuotasTableData): TipoDeCuota {
  return cuota.__typename === "CuotaEspecial"
    ? TipoDeCuota.Especial
    : cuota.__typename === "CuotaSemilla"
      ? TipoDeCuota.Semilla
      : TipoDeCuota.Regular;
}

export function CuotasTable({
  data: cuotas,
  type = "default",
  loading,
  loadingRows = 5,
}: CuotasTableProps) {
  const { open } = useDrawer();
  const router = useRouter();

  const filteredCuotas = cuotas.filter((cuota) => {
    if (type === "default") return true;
    if (type === "regular") return cuota.__typename === "CuotaRegular";
    return cuota.__typename === "CuotaEspecial";
  });

  const verDetalles = (cuota: CuotasTableData) => {
    open({
      title: "Información de la cuota",
      titleBadge: <TipoCuotaTag type={tipoDeCuota(cuota)} />,
      side: "right",
      size: 460,
      loader: async () => {
        const result = await execute(CuotaDetalleQuery, {
          cuota_id: cuota.id,
        });
        const data = result.data;
        if (!data?.cuota) {
          return (
            <p className="p-6 text-sm text-muted-foreground">No encontrada</p>
          );
        }
        return (
          <CuotaDetalle
            cuota={data.cuota}
            deudasPendientes={data.deudas.data}
          />
        );
      },
    });
  };

  const onClickFila = useSingleDoubleClick({
    onSingle: verDetalles,
    onDouble: (cuota) => router.push(`/cuotas/${cuota.id}`),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((col) => (
            <TableHead
              key={col.label}
              className={`table__head ${col.className ?? ""}`}
            >
              {col.label}
            </TableHead>
          ))}
          <TableHead className="table__head text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeleton
            rows={loadingRows}
            columns={6}
            cell={(col) => {
              switch (col) {
                case 0:
                  return (
                    <div className="grid min-w-48 gap-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  );
                case 1:
                  return <Skeleton className="h-5 w-16 rounded-full" />;
                case 2:
                  return <Skeleton className="h-4 w-16 tabular-nums" />;
                case 3:
                  return (
                    <div className="flex items-center justify-center gap-2">
                      <Skeleton className="h-2 w-24" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  );
                case 4:
                  return <Skeleton className="mx-auto h-5 w-20 rounded-full" />;
                default:
                  return (
                    <div className="flex justify-end">
                      <Skeleton className="h-8 w-28 rounded-md" />
                    </div>
                  );
              }
            }}
          />
        ) : (
          filteredCuotas.map((cuota) => (
            <TableRow
              key={cuota.id}
              onClick={(e) => onClickFila(cuota, e)}
              className="cursor-pointer"
            >
              {COLUMNS.map((col) => (
                <TableCell key={col.label} className={col.className}>
                  {col.getValue(cuota)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      href={"/cuotas/" + cuota.id}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Ver detalles
                      <ChevronRight size={16} />
                    </Link>
                  }
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
