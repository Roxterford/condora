"use client";

import { useState } from "react";

import { WakeScreen } from "@/components/wake-screen/wake-screen";

/**
 * Puente entre el layout raíz (Server Component) y la pantalla de encendido
 * (Client Component).
 *
 * El layout decide en el servidor si la API está despierta y solo entonces
 * arma la pantalla, así que el estado inicial nunca cambia entre el servidor y
 * el cliente y no hay riesgo de desajuste de hidratación.
 */
export function WakeGate({ armed }: { armed: boolean }) {
  const [visible, setVisible] = useState(armed);

  if (!visible) {
    return null;
  }

  return <WakeScreen onDismiss={() => setVisible(false)} />;
}
