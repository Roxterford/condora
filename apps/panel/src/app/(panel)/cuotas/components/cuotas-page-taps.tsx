"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Paginacion } from "@/components/paginacion/paginacion";
import {
  CuotasTable,
  CuotasTableProps,
} from "@/features/administracion/components/cuotas_table/cuotas_table";

export type CuotasPageTab = "todas" | "regulares" | "especiales";

export const CUOTAS_TABS: { value: CuotasPageTab; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "regulares", label: "Mensualidades" },
  { value: "especiales", label: "Cuotas Especiales" },
];

export interface CuotasPageTapsProps {
  tab: CuotasPageTab;
  onTabChange: (value: CuotasPageTab) => void;
  conteoPorTab: Map<CuotasPageTab, number | undefined>;
  cuotas: CuotasTableProps["data"];
  loading?: boolean;
  loadingRows?: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CuotasPageTaps({
  tab,
  onTabChange,
  conteoPorTab,
  cuotas,
  loading,
  loadingRows,
  currentPage,
  totalPages,
  onPageChange,
}: CuotasPageTapsProps) {
  return (
    <>
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as CuotasPageTab)}>
        <TabsList variant="line">
          {CUOTAS_TABS.map((t) => (
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
      </Tabs>
      <Paginacion
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className="justify-end"
      />
      <CuotasTable data={cuotas} loading={loading} loadingRows={loadingRows} />
    </>
  );
}
