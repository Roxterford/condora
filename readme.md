# 🏠 Condora

gestión de condominios con monorepo moderno.

![Next.js](https://img.shields.io/badge/next%20js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/GoLand-000000?style=for-the-badge&logo=goland&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQl-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-030712?style=for-the-badge&logo=tailwind-css&logoColor=1ac3ff)

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,prisma,sqlite,bun,vitest" />
</p>

---

## ✨ Stack Tecnológico

### 🖥️ Frontend

| Tecnología      | Versión |
| --------------- | ------- |
| Next.js         | 16.2.0  |
| TypeScript      | 5.9.3   |
| TailwindCSS     | 4.x     |
| Storybook       | 10.2.17 |
| Vitest          | -       |
| Playwright      | -       |
| Better Auth     | 1.4.21  |
| React Hook Form | -       |
| Valibot         | -       |

### ⚙️ Backend

| Tecnología     | Versión |
| -------------- | ------- |
| Go             | 1.25.5  |
| gqlgen         | 0.17.86 |
| GORM           | 1.31.1  |
| golang-jwt/jwt | v5      |
| Testify        | -       |

### 🗄️ Base de Datos

| Tecnología  | Versión |
| ----------- | ------- |
| SQLite      | -       |
| Prisma      | 7.2.0   |
| Drizzle ORM | 0.45.1  |

### 🛠️ Herramientas

- **Monorepo**: moonrepo
- **Paquete**: Bun
- **Linting**: ESLint + Prettier
- **Git Hooks**: Lefthook
- **Commits**: Commitlint + Commitizen

---

## 📁 Estructura del Proyecto

```
condominio/
├── apps/
│   ├── panel/          # Frontend Next.js
│   └── api/            # Backend GraphQL Go
├── prisma/             # Esquema y seeds
├── generated/          # Cliente Prisma
├── .moon/              # Config moonrepo
├── .github/            # Templates issues
└── apps/panel/
    ├── src/
    │   ├── lib/
    │   │   ├── server/
    │   │   │   ├── auth.ts    # Better Auth
    │   │   │   └── db/        # Drizzle schemas
    │   │   └── components/   # Componentes UI
    │   └── app/               # Rutas Next.js
    ├── .storybook/
    ├── e2e/
    └── stories/
```

---

## 🚀 Scripts

### Root

| Comando      | Descripción         |
| ------------ | ------------------- |
| `bun dev`    | Iniciar desarrollo  |
| `bun build`  | Construir proyectos |
| `bun test`   | Ejecutar pruebas    |
| `bun lint`   | Linting total       |
| `bun format` | Formatear código    |
| `bun db`     | Operaciones BD      |

### Frontend

```bash
moon run panel:dev         # Desarrollo Next.js
moon run panel:build       # Build producción
moon run panel:storybook   # Servir Storybook
moon run panel:test-unit   # Tests Vitest
moon run panel:test-e2e    # Tests Playwright
moon run panel:db-push     # Drizzle push
moon run panel:db-studio   # Drizzle studio
```

### Backend

```bash
moon run api:dev           # Desarrollo Go
moon run api:cov           # Coverage
```

---

## ⚙️ Variables de Entorno

```env
SECRET_KEY=<clave>
DATABASE_URL=<url sqlite>
ORIGIN=<url base>
BETTER_AUTH_SECRET=<secret>
```

---

## 🔄 Flujo de Trabajo

### 1️⃣ Desarrollo

```bash
bun dev                    # Todos los servicios
moon run panel:dev        # Solo frontend
moon run api:dev          # Solo backend
```

### 2️⃣ Commits

```bash
git commit  # Interfaz interactiva Commitizen
```

### 3️⃣ Testing

```bash
moon run :test-all        # Todas las pruebas
moon run panel:test-unit  # Unitarios frontend
moon run panel:test-e2e   # E2E frontend
```

### 4️⃣ Base de Datos

```bash
# Prisma
bun prisma generate && bun prisma db push

# Drizzle
moon run panel:db-generate
moon run panel:db-push
moon run panel:db-studio
```

---

## 💡 Consideraciones Especiales

### 🗃️ Base de Datos Dual

- **Prisma**: Esquema principal + seeds
- **Drizzle**: Autenticación + operaciones específicas
- Ambos comparten la misma SQLite

### 🔐 Autenticación

- Better Auth con adapter Drizzle
- Cookies automáticas en Next.js
- Email/Password habilitado

### 🌍 Internacionalización

- Proyecto en español
- Templates GitHub en español

---

## 📚 Recursos

| Recurso     | Enlace                               |
| ----------- | ------------------------------------ |
| Next.js     | [docs](https://nextjs.org/docs)      |
| Prisma      | [docs](https://www.prisma.io/docs/)  |
| moonrepo    | [docs](https://moonrepo.dev/docs)    |
| Better Auth | [docs](https://better-auth.com/docs) |

### Templates GitHub

- `.github/ISSUE_TEMPLATE/reporte-de-bug.md`
- `.github/ISSUE_TEMPLATE/solicutud-de-funcionalidad.md`

---

## 🐌 Problemas N+1

> Auditoría del 2026-09-21. Mediciones sobre `dev.db` (520 unidades, 24 cuotas, 11.160 deudas, 8.754 destinos).

### 🔴 1. Vista `unidades_info` — N+1 dentro de SQL (~2.7s) → **✅ RESUELTO por denormalización**

- **Ubicación**: `sql/views/unidades_info.sql`
- **Causa**: por cada unidad hacía un `LEFT JOIN` contra la vista `deudas` + 2 subconsultas correlacionadas sobre `operaciones` y `destino_de_pagos`.
- **Medición**: `ORDER BY codigo LIMIT 20` recalcula las 520 filas → **2.7s** por request.
- **Disparaba**: `obtenerUnidades` → páginas **Villas** y **GlobalSearch**.
- **✅ Resuelto (2026-09-21)**: denormalización completa en `unidades` + vista ligera
  - **Migración**: `sql/migrations/001_denormalize_unidades.sql` — columnas `deuda_total`, `estado_cuenta`, `cuotas_pendientes`, `cuenta` añadidas a tabla `unidades` y pobladas desde la vista original.
  - **Vista ligera**: `unidades_info` ahora solo hace `LEFT JOIN sujetos` para contacto/titular (ya no recalcula nada).
  - **Repository simplificado**: `Obtener` consulta directo la vista ligera con `GFilter`/`GPaginate` → **~2ms** por página (antes 2.7s + 2.7s count = 5.4s).
  - **Hooks de recálculo**: pendientes en casos de uso `RegistrarPago`, `RegistrarCuota`, `AnularPago` (ver TODO).

### 🔴 2. Vista `recaudacion` — correlacionadas por cuota (~0.26s)

- **Ubicación**: `sql/views/recaudacion.sql`
- **Causa**: subconsultas correlacionadas sobre `internal_deudas` + `destino_de_pagos` por cuota + `GROUP BY` de toda la tabla.
- **Medición**: query del loader con las 24 cuotas = **0.257s** en cada carga de **CuotasPage**.
- **Fix base (denormalización #1 hecha)**: `recaudado`, `pagos_asociados` en tabla `cuotas` (análogo a `unidades`), sincronizados al registrar pago/cuota.

### 🟠 3. Resolver `gastos` por cuota — N+1 real en Go

- **Ubicación**: `apps/api/graph/cuota.resolvers.go:21,32,42` → `helpers.go:16` (`resolverObtenerGastos`)
- **Causa**: usa case completo (find + count + `Preload("Proveedor")`) **por cuota**. Hoy solo se pide en detalle (1 cuota); explotaría en cualquier lista con `gastos`.
- **Fix**: dataloader `GetGastos(cuotaID)` (análogo a `recaudacion.loader.go`) con `WHERE cuota IN (...)`, registrado en `dataloaders.go`.

### 🟠 4. Resolver `titulares` por unidad — latente

- **Ubicación**: `apps/api/graph/unidad.resolvers.go:20`
- **Causa**: query `WHERE unidad = obj.ID` por fila. Hoy solo en `VillaPage` (1 unidad). Se volvería N+1 en cualquier lista que pida `titulares`.
- **Fix**: dataloader `GetTitularesByUnidadIDs`.

### 🟡 5. `obtenerDeudas`: `Preload("Abonos")` incondicional

- **Ubicación**: `apps/api/graph/obtener_deudas.resolvers.go:73`
- **Causa**: precarga abonos aunque el query no los pida (`EstadoPagosVilla`, `VillaPage`). Trabajo desperdiciado por página.
- **Fix**: campo `abonos` como resolver lazy + loader, o precarga condicionada al query.

### ✅ Resueltos con loaders

- **Recaudación por cuota**: `recaudacion.loader.go` (dataloader `Recaudacion`)
- **Unidad por fila** en deudas/operaciones: `unidad.loader.go` (dataloaders `Unidad` y `UnidadIdentifiers`)

---

## 📋 TODOS

- [x] Evaluar mover `./apps/api/sql` a `./prisma/sql`
- [x] Renombrar `Villas` → `Unidades` (sistema agnóstico)
- [ ] Arreglar la condicion in en los filtros dinamicos
- [ ] Limitar la cantidad de gastos que puede contener una Cuota, esto por motivos de simplicidad
- [x] Detectar y solucionar problemas n + 1 (ver sección [🐌 Problemas N+1](#problemas-n1))
- [x] **Denormalización `unidades`**: migración + vista ligera + repo simplificado
- [ ] **Hooks recálculo `unidades`**: `RegistrarPago`/`AplicarDestino` actualizan `deuda_total`, `estado_cuenta`, `cuotas_pendientes`, `cuenta`
- [ ] **Hooks recálculo `unidades`**: `RegistrarCuota` incrementa `cuotas_pendientes` y `deuda_total`
- [ ] **Hooks recálculo `unidades`**: `AnularPago`/`EliminarDestino` recalculan fila completa
- [ ] **Denormalización `cuotas`**: columnas `recaudado`, `pagos_asociados` + hooks (para fix #2)
- [ ] **#3**: Dataloader `GetGastos(cuotaID)` (`cuota.resolvers.go` → `helpers.go:16`)
- [ ] **#4**: Dataloader `GetTitularesByUnidadIDs` (`unidad.resolvers.go:20`)
- [ ] **#5**: `Preload("Abonos")` condicional en `obtener_deudas.resolvers.go:73`
