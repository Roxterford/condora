import type { LucideIcon } from 'lucide-react'

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '@/components/ui/empty'

/**
 * Estado "todavía no" para secciones que ya están en la navegación pero que
 * todavía no tienen implementación.
 *
 * Sin esto, `/reportes` y `/configuracion` eran enlaces a un 404: el sidebar y
 * el bottom sheet los ofrecen como si fueran a funcionar, y el usuario se
 * encuentra con un error del servidor en vez de con lo que esperaba. Una página
 * que dice "esto todavía no" es más honesta que una que no existe.
 *
 * Vive en `components/` y no en `app/<ruta>/components/` porque lo comparten
 * varias páginas.
 */
export function ComingSoon({
	icon: Icon,
	title,
	description
}: {
	icon: LucideIcon
	title: string
	description: string
}) {
	// El `border` punteado y el `muted/30` hacen que la caja se lea como una
	// tarjeta de verdad y no como texto flotando en el medio de la página. El
	// `py-16` la deja respirar sin comerse el viewport en pantallas bajas.
	return (
		<Empty className="rounded-2xl border border-dashed bg-muted/30 py-16">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Icon aria-hidden />
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
		</Empty>
	)
}