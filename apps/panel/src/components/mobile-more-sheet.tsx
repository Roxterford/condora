'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CheckIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetTitle
} from '@/components/ui/sheet'
import { isNavItemActive, NAV_GROUPS } from '@/lib/panel-nav'

/**
 * Bottom sheet con todos los destinos del panel.
 *
 * Reemplaza al drawer lateral que antes abría el botón "Más". El drawer se
 * feelaba como un menú de escritorio metido en un teléfono: entraba desde un
 * borde, ocupaba el alto completo y tapaba la barra inferior. El bottom sheet
 * sube desde el mismo borde que la barra, así que la relación entre "estoy en
 * la barra" y "estoy viendo el resto" es inmediata.
 *
 * Apoyado en el `Sheet` de shadcn (Base UI `Dialog`), que ya resuelve lo que
 * uno tiene que escribir a mano en un modal casero:
 *
 * - `role="dialog"` + `aria-modal`, foco atrapado y devuelto al botón "Más" al
 *   cerrar, y `aria-expanded` en el trigger.
 * - Bloqueo del scroll del body (antes el drawer dejaba scrollear la página por
 *   detrás) y cierre con `Esc` o tocando el fondo.
 * - Transiciones de entrada y salida, y `inert` para el resto de la página.
 *
 * Se sube desde el tope completo en vez del `translate-y-[2.5rem]` por defecto
 * de shadcn: a 2.5rem el salto se lee como un glitch y no como una hoja que
 * entra desde abajo. Por eso se repite el mismo `data-[side=bottom]:` del
 * componente base — con un modificador distinto `tailwind-merge` no los
 * deduplica y el orden en la hoja de estilos decide, que no es determinista.
 *
 * ## Por qué los items son `<Link>` y no `SheetClose`
 *
 * Lo natural era componer el cierre sobre el link:
 * `<SheetClose render={<Link href="..." />} />`. No: `Dialog.Close` espera un
 * `<button>`, y sus dos salidas son peores que el warning de consola:
 *
 * - Sin `nativeButton={false}` avisa por consola en cada item.
 * - Con `nativeButton={false}` le inyecta `role="button"` y `tabindex="0"` al
 *   `<a>`: los siete links dejan de ser links para el árbol de accesibilidad y
 *   cada uno se vuelve un parada del tab. Una lista de navegación que se
 *   anuncia como siete botones.
 *
 * Con `onOpenChange` controlado el cierre es un `onClick` más y los links
 * siguen siendo links de verdad: `href` navegable, ctrl/cmd-click para abrir en
 * pestaña nueva, y un solo tab stop para toda la lista.
 */
export function MobileMoreSheet({ onClose }: { onClose: () => void }) {
	const pathname = usePathname()

	return (
		<SheetContent
			side="bottom"
			showCloseButton={false}
			className="max-h-[85dvh] gap-0 rounded-t-3xl border-t-0 p-0 md:hidden data-[side=bottom]:data-starting-style:translate-y-full data-[side=bottom]:data-ending-style:translate-y-full"
		>
			{/*
			 * El "grabber" es puro adorno (`aria-hidden`): en esta variante del
			 * `Sheet` no se puede arrastrar para cerrar, así que no puede
			 * prometer una interacción que no existe. Va primero en el DOM
			 * porque es lo que el ojo busca primero para saber hacia dónde se
			 * arrastra la hoja.
			 */}
			<div aria-hidden className="shrink-0 pt-2.5 pb-1">
				<div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
			</div>

			{/* `pr-4` en vez de `right-4`: el botón lleva padding propio y el valor
			    del componente base lo dejaba pegado al borde. */}
			<div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-2 pb-4 pr-4">
				<div className="min-w-0">
					<SheetTitle className="text-lg font-semibold">Todas las secciones</SheetTitle>
					<SheetDescription className="mt-0.5 text-sm text-muted-foreground">
						Los {NAV_GROUPS.flatMap((g) => g.items).length} destinos del panel.
					</SheetDescription>
				</div>

				<SheetClose
					render={
						<Button
							variant="ghost"
							size="icon-sm"
							className="-mt-1 shrink-0 text-muted-foreground"
						/>
					}
				>
					<XIcon />
					<span className="sr-only">Cerrar</span>
				</SheetClose>
			</div>

			<Separator />

			{/*
			 * El cuerpo scrollea y no el `SheetContent`: así el título y el botón
			 * de cerrar quedan fijos aunque la lista crezca, y `overscroll-contain`
			 * evita que el gesto de scroll encadene hacia la página de atrás.
			 */}
			<div className="overflow-y-auto overscroll-contain px-3 pt-1 pb-2">
				{NAV_GROUPS.map((group, groupIndex) => (
					<div key={group.label}>
						<p
							className={`px-3 pt-4 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase ${
								groupIndex === 0 ? 'pt-2' : ''
							}`}
						>
							{group.label}
						</p>

						<ul className="space-y-0.5">
							{group.items.map((item) => {
								const active = isNavItemActive(pathname, item.href)
								const Icon = item.icon

								return (
									<li key={item.href}>
										<Link
											href={item.href}
											aria-current={active ? 'page' : undefined}
											onClick={onClose}
											className={`flex min-h-14 items-center gap-3 rounded-xl px-3 transition-colors ${
												active
													? 'bg-primary/10 text-primary'
													: 'text-foreground hover:bg-muted'
											}`}
										>
											<span
												aria-hidden
												className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
													active
														? 'bg-primary/10 text-primary'
														: 'bg-muted text-muted-foreground'
												}`}
											>
												<Icon size={18} />
											</span>
											<span className="flex-1 truncate font-medium">{item.title}</span>
											{active && <CheckIcon className="size-4 shrink-0" />}
										</Link>
									</li>
								)
							})}
						</ul>
					</div>
				))}
			</div>
		</SheetContent>
	)
}