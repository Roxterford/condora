import { GlobalSearch } from "@/components/global-search/global-search";
import { AccountIdentity, AccountMenu } from "./account-menu";

const nombreUsuario = "Ed Ccs";
const rolUsuario = "Administrador";

/**
 * Header del panel.
 *
 * Ya no lleva botón de menú: en móvil la navegación principal es la barra
 * inferior (`MobileTabBar`) y las rutas secundarias se alcanzan desde "Más".
 * Dejar el hamburguesa invitaba a dos navegaciones paralelas que compiten por
 * el mismo espacio en la parte superior de la pantalla.
 *
 * `sticky top-0` + `z-30`: la barra inferior es `z-40`, así el header pasa por
 * debajo de ella al scrollear en vez de Taparse.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md sm:h-20 md:px-6">
      {/* Left */}
      {/* `min-w-0` para que el buscador pueda encogerse en vez de empujar el
          bloque de cuenta fuera de la pantalla en móvil. */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
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