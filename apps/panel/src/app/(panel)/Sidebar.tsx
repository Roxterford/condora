"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { isNavItemActive, NAV_ITEMS } from "@/lib/panel-nav";

/**
 * Sidebar de escritorio.
 *
 * Por debajo de `md` este componente no renderiza nada: la navegación móvil es la
 * barra inferior y su bottom sheet (ver `mobile-tab-bar.tsx`). Antes también
 * era un drawer lateral para móvil, que quedó reemplazado.
 */
export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => isNavItemActive(pathname, href);

  // Una sola definición para desktop y móvil: antes cada uno tenía su propia
  // copia y el item activo salía teal en escritorio y azul en móvil.
  const itemClass = (href: string) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive(href)
        ? "bg-primary text-white shadow-lg shadow-blue-100"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-100 sm:h-20">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/condora.svg"
            alt="Condora Logo"
            width={160}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className={itemClass(item.href)}>
              <Icon size={20} />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}