// @ts-check
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

const SITE_URL = process.env.SITE_URL ?? 'https://condora.app'

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	output: 'static',
	// Emite `/index.html` en vez de `/` (comportamiento por defecto de Astro).
	trailingSlash: 'never',
	build: {
		// Tablas de assets comprimidas por defecto; no hace falta `assetsPrefix`.
		inlineStylesheets: 'auto',
	},
	integrations: [
		sitemap({
			filter: (page) => !page.includes('/404'),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
		build: {
			// Clases usadas únicamente dentro de `<style>` de .astro.
			cssMinify: 'lightningcss',
		},
	},
	devToolbar: {
		enabled: false,
	},
})