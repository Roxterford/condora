"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Home,
  BarChart3,
  Settings,
  Wrench,
  X,
  Newspaper,
  ArrowLeftRight,
} from "lucide-react";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

type MenuItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

/** Ancho del drawer móvil. 18rem en pantallas cómodas, 85vw en las angostas. */
const MOBILE_DRAWER_WIDTH = "w-[min(18rem,85vw)]";

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    href: "/dashboard",
  },
  { title: "Villas", icon: <Home size={20} />, href: "/villas" },
  { title: "Cuotas", icon: <Newspaper size={20} />, href: "/cuotas" },
  {
    title: "Operaciones",
    icon: <ArrowLeftRight size={20} />,
    href: "/operaciones",
  },
  { title: "Reportes", icon: <BarChart3 size={20} />, href: "/reportes" },
  {
    title: "Configuración",
    icon: <Settings size={20} />,
    href: "/configuracion",
  },
  {
    title: "Administración",
    icon: <Wrench size={20} />,
    href: "/admin/outbox",
  },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  // Una sola definición para desktop y móvil: antes cada uno tenía su propia
  // copia y el item activo salía teal en escritorio y azul en móvil.
  const itemClass = (href: string) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive(href)
        ? "bg-primary text-white shadow-lg shadow-blue-100"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <>
      {/* Desktop Sidebar (izquierda) */}
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
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(item.href)}>
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar (slide-in desde izquierda) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              aria-hidden
            />

            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 25 }}
              className={`fixed top-0 left-0 h-dvh bg-white z-50 md:hidden flex flex-col ${MOBILE_DRAWER_WIDTH}`}
            >
              {/* Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4 sm:h-20 sm:px-6">
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
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar menú"
                  className="shrink-0 text-gray-500"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Menu */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={itemClass(item.href)}
                  >
                    {item.icon}
                    <span className="font-medium">{item.title}</span>
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
