import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow } from './helpers/overflow'

const BASE_URL = process.env.PANEL_BASE_URL ?? 'http://localhost:4000'

/**
 * Rutas del panel y fixtures.
 *
 * Los ids dinámicos salen de `prisma/seeds/mocks`. Se pueden sobreescribir por
 * entorno para correr contra otro dataset:
 *   E2E_VILLA_CODIGO=villa-42 E2E_CUOTA_ID=c-2025-07-reg bun run test:e2e
 */
const VILLA_CODIGO = process.env.E2E_VILLA_CODIGO ?? 'villa-1'
const CUOTA_ID = process.env.E2E_CUOTA_ID ?? 'c-2025-04-reg'

/**
 * Token de sesión para las aserciones que necesitan datos reales.
 *
 * El panel manda la cookie `api_token` como `Authorization: Bearer` (ver
 * `providers/graphql/execute.ts`). Sin ella la API responde error y todas las
 * tablas caen en su estado vacío: el layout se puede verificar igual, pero no
 * hay filas con las que abrir un drawer.
 *
 * Con token:   E2E_API_TOKEN=... bun run test:e2e
 * Sin token: las pruebas dependientes de datos hacen `skip`, no fallan.
 */
const API_TOKEN = process.env.E2E_API_TOKEN

const ROUTES = [
	{ path: '/', name: 'login' },
	{ path: '/dashboard', name: 'dashboard' },
	{ path: '/cuotas', name: 'cuotas' },
	{ path: '/cuotas/registrar', name: 'cuotas-registrar' },
	{ path: `/cuotas/${CUOTA_ID}`, name: 'cuota-detalle' },
	{ path: '/operaciones', name: 'operaciones' },
	{ path: '/pagos/registrar', name: 'pagos-registrar' },
	{ path: '/villas', name: 'villas' },
	{ path: `/villas/${VILLA_CODIGO}`, name: 'villa-detalle' },
	{ path: '/admin/outbox', name: 'admin-outbox' }
] as const

/**
 * El panel no tiene middleware: sin cookie `api_token` las rutas de `(panel)`
 * montan igual el layout y solo fallan las queries. Como lo que verificamos es
 * la composición visual (que nada se salga del viewport), alcanza con esperar al
 * esqueleto del shell en vez de a los datos.
 *
 * Importante: se espera a que la red quede quieta antes de medir. Con un
 * `waitForTimeout` fijo se medía a medio hidratar y salían falsos positivos que
 * dependían de cuán rápido respondía la API.
 */
async function gotoAndSettle(page: import('@playwright/test').Page, path: string): Promise<void> {
	// La cookie tiene que estar antes del `goto`: el server component la lee
	// durante el render.
	if (API_TOKEN) {
		await page.context().addCookies([
			{ name: 'api_token', value: API_TOKEN, url: BASE_URL, httpOnly: false }
		])
	}

	await page.goto(path, { waitUntil: 'load' })

	// El shell del panel siempre monta un `main`; el login, un `form`.
	const shell = page.locator('main, form').first()
	await expect(shell).toBeVisible()

	// Las queries GraphQL del panel llegan por el proxy de Next, así que
	// `networkidle` también cubre el data fetching del server.
	await page
		.waitForLoadState('networkidle', { timeout: 15_000 })
		.catch(() => {
			// Sin API la red nunca queda quieta del todo; igual hay que medir.
		})

	// Margen para la aplicación de clases de Tailwind post-hidratación.
	await page.waitForTimeout(400)
}

test.describe('sin desbordamiento horizontal', () => {
	for (const route of ROUTES) {
		test(route.name, async ({ page }) => {
			await gotoAndSettle(page, route.path)
			await expectNoHorizontalOverflow(page, route.path)
		})
	}
})

/**
 * El drawer lateral es el peor offender conocido: su ancho llegaba como
 * `maxWidth` inline, que ninguna clase de Tailwind puede pisar, así que en un
 * viewport angosto se salía de la pantalla sin forma de corregirlo desde el
 * componente.
 */
test.describe('drawer lateral', () => {
	test('ocupa como máximo el 100% del viewport', async ({ page }) => {
		/*
		 * `/cuotas` y no `/operaciones`: operaciones devuelve la tabla vacía sin
		 * un token válido, así que no hay fila con la que abrir nada. En cuotas
		 * `useSingleDoubleClick` ejecuta `onSingle` en el acto, así que un solo
		 * click abre el drawer.
		 */
		await gotoAndSettle(page, '/cuotas')

		/*
		 * Esperar por tiempo no alcanza: la tabla primero muestra el esqueleto y
		 * recién después resuelve a `empty` o a filas reales. Se espera a que
		 * aparezca cualquiera de los dos estados para no decidir sobre el
		 * esqueleto — las filas del esqueleto cuentan como "datos" si no se las
		 * filtra, y eso hacía clickear una fila que no existe.
		 */
		await page.waitForFunction(
			() => {
				const tbody = document.querySelector('[data-slot="table-container"] tbody')
				if (!tbody) return false
				if (tbody.querySelector('[data-slot="empty"]')) return true
				return Array.from(tbody.querySelectorAll('tr')).some(
					(tr) => !tr.querySelector('[data-slot="empty"]') && !tr.querySelector('[data-slot="skeleton"]')
				)
			},
			{ timeout: 20_000 }
		)

		/*
		 * La tabla vacía renderiza una sola `<tr>` (el estado `empty`), que es
		 * visible pero no tiene `onClick`. Contarla como "hay filas" hacía que
		 * el test clickeara una fila muerta y fallara al esperar el drawer.
		 */
		const vacia = await page.locator('[data-slot="empty"]').first().isVisible().catch(() => false)
		if (vacia) {
			test.skip(
				true,
				API_TOKEN
					? 'La tabla vino vacía: la API respondió sin operaciones para este dataset'
					: 'Sin E2E_API_TOKEN la API rechaza las queries y la tabla cae en empty'
			)
			return
		}

		const fila = page.locator('[data-slot="table-container"] tbody tr').first()

		if (!(await fila.isVisible())) {
			test.skip(true, 'Sin filas en la tabla: la API no está disponible o no hay datos')
			return
		}

		await fila.click()

		const sheet = page.locator('[data-slot="sheet-content"]').first()
		await expect(sheet).toBeVisible()
		await page.waitForTimeout(400)

		const { sheetWidth, viewportWidth } = await sheet.evaluate((el) => ({
			sheetWidth: Math.round(el.getBoundingClientRect().width),
			viewportWidth: document.documentElement.clientWidth
		}))

		expect(
			sheetWidth,
			`el drawer mide ${sheetWidth}px en un viewport de ${viewportWidth}px`
		).toBeLessThanOrEqual(viewportWidth)

		await expectNoHorizontalOverflow(page, '/cuotas (drawer abierto)')
	})
})

/**
 * En móvil el sidebar es un drawer con `framer-motion` y el header tiene un
 * botón de menú. Sin esto no hay forma de navigating el panel a 375px.
 */
test.describe('navegación móvil', () => {
	test('el menú lateral abre y cerrable', async ({ page }, testInfo) => {
		const viewport = testInfo.project.use.viewport
		const isMobileLayout = (viewport?.width ?? 0) < 768

		await gotoAndSettle(page, '/dashboard')

		// `/menu/i` no matchea "Abrir menú": la `ú` acentuada es otro carácter.
		// La clase de caracteres cubre ambas escrituras.
		const menuButton = page.getByRole('button', { name: /men[uú]/i }).first()
		const visible = await menuButton.isVisible().catch(() => false)

		if (!isMobileLayout) {
			expect(visible, 'el botón de menú debe estar oculto en escritorio').toBe(false)
			return
		}

		expect(visible, 'el botón de menú debe estar visible en móvil').toBe(true)

		await menuButton.click()

		// `:visible` importa: el sidebar de escritorio sigue en el DOM con
		// `display: none`, y `.first()` se lo agarra a él en vez del drawer.
		const nav = page.locator('nav:visible').first()
		await expect(nav).toBeVisible()
		await page.waitForTimeout(400)

		await expectNoHorizontalOverflow(page, '/dashboard (sidebar abierto)')
	})
})