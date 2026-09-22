"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Box, CreditCardPlus, ReceiptText, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import {
  EstadoDeDeuda,
  EstadoPagosVillaQuery,
} from "@/providers/graphql/graphql";
import { Button } from "@/components/ui/button";
import { EstadoDeudaTag } from "@/components/estado-deuda-tag";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Paginacion } from "@/components/paginacion/paginacion";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmoothScrollToTop } from "@/hooks/useSmoothScrollToTop";
import { useOverlay } from "@/hooks/useOverlay";
import { useSingleDoubleClick } from "@/hooks/useSingleDoubleClick";
import { useDrawer } from "@/contexts/drawer-context";
import { money } from "@/lib/money-display";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/table-skeleton/table-skeleton";
import { RegistrarPagoOverlay } from "@/features/administracion/components/registrar-pago-overlay";

const PageQuery = graphql(/* GraphQL */ `
  query EstadoPagosVilla($filtro: DeudaFilter, $paginador: Paginator) {
    deudas: obtenerDeudas(filtro: $filtro, paginador: $paginador) {
      data {
        id
        unidad {
          id
          codigo
        }
        titular {
          id
          display_name
        }
        monto
        deuda
        estado
      }
      limit
      page
      pages
      total
    }
  }
`);

type Deuda = EstadoPagosVillaQuery["deudas"]["data"][number];
type UnidadPago = { id: string; codigo: string; wallet: number; deuda: number };

export function EstadoPagosVilla({ cuota_id }: { cuota_id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitParam = Number(searchParams.get("limit"));
  const limit = RESULTADOS_POR_PAGINA.includes(
    limitParam as (typeof RESULTADOS_POR_PAGINA)[number],
  )
    ? limitParam
    : RESULTADOS_POR_PAGINA[1];
  const [busqueda, setBusqueda] = useState("%%");
  const onDebounceBusqueda = useDebounce(setBusqueda);
  const scrollToTop = useSmoothScrollToTop();
  const { open: abrirDrawer, close: cerrarDrawer } = useDrawer();

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["cuota.pagos-villa", cuota_id, busqueda, currentPage, limit],
    queryFn: async () => {
      const result = await execute(PageQuery, {
        filtro: { cuota: { eq: cuota_id }, unidad: { like: busqueda } },
        paginador: { page: currentPage, limit },
      });
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

  const [unidadPago, setUnidadPago] = useState<UnidadPago | null>(null);
  const registrarPago = useOverlay({
    closeOnDone: true,
    onDone: () => {
      refetch();
    },
  });

  const deudas = data?.deudas;
  const totalPages = deudas?.pages ?? 1;

  const setPage = (page: number) => {
    scrollToTop();
    router.push(`/cuotas/${cuota_id}?page=${page}&limit=${limit}`, {
      scroll: false,
    });
  };

  const setLimit = (nuevoLimit: number) => {
    router.push(`/cuotas/${cuota_id}?limit=${nuevoLimit}`);
  };

  const abrirRegistrarPago = (deuda: Deuda) => {
    setUnidadPago({
      id: deuda.unidad.id,
      codigo: deuda.unidad.codigo,
      wallet: 0,
      deuda: deuda.deuda,
    });
    registrarPago.open();
  };

  const verUnidad = (deuda: Deuda) => {
    abrirDrawer({
      title: deuda.unidad.codigo,
      titleBadge: <EstadoDeudaTag state={deuda.estado} />,
      side: "right",
      size: 400,
      content: (
        <UnidadDrawerContent
          deuda={deuda}
          onRegistrarPago={() => {
            cerrarDrawer();
            abrirRegistrarPago(deuda);
          }}
        />
      ),
    });
  };

  const onClickFila = useSingleDoubleClick({
    onSingle: verUnidad,
    onDouble: (deuda) => router.push(`/villas/${deuda.unidad.codigo}`),
  });

  return (
    <>
      <div className="flex">
        <form>
          <InputGroup>
            <InputGroupInput
              placeholder="Buscar por código"
              className="md:min-w-68"
              onChange={(e) => onDebounceBusqueda(`%${e.target.value}%`)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </form>
        <Paginacion
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          className="justify-end"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="table__head">Villa</TableHead>
            <TableHead className="table__head">Propietario</TableHead>
            <TableHead className="table__head">Estado</TableHead>
            <TableHead className="table__head">Cuenta</TableHead>
            <TableHead className="table__head">Debe</TableHead>
            <TableHead className="table__head text-right">Acciones</TableHead>
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
                    return <Skeleton className="h-4 w-14" />;
                  case 1:
                    return <Skeleton className="h-4 w-28" />;
                  case 2:
                    return <Skeleton className="h-5 w-16 rounded-full" />;
                  case 3:
                    return (
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-4" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    );
                  case 4:
                    return <Skeleton className="h-4 w-16" />;
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
                  {deuda.unidad.codigo}
                </TableCell>
                <TableCell>
                  {deuda.titular?.display_name ?? "Sin titular"}
                </TableCell>
                <TableCell>
                  <EstadoDeudaTag state={deuda.estado} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {money(deuda.monto - deuda.deuda)}{" "}
                  <span className="text-muted-foreground">
                    / {money(deuda.monto)}
                  </span>
                </TableCell>

                <TableCell className="tabular-nums">
                  {deuda.deuda ? (
                    <span className="text-red-600">{money(deuda.deuda)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {deuda.estado === EstadoDeDeuda.Pendiente ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirRegistrarPago(deuda);
                      }}
                    >
                      Registrar pago
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link
                          href={`/villas/${deuda.unidad.codigo}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver detalles
                        </Link>
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5}>
                {busqueda !== "%%" ? <NotFoundState /> : <EmptyState />}
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
      <RegistrarPagoOverlay
        {...registrarPago.overlayProps}
        unidad={unidadPago}
        initialFocus="unidad"
      />
    </>
  );
}

function UnidadDrawerContent({
  deuda,
  onRegistrarPago,
}: {
  deuda: Deuda;
  onRegistrarPago: () => void;
}) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <Box className="size-8 text-primary" />
        </div>
        <div className="grid gap-0.5">
          <p className="font-semibold">{deuda.unidad.codigo}</p>
          <p className="text-sm text-muted-foreground">
            {deuda.titular?.display_name ?? "Sin titular"}
          </p>
        </div>
      </div>

      <dl className="divide-y divide-border rounded-lg border">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Estado</dt>
          <EstadoDeudaTag state={deuda.estado} />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">Monto de la deuda</dt>
          <dd className="text-sm font-semibold tabular-nums">
            {money(deuda.deuda)}
          </dd>
        </div>
      </dl>

      <div className="grid gap-2">
        {deuda.estado === EstadoDeDeuda.Pendiente && (
          <Button onClick={onRegistrarPago}>
            <CreditCardPlus /> Registrar pago
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={
            <Link href={`/villas/${deuda.unidad.codigo}`}>Ver detalles</Link>
          }
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ReceiptText />
        </EmptyMedia>
        <EmptyTitle>Sin pagos registrados</EmptyTitle>
        <EmptyDescription>
          Esta cuota no tiene pagos registrados todavía
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NotFoundState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>Resultados no encontrados</EmptyTitle>
        <EmptyDescription>Intenta una búsqueda diferente</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
