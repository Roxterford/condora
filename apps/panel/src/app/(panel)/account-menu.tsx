"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";

import { AvatarIniciales } from "@/components/avatar-iniciales/avatar-iniciales";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearAuthCookie } from "@/lib/auth-cookie";

type AccountMenuProps = {
  nombre: string;
  rol: string;
};

/**
 * Menú de cuenta para móvil.
 *
 * El bloque de identidad del `Header` se oculta bajo `md` porque no entra, así
 * que sin esto un usuario en teléfono no tiene forma de ver quién es ni de
 * cerrar sesión. En escritorio el `Header` sigue mostrando la identidad
 * inline y no monta este componente.
 */
export function AccountMenu({ nombre, rol }: AccountMenuProps) {
  const router = useRouter();

  function handleLogout() {
    clearAuthCookie();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-full md:hidden"
            aria-label="Menú de cuenta"
          >
            <AvatarIniciales nombre={nombre} className="size-9" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserRound className="size-4 shrink-0 text-gray-400" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-gray-800">
              {nombre}
            </span>
            <span className="truncate text-xs text-gray-400">{rol}</span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={
            <Link href="/configuracion" className="md:hidden">
              <Settings className="size-4" />
              Configuración
            </Link>
          }
        />

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Identidad visible en escritorio, sin menú. */
export function AccountIdentity({ nombre, rol }: AccountMenuProps) {
  return (
    <>
      <AvatarIniciales nombre={nombre} className="size-11" />

      <div className="hidden min-w-0 lg:block">
        <h3 className="truncate text-sm font-semibold text-gray-800">{nombre}</h3>
        <p className="truncate text-xs text-gray-400">{rol}</p>
      </div>

      <ChevronDown size={18} className="hidden shrink-0 text-gray-400 lg:block" />
    </>
  );
}