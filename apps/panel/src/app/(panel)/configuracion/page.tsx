import { Settings } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";

/**
 * Placeholder hasta que exista la pantalla de configuración.
 *
 * La ruta ya estaba en el sidebar y en el bottom sheet, así que el enlace
 * prometía una pantalla que no existía. Ver `ComingSoon`.
 */
export default function ConfiguracionPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configuración"
      description="Esta sección estará disponible próximamente. Mientras tanto, la administración se sigue haciendo desde Administración y Outbox."
    />
  );
}