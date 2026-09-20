import { EstadoDeProyecto } from "@/providers/graphql/graphql";
import { Badge } from "./ui/badge";

const classmap: Record<EstadoDeProyecto, string> = {
  [EstadoDeProyecto.Activo]: "bg-green-100 text-green-700",
  [EstadoDeProyecto.Cerrado]: "bg-slate-100 text-slate-600",
  [EstadoDeProyecto.Borrador]: "bg-yellow-100 text-yellow-700",
};

interface EstadoProyectoTagProps {
  state: EstadoDeProyecto;
}

export function EstadoProyectoTag({ state }: EstadoProyectoTagProps) {
  return <Badge className={classmap[state]}>{state}</Badge>;
}
