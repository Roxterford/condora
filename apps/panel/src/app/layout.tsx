import { Toaster } from "@/components/ui/sonner";
import { probeApiForRender } from "@/lib/api-wake";
import { isWakeScreenEnabled } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";
import { connection } from "next/server";
import "./app.css";
import { Devtools } from "./devtools";
import Providers from "./providers";
import { WakeGate } from "./wake-gate";

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Condora",
  description: "Plataforma de gestión de condominios",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // La API de Render se suspende por inactividad. Antes de renderizar
  // comprobamos si está despierta: si lo está (el caso normal de un usuario
  // activo) no armamos nada y el sobrecoste es cero gracias a la caché de 30 s
  // de `probeApiForRender`. Si no lo está, este mismo sondeo ya le pide
  // arrancarse y montamos la pantalla de encendido encima del contenido.
  //
  // `connection()` es imprescindible: sin él Next intentaría prerenderizar el
  // layout en `next build`, sondearía una API inexistente en esa máquina y
  // hornearía la pantalla de encendido dentro del HTML estático. Con él, el
  // sondeo solo corre cuando hay una petición real.
  await connection();
  const shouldArmWakeScreen = isWakeScreenEnabled() && !(await probeApiForRender()).awake;

  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        notoSans.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <WakeGate armed={shouldArmWakeScreen} />
          {children}
          <Devtools />
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                description: "!text-gray-400",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
