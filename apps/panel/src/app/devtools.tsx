"use client";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * Devtools de TanStack, solo en desarrollo.
 *
 * Dos razones para este componente:
 *
 * 1. **No deben ir a producción.** Antes se montaban siempre, así que el build
 *    arrastraba los devtools y exponía el estado de las queries de cada
 *    usuario. `NODE_ENV` se inlinea en el bundle, así que en el build de
 *    producción esto se elimina por completo.
 *
 * 2. **Lejos de la barra inferior.** Hay *dos* botones flotantes, no uno, y
 *    ambos vienen en `bottom-right` con `z-index: 99999` — justo donde quedó el
 *    tab "Más". El `<circle r="316.5">` del efecto decorativo del trigger se
 *    montaba encima del tab y se comía el tap: el tab era inclicable en
 *    desarrollo.
 *    - `ReactQueryDevtools` → `top-left`. No acepta `middle-*` (solo
 *      `top|bottom × left|right`, o `relative`), y abajo está la barra.
 *    - `TanStackDevtools` → `middle-right`, que sí lo admite y queda sobre el
 *      contenido, sin tapar nada.
 *
 *    En `top-left` el launcher pisa una parte del buscador en móvil y la
 *    esquina del backdrop. Es solo en desarrollo y no bloquea navegación, pero
 *    es el precio de que el launcher exista en una barra de ancho completo.
 */
export function Devtools() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
      <TanStackDevtools
        plugins={[formDevtoolsPlugin()]}
        config={{ position: "middle-right" }}
      />
    </>
  );
}