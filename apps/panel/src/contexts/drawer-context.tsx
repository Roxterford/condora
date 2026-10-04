'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type DrawerSide = 'right' | 'left' | 'bottom'

/**
 * Ancho máximo del drawer, en px, **aplicado solo desde `sm`**.
 *
 * En móvil el drawer ocupa el 100% del viewport (ver `DynamicDrawer`), así que
 * este valor no tiene sentido por debajo de 768px. Se expresa en px y no como
 * clase porque viaja por una variable CSS.
 */
export const DRAWER_DEFAULT_SIZE = 400

type DrawerOptions = {
	content?: ReactNode
	loader?: () => Promise<ReactNode>
	title?: string
	titleBadge?: ReactNode
	side?: DrawerSide
	/** Ancho máximo desde `sm`. Ignorado cuando `side` es `bottom`. */
	size?: number
}

type DrawerState = {
	isOpen: boolean
	content: ReactNode | null
	title: string
	titleBadge?: ReactNode
	side: DrawerSide
	size: number
	loading: boolean
}

type DrawerContextType = {
	state: DrawerState
	open: (options: DrawerOptions) => void
	close: () => void
}

const INITIAL_STATE: DrawerState = {
	isOpen: false,
	content: null,
	title: '',
	side: 'right',
	size: DRAWER_DEFAULT_SIZE,
	loading: false,
}

const DrawerContext = createContext<DrawerContextType | null>(null)

export function DrawerProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<DrawerState>(INITIAL_STATE)

	const open = useCallback((options: DrawerOptions) => {
		const { content, loader, title = '', titleBadge, side = 'right', size = DRAWER_DEFAULT_SIZE } = options

		if (loader) {
			setState({ isOpen: true, content: null, title, titleBadge, side, size, loading: true })
			loader().then((resolved) => {
				setState((prev) => ({ ...prev, content: resolved, loading: false }))
			})
		} else {
			setState({ isOpen: true, content: content ?? null, title, titleBadge, side, size, loading: false })
		}
	}, [])

	const close = useCallback(() => {
		setState(INITIAL_STATE)
	}, [])

	return (
		<DrawerContext value={{ state, open, close }}>
			{children}
		</DrawerContext>
	)
}

export function useDrawer() {
	const ctx = useContext(DrawerContext)
	if (!ctx) throw new Error('useDrawer debe usarse dentro de un DrawerProvider')
	return ctx
}
