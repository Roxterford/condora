import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

function arrayFrom(length: number) {
  return Array.from({ length }, (_, index) => index);
}

export function TableSkeleton({
  rows = 5,
  columns = 1,
  cell,
}: {
  rows?: number;
  columns?: number;
  cell?: (col: number) => ReactNode;
}) {
  return arrayFrom(rows).map((row) => (
    <TableRow key={row}>
      {arrayFrom(columns).map((col) => (
        <TableCell key={col}>
          {cell ? cell(col) : <Skeleton className="h-4 w-full" />}
        </TableCell>
      ))}
    </TableRow>
  ));
}