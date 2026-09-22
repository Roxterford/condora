<div align="center">

# Condora

**Administrar tu condominio, hecho simple.**

<p align="center">
  <img src="apps/panel/public/condora.svg" alt="Condora" width="480" />
</p>

Cobra, registra y reporta la administración de tu condominio en un solo lugar: cuotas,
deudas, pagos, gastos y recaudación, con montos exactos en múltiples monedas.

<br/>

![WIP](https://img.shields.io/badge/WIP-en_desarrollo-eab308.svg?style=for-the-badge)
![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white)
![GraphQL](https://img.shields.io/badge/graphql-E10098.svg?style=for-the-badge&logo=graphql&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-0F172A.svg?style=for-the-badge&logo=tailwindcss&logoColor=38bdf8)
![Prisma](https://img.shields.io/badge/prisma-2D3748.svg?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white)

</div>

---

## 🎯 Qué hace Condora

Condora le hace **obvia** al administrador la gestión de cobro y gastos de la comunidad,
y le entrega los reportes para **cobrar y rendir cuentas** en la asamblea.

### El bucle de cobro, de punta a punta

1. **Carga el condominio**: registra las unidades (villas, apartamentos, locales) y sus
   propietarios y contactos.
2. **Genera la cuota del mes**: al emitirla, cada unidad recibe automáticamente su deuda.
3. **Registra pagos**: en efectivo, pago móvil, transferencia nacional o internacional (Zelle/BOfA).
4. **Abona a las deudas**: cada pago se distribuye y la deuda baja en tiempo real.
5. **Ve la recaudación**: sigue cuotas pagadas, pendientes y montos recaudados por período.

### Transparencia para la asamblea

- **Estado de cuenta por unidad**: deuda total, cuotas pendientes y estado (solvente / en deuda).
- **Gastos y proveedores**: registra egresos, asócialos a un proveedor y muéstrale a la
  comunidad hacia dónde fue el dinero.
- **Reportes gastos vs. recaudación**: lo que el administrador lleva a la asamblea para
  justificar el sistema.

### 💱 Exactitud multi-moneda

- **Multi-moneda**: montos en VED y USD con tasas de cambio actualizadas (integración con
  dolarapi.com y respaldo local).
- **Proyectos por cuota**: crea proyectos (ej. ascensor, fachada), cada uno ligado a una
  cuota con fecha límite e interés por mora.
- **Compensaciones**: cruza cuentas — un técnico que presta un servicio puede dirigir parte
  de su cobro a su propia deuda.

---

## 🚀 Desarrollo

Requisitos: [Bun](https://bun.sh) ≥ 1.x y [moonrepo](https://moonrepo.dev) (CLI global).

| Comando                | Descripción                                 |
| ---------------------- | ------------------------------------------- |
| `bun install`          | Instalar dependencias (workspace)           |
| `bun dev`              | Levantar frontend y API en modo desarrollo  |
| `bun test`             | Ejecutar toda la suite de pruebas           |
| `bun lint`             | Lint de todo el monorepo                    |
| `bun format`           | Formatear código                            |
| `bun build`            | Construir todos los proyectos               |
| `bun db`               | Operaciones de base de datos                |
| `bun seed`             | Poblar la base de datos con datos de prueba |

### Módulos por separado

| Comando                          | Módulo                          |
| -------------------------------- | ------------------------------- |
| `moon run panel:dev`             | Frontend (Next.js) en `:3000`   |
| `moon run api:dev`               | API (GraphQL/Go) en `:8080`     |
| `moon run panel:storybook`       | Storybook UI                    |
| `moon run panel:test-unit`       | Tests unitarios (Vitest)        |
| `moon run panel:test-e2e`        | Tests E2E (Playwright)          |
| `moon run api:cov`               | Cobertura de la API             |

### Base de datos

La base de datos es **SQLite** compartida. El esquema principal vive en Prisma y, junto
con las seeds, es la fuente de verdad; Drizzle expone el acceso a las tablas desde el
frontend.

```bash
bun run prisma generate && bun run prisma db push   # Esquema + migraciones
moon run panel:db-push                              # Drizzle push
moon run panel:db-studio                            # Studio (inspección visual)
```

### 🧪 Flujo de trabajo

**Pruebas**

```bash
moon run :test-all          # Toda la suite
moon run panel:test-unit    # Unitarios frontend
moon run panel:test-e2e     # E2E frontend
moon run api:cov            # Coverage API Go
```

**Commits**

Usamos [Conventional Commits](https://www.conventionalcommits.org/) con emojis y git hooks
(Lefthook + Commitlint). Para la interfaz interactiva:

```bash
git commit
```

---

## ⚙️ Configuración

### Variables de entorno

| Variable              | Descripción                     |
| --------------------- | ------------------------------- |
| `SECRET_KEY`          | Clave de firma de la API        |
| `DATABASE_URL`        | URL de la base de datos SQLite  |
| `ORIGIN`              | URL base del frontend           |
| `BETTER_AUTH_SECRET`  | Secreto de Better Auth          |

### Autenticación

- Better Auth con adapter Drizzle.
- Cookies automáticas en Next.js.
- Email/contraseña habilitado.

---

## 🛠️ Tecnologías

| Capa                          | Tecnologías                                                            |
| ----------------------------- | ---------------------------------------------------------------------- |
| **Frontend**                  | Next.js 16, React 19, TypeScript, TailwindCSS 4, shadcn/ui, TanStack Query |
| **Backend**                   | Go 1.25, GraphQL (gqlgen), GORM, JWT                                   |
| **Base de datos**             | SQLite, Prisma 7 (esquema + seeds), Drizzle (auth + tabla lateral)     |
| **Calidad**                   | Vitest (unit), Playwright (e2e), Storybook, ESLint + Prettier          |
| **Monorepo**                  | moonrepo, Bun, Lefthook, Commitlint, Commitizen                        |

---

## 📁 Estructura

```
condominio/
├── apps/
│   ├── panel/              # Frontend Next.js (+ ui, stories, e2e)
│   └── api/                # Backend GraphQL en Go (DDD + casos de uso)
├── prisma/                 # Esquema de datos y seeds
├── generated/              # Cliente Prisma generado
├── sql/                    # Vistas y migraciones SQL
├── docs/                   # Documentación de producto y prototipos
└── .moon/                  # Configuración de moonrepo
```

---

## 📚 Estado del proyecto

- ✅ **Backlog de producto** con la demo que vende → [`docs/BACKLOG-PRODUCTO.md`](docs/BACKLOG-PRODUCTO.md)
- ✅ **Auditoría y fixes de N+1** de la API → [sección de desempeño](#-rendimiento)
- 🔲 Portal self-service del propietario (P2, solo si se valida la demanda)

### 🐌 Rendimiento

Auditoría del 2026-09-21 sobre `dev.db` (520 unidades, 24 cuotas, 11.160 deudas, 8.754 destinos).

| Problema                                | Ubicación                                    | Estado                                                        |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| N+1 dentro de SQL (`unidades_info`)     | `sql/views/unidades_info.sql`                | ✅ Resuelto — denormalización + vista ligera (~2ms por página) |
| Correlacionadas por cuota (`recaudacion`) | `sql/views/recaudacion.sql`                 | 🟠 Pendiente — denormalizar `recaudado`/`pagos_asociados` en `cuotas` |
| N+1 en resolver `gastos`                | `apps/api/graph/cuota.resolvers.go:21,32,42` | 🟠 Pendiente — dataloader `GetGastos(cuotaID)`               |
| Resolver `gastos` (helper)              | `apps/api/graph/helpers.go:16`              | 🟠 Usa find + count + `Preload("Proveedor")` por cuota        |
| N+1 en resolver `titulares`             | `apps/api/graph/unidad.resolvers.go:20`      | 🟠 Pendiente — dataloader `GetTitularesByUnidadIDs`            |
| `Preload("Abonos")` incondicional       | `apps/api/graph/obtener_deudas.resolvers.go:73` | 🟡 Pendiente — precarga condicional                         |

---

## 📖 Recursos

| Recurso        | Enlace                                        |
| -------------- | --------------------------------------------- |
| Next.js        | [docs](https://nextjs.org/docs)               |
| Prisma         | [docs](https://www.prisma.io/docs/)           |
| gqlgen         | [docs](https://gqlgen.com/)                   |
| moonrepo       | [docs](https://moonrepo.dev/docs)             |
| Better Auth    | [docs](https://better-auth.com/docs)          |

---

<div align="center">

Hecho con 💚 para administradores de condominios.

</div>