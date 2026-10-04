import type { Page } from '@playwright/test'

/** Tolerancia en px: subpixel de redondeo y scrollbars no cuentan como bug. */
const TOLERANCE_PX = 1

/** Cuántos elementos culpables reportamos antes de truncar. */
const MAX_REPORTED = 8

export type OverflowOffender = {
	tag: string
	/** Ruta corta tipo CSS para encontrar el nodo en el DevTools. */
	path: string
	/** `class` recortado: es la pista más útil para arreglarlo. */
	className: string
	right: number
	width: number
	/** Ancestro que lo está recortando, si lo hay. */
	clippedBy: string | null
}


/**
 * Devuelve los elementos que se salen del viewport por la derecha.
 *
 * Distingue tres casos, que es lo que hace útil el test:
 *
 * 1. **Recortado por `overflow-x: auto|scroll`** → NO se reporta. El usuario
 *    tiene un scrollbar y puede llegar al contenido. Es el caso legítimo de
 *    las tablas (`components/ui/table.tsx` envuelve cada `<Table>` en un
 *    contenedor con scroll). Reportarlo sería ruido.
 *
 * 2. **Recortado por `overflow-x: hidden`** → SÍ se reporta. El contenido
 *    existe pero es inalcanzable: cortado, sin scroll, sin forma de verlo.
 *    Es el bug más caro de una app "responsive" y es exactamente lo que
 *    provoca `overflow-x-hidden` en `<main>`.
 *
 * 3. **Sin ancestro que lo recorte** → SÍ se reporta. El elemento se sale de
 *    la pantalla, se sea o no de forma recuperable.
 *
 * Se ignoran los subárboles `aria-hidden` (decoración: la barra de progreso
 * animada se sale del viewport a propósito) y todo lo que no tiene tamaño
 * propio (`display: none`, `sr-only`, contenido de un popover cerrado).
 */
async function findOverflowingElements(page: Page): Promise<OverflowOffender[]> {
	return page.evaluate(
		({ tolerance, maxReported }) => {
			const isRendered = (el: Element): boolean => {
				const rect = el.getBoundingClientRect()
				if (rect.width === 0 || rect.height === 0) return false

				const style = getComputedStyle(el)
				if (style.visibility === 'hidden') return false
				if (style.display === 'none') return false
				// Los decorativos suelen ocultarse con `opacity-0`.
				if (Number(style.opacity) === 0) return false

				// `visibility: hidden` heredado desde un ancestro.
				return el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })
			}

			/**
			 * Analiza TODA la cadena de ancestros, no solo el más cercano.
			 *
			 * Importa porque un `overflow-x: hidden` anidado (la progress bar de
			 * una celda, un badge con `truncate`) puede esconder el hecho de que
			 * arriba, en `div.relative.overflow-x-auto`, el usuario sí puede
			 * scrollear. Si solo miráramos el ancestro inmediato, cada tabla con
			 * barra de progreso daría falsos positivos.
			 *
			 * - `scrollable`: algún ancestro es auto|scroll → alcanzable, no es bug.
			 * - `clippedBy`: el ancestro que recorta de verdad (el más externo).
			 */
			const inspectAncestors = (
				el: Element
			): { scrollable: boolean; clippedBy: Element | null } => {
				let scrollable = false
				let clippedBy: Element | null = null

				let current: Element | null = el.parentElement
				while (current) {
					const overflowX = getComputedStyle(current).overflowX
					if (overflowX === 'auto' || overflowX === 'scroll') scrollable = true
					if (overflowX === 'hidden' || overflowX === 'clip') clippedBy = current
					current = current.parentElement
				}

				return { scrollable, clippedBy }
			}

			/**
			 * Ruta legible de un nodo. Va definida DENTRO del evaluate a
			 * propósito: `page.evaluate` serializa la función y la corre en el
			 * browser, donde no existe el scope de Node. Referenciar una
			 * helper de módulo desde adentro revienta con
			 * `ReferenceError: describe is not defined`.
			 */
			const describe = (node: Element): string => {
				const parts: string[] = []
				let current: Element | null = node

				while (current && parts.length < 4) {
					const own = current.tagName.toLowerCase()
					const testId = current.getAttribute('data-testid')
					if (testId) {
						parts.unshift(`${own}[data-testid="${testId}"]`)
						break
					}
					parts.unshift(current.id ? `${own}#${current.id}` : own)
					current = current.parentElement
				}

				return parts.join(' > ')
			}

			const offenders: Array<{
				tag: string
				path: string
				className: string
				right: number
				width: number
				clippedBy: string | null
			}> = []

			const viewportWidth = document.documentElement.clientWidth
			const seen = new Set<Element>()

			for (const el of document.body.querySelectorAll('*')) {
				// Solo HTML: dentro de un `<svg>` los rect son raros.
				if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue

				// Decoración: no la ve nadie, no es contenido.
				if (el.closest('[aria-hidden="true"]')) continue
				// Escape hatch documentado para carruseles osimilar.
				if (el.closest('[data-overflow-ignore]')) continue
				if (seen.has(el)) continue
				if (!isRendered(el)) continue

				const rect = el.getBoundingClientRect()
				if (rect.right <= viewportWidth + tolerance) continue

				const { scrollable, clippedBy } = inspectAncestors(el)

				// Caso 1: el usuario puede scrollear hasta ahí. No es bug.
				if (scrollable) continue

				// `hidden` o sin recorte: el contenido queda inalcanzable.
				seen.add(el)

				offenders.push({
					tag: el.tagName.toLowerCase(),
					path: describe(el),
					className: (el.getAttribute('class') ?? '').slice(0, 120),
					right: Math.round(rect.right),
					width: Math.round(rect.width),
					clippedBy: clippedBy ? describe(clippedBy) : null
				})

				if (offenders.length >= maxReported) break
			}

			return offenders
		},
		{ tolerance: TOLERANCE_PX, maxReported: MAX_REPORTED }
	)
}

/**
 * Falla el test si la página se sale del viewport.
 *
 * Además del desbordamiento horizontal, avisa cuando el documento entero
 * scrollea en vertical de forma inusual: casi siempre es un `100vh` mal
 * convertido que empuja el pie de página fuera de la pantalla en iOS.
 */
export async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
	const offenders = await findOverflowingElements(page)

	const documentOverflow = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}))

	const problems: string[] = []

	if (documentOverflow.scrollWidth > documentOverflow.clientWidth + TOLERANCE_PX) {
		problems.push(
			`el documento scrollea en horizontal: scrollWidth=${documentOverflow.scrollWidth} > clientWidth=${documentOverflow.clientWidth}`
		)
	}

	if (offenders.length > 0) {
		const detail = offenders
			.map(
				(o) =>
					`  · <${o.tag}> right=${o.right}px width=${o.width}px` +
					`${o.clippedBy ? ` recortado por ${o.clippedBy}` : ''}` +
					`\n      ${o.path}` +
					`${o.className ? `\n      class="${o.className}"` : ''}`
			)
			.join('\n')
		problems.push(`contenido fuera del viewport (${offenders.length}):\n${detail}`)
	}

	if (problems.length > 0) {
		throw new Error(
			`[${label}] La UI no es responsive.\n\n${problems.join('\n\n')}\n\n` +
				'Si el elemento se sale a propósito, envolvelo en <div data-overflow-ignore>.'
		)
	}
}