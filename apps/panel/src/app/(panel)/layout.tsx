"use client";

import { Suspense } from "react";

import { DrawerProvider } from "@/contexts/drawer-context";
import { DynamicDrawer } from "@/components/dynamic-drawer";
import { TopProgressBar } from "@/components/loading/top-progress-bar";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PanelBreadcrumb } from "./panel-breadcrumb";

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#fff]">
      {/* Sidebar (izquierda) — solo a partir de `md` */}
      <Sidebar />

      {/* Main */}
      {/* `min-w-0` es lo que permite que el contenido angosto se encoja en vez
          de estirar el flex row. Sin él, cualquier hijo con ancho fijo (tabla,
          drawer) ensancha la columna y aparece scroll horizontal en la página. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <Header />

        {/* Content */}
        {/* `overflow-x-clip` en vez de `hidden`: `hidden` convierte el elemento
            en contenedor de scroll y rompe `position: sticky` de los hijos,
            mientras que `clip` recorta sin crear contexto de scroll.

            El `pb-24` en móvil deja libre la franja que ocupa la barra inferior
            fija; sin él la última fila de cualquier tabla queda debajo y no se
            puede leer ni scrollear hasta ella. */}
        <main className="flex-1 overflow-x-clip p-4 pb-24 md:p-6">
          <PanelBreadcrumb />
          <div className="mt-4">{children}</div>
        </main>
      </div>

      {/* Drawer de detalle (cuotas, operaciones, etc.), en todos los tamaños. */}
      <DynamicDrawer />

      {/* Barra inferior de navegación: la principal en móvil, con su bottom
          sheet de destinos secundarios detrás de "Más". Se autoregula con el
          `Sheet` de Base UI, así que no necesita estado acá. */}
      <MobileTabBar />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DrawerProvider>
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <DashboardContent>{children}</DashboardContent>
    </DrawerProvider>
  );
}