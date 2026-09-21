"use client";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { money } from "@/lib/money-display";
import {
  OperacionesPageQuery,
  OperacionType,
} from "@/providers/graphql/graphql";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { useDrawer } from "@/contexts/drawer-context";
import {
  OperacionDetalle,
  acortarId,
} from "@/components/operacion-detalle/operacion-detalle";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, MoveDownRight, MoveUpRight, SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/table-skeleton/table-skeleton";

const UnidadTitularQuery = graphql(/* GraphQL */ `
  query UnidadTitular($codigo: String!) {
    unidad: obtenerUnidadPorCodigo(codigo: $codigo) {
      codigo
      titular_primario {
        __typename
        ... on Sujeto {
          id
          display_name
          cedula
          email
          telefono
        }
      }
    }
  }
`);

export function OperacionesTable({
  data,
  loading,
  loadingRows = 5,
}: {
  data: OperacionesPageQuery["operaciones"]["data"];
  loading?: boolean;
  loadingRows?: number;
}) {
  const { open } = useDrawer();

  const verDetalles = (operacion: (typeof data)[number]) => {
    const options = {
      title: "Información de la operación",
      titleBadge: (
        <Badge
          variant="secondary"
          className="font-mono text-[10px] font-medium tracking-wide"
        >
          {acortarId(operacion.operacion)}
        </Badge>
      ),
      side: "right" as const,
      size: 440,
    };

    if (operacion.__typename === "Pago") {
      open({
        ...options,
        loader: async () => {
          const result = await execute(UnidadTitularQuery, {
            codigo: operacion.unidad.codigo,
          });
          return (
            <OperacionDetalle
              operacion={operacion}
              unidadTitular={result.data?.unidad?.titular_primario}
            />
          );
        },
      });
      return;
    }

    open({
      ...options,
      content: <OperacionDetalle operacion={operacion} />,
    });
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="table__head">Concepto</TableHead>
          <TableHead className="table__head">Referencia</TableHead>
          <TableHead className="table__head | text-center">Tipo</TableHead>
          <TableHead className="table__head">Monto</TableHead>
          <TableHead className="table__head">Método</TableHead>
          <TableHead className="table__head">Fecha</TableHead>
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
                  return (
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-7 rounded-md" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  );
                case 1:
                  return (
                    <div className="grid gap-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  );
                case 2:
                  return <Skeleton className="mx-auto h-5 w-14 rounded-full" />;
                case 3:
                  return <Skeleton className="h-4 w-16" />;
                case 4:
                  return <Skeleton className="h-4 w-20" />;
                case 5:
                  return <Skeleton className="h-4 w-32" />;
                default:
                  return <Skeleton className="ml-auto size-4" />;
              }
            }}
          />
        ) : data.length ? (
          data.map((operacion) => (
            <TableRow
              key={operacion.operacion}
              onClick={() => verDetalles(operacion)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex gap-3">
                  <VarianteDeOperacionIcon variant={operacion.__typename} />
                  {operacion.concepto}
                </div>
              </TableCell>
              <TableCell>
                <VarianteDeOperacionReferencia data={operacion} />
              </TableCell>
              <TableCell className="text-center">
                <VarianteDeOperacionTag variant={operacion.__typename} />
              </TableCell>
              <TableCell>{money(operacion.monto, operacion.moneda)}</TableCell>
              <TableCell>{operacion.metodo}</TableCell>
              <TableCell>
                {format(operacion.fecha, "d 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </TableCell>
              <TableCell className="text-end">
                <ChevronRight
                  className="ml-auto text-muted-foreground"
                  size={16}
                />
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7}>
              <NotFoundState />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function VarianteDeOperacionReferencia({
  data,
}: {
  data: OperacionesPageQuery["operaciones"]["data"][0];
}) {
  let maintext = "-";

  if (data.__typename === "GastoACondominio") maintext = "Condominio";
  if (data.__typename === "GastoAProveedor") maintext = data.proveedor.nombre;
  if (data.__typename === "Pago") maintext = `Unidad ${data.unidad.codigo}`;

  return (
    <div>
      <p className="font-medium">{maintext}</p>
      <p className="text-sm text-gray-500">{data.operacion}</p>
    </div>
  );
}

function VarianteDeOperacionIcon({
  variant,
}: {
  variant: OperacionType["__typename"];
}) {
  switch (variant) {
    case "GastoACondominio":
    case "GastoAProveedor":
      return (
        <Badge className="bg-yellow-200 text-yellow-700">
          <MoveUpRight />
        </Badge>
      );
    case "Pago":
      return (
        <Badge className="bg-green-100 text-green-700">
          <MoveDownRight />
        </Badge>
      );
  }

  return <Badge>Indeterminado</Badge>;
}

function VarianteDeOperacionTag({
  variant,
}: {
  variant: OperacionType["__typename"];
}) {
  switch (variant) {
    case "GastoACondominio":
    case "GastoAProveedor":
      return <Badge className="bg-yellow-200 text-yellow-700">Gasto</Badge>;
    case "Pago":
      return <Badge className="bg-green-100 text-green-700">Pago</Badge>;
  }

  return <Badge>Indeterminado</Badge>;
}

function NotFoundState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>Resultados no enctrados</EmptyTitle>
        <EmptyDescription>Intenta una busqueda diferente</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
