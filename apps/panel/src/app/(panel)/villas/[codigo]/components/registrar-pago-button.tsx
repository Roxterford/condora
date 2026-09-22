"use client";

import { Button } from "@/components/ui/button";
import { RegistrarPagoOverlay } from "@/features/administracion/components/registrar-pago-overlay";
import { useOverlay } from "@/hooks/useOverlay";
import { CreditCardPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { VillaPageQuery } from "@/providers/graphql/graphql";

export function RegistrarPagoButton({
  unidad,
}: {
  unidad: VillaPageQuery["unidad"];
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const registrarPago = useOverlay({
    closeOnDone: true,
    onDone() {
      queryClient.invalidateQueries({ queryKey: ["villas"] });
      router.refresh();
    },
  });

  return (
    <>
      <Button onClick={registrarPago.open}>
        <CreditCardPlus /> Registrar pago
      </Button>
      <RegistrarPagoOverlay
        {...registrarPago.overlayProps}
        unidad={unidad}
        initialFocus="monto"
      />
    </>
  );
}
