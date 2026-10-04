import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  valueClassName?: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
}

export default function StatCard({
  title,
  value,
  valueClassName,
  subtitle,
  icon,
  color,
}: StatCardProps) {
  return (
    /* `flex-col` en móvil: en `sm+` el icono va a la derecha y la tarjeta
       mantiene la altura mínima. Apilado evita que el `min-h` se convierta en
       espacio vacío cuando el número es largo. */
    <div className="flex min-h-[125px] flex-col items-start justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-4 sm:flex-row sm:p-6">
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{title}</p>

        <h2
          className={cn(
            "mt-3 text-3xl font-bold break-words text-gray-800 sm:text-4xl",
            valueClassName,
          )}
        >
          {value}
        </h2>

        <p className="mt-3 text-sm text-gray-400">{subtitle}</p>
      </div>

      <div
        className={cn(
          "flex size-14 shrink-0 items-center justify-center rounded-2xl",
          color,
        )}
      >
        <div className="scale-110">{icon}</div>
      </div>
    </div>
  );
}
