"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import { useSmoothScrollToTop } from "@/hooks/useSmoothScrollToTop";
import { execute } from "@/providers/graphql/execute";
import { TipoDeCuota, CuotaFilter } from "@/providers/graphql/graphql";
import { CuotasTableData } from "@/features/administracion/components/cuotas_table/cuotas_table";
import { CuotasPageTaps, CuotasPageTab, CUOTAS_TABS } from "./cuotas-page-taps";
import { useDebounce } from "@/hooks/useDebounce";

const PageQueryString = /* GraphQL */ `
  query CuotasPage($page: Int!, $limit: Int!, $filter: CuotaFilter) {
    cuotas: obtenerCuotas(
      filtro: $filter
      paginador: { limit: $limit, page: $page }
    ) {
      data {
        __typename
        ... on Cuota {
          id
          display_name
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
`;

const ConteoQueryString = /* GraphQL */ `
  query ConteoCuotasPorTipo($filter: CuotaFilter) {
    cuotas: obtenerCuotas(filtro: $filter, paginador: { page: 1, limit: 1 }) {
      total
    }
  }
`;

// El enum `TipoDeCuota` del schema usa PascalCase, pero la columna `cuotas.tipo`
// almacena el valor en mayúsculas, que es lo que espera el filtro del backend.
const TIPO_REGULAR = "REGULAR";
const TIPO_ESPECIAL = "ESPECIAL";

const FILTROS_POR_TAB: Record<CuotasPageTab, CuotaFilter> = {
  todas: {},
  regulares: { tipo: { eq: TIPO_REGULAR } },
  especiales: { tipo: { eq: TIPO_ESPECIAL } },
};

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
  const [tab, setTab] = useState<CuotasPageTab>("todas");
  const [busqueda, setBusqueda] = useState("%%");
  const onDebounceBusqueda = useDebounce(setBusqueda);
  const scrollToTop = useSmoothScrollToTop();

  const buildFilter = useCallback((): any => {
    const baseFilter = FILTROS_POR_TAB[tab];
    if (busqueda === "%%") return baseFilter;
    
    return {
      and: [
        baseFilter,
        { nombre: { ilike: busqueda } },
      ],
    };
  }, [tab, busqueda]);

  const filter = buildFilter();

  const { data, isFetching } = useQuery({
    queryKey: ["cuotas", tab, busqueda, currentPage, limit],
    queryFn: async () => {
      const result = await execute<{ cuotas: { data: any[]; pages: number; total: number; limit: number; page: number } }, { page: number; limit: number; filter: CuotaFilter }>(PageQueryString, {
        page: currentPage,
        limit,
        filter,
      });
      return result.data;
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === tab && previousQuery?.queryKey[2] === busqueda
        ? previousData
        : undefined,
  });

  const conteos = useQueries({
    queries: CUOTAS_TABS.map((t) => ({
      queryKey: ["cuotas", "conteo", t.value, busqueda],
      queryFn: async () => {
        const tabFilter = FILTROS_POR_TAB[t.value];
        const combinedFilter = busqueda === "%%"
          ? tabFilter
          : { and: [tabFilter, { nombre: { ilike: busqueda } }] };
        const result = await execute<{ cuotas: { total: number } }, { filter: any }>(ConteoQueryString, {
          filter: combinedFilter as any,
        });
        return result.data?.cuotas.total ?? 0;
      },
    })),
  });

  const conteoPorTab = new Map(
    CUOTAS_TABS.map((t, i) => [t.value, conteos[i]?.data]),
  );

  const cuotas = data?.cuotas;
  const totalPages = cuotas?.pages ?? 1;

  const setPage = (page: number) => {
    scrollToTop();
    router.push(`/cuotas?page=${page}&limit=${limit}`, { scroll: false });
  };

  const setLimit = (nuevoLimit: number) => {
    router.push(`/cuotas?limit=${nuevoLimit}`);
  };

  const onTabChange = (value: CuotasPageTab) => {
    setTab(value);
    router.push("/cuotas", { scroll: false });
  };

  const cuota_table_data = (cuotas?.data ?? []).map<CuotasTableData>((c) => ({
    __typename: c.__typename,
    id: c.id,
    tipo:
      c.__typename === "CuotaEspecial"
        ? TipoDeCuota.Especial
        : TipoDeCuota.Regular,
    display_name: c.display_name,
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
      <header className="page-header">
        <div>
          <h1 className="page-title">Cuotas</h1>
          <p className="page-description">
            Gestión de cuotas mensuales y espaciales
          </p>
        </div>

        <Link href="/cuotas/registrar" className="shrink-0">
          <Button>
            <Plus /> Nueva cuota
          </Button>
        </Link>
      </header>
      <div className="mt-5 space-y-5">
        <CuotasPageTaps
          tab={tab}
          onTabChange={onTabChange}
          conteoPorTab={conteoPorTab}
          cuotas={cuota_table_data}
          loading={isFetching}
          loadingRows={limit}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onSearchChange={onDebounceBusqueda}
          busqueda={busqueda}
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