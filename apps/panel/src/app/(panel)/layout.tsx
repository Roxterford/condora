"use client";

import { Suspense, useState } from "react";

import { DrawerProvider } from "@/contexts/drawer-context";
import { DynamicDrawer } from "@/components/dynamic-drawer";
import { TopProgressBar } from "@/components/loading/top-progress-bar";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { PanelBreadcrumb } from "./panel-breadcrumb";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-[#fff]">
      {/* Sidebar (izquierda) */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main */}
      {/* `min-w-0` es lo que permite que el contenido angosto se encoja en vez
          de estirar el flex row. Sin él, cualquier hijo con ancho fijo (tabla,
          drawer) ensancha la columna y aparece scroll horizontal en la página. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Content */}
        {/* `overflow-x-clip` en vez de `hidden`: `hidden` convierte el elemento
            en contenedor de scroll y rompe `position: sticky` de los hijos,
            mientras que `clip` recorta sin crear contexto de scroll. */}
        <main className="flex-1 overflow-x-clip p-4 md:p-6">
          <PanelBreadcrumb />
          <div className="mt-4">{children}</div>
        </main>
      </div>

      {/* Dynamic Drawer — se abre al llamar useDrawer().open() */}
      <DynamicDrawer />
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
