import { BarChart3 } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";

/**
 * Placeholder hasta que existan las consultas de reportes.
 *
 * La ruta ya estaba en el sidebar y en el bottom sheet, así que el enlace
 * prometía una pantalla que no existía. Ver `ComingSoon`.
 */
export default function ReportesPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Reportes"
      description="Esta sección estará disponible próximamente. Por ahora no hay reportes para consultar."
    />
  );
}