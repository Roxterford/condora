import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.NEXT_PORT ?? process.env.PORT ?? 4000)
const baseURL = process.env.PANEL_BASE_URL ?? `http://localhost:${PORT}`

/**
 * Anchos que usamos como contrato de diseño del panel.
 *
 * 375  móvil típico (iPhone SE/13 mini). Es el piso: si algo no cabe acá,
 *      no entra en nada más angosto.
 * 768  tablet vertical. Coincide con el breakpoint `md` de Tailwind, que es
 *      donde el panel cambia de sidebar fijo a drawer.
 * 1440 escritorio de trabajo.
 */
export const VIEWPORTS = {
	mobile: { width: 375, height: 667 },
	tablet: { width: 768, height: 1024 },
	desktop: { width: 1440, height: 900 }
} as const

export default defineConfig({
	testDir: './e2e',
	outputDir: './e2e/.artifacts',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	timeout: 30_000,
	expect: { timeout: 7_000 },
	use: {
		baseURL,
		trace: 'retain-on-failure',
		// El panel es SSR y sondea la API en cada render. Sin API las páginas
		// igual montan el layout (que es lo que medimos) pero las queries
		// fallan, así que `networkidle` nunca llega del todo.
		actionTimeout: 10_000
	},
	projects: [
		{
			name: 'mobile-375',
			use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.mobile, isMobile: false }
		},
		{
			name: 'tablet-768',
			use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.tablet }
		},
		{
			name: 'desktop-1440',
			use: { ...devices['Desktop Chrome'], viewport: VIEWPORTS.desktop }
		}
	],
	webServer: {
		command: `bun next dev --port ${PORT}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: 'ignore',
		stderr: 'pipe'
	}
})