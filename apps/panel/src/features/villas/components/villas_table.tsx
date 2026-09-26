import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Home, SearchX, Ellipsis, ChevronRight } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AvatarIniciales } from "@/components/avatar-iniciales/avatar-iniciales";
import { Titular, Unidad } from "@/providers/graphql/graphql";
import { EstadoUnidadTag } from "@/components/estado-unidad-tag";
import { money } from "@/lib/money-display";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/table-skeleton/table-skeleton";

export interface VillasTableData extends Pick<
  Unidad,
  "codigo" | "estado" | "wallet" | "deuda"
> {
  propietario?: Pick<Titular, "cedula" | "display_name">;
  estado_pagos: "solvente" | "pendiente";
  contacto: {
    email: string;
    telefono: string;
  };
}

export interface VillasTableProps {
  data: VillasTableData[];
  busqueda?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
  loadingRows?: number;
}
export function VillasTable({
  data,
  busqueda,
  emptyTitle,
  emptyDescription,
  loading,
  loadingRows = 5,
}: VillasTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="table__head">Código</TableHead>
          <TableHead className="table__head">Titular primario</TableHead>
          <TableHead className="table__head">Contacto</TableHead>
          <TableHead className="table__head">Estado</TableHead>
          <TableHead className="table__head">Solvencia</TableHead>
          <TableHead className="table__head text-end">Deuda total</TableHead>
          <TableHead className="table__head"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeleton
            rows={loadingRows}
            columns={7}
            cell={(col) => {
              switch (col) {
                case 0:
                  return <Skeleton className="h-4 w-14" />;
                case 1:
                  return (
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="grid gap-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  );
                case 2:
                  return (
                    <div className="grid gap-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  );
                case 3:
                  return <Skeleton className="h-5 w-14 rounded-full" />;
                case 4:
                  return <Skeleton className="h-5 w-20 rounded-full" />;
                case 5:
                  return <Skeleton className="ml-auto h-4 w-16" />;
                default:
                  return (
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-24 rounded-md" />
                      <Skeleton className="size-8 rounded-md" />
                    </div>
                  );
              }
            }}
          />
        ) : data.length ? (
          data.map((villa) => (
            <TableRow key={villa.codigo}>
              <TableCell>
                <Link className="link" href={"/villas/" + villa.codigo}>
                  {villa.codigo}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {villa.propietario ? (
                    <>
                      <AvatarIniciales nombre={villa.propietario.display_name} />
                      <div className="grid">
                        <span>{villa.propietario.display_name}</span>
                        <span className="text-gray-500 text-xs">
                          {villa.propietario.cedula}
                        </span>
                      </div>
                    </>
                  ) : (
                    <Ignore />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <p>{villa.contacto.telefono}</p>
                <span className="text-gray-500">{villa.contacto.email}</span>
              </TableCell>
              <TableCell>
                <EstadoUnidadTag state={villa.estado} />
              </TableCell>

              <TableCell>
                <Badge
                  className={
                    villa.estado_pagos === "pendiente"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }
                >
                  {villa.estado_pagos}
                </Badge>
              </TableCell>

              <TableCell className="text-end">
                {villa.deuda > 0 ? money(villa.deuda) : <Ignore />}
              </TableCell>

              <TableCell>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={
                      <Link href={["/villas", villa.codigo].join("/")}>
                        Ver detalles
                        <ChevronRight size={16} />
                      </Link>
                    }
                  />
                  <Button variant="ghost">
                    <Ellipsis />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7}>
              {busqueda ? (
                <NotFoundState />
              ) : (
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                />
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function Ignore() {
  return "-";
}

function EmptyState({
  title = "Lista vacía",
  description = "No hay unidades que mostrar aquí",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Home />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NotFoundState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>Resultados no encontrados</EmptyTitle>
        <EmptyDescription>Intenta una búsqueda diferente</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
