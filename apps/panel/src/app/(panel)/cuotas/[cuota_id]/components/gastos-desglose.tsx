"use client";

import { useState } from "react";
import {
  DesgloseDeGastoItem,
  DesgloseDeGastos,
} from "@/features/administracion/components/desglose_de_gastos";
import {
  GastoSidebar,
  GastoSidebarData,
} from "@/features/administracion/components/gasto_sidebar/gasto-sidebar";
import { useOverlay } from "@/hooks/useOverlay";

export function GastosDesglose({ gastos }: { gastos: DesgloseDeGastoItem[] }) {
  const [selectedGasto, setSelectedGasto] = useState<GastoSidebarData | null>(
    null,
  );
  const gastoSidebar = useOverlay();

  const handleGastoPress = (gasto: DesgloseDeGastoItem) => {
    setSelectedGasto({
      id: gasto.operacion,
      concepto: gasto.concepto,
      monto_total: gasto.total,
      fecha: gasto.fecha,
      tasa: gasto.tasa,
      proveedor: gasto.proveedor,
    });
    gastoSidebar.open();
  };

  return (
    <>
      <DesgloseDeGastos
        data={gastos}
        showActions={false}
        onGastoPress={handleGastoPress}
      />
      <GastoSidebar
        data={selectedGasto ?? undefined}
        {...gastoSidebar.overlayProps}
      />
    </>
  );
}
