"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import { useSmoothScrollToTop } from "@/hooks/useSmoothScrollToTop";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { TipoDeCuota } from "@/providers/graphql/graphql";
import { CuotasTableData } from "@/features/administracion/components/cuotas_table/cuotas_table";
import { CuotasPageTaps } from "./cuotas-page-taps";

const PageQuery = graphql(/* GraphQL */ `
  query CuotasPage($page: Int!, $limit: Int!) {
    cuotas: obtenerCuotas(paginator: { limit: $limit, page: $page }) {
      data {
        __typename
        ... on Cuota {
          id
          monto
          mes
          anio
          registro
          recaudacion {
            unidades_aplicadas
            pagos_asociados
            monto_estimado
            monto_recaudado
            moneda
          }
        }

        ... on CuotaEspecial {
          detalles {
            titulo
            descripcion
          }
          recaudacion {
            unidades_aplicadas
            pagos_asociados
            monto_estimado
            monto_recaudado
            moneda
          }
        }
      }
      limit
      page
      pages
      total
    }
  }
`);

export function CuotasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitParam = Number(searchParams.get("limit"));
  const limit = RESULTADOS_POR_PAGINA.includes(
    limitParam as (typeof RESULTADOS_POR_PAGINA)[number],
  )
    ? limitParam
    : RESULTADOS_POR_PAGINA[1];
  const scrollToTop = useSmoothScrollToTop();

  const { data, isFetching } = useQuery({
    queryKey: ["cuotas", currentPage, limit],
    queryFn: async () => {
      const result = await execute(PageQuery, { page: currentPage, limit });
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

  const cuotas = data?.cuotas;
  const totalPages = cuotas?.pages ?? 1;

  const setPage = (page: number) => {
    scrollToTop();
    router.push(`/cuotas?page=${page}&limit=${limit}`, { scroll: false });
  };

  const setLimit = (nuevoLimit: number) => {
    router.push(`/cuotas?limit=${nuevoLimit}`);
  };

  const cuota_table_data = (cuotas?.data ?? []).map<CuotasTableData>((c) => ({
    id: c.id,
    tipo:
      c.__typename === "CuotaEspecial"
        ? TipoDeCuota.Especial
        : TipoDeCuota.Regular,
    monto: c.monto,
    mes: c.mes,
    anio: c.anio,
    registro: new Date(c.registro),
    actualizacion: new Date(),
    pagos_recibidos: c.recaudacion.pagos_asociados,
    pagos_esperados: c.recaudacion.unidades_aplicadas,
    monto_recaudado: c.recaudacion.monto_recaudado,
    monto_estimado: c.recaudacion.monto_estimado,
    moneda: c.recaudacion.moneda,
    ...((c.__typename === "CuotaEspecial" &&
      ({
        detalles: {
          titulo: c.detalles.titulo,
          descripcion: c.detalles.descripcion,
        },
      } as Pick<CuotasTableData<"especial">, "detalles">)) as any),
  }));

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cuotas</h1>
          <p className="page-description">
            Gestión de cuotas mensuales y espaciales
          </p>
        </div>

        <Link href="/cuotas/registrar">
          <Button>
            <Plus /> Nueva cuota
          </Button>
        </Link>
      </header>
      <div className="mt-5 space-y-5">
        <CuotasPageTaps
          cuotas={cuota_table_data}
          loading={isFetching}
          loadingRows={limit}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
        <PaginacionFooter
          currentPage={currentPage}
          totalPages={totalPages}
          limit={limit}
          onLimitChange={setLimit}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
