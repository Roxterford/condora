"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Box, CircleAlert, CircleCheckBig, DollarSign } from "lucide-react";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/ui/StatCard";
import { money } from "@/lib/money-display";
import { Paginacion } from "@/components/paginacion/paginacion";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
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
  const [tab, setTab] = useState("todas");
  const scrollToTop = useSmoothScrollToTop();

  const { data, isFetching } = useQuery({
    queryKey: ["villas", tab, busqueda, currentPage, limit],
    queryFn: async () => {
      const result = await execute(PageQuery, {
        page: currentPage,
        filtro:
          tab === "deuda"
            ? { deuda: { gt: 0 }, codigo: { like: busqueda } }
            : tab === "solventes"
              ? { deuda: { eq: 0 }, codigo: { like: busqueda } }
              : { codigo: { like: busqueda } },
        limit,
      });
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

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
    setTab(value);
    router.push("/villas");
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
      <header className="flex items-end justify-between">
        <div>
          <h1>Villas</h1>
          <p className="page-description">
            Gestione la información de propietarios del condominio
          </p>
        </div>
        <div className="flex gap-2"></div>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
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
          <TabsList variant="line">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="activas">Activas</TabsTrigger>
            <TabsTrigger value="solventes">Solventes</TabsTrigger>
            <TabsTrigger value="deuda">Con deuda pendiente</TabsTrigger>
            <TabsTrigger value="inhabitadas">Inhabitadas</TabsTrigger>
          </TabsList>
          {(tab === "todas" || tab === "deuda" || tab === "solventes") && (
            <TabsContent value={tab} className="space-y-5">
              <div className="flex">
                <form>
                  <InputGroup>
                    <InputGroupInput
                      placeholder="Buscar por código"
                      className="md:min-w-68"
                      onChange={(e) =>
                        onDebounceBusqueda(`%${e.target.value}%`)
                      }
                    />
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
                emptyTitle={
                  tab === "solventes"
                    ? "No hay unidades solventes"
                    : undefined
                }
                emptyDescription={
                  tab === "solventes"
                    ? "Todas las unidades tienen deudas pendientes"
                    : undefined
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
          )}
        </Tabs>
      </section>
    </>
  );
}
