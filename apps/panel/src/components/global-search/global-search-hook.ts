"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { execute } from "@/providers/graphql/execute";
import { useDebounce } from "@/hooks/useDebounce";
import { buscarMockSujetos, type MockSujeto } from "./mock-sujetos";

export const LIMITE_GLOBAL_SEARCH = 5;

const GLOBAL_SEARCH_QUERY_STRING = /* GraphQL */ `
  query GlobalSearch($busqueda: String!, $limit: Int!) {
    unidades: obtenerUnidades(
      filtro: { codigo: { like: $busqueda } }
      paginador: { limit: $limit, page: 1 }
    ) {
      data {
        codigo
        estado
        deuda
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
      total
    }

    operaciones: obtenerOperaciones(
      paginador: { limit: $limit, page: 1 }
      filtro: {
        or: [
          { concepto: { like: $busqueda } }
          { unidad: { like: $busqueda } }
          { proveedor_nombre: { like: $busqueda } }
        ]
      }
    ) {
      data {
        __typename
        ... on IOperacion {
          fecha
          operacion
          concepto
          monto
          moneda
        }
        ... on Pago {
          unidad {
            id
            codigo
          }
        }
        ... on GastoAProveedor {
          proveedor {
            nombre
          }
        }
      }
      total
    }

    proveedores: obtenerProveedores {
      id
      nombre
      rif
    }

    cuotas: obtenerCuotas(
      filtro: { nombre: { ilike: $busqueda } }
      paginador: { limit: $limit, page: 1 }
    ) {
      data {
        __typename
        ... on Cuota {
          id
          display_name
          monto
          mes
          anio
        }
        ... on CuotaEspecial {
          id
          display_name
          monto
          detalles {
            titulo
          }
        }
      }
      total
    }
  }
`;

interface GlobalSearchResultData {
  unidades: {
    data: Array<{
      codigo: string;
      estado: string;
      deuda: number;
      titular_primario: {
        __typename: string;
        id?: string;
        cedula?: string;
        display_name?: string;
        nombres?: string;
        apellidos?: string;
        razon_social?: string;
      } | null;
    }>;
    total: number;
  };
  operaciones: {
    data: Array<{
      __typename: string;
      fecha?: string;
      operacion?: string;
      concepto?: string;
      monto?: number;
      moneda?: string;
      unidad?: {
        id: string;
        codigo: string;
      };
      proveedor?: {
        nombre: string;
      };
    }>;
    total: number;
  };
  proveedores: Array<{
    id: string;
    nombre: string;
    rif: string | null;
  }>;
  cuotas: {
    data: Array<{
      __typename: "Cuota" | "CuotaEspecial";
      id: string;
      display_name: string;
      monto: number;
      mes: number | null;
      anio: number | null;
      detalles: {
        titulo: string;
      } | null;
    }>;
    total: number;
  };
}

type UnidadDeBusqueda = NonNullable<GlobalSearchResultData["unidades"]["data"]>[number];
type OperacionDeBusqueda = NonNullable<GlobalSearchResultData["operaciones"]["data"]>[number];
type ProveedorDeBusqueda = GlobalSearchResultData["proveedores"][number];
export type CuotaDeBusqueda = NonNullable<GlobalSearchResultData["cuotas"]["data"]>[number];

const STORAGE_KEY = "condora:busquedas-recientes";

export function useRecentSearches(max = 5) {
  const [recientes, setRecientes] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setRecientes(JSON.parse(raw) as string[]);
    } catch {
      // almacenamiento no disponible
    }
  }, []);

  const agregarBusqueda = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return;
      setRecientes((prev) => {
        const next = [
          v,
          ...prev.filter(
            (x) => x.toLocaleLowerCase() !== v.toLocaleLowerCase(),
          ),
        ].slice(0, max);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // almacenamiento no disponible
        }
        return next;
      });
    },
    [max],
  );

  return { recientes, agregarBusqueda };
}

export type GlobalSearchData = {
  debouncedTerm: string;
  isLoading: boolean;
  unidades: UnidadDeBusqueda[];
  unidadesTotal: number;
  operaciones: OperacionDeBusqueda[];
  operacionesTotal: number;
  proveedores: ProveedorDeBusqueda[];
  cuotas: CuotaDeBusqueda[];
  cuotasTotal: number;
  sujetos: MockSujeto[];
  totalCoincidencias: number;
};

export function useGlobalSearch(term: string): GlobalSearchData {
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const onDebounce = useDebounce(setDebouncedTerm);

  useEffect(() => {
    onDebounce(term);
  }, [term, onDebounce]);

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", debouncedTerm],
    enabled: debouncedTerm.trim().length > 0,
    queryFn: async () => {
      const result = await execute(GLOBAL_SEARCH_QUERY_STRING, {
        busqueda: `%${debouncedTerm.trim()}%`,
        limit: LIMITE_GLOBAL_SEARCH,
      });
      return result.data as GlobalSearchResultData;
    },
    placeholderData: keepPreviousData,
  });

  const proveedores = useMemo(() => {
    const todos = data?.proveedores ?? [];
    const q = debouncedTerm.trim().toLocaleLowerCase("es");
    if (!q) return [];
    return todos
      .filter((p) => p.nombre.toLocaleLowerCase("es").includes(q))
      .slice(0, LIMITE_GLOBAL_SEARCH);
  }, [data?.proveedores, debouncedTerm]);

  const sujetos = useMemo(
    () => buscarMockSujetos(debouncedTerm, LIMITE_GLOBAL_SEARCH),
    [debouncedTerm],
  );

  const cuotas = useMemo(() => {
    const todas = data?.cuotas?.data ?? [];
    const q = debouncedTerm.trim().toLocaleLowerCase("es");
    if (!q) return todas.slice(0, LIMITE_GLOBAL_SEARCH);
    return todas
      .filter((c) => c.display_name.toLocaleLowerCase("es").includes(q))
      .slice(0, LIMITE_GLOBAL_SEARCH);
  }, [data?.cuotas, debouncedTerm]);

  const unidadesTotal = data?.unidades?.total ?? 0;
  const operacionesTotal = data?.operaciones?.total ?? 0;
  const cuotasTotal = data?.cuotas?.total ?? 0;
  const totalCoincidencias =
    unidadesTotal + operacionesTotal + proveedores.length + cuotasTotal + sujetos.length;

  return {
    debouncedTerm: debouncedTerm.trim(),
    isLoading,
    unidades: data?.unidades?.data ?? [],
    unidadesTotal,
    operaciones: data?.operaciones?.data ?? [],
    operacionesTotal,
    proveedores,
    cuotas,
    cuotasTotal,
    sujetos,
    totalCoincidencias,
  };
}