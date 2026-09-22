"use client";

import { Button } from "@/components/ui/button";
import { useOverlay } from "@/hooks/useOverlay";
import { Pencil } from "lucide-react";
import { EditarTitularOverlay, TitularSujeto } from "./editar-titular-overlay";

export function EditarTitularButton({ titular }: { titular: TitularSujeto }) {
  const editarTitular = useOverlay({ closeOnDone: true });

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Editar titular"
        onClick={editarTitular.open}
      >
        <Pencil />
      </Button>
      <EditarTitularOverlay {...editarTitular.overlayProps} titular={titular} />
    </>
  );
}
