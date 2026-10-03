/// <reference types="astro/client" />

/**
 * Variables de entorno de la landing.
 *
 * Solo se declara lo que realmente se consume. `PUBLIC_*` queda expuesta al
 * bundle del cliente; el resto se mantiene en el servidor.
 */
interface ImportMetaEnv {
	/**
	 * URL pública del panel de administración.
	 *
	 * No está publicada en el repositorio a propósito: se inyecta en el
	 * despliegue. Mientras llegue vacía, la landing no renderiza ningún enlace
	 * "ir al panel". Es preferible que falte un enlace a apuntar a un sitio
	 * equivocado.
	 */
	readonly PUBLIC_PANEL_URL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}