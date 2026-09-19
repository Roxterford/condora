"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gasto, Proveedor } from "@/providers/graphql/graphql";
import { MoreHorizontal, ReceiptText } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { money } from "@/lib/money-display";

export interface DesgloseDeGastoItem extends Pick<
  Gasto,
  "operacion" | "concepto" | "moneda" | "monto" | "fecha" | "tasa" | "total"
> {
  proveedor: Pick<Proveedor, "id" | "nombre" | "rif" | "telefono" | "email">;
}
export interface DesgloseDeGastosProps {
  data: DesgloseDeGastoItem[];
  showActions?: boolean;
  onGastoPress?: (gasto: DesgloseDeGastoItem) => void;
  onRemove?: (gasto: DesgloseDeGastoItem) => void;
}

export function DesgloseDeGastos({
  data: gastos,
  onGastoPress: onGastoClick,
  showActions = true,
  onRemove,
}: DesgloseDeGastosProps) {
  const remove = (gasto: DesgloseDeGastoItem) => {
    onRemove?.(gasto);
  };

  const total = gastos.reduce((acc, g) => acc + g.total, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="table__head">ID</TableHead>
          <TableHead className="table__head">Concepto</TableHead>
          <TableHead className="table__head">Fecha</TableHead>
          <TableHead className="table__head">Proveedor</TableHead>
          <TableHead className="table__head text-right">Monto</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {gastos.length ? (
          gastos.map((gasto) => (
            <TableRow key={gasto.operacion}>
              <TableCell className="font-medium">
                <label className="link" onClick={() => onGastoClick?.(gasto)}>
                  {gasto.operacion.slice(-6)}
                </label>
              </TableCell>
              <TableCell>{gasto.concepto}</TableCell>
              <TableCell>{gasto.fecha.toLocaleDateString("es")}</TableCell>
              <TableCell>{gasto.proveedor.nombre}</TableCell>
              <TableCell className="text-right tabular-nums">
                {money(gasto.total)}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => remove(gasto)}
                      >
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={showActions ? 6 : 5}>
              <EmptyState />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
      {gastos.length > 0 && (
        <TableFooter className="bg-transparent">
          <TableRow>
            <TableCell colSpan={4} className="text-base font-medium">Total</TableCell>
            <TableCell className="text-right text-base font-semibold tabular-nums">
              {money(total)}
            </TableCell>
            {showActions && <TableCell />}
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}

function EmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ReceiptText />
        </EmptyMedia>
        <EmptyTitle>Lista vacía</EmptyTitle>
        <EmptyDescription>Añade algo al verlos aquí</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
