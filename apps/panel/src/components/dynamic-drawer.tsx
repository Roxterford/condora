'use client'

import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrawer } from '@/contexts/drawer-context'
import { cn } from '@/lib/utils'

/**
 * Ancho del panel por lado.
 *
 * Cada valor lleva su propio modificador `data-[side=…]` porque es lo que usa
 * `SheetContent` para posicionar el panel (`w-3/4`, `inset-y-0`, …) y para
 * imposing su `sm:max-w-sm`. Repetir el modificador es lo que hace que
 * `tailwind-merge` descarte las clases del primitivo: con un `sm:max-w-…` sin
 * prefijo perdía por especificidad y el ancho configurado se ignoraba.
 *
 * Los tres literales existen siempre para que el escáner de Tailwind genere el
 * CSS de los tres lados, aunque en cada render solo se use uno.
 *
 * `bottom` no lleva tope de ancho a propósito: es una hoja que se estira de
 * borde a borde.
 */
const WIDTH_BY_SIDE = {
	right: 'data-[side=right]:w-full data-[side=right]:sm:max-w-[var(--drawer-size)]',
	left: 'data-[side=left]:w-full data-[side=left]:sm:max-w-[var(--drawer-size)]',
	bottom: 'data-[side=bottom]:w-full'
} as const

function DrawerSkeleton() {
	return (
		<div className="space-y-4 p-6">
			<Skeleton className="h-6 w-3/4" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-32 w-full" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	)
}

export function DynamicDrawer() {
	const { state, close } = useDrawer()

	const isBottom = state.side === 'bottom'

	/**
	 * El ancho viaja por variable CSS en lugar de armarse como
	 * `sm:max-w-[${size}px]`. Una clase arbitraria construida en runtime no la
	 * ve el escáner de Tailwind, así que el CSS nunca se generaría; con
	 * `var()` la clase es siempre literal y solo cambia el valor.
	 */
	const style = isBottom
		? undefined
		: ({ '--drawer-size': `${state.size}px` } as CSSProperties)

	return (
		<Sheet open={state.isOpen} onOpenChange={(open) => !open && close()}>
			<SheetContent
				side={state.side}
				showCloseButton={false}
				className={cn(WIDTH_BY_SIDE[state.side], 'gap-0')}
				style={style}
			>
				<SheetHeader className="px-4 sm:px-8">
					<div className="flex items-center justify-between gap-3">
						<SheetTitle className="font-semibold text-lg">
							<span className="flex items-center gap-2">
								{state.title || 'Detalle'}
								{state.titleBadge}
							</span>
						</SheetTitle>
						<button
							onClick={close}
							aria-label="Cerrar detalle"
							className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
						>
							<X size={20} />
						</button>
					</div>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto">
					{state.loading ? <DrawerSkeleton /> : state.content}
				</div>
			</SheetContent>
		</Sheet>
	)
}