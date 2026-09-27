import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const COLORES_AVATAR: Array<[string, string]> = [
  ["bg-rose-100", "text-rose-700"],
  ["bg-orange-100", "text-orange-700"],
  ["bg-amber-100", "text-amber-700"],
  ["bg-green-100", "text-green-700"],
  ["bg-teal-100", "text-teal-700"],
  ["bg-sky-100", "text-sky-700"],
  ["bg-blue-100", "text-blue-700"],
  ["bg-violet-100", "text-violet-700"],
  ["bg-fuchsia-100", "text-fuchsia-700"],
];

function obtenerIniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter((parte) => parte.length > 0)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function obtenerColorAvatar(nombre: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORES_AVATAR[Math.abs(hash) % COLORES_AVATAR.length];
}

interface AvatarInicialesProps extends React.ComponentProps<typeof Avatar> {
  nombre: string;
  shape?: "circle" | "rounded";
}

export function AvatarIniciales({
  nombre,
  shape = "rounded",
  className,
  ...props
}: AvatarInicialesProps) {
  const [bg, text] = obtenerColorAvatar(nombre);

  return (
    <Avatar
      className={cn(
        bg,
        className,
        "border-none after:border-none",
        shape === "rounded" && "rounded-xl after:rounded-xl"
      )}
      size="lg"
      {...props}
    >
      <AvatarFallback
        className={cn(
          "bg-transparent",
          text,
          shape === "rounded" && "rounded-xl"
        )}
      >
        {obtenerIniciales(nombre)}
      </AvatarFallback>
    </Avatar>
  );
}
