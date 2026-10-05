import type { LucideIcon } from 'lucide-react'
import { ArrowLeftRight, BarChart3, Home, LayoutDashboard, Newspaper, Settings, Wrench } from 'lucide-react'

/**
 * Definición única de la navegación del panel.
 *
 * Antes esta lista vivía dentro de `Sidebar.tsx` y la barra inferior repetía
 * cuatro de esas rutas a mano. Con dos consumidores, cualquier ruta nueva
 * tenía que tocarse en tres lugares y era fácil que se desincronizaran. Ahora
 * los tres (sidebar de escritorio, barra inferior y bottom sheet) leen de acá.
 */

export type NavItem = {
	title: string
	href: string
	icon: LucideIcon
}

export type NavGroup = {
	label: string
	items: NavItem[]
}

/**
 * Las cuatro rutas que tienen `page.tsx` y por eso pueden ser tab de la barra
 * inferior. `/reportes` y `/configuracion` todavía no existen, así que si entran
 * acá la barra lleva al 404.
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
	{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
	{ title: 'Villas', href: '/villas', icon: Home },
	{ title: 'Cuotas', href: '/cuotas', icon: Newspaper },
	{ title: 'Operaciones', href: '/operaciones', icon: ArrowLeftRight }
]

/** Los destinos que quedan detrás de "Más". */
export const SECONDARY_NAV_ITEMS: NavItem[] = [
	{ title: 'Reportes', href: '/reportes', icon: BarChart3 },
	{ title: 'Configuración', href: '/configuracion', icon: Settings },
	{ title: 'Administración', href: '/admin/outbox', icon: Wrench }
]

export const NAV_GROUPS: NavGroup[] = [
	{ label: 'Navegación', items: PRIMARY_NAV_ITEMS },
	{ label: 'Otros', items: SECONDARY_NAV_ITEMS }
]

/** Los grupos en una sola lista, para los usos que no necesitan jerarquía. */
export const NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS]

/**
 * Coincidencia por prefijo y no igualdad exacta: `/cuotas/c-2025-04-reg` tiene
 * que mantener activo el tab "Cuotas". Se exceptúa `/dashboard` para que no se
 * coma a rutas future con nombre corto.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
	if (pathname === href) return true
	return href !== '/dashboard' && pathname.startsWith(`${href}/`)
}