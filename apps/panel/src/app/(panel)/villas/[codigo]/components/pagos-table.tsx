"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OperacionDetalle,
  acortarId,
  type Operacion,
} from "@/components/operacion-detalle/operacion-detalle";
import { useDrawer } from "@/contexts/drawer-context";
import { money } from "@/lib/money-display";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, ReceiptText } from "lucide-react";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { VillaPageQuery, VillaPagosQuery } from "@/providers/graphql/graphql";
import { useSmoothScrollToTop } from "@/hooks/useSmoothScrollToTop";
import { Paginacion } from "@/components/paginacion/paginacion";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import { TableSkeleton } from "@/components/table-skeleton/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { RegistrarPagoButton } from "./registrar-pago-button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

const PagosQuery = graphql(/* GraphQL */ `
  query VillaPagos($codigo: String!, $page: Int!, $limit: Int!) {
    pagos: obtenerPagos(
      filtro: { unidad: { eq: $codigo } }
      paginador: { limit: $limit, page: $page }
    ) {
      data {
        __typename
        fecha
        operacion
        concepto
        metodo
        moneda
        monto
        registro
        tasa
        total
        unidad {
          id
          codigo
        }
      }
      limit
      page
      pages
      total
    }
  }
`);

type Pago = VillaPagosQuery["pagos"]["data"][number];
type OperacionDetalleProps = React.ComponentProps<typeof OperacionDetalle>;

export function PagosTable({
  unidadTitular,
  unidad,
}: {
  unidadTitular?: OperacionDetalleProps["unidadTitular"];
  unidad: VillaPageQuery["unidad"];
}) {
  const codigo = unidad?.codigo ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollToTop = useSmoothScrollToTop();
  const { open } = useDrawer();

  const currentPage = Math.max(1, Number(searchParams.get("pagos_page")) || 1);
  const limitParam = Number(searchParams.get("pagos_limit"));
  const limit = RESULTADOS_POR_PAGINA.includes(
    limitParam as (typeof RESULTADOS_POR_PAGINA)[number],
  )
    ? limitParam
    : RESULTADOS_POR_PAGINA[1];

  const { data, isFetching } = useQuery({
    queryKey: ["villas", codigo, "pagos", currentPage, limit],
    enabled: codigo.length > 0,
    queryFn: async () => {
      const result = await execute(PagosQuery, {
        codigo,
        page: currentPage,
        limit,
      });
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

  const pagos = data?.pagos;
  const totalPages = pagos?.pages ?? 1;

  const setPage = (page: number) => {
    scrollToTop();
    const params = new URLSearchParams(searchParams);
    params.set("pagos_page", String(page));
    router.push(`/villas/${codigo}?${params}`, { scroll: false });
  };

  const setLimit = (nuevoLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("pagos_limit", String(nuevoLimit));
    params.set("pagos_page", "1");
    router.push(`/villas/${codigo}?${params}`, { scroll: false });
  };

  const verDetalles = (pago: Pago) => {
    open({
      content: (
        <OperacionDetalle
          operacion={pago as Operacion}
          unidadTitular={unidadTitular}
        />
      ),
      title: "Información de la operación",
      titleBadge: (
        <Badge
          variant="secondary"
          className="font-mono text-[10px] font-medium tracking-wide"
        >
          {acortarId(pago.operacion)}
        </Badge>
      ),
      side: "right",
      size: 440,
    });
  };

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
            <TableHead className="table__head">Concepto</TableHead>
            <TableHead className="table__head">Monto</TableHead>
            <TableHead className="table__head">Fecha</TableHead>
            <TableHead className="table__head">Estado</TableHead>
            <TableHead className="table__head text-end">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetching ? (
            <TableSkeleton
              rows={limit}
              columns={5}
              cell={(col) => {
                switch (col) {
                  case 0:
                    return <Skeleton className="h-4 w-32" />;
                  case 1:
                  case 2:
                    return <Skeleton className="h-4 w-16" />;
                  case 3:
                    return <Skeleton className="h-5 w-20 rounded-full" />;
                  default:
                    return <Skeleton className="ml-auto h-4 w-4" />;
                }
              }}
            />
          ) : pagos?.data.length ? (
            pagos.data.map((pago) => (
              <TableRow
                key={pago.operacion}
                onClick={() => verDetalles(pago)}
                className="cursor-pointer"
              >
                <TableCell>{pago.concepto}</TableCell>
                <TableCell>{money(pago.monto, pago.moneda)}</TableCell>
                <TableCell>
                  {format(pago.fecha, "d MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-700">
                    Completado
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <ChevronRight
                    className="ml-auto text-muted-foreground"
                    size={16}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState unidad={unidad} />
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

function EmptyState({ unidad }: { unidad: VillaPageQuery["unidad"] }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ReceiptText />
        </EmptyMedia>
        <EmptyTitle>No hay pagos</EmptyTitle>
        <EmptyDescription>Registra un pago para verlo aquí</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <RegistrarPagoButton unidad={unidad} />
      </EmptyContent>
    </Empty>
  );
}