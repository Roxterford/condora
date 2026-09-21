"use client";

import { Button } from "@/components/ui/button";
import { EstadoDeudaTag } from "@/components/estado-deuda-tag";
import { TipoCuotaTag } from "@/components/tipo-cuota-tag";
import { useDrawer } from "@/contexts/drawer-context";
import { execute } from "@/providers/graphql/execute";
import {
  CuotaDetalle,
  CuotaDetalleQuery,
} from "@/components/cuota-detalle/cuota-detalle";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { money } from "@/lib/money-display";
import { useRouter } from "next/navigation";
import { useSingleDoubleClick } from "@/hooks/useSingleDoubleClick";
import {
  Deuda__CuotaType,
  TipoDeCuota,
  VillaPageQuery,
} from "@/providers/graphql/graphql";
import { ReceiptText } from "lucide-react";
import Link from "next/link";

type Deuda = VillaPageQuery["deudas"]["data"][number];

const TIPO_POR_TIPO_DEUDA: Record<
  NonNullable<Deuda__CuotaType["__typename"]>,
  TipoDeCuota
> = {
  Deuda__CuotaEspecial: TipoDeCuota.Especial,
  Deuda__CuotaRegular: TipoDeCuota.Regular,
  Deuda__CuotaSemilla: TipoDeCuota.Semilla,
};

export function DeudasTable({ deudas }: { deudas: Deuda[] }) {
  const { open } = useDrawer();
  const router = useRouter();

  const verCuota = (deuda: Deuda) => {
    open({
      title: "Información de la cuota",
      titleBadge: (
        <TipoCuotaTag type={TIPO_POR_TIPO_DEUDA[deuda.cuota.__typename]} />
      ),
      side: "right",
      size: 460,
      loader: async () => {
        const result = await execute(CuotaDetalleQuery, {
          cuota_id: deuda.cuota.id,
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
    onSingle: verCuota,
    onDouble: (deuda) => router.push(`/cuotas/${deuda.cuota.id}`),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="table__head">Cuota</TableHead>
          <TableHead className="table__head">Tipo</TableHead>
          <TableHead className="table__head">Estado</TableHead>
          <TableHead className="table__head">Origen</TableHead>
          <TableHead className="table__head">Debe</TableHead>
          <TableHead className="table__head text-end">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deudas.length ? (
          deudas.map((deuda) => (
            <TableRow
              key={deuda.id}
              onClick={(e) => onClickFila(deuda, e)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">
                {deuda.cuota.nombre}
              </TableCell>
              <TableCell>
                <TipoCuotaTag
                  type={TIPO_POR_TIPO_DEUDA[deuda.cuota.__typename]}
                />
              </TableCell>
              <TableCell>
                <EstadoDeudaTag state={deuda.estado} />
              </TableCell>
              <TableCell>{money(deuda.monto)}</TableCell>
              <TableCell>{money(deuda.deuda)}</TableCell>
              <TableCell className="text-end">
                <Link href={`/cuotas/${deuda.cuota.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // verCuota(deuda);
                    }}
                  >
                    Ver detalles
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6}>
              <EmptyState />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function EmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ReceiptText />
        </EmptyMedia>
        <EmptyTitle>Sin deudas</EmptyTitle>
        <EmptyDescription>
          Esta unidad no tiene deudas registradas
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
