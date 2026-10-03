# Condora · Landing

Landing page de **Condora**, software de gestión de cuotas, pagos y operaciones
para condominios, edificios y comercios.

Sitio estático generado con [Astro](https://astro.build) 7 y Tailwind CSS v4.
Cero frameworks de UI en el cliente: solo componentes `.astro` y JS vanilla.

## Regla de contenido

**En esta landing no se escribe ninguna afirmación que no se pueda respaldar en
el código de `apps/panel`.** Todo módulo, ruta o acción que se menciona existe en
el panel hoy; si algo todavía no está construido, no se anuncia: se ofrece una
demo. No hay precios publicados, ni testimonios, ni métricas de resultado, ni
capturas inventadas.

Por eso la página **no** enlaza a una URL del panel: esa URL no está publicada en
el repositorio y se inyecta por entorno (ver `PUBLIC_PANEL_URL`).

El único canal de conversión es el mismo que ya usa el panel en
`apps/panel/src/app/(auth)/support-links.ts`: un `mailto:` a soporte.

## Comandos

Las tareas se ejecutan desde la raíz del monorepo con moonrepo:

```bash
bun run dev:landing        # servidor de desarrollo en :4321
bun run build:landing      # build estático en landing/dist/
bunx moon run landing:check  # astro check (tipos + plantillas)
```

`landing:check` no tiene script en el `package.json` de la raíz (solo existen
`dev:landing` y `build:landing`), así que se invoca con `moon run`.

O directamente dentro de `landing/`:

```bash
bun run dev
bun run build
bun run preview
bun run check
bun run clean
```

### El dev server corre en segundo plano

Astro 7 demoniza el servidor de desarrollo: `moon run landing:dev` **devuelve el
control de inmediato** y el servidor sigue vivo. Esto es intencional, evita que
la tarea de moon quede bloqueada y deja el servidor disponible entre
ejecuciones.

```bash
bunx astro dev status    # ver PID, puertos y uptime
bunx astro dev logs      # consultar la salida
bunx astro dev stop      # detenerlo
```

El puerto por defecto es `4321`; se sobreescribe con `LANDING_PORT` en las tareas
de moon o con `--port` en la CLI.

## Estructura

```
landing/
├── astro.config.mjs        # output: 'static' + sitemap + Tailwind v4 vía Vite
├── moon.yml                # tareas del proyecto en el workspace
├── public/                 # logos de marca, favicon, OG image, manifest
└── src/
    ├── components/
    │   ├── brand/          # Logo, BrandLockup (SVG oficial del panel)
    │   ├── sections/       # una sección por archivo
    │   └── ui/             # Button, Badge, Icon, SectionHeading
    ├── data/site.ts        # todo el copy y la configuración del sitio
    ├── env.d.ts            # tipos de las variables de entorno
    ├── layouts/            # BaseLayout.astro (SEO, fuentes, JSON-LD)
    ├── pages/              # index.astro, 404.astro
    ├── scripts/main.ts     # interacciones (reveal, header, menú móvil, FAQ)
    └── styles/global.css   # tokens @theme de Tailwind v4 y sistema de animación
```

Los logos (`condora.svg` y `condora_blanco.svg`) y los favicon se copian desde
`apps/panel/public/` y `apps/panel/src/app/favicon.ico`. No hay una versión
local editada a mano: la marca es una sola en los dos proyectos.

## Sistema de diseño

Los tokens viven en `src/styles/global.css` dentro de un bloque `@theme`
(Tailwind v4 es *CSS-first*, no hay `tailwind.config.js`).

La paleta está tomada **literalmente** del panel para que landing y panel se lean
como el mismo producto:

| Token del panel | Valor            | Uso                                   |
| --------------- | ---------------- | ------------------------------------- |
| `--primary`     | `#00A3A0`        | `brand-600`: relleno y adorno         |
| marca (logo)    | `#00A9A5`        | isotipo, degradados                   |
| `--background`  | `#FFFFFF`        | superficie base (`bg-canvas`)         |
| `--foreground`  | `#09090B`        | `zinc-950`: texto de encabezado       |
| `--muted`       | `#F4F4F5`        | `zinc-100`: superficies secundarias   |
| `--border`      | `#E4E4E7`        | `zinc-200`: bordes                    |
| `--radius`      | `0.625rem`       | base de la escala de radios           |

**Contraste.** `brand-600` se queda en 3.1:1 sobre blanco, por debajo del 4.5:1
que exige AA para texto normal: se usa solo como relleno o adorno. Todo texto de
marca usa `brand-700` (4.8:1) o `brand-800` (6.4:1). Los botones primarios usan
`brand-800` en lugar del `--primary` del panel por este mismo motivo.

**Tipografía.** Noto Sans para todo el texto y Geist Mono para datos, igual que
el panel. El recurso del titular es el contraste de peso dentro de la misma
línea (`font-light` junto a `font-extrabold`), no una familia serif distinta.

## Animaciones

Dos capas, ambas respetando `prefers-reduced-motion`:

1. **Nativa** — CSS scroll-driven animations (`animation-timeline: view()`).
   Se ejecuta en el hilo del compositor, sin coste de JS.
2. **Respaldo** — `IntersectionObserver` en `src/scripts/main.ts`, que solo se
   activa si el navegador no soporta la sintaxis anterior.

Las cuatro decisiones que hacen que el movimiento se sienta suave:

- Distancias cortas (10–14 px). Recorrer mucho espacio en poco tiempo es lo que
  produce el tirón.
- `--ease-brand` (`cubic-bezier(0.22, 1, 0.36, 1)`), la curva dominante del
  panel, en lugar de una curva con rebote.
- Duraciones largas (0.8–1 s) para la misma distancia.
- Sin `scale` en las entradas: escalar provoca un "pop".

## SEO

- `BaseLayout.astro` centraliza `title`, `description`, `canonical`, Open Graph,
  Twitter Cards, iconos y JSON-LD (`SoftwareApplication` + `Organization`).
- El JSON-LD **no** declara `offers`: no hay precios publicados y un
  `AggregateOffer` inventado sería exactamente el dato falso que esta página
  evita.
- `sitemap.xml` e `sitemap-index.xml` generados por `@astrojs/sitemap`.
- `public/robots.txt` referencia el sitemap.
- Imagen OG: `public/og-image.png` (1200×630), generada desde
  `public/og-image.svg` con `rsvg-convert`.

## Variables de entorno

| Variable            | Por defecto           | Uso                                        |
| ------------------- | --------------------- | ------------------------------------------ |
| `SITE_URL`          | `https://condora.app` | Canonical, OG y sitemap                    |
| `PUBLIC_PANEL_URL`  | *(vacío)*             | Enlace "ir al panel"; vacío = no se pinta  |
| `LANDING_PORT`      | `4321`                | Puerto en tareas de moon                   |

## Despliegue

El build produce un directorio `dist/` estático que se puede publicar en
cualquier hosting (Netlify, Vercel, Cloudflare Pages, S3 + CDN). No requiere
runtime de servidor.

Para que aparezca el acceso al panel hay que exportar `PUBLIC_PANEL_URL` en el
entorno de build:

```bash
PUBLIC_PANEL_URL=https://panel.ejemplo.com bun run build:landing
```