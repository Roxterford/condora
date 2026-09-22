"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import {
  AlertCircle,
  ArrowLeftRight,
  CircleDollarSign,
  CreditCardMinus,
  CreditCardPlus,
  DollarSign,
  Receipt,
  Search,
} from "lucide-react";
import { Paginacion } from "@/components/paginacion/paginacion";
import { PaginacionFooter } from "@/components/paginacion/pagination-footer";
import { RESULTADOS_POR_PAGINA } from "@/components/paginacion/resultados-por-pagina";
import { OperacionesTable } from "./operaciones-table";
import { RegistrarPagoOverlay } from "@/features/administracion/components/registrar-pago-overlay";
import { useOverlay } from "@/hooks/useOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/ui/StatCard";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/useDebounce";
import { useSmoothScrollToTop } from "@/hooks/useSmoothScrollToTop";
import { useState } from "react";
import { RegistrarGastoOverlay } from "@/features/administracion/components/registrar_gasto_overlay";
import { OperacionFilter } from "@/providers/graphql/graphql";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const PageQuery = graphql(/* GraphQL */ `
  query OperacionesPage($page: Int!, $filtro: OperacionFilter, $limit: Int!) {
    proveedores: obtenerProveedores {
      id
      nombre
    }

    operaciones: obtenerOperaciones(
      paginador: { limit: $limit, page: $page }
      filtro: $filtro
    ) {
      data {
        __typename

        ... on IOperacion {
          fecha
          operacion
          concepto
          metodo
          monto
          moneda
          registro
          tasa
          total
        }

        ... on GastoAProveedor {
          proveedor {
            nombre
            rif
            telefono
            email
          }
        }

        ... on Pago {
          unidad {
            id
            codigo
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

const TIPOS_POR_TAB: Record<string, string | undefined> = {
  pagos: "CREDITO",
  gastos: "DEBITO",
};

export function OperacionesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const limitParam = Number(searchParams.get("limit"));
  const limit = RESULTADOS_POR_PAGINA.includes(
    limitParam as (typeof RESULTADOS_POR_PAGINA)[number],
  )
    ? limitParam
    : RESULTADOS_POR_PAGINA[1];
  const [busquda, setBusqueda] = useState("%%");
  const [tab, setTab] = useState("todas");
  const onDebounceBusqueda = useDebounce(setBusqueda);
  const scrollToTop = useSmoothScrollToTop();

  const tipo = TIPOS_POR_TAB[tab];

  const busquedaFiltro: OperacionFilter = {
    or: [
      { concepto: { like: busquda } },
      { unidad: { like: busquda } },
      { proveedor_nombre: { like: busquda } },
    ],
  };

  const filtro: OperacionFilter = tipo
    ? { and: [{ tipo: { eq: tipo } }, busquedaFiltro] }
    : busquedaFiltro;

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["operaciones", tab, busquda, currentPage, limit],
    queryFn: async () => {
      const result = await execute(PageQuery, {
        page: currentPage,
        filtro,
        limit,
      });
      return result.data;
    },
    placeholderData: keepPreviousData,
    enabled: tab !== "transacciones",
  });

  const operaciones = data?.operaciones;
  const totalPages = operaciones?.pages ?? 1;

  const setPage = (page: number) => {
    scrollToTop();
    router.push(`/operaciones?page=${page}&limit=${limit}`, { scroll: false });
  };

  const setLimit = (nuevoLimit: number) => {
    router.push(`/operaciones?limit=${nuevoLimit}`);
  };

  const onTabChange = (value: string) => {
    setTab(value);
    router.push("/operaciones");
  };

  const registrarPago = useOverlay({
    closeOnDone: true,
    onDone() {
      refetch();
    },
  });

  const registrarGasto = useOverlay({
    closeOnDone: true,
    onDone() {
      refetch();
    },
  });

  return (
    <>
      <header className="flex items-end justify-between">
        <div>
          <h1>Operaciones</h1>
          <p className="page-description">
            Finanzas · Movimientos, pagos y gastos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={registrarGasto.open}>
            <CreditCardMinus /> Gasto
          </Button>
          <Button variant="outline">
            <ArrowLeftRight /> Transacción
          </Button>
          <Button onClick={registrarPago.open}>
            <CreditCardPlus /> Pago
          </Button>
        </div>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        <StatCard
          title="Ingresos"
          value="$440"
          subtitle="3 pagos · Agosto"
          color="bg-green-100"
          icon={<DollarSign className="text-green-600" />}
        />

        <StatCard
          title="Egresos"
          value="$800"
          subtitle="2 gastos"
          color="bg-yellow-100"
          icon={<CircleDollarSign className="text-yellow-600" />}
        />

        <StatCard
          title="Neto del periodo"
          value="−$360"
          subtitle="ingresos − egresos"
          color="bg-rose-100"
          icon={<AlertCircle className="text-rose-600" />}
        />

        <StatCard
          title="Operaciones"
          value="6"
          subtitle="incl. 1 compensación"
          color="bg-cyan-100"
          icon={<Receipt className="text-cyan-600" />}
        />
      </section>
      <section className="mt-5">
        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList variant="line">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="gastos">Gastos</TabsTrigger>
            <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="space-y-5">
            {tab === "transacciones" ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ArrowLeftRight />
                  </EmptyMedia>
                  <EmptyTitle>Transacciones</EmptyTitle>
                  <EmptyDescription>
                    Las transacciones agrupan operaciones relacionadas, como las
                    compensaciones. Esta sección estará disponible próximamente.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div className="flex">
                  <form>
                    <InputGroup>
                      <InputGroupInput
                        placeholder="Buscar por consepto, villa o proveedor"
                        className="md:min-w-68"
                        onChange={(e) =>
                          onDebounceBusqueda(`%${e.target.value}%`)
                        }
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
                <OperacionesTable
                  data={operaciones?.data ?? []}
                  loading={isFetching}
                  loadingRows={limit}
                />
                <PaginacionFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  limit={limit}
                  onLimitChange={setLimit}
                  onPageChange={setPage}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>
      <RegistrarPagoOverlay {...registrarPago.overlayProps} />
      <RegistrarGastoOverlay
        {...registrarGasto.overlayProps}
        proveedores={data?.proveedores ?? []}
      />
    </>
  );
}
