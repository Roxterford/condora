"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultadosPorPagina } from "./resultados-por-pagina";

export interface PaginacionFooterProps {
  currentPage: number;
  totalPages: number;
  limit: number;
  onLimitChange: (limit: number) => void;
  onPageChange: (page: number) => void;
}

export function PaginacionFooter({
  currentPage,
  totalPages,
  limit,
  onLimitChange,
  onPageChange,
}: PaginacionFooterProps) {
  /*
   * Este pie lo comparten todas las tablas. Con una sola fila y `justify-between`
   * el grupo de la derecha no entraba en 375px y se salía de la pantalla, así
   * que en móvil el texto y los controles bajan a filas separadas.
   */
  return (
    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        Página <span className="font-bold">{currentPage}</span> de{" "}
        <span className="font-bold">{totalPages}</span>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <ResultadosPorPagina limit={limit} onLimitChange={onLimitChange} />
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Página siguiente"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
