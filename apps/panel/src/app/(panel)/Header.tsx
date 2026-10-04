import { Menu } from "lucide-react";

import { GlobalSearch } from "@/components/global-search/global-search";
import { AccountIdentity, AccountMenu } from "./account-menu";

const nombreUsuario = "Ed Ccs";
const rolUsuario = "Administrador";

type HeaderProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export default function Header({ setSidebarOpen }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:h-20 md:px-6">
      {/* Left */}
      {/* `min-w-0` para que el buscador pueda encogerse en vez de empujar el
          bloque de cuenta fuera de la pantalla en móvil. */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
          className="shrink-0 text-gray-700 md:hidden"
        >
          <Menu size={24} />
        </button>

        <GlobalSearch />
      </div>

      {/* Right: identidad en escritorio, menú de cuenta en móvil */}
      <div className="hidden shrink-0 items-center gap-3 md:flex">
        <AccountIdentity nombre={nombreUsuario} rol={rolUsuario} />
      </div>

      <div className="flex shrink-0 items-center">
        <AccountMenu nombre={nombreUsuario} rol={rolUsuario} />
      </div>
    </header>
  );
}