"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EstadoDeudaTag } from "@/components/estado-deuda-tag";
import { TipoCuotaTag } from "@/components/tipo-cuota-tag";
import { useDrawer } from "@/contexts/drawer-context";
import { execute } from "@/providers/graphql/execute";
import { graphql } from "@/providers/graphql";
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
import { useSingleDoubleClick } from "@/hooks/useSingleDoubleClick";
import { useSmoothScrollToTop } from "@/hooks/useSmoothScrollToTop";
import { Paginacion } from "@/components/paginacion/paginacion";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import { TableSkeleton } from "@/components/table-skeleton/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Deuda__CuotaType,
  TipoDeCuota,
  VillaDeudasQuery,
} from "@/providers/graphql/graphql";
import { ReceiptText, ChevronRight } from "lucide-react";
import Link from "next/link";

const DeudasQuery = graphql(/* GraphQL */ `
  query VillaDeudas($codigo: String!, $page: Int!, $limit: Int!) {
    deudas: obtenerDeudas(
      filtro: { unidad: { eq: $codigo } }
      paginador: { limit: $limit, page: $page }
    ) {
      data {
        id
        cuota {
          __typename
          ... on Deuda__Cuota {
            id
            nombre
          }
        }
        deuda
        monto
        estado
      }
      limit
      page
      pages
      total
    }
  }
`);

type Deuda = VillaDeudasQuery["deudas"]["data"][number];

const TIPO_POR_TIPO_DEUDA: Record<
  NonNullable<Deuda__CuotaType["__typename"]>,
  TipoDeCuota
> = {
  Deuda__CuotaEspecial: TipoDeCuota.Especial,
  Deuda__CuotaRegular: TipoDeCuota.Regular,
  Deuda__CuotaSemilla: TipoDeCuota.Semilla,
};

export function DeudasTable({ codigo }: { codigo: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollToTop = useSmoothScrollToTop();
  const { open } = useDrawer();

  const currentPage = Math.max(1, Number(searchParams.get("deudas_page")) || 1);
  const limitParam = Number(searchParams.get("deudas_limit"));
  const limit = RESULTADOS_POR_PAGINA.includes(
    limitParam as (typeof RESULTADOS_POR_PAGINA)[number],
  )
    ? limitParam
    : RESULTADOS_POR_PAGINA[1];

  const { data, isFetching } = useQuery({
    queryKey: ["villas", codigo, "deudas", currentPage, limit],
    queryFn: async () => {
      const result = await execute(DeudasQuery, {
        codigo,
        page: currentPage,
        limit,
      });
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

  const deudas = data?.deudas;
  const totalPages = deudas?.pages ?? 1;

  const setPage = (page: number) => {
    scrollToTop();
    const params = new URLSearchParams(searchParams);
    params.set("deudas_page", String(page));
    router.push(`/villas/${codigo}?${params}`, { scroll: false });
  };

  const setLimit = (nuevoLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("deudas_limit", String(nuevoLimit));
    params.set("deudas_page", "1");
    router.push(`/villas/${codigo}?${params}`, { scroll: false });
  };

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
    <>
      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        className="justify-end"
      />
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
          {isFetching ? (
            <TableSkeleton
              rows={limit}
              columns={6}
              cell={(col) => {
                switch (col) {
                  case 0:
                    return <Skeleton className="h-4 w-32" />;
                  case 1:
                  case 2:
                    return <Skeleton className="h-5 w-16 rounded-full" />;
                  case 3:
                  case 4:
                    return <Skeleton className="h-4 w-14" />;
                  default:
                    return <Skeleton className="ml-auto h-7 w-28 rounded-md" />;
                }
              }}
            />
          ) : deudas?.data.length ? (
            deudas.data.map((deuda) => (
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
                      <ChevronRight size={16} />
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
      <PaginacionFooter
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
        onLimitChange={setLimit}
        onPageChange={setPage}
      />
    </>
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