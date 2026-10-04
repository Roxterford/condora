"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Box,
  CircleAlert,
  CircleCheckBig,
  DollarSign,
  Search,
} from "lucide-react";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { EstadoDeUnidad, UnidadFilter } from "@/providers/graphql/graphql";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/stat-card/stat-card";
import { money } from "@/lib/money-display";
import { Paginacion } from "@/components/paginacion/paginacion";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmoothScrollToTop } from "@/hooks/useSmoothScrollToTop";
import {
  VillasTable,
  VillasTableData,
} from "@/features/villas/components/villas_table";

const PageQuery = graphql(/* GraphQL */ `
  query VillasPage($page: Int!, $filtro: UnidadFilter, $limit: Int!) {
    resumen: obtenerResumenUnidades {
      total_unidades
      unidades_solventes
      unidades_con_pendientes
      total_pendiente
    }

    villas: obtenerUnidades(
      filter: $filtro
      paginator: { limit: $limit, page: $page }
    ) {
      data {
        codigo
        estado
        wallet
        deuda
        contacto {
          id
          email
          telefono
        }
        titular_primario {
          __typename
          ... on Sujeto {
            id
            cedula
            display_name
          }
          ... on Persona {
            nombres
            apellidos
          }
          ... on Ente {
            razon_social
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

const ConteoQuery = graphql(/* GraphQL */ `
  query ConteoUnidadesPorTab($filtro: UnidadFilter) {
    villas: obtenerUnidades(filter: $filtro, paginator: { page: 1, limit: 1 }) {
      total
    }
  }
`);

type Tab = "todas" | "activas" | "solventes" | "deuda" | "inhabitadas";

const TABS: {
  value: Tab;
  label: string;
  filtro: UnidadFilter;
  vacio: string;
}[] = [
  { value: "todas", label: "Todas", filtro: {}, vacio: "No hay unidades" },
  {
    value: "activas",
    label: "Activas",
    filtro: { estado: { eq: EstadoDeUnidad.Activa } },
    vacio: "No hay unidades activas",
  },
  {
    value: "solventes",
    label: "Solventes",
    filtro: { deuda: { eq: 0 } },
    vacio: "No hay unidades solventes",
  },
  {
    value: "deuda",
    label: "Con deuda pendiente",
    filtro: { deuda: { gt: 0 } },
    vacio: "No hay unidades con deuda pendiente",
  },
  {
    value: "inhabitadas",
    label: "Inhabitadas",
    filtro: { estado: { eq: EstadoDeUnidad.Inhabitada } },
    vacio: "No hay unidades inhabitadas",
  },
];

// Combina el filtro de la tab con la búsqueda por código. El filtro de la tab
// se omite cuando está vacío para no generar un `and` con un objeto en blanco.
const filtroConBusqueda = (
  filtro: UnidadFilter,
  busqueda: string,
): UnidadFilter => ({
  and: [
    ...(Object.keys(filtro).length ? [filtro] : []),
    { codigo: { like: busqueda } },
  ],
});

export function VillasPageContent() {
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
  const [tab, setTab] = useState<Tab>("todas");
  const scrollToTop = useSmoothScrollToTop();

  const tabActual = TABS.find((t) => t.value === tab) ?? TABS[0];

  const { data, isFetching } = useQuery({
    queryKey: ["villas", tab, busqueda, currentPage, limit],
    queryFn: async () => {
      const result = await execute(PageQuery, {
        page: currentPage,
        filtro: filtroConBusqueda(tabActual.filtro, busqueda),
        limit,
      });
      return result.data;
    },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === tab ? previousData : undefined,
  });

  const conteos = useQueries({
    queries: TABS.map((t) => ({
      queryKey: ["villas", "conteo", t.value],
      queryFn: async () => {
        const result = await execute(ConteoQuery, { filtro: t.filtro });
        return result.data?.villas?.total ?? 0;
      },
    })),
  });

  const conteoPorTab = new Map(TABS.map((t, i) => [t.value, conteos[i]?.data]));

  const villas = data?.villas;
  const totalPages = villas?.pages ?? 1;

  const setPage = (page: number) => {
    scrollToTop();
    router.push(`/villas?page=${page}&limit=${limit}`, { scroll: false });
  };

  const setLimit = (nuevoLimit: number) => {
    router.push(`/villas?limit=${nuevoLimit}`);
  };

  const onTabChange = (value: string) => {
    setTab(value as Tab);
    router.push(`/villas?limit=${limit}`, { scroll: false });
  };

  const villas_table_data: VillasTableData[] = (villas?.data ?? []).map(
    (villa) => {
      const titular_primario = villa.titular_primario;

      return {
        codigo: villa.codigo,
        estado: villa.estado,
        wallet: villa.wallet,
        deuda: villa.deuda,
        propietario: titular_primario ?? undefined,
        contacto: {
          email: villa.contacto?.email ?? "",
          telefono: villa.contacto?.telefono ?? "",
        },
        estado_pagos: villa.deuda > 0 ? "pendiente" : "solvente",
      };
    },
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Villas</h1>
          <p className="page-description">
            Gestione la información de propietarios del condominio
          </p>
        </div>
        <div className="page-actions"></div>
      </header>

      <ul className="statcards mt-8">
        <StatCard
          color="bg-primary/10"
          icon={<Box className="text-primary" />}
          title="Unidades totales"
          value={data?.resumen?.total_unidades ?? "-"}
          subtitle=""
        />
        <StatCard
          color="bg-green-100"
          icon={<CircleCheckBig className="text-green-700" />}
          title="Solventes"
          value={data?.resumen?.unidades_solventes ?? "-"}
          subtitle=""
        />
        <StatCard
          color="bg-yellow-100"
          icon={<CircleAlert className="text-yellow-600" />}
          title="Pendientes de pago"
          value={data?.resumen?.unidades_con_pendientes ?? "-"}
          subtitle=""
        />
        <StatCard
          color="bg-rose-100"
          icon={<DollarSign className="text-rose-700" />}
          title="Deuda pendiente"
          value={data?.resumen ? money(data.resumen.total_pendiente) : "-"}
          subtitle=""
        />
      </ul>

      <section className="mt-5">
        <Tabs value={tab} onValueChange={onTabChange}>
          <div className="tabs-scroll">
          <TabsList variant="line">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <Badge
                  variant={t.value === tab ? "secondary" : "outline"}
                  className="ml-1 tabular-nums"
                >
                  {conteoPorTab.get(t.value) ?? "-"}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          </div>

          <TabsContent value={tab} className="space-y-5">
            <div className="toolbar">
              <form>
                <InputGroup>
                  <InputGroupInput
                    placeholder="Buscar por código"
                    className="w-full md:min-w-68"
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
            <VillasTable
              data={villas_table_data}
              busqueda={busqueda !== "%%"}
              loading={isFetching}
              loadingRows={limit}
              emptyTitle={tab === "todas" ? undefined : tabActual.vacio}
              emptyDescription={
                tab === "todas"
                  ? undefined
                  : "Ninguna unidad coincide con los filtros seleccionados"
              }
            />
            <PaginacionFooter
              currentPage={currentPage}
              totalPages={totalPages}
              limit={limit}
              onLimitChange={setLimit}
              onPageChange={setPage}
            />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
