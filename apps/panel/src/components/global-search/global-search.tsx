"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Factory,
  Home,
  LayoutDashboard,
  Newspaper,
  Search,
  User,
  Wrench,
} from "lucide-react";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { money } from "@/lib/money-display";
import { useGlobalSearch, useRecentSearches } from "./global-search-hook";
import {
  GlobalSearchContent,
  type GlobalSearchState,
} from "./global-search-content";
import type { ResultRow } from "./search-result-row";
import {
  accionesDestacadas,
  buscarAcciones,
  type AccionSistema,
} from "./buscar-acciones";

type RowBase = {
  key: string;
  groupLabel: string;
  icon: ResultRow["icon"];
  title: string;
  meta: string;
  typeLabel: string;
  mock?: boolean;
  mockHint?: string;
  trackSearch?: boolean;
  onClick: () => void;
};

const EMPTY_ROWS: ResultRow[] = [];

function formatFecha(fecha: Date | string): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return String(fecha);
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function accionARow(
  accion: AccionSistema,
  go: (path: string) => void,
): ResultRow {
  return {
    key: `accion-${accion.id}`,
    groupLabel: "Acciones",
    icon: <accion.icono />,
    title: accion.titulo,
    meta: accion.descripcion,
    typeLabel: "Acción",
    onClick: () => go(accion.ruta),
  };
}

type GlobalSearchOpenChangeDetails = {
  reason?: string;
  event?: Event;
  cancel?: () => void;
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const suppressFocusOpenRef = useRef(false);

  const suppressFocusOpen = useCallback(() => {
    suppressFocusOpenRef.current = true;
    window.setTimeout(() => {
      suppressFocusOpenRef.current = false;
    }, 150);
  }, []);

  const focusInput = useCallback(() => {
    wrapperRef.current?.querySelector("input")?.focus();
  }, []);

  const blurInput = useCallback(() => {
    wrapperRef.current?.querySelector("input")?.blur();
  }, []);
  const {
    debouncedTerm,
    isLoading,
    unidades,
    unidadesTotal,
    operaciones,
    operacionesTotal,
    proveedores,
    sujetos,
    totalCoincidencias,
  } = useGlobalSearch(query);
  const { recientes, agregarBusqueda } = useRecentSearches();

  const go = useCallback((path: string) => router.push(path), [router]);

  const handleOpenChange = useCallback(
    (next: boolean, details: GlobalSearchOpenChangeDetails) => {
      if (!next && details.reason === "outside-press") {
        const target = details.event?.target;
        if (target instanceof Node && wrapperRef.current?.contains(target)) {
          details.cancel?.();
          return;
        }
      }
      if (!next) suppressFocusOpen();
      setOpen(next);
    },
    [suppressFocusOpen],
  );

  const idleRows: ResultRow[] = useMemo(
    () => [
      {
        key: "seccion-dashboard",
        groupLabel: "Ir a",
        icon: <LayoutDashboard />,
        title: "Dashboard",
        meta: "Resumen general",
        typeLabel: "Sección",
        onClick: () => go("/dashboard"),
      },
      {
        key: "seccion-villas",
        groupLabel: "Ir a",
        icon: <Home />,
        title: "Villas",
        meta: "Unidades del condominio",
        typeLabel: "Sección",
        onClick: () => go("/villas"),
      },
      {
        key: "seccion-cuotas",
        groupLabel: "Ir a",
        icon: <Newspaper />,
        title: "Cuotas",
        meta: "Cuotas de administración",
        typeLabel: "Sección",
        onClick: () => go("/cuotas"),
      },
      {
        key: "seccion-operaciones",
        groupLabel: "Ir a",
        icon: <ArrowLeftRight />,
        title: "Operaciones",
        meta: "Pagos y gastos",
        typeLabel: "Sección",
        onClick: () => go("/operaciones"),
      },
      {
        key: "seccion-admin",
        groupLabel: "Ir a",
        icon: <Wrench />,
        title: "Administración",
        meta: "Bandeja de eventos",
        typeLabel: "Sección",
        onClick: () => go("/admin/outbox"),
      },
    ],
    [go],
  );

  const idleAcciones: ResultRow[] = useMemo(
    () => accionesDestacadas().map((accion) => accionARow(accion, go)),
    [go],
  );

  const trimmed = query.trim();

  const accionRows: ResultRow[] = useMemo(
    () => buscarAcciones(trimmed).map((accion) => accionARow(accion, go)),
    [trimmed, go],
  );

  const resultRows: ResultRow[] = useMemo(() => {
    const rows: ResultRow[] = [];

    for (const unidad of unidades) {
      const titular = unidad.titular_primario?.display_name;
      rows.push({
        key: `unidad-${unidad.codigo}`,
        groupLabel: "Unidades",
        icon: <Home />,
        title: unidad.codigo,
        meta: `${titular ?? "Sin asignar"} · ${
          unidad.deuda > 0 ? "Pendiente" : "Solvente"
        }`,
        typeLabel: "Unidad",
        trackSearch: true,
        onClick: () => go(`/villas/${unidad.codigo}`),
      });
    }

    for (const sujeto of sujetos) {
      rows.push({
        key: sujeto.id,
        groupLabel: "Sujetos",
        icon: <User />,
        title: sujeto.display_name,
        meta: `${sujeto.rol} · ${sujeto.unidad_codigo}`,
        typeLabel: "Sujeto",
        mock: true,
        mockHint:
          "Dato de ejemplo: la búsqueda de propietarios está en desarrollo y no consulta la API todavía.",
        trackSearch: true,
        onClick: () => go(`/villas/${sujeto.unidad_codigo}`),
      });
    }

    for (const operacion of operaciones) {
      const conUnidad =
        operacion.__typename === "Pago" ? operacion.unidad?.codigo : undefined;
      rows.push({
        key: `operacion-${operacion.operacion ?? operacion.concepto}`,
        groupLabel: "Operaciones",
        icon: <ArrowLeftRight />,
        title: conUnidad
          ? `${operacion.concepto} · ${conUnidad}`
          : operacion.concepto,
        meta: `${formatFecha(operacion.fecha)} · ${money(
          operacion.monto,
          operacion.moneda,
        )}`,
        typeLabel: "Operación",
        trackSearch: true,
        onClick: () => go("/operaciones"),
      });
    }

    for (const proveedor of proveedores) {
      rows.push({
        key: `proveedor-${proveedor.id}`,
        groupLabel: "Proveedores",
        icon: <Factory />,
        title: proveedor.nombre,
        meta: `RIF ${proveedor.rif ?? "—"}`,
        typeLabel: "Proveedor",
        trackSearch: true,
        onClick: () => go("/operaciones"),
      });
    }

    return rows;
  }, [unidades, sujetos, operaciones, proveedores, go]);

  const idle = trimmed.length === 0;
  const debouncePendiente = idle ? false : trimmed !== debouncedTerm;

  const idleRowsCombined: ResultRow[] = useMemo(
    () => [...idleRows, ...idleAcciones],
    [idleRows, idleAcciones],
  );

  const resultRowsCombined: ResultRow[] = useMemo(
    () => [...accionRows, ...resultRows],
    [accionRows, resultRows],
  );

  let rows: ResultRow[];
  let state: GlobalSearchState = "idle";
  if (idle) {
    rows = idleRowsCombined;
  } else if (debouncePendiente || isLoading) {
    rows = accionRows;
    state = "loading";
  } else if (accionRows.length > 0 || resultRows.length > 0) {
    rows = resultRowsCombined;
    state = "results";
  } else {
    rows = EMPTY_ROWS;
    state = "empty";
  }

  useEffect(() => {
    setActiveIndex(0);
  }, [rows]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setOpen(true);
        requestAnimationFrame(focusInput);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusInput]);

  const selectRow = useCallback(
    (row: ResultRow) => {
      suppressFocusOpen();
      setOpen(false);
      blurInput();
      if (row.trackSearch) agregarBusqueda(trimmed);
      row.onClick();
    },
    [suppressFocusOpen, blurInput, agregarBusqueda, trimmed],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) setOpen(true);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        rows.length ? (i - 1 + rows.length) % rows.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows.length) selectRow(rows[activeIndex] ?? rows[0]!);
    } else if (e.key === "Escape") {
      suppressFocusOpen();
      e.currentTarget.blur();
      setOpen(false);
    }
  };

  const aplicarReciente = (value: string) => {
    setQuery(value);
    requestAnimationFrame(focusInput);
  };

  const reset = () => {
    setQuery("");
    requestAnimationFrame(focusInput);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div ref={wrapperRef} className="relative w-full max-w-[420px]">
        <InputGroup className="h-12 rounded-2xl border-gray-200 bg-gray-50 dark:bg-input/30">
          <InputGroupAddon align="inline-start" className="pl-4 pr-1">
            <Search className="size-[18px] text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suppressFocusOpenRef.current) return;
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar datos, personas o funcionalidades…"
            className="h-12 text-sm"
            aria-label="Búsqueda global"
          />
          <InputGroupAddon align="inline-end" className="pr-3 pl-1">
            <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <PopoverContent
        anchor={wrapperRef}
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={8}
        initialFocus={false}
        finalFocus={false}
        className="gap-0 w-[min(560px,calc(100vw-2rem))] max-h-[min(480px,calc(100dvh-8rem))] overflow-hidden rounded-xl p-0 shadow-lg"
      >
        <GlobalSearchContent
          state={state}
          query={trimmed}
          rows={rows}
          activeIndex={activeIndex}
          onHoverIndex={setActiveIndex}
          onSelectRow={selectRow}
          recientes={recientes}
          onRecienteClick={aplicarReciente}
          totalCoincidencias={
            idle ? totalCoincidencias : totalCoincidencias + accionRows.length
          }
          onReset={reset}
        />
      </PopoverContent>
    </Popover>
  );
}
