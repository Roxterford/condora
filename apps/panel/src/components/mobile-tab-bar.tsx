'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Ellipsis } from 'lucide-react'

import { MobileMoreSheet } from '@/components/mobile-more-sheet'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { isNavItemActive, PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/lib/panel-nav'

/**
 * Barra de navegación inferior para móvil.
 *
 * En escritorio el panel de la izquierda sigue siendo la navegación principal
 * (ver `Sidebar.tsx`); en móvil ese panel no alcanza: obligaba a abrir un drawer
 * para cambiar de sección. Acá se resuelve como en una app nativa, con los
 * destinos de siempre a un toque.
 *
 * Decisiones de diseño:
 *
 * - **5 slots, no 7.** Más de 5 items en una barra inferior hace que las
 *   etiquetas queden ilegibles a 375px. Los tres destinos menos usados
 *   (Reportes, Configuración, Administración) quedan detrás de "Más", que abre un
 *   bottom sheet. Así no se pierde ninguna ruta.
 *
 * - **Cuatro tabs, no seis.** `Reportes` y `Configuración` también tienen
 *   ruta, pero a 375px un sexto item vuelve ilegibles las etiquetas. Es una
 *   decisión de espacio, no de funcionalidad: los siete destinos siguen a un
 *   toque desde "Más".
 *
 * - **`pb-[env(safe-area-inset-bottom)]`.** Sin esto la barra queda debajo del
 *   indicador de inicio del iPhone y el último item es intocable.
 *
 * - **Animación solo con CSS.** Un indicador activo con `framer-motion` obliga
 *   a medir el layout en cada navegación; acá alcanza con una transición de
 *   color y escala.
 *
 * - **Sin props.** Antes `layout.tsx` tenía el estado `sidebarOpen` solo para
 *   abrir este menú. Ahora el estado vive acá, junto al trigger que lo abre, y
 *   el `Sheet` es controlado porque los links del bottom sheet necesitan
 *   cerrarlo: componer `SheetClose` sobre un `<Link>` les inyectaría
 *   `role="button"` (ver `mobile-more-sheet.tsx`).
 */

const PRIMARY_TABS = PRIMARY_NAV_ITEMS

/** Rutas que no son tab pero hay que poder llegar desde el bottom sheet. */
const SECONDARY_ROUTES = SECONDARY_NAV_ITEMS.map((item) => item.href)

/** `md` es el breakpoint en el que el sidebar de la izquierda vuelve. */
const BAR_CLASS = 'md:hidden'

export function MobileTabBar() {
	const pathname = usePathname()
	const [moreOpen, setMoreOpen] = useState(false)

	const isActive = (href: string) => isNavItemActive(pathname, href)
	const moreActive = SECONDARY_ROUTES.some((href) => isActive(href))

	return (
		<Sheet open={moreOpen} onOpenChange={setMoreOpen}>
			<nav aria-label="Navegación principal" className={`fixed inset-x-0 bottom-0 z-40 ${BAR_CLASS}`}>
				{/*
				 * `bg-white/95` + `backdrop-blur` en vez de un blanco sólido: la lista
				 * se transparenta un poco con el contenido que pasa por debajo, que
				 * es lo que hace que se lea como barra de app y no como un borde.
				 */}
				<div className="border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
					<ul className="grid grid-cols-5">
						{PRIMARY_TABS.map((tab) => {
							const active = isActive(tab.href)
							const Icon = tab.icon

							return (
								<li key={tab.href}>
									<Link
										href={tab.href}
										aria-current={active ? 'page' : undefined}
										className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] leading-none transition-colors ${
											active ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
										}`}
									>
										{/*
										 * La "píldora" detrás del icono es lo que marca el item
										 * activo sin depender solo del color: en pantallas con
										 * brillo bajo o daltonismo el color solo no alcanza.
										 */}
										<span
											aria-hidden
											className={`flex size-8 items-center justify-center rounded-full transition-colors ${
												active ? 'bg-primary/10' : ''
											}`}
										>
											<Icon size={20} strokeWidth={active ? 2.4 : 2} />
										</span>
										<span className={active ? 'font-semibold' : 'font-medium'}>{tab.title}</span>
									</Link>
								</li>
							)
						})}

						<li>
							{/*
							 * `SheetTrigger` ya renderiza un `<button>` y pone
							 * `aria-expanded` solo, así que no hay que cablear estado ni
							 * `onClick`.
							 */}
							<SheetTrigger
								aria-label="Más opciones"
								className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] leading-none transition-colors ${
									moreActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
								}`}
							>
								<span
									aria-hidden
									className={`flex size-8 items-center justify-center rounded-full transition-colors ${
										moreActive ? 'bg-primary/10' : ''
									}`}
								>
									<Ellipsis size={20} strokeWidth={moreActive ? 2.4 : 2} />
								</span>
								<span className={moreActive ? 'font-semibold' : 'font-medium'}>Más</span>
							</SheetTrigger>
						</li>
					</ul>
				</div>
			</nav>

			<MobileMoreSheet onClose={() => setMoreOpen(false)} />
		</Sheet>
	)
}