/**
 * Configuración y copy de la landing.
 *
 * REGLA DE ESTA FUENTE: aquí no se escribe ninguna afirmación que no se pueda
 * respaldar en el código de `apps/panel`. Todo módulo, ruta o acción que se
 * menciona existe en el panel hoy. Si algo todavía no está construido, no se
 * anuncia: se ofrece una demo. Las cifras de resultados y los testimonios
 * quedan fuera por esa razón, no por descuido.
 */

/** Canal de contacto real. Es el mismo que usa el panel en `support-links.ts`. */
const SUPPORT_EMAIL = 'sanaruca@gmail.com'

const mailto = (subject: string) =>
	`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`

export const site = {
	name: 'Condora',
	tagline: 'Gestión de cuotas y pagos para condominios',
	description:
		'Condora es el software de gestión de cuotas, pagos y operaciones para condominios. Centraliza el registro de propietarios, las cuotas, los pagos y los indicadores de cobranza.',
	url: import.meta.env.SITE ?? 'https://condora.app',
	locale: 'es_LA',
	email: SUPPORT_EMAIL,
	/**
	 * URL del panel. No está publicada en el repositorio, así que se inyecta
	 * por entorno en el despliegue. Mientras llegue vacía la landing no
	 * renderiza ningún enlace "ir al panel": es preferible que falte un
	 * enlace a apuntar a un sitio equivocado.
	 */
	panelUrl: import.meta.env.PUBLIC_PANEL_URL ?? '',
	/** Canal principal de conversión: el mismo "Solicita una demo" del panel. */
	requestDemoHref: mailto('Solicitud de demo - Condora'),
	supportHref: mailto('Soporte - Condora'),
	keywords: [
		'software para condominios',
		'gestión de cuotas',
		'control de deudas',
		'pagos de administración',
		'cuotas especiales',
		'cobranza condominial',
		'software para juntas de condominio',
	],
} as const

/** Títulos de las secciones, en el mismo orden que en `index.astro`. */
export const navigation = [
	{ label: 'Producto', href: '#producto' },
	{ label: 'Cómo funciona', href: '#como-funciona' },
	{ label: 'Módulos', href: '#modulos' },
	{ label: 'Preguntas', href: '#faq' },
] as const

export const footerNav = [
	{
		title: 'Producto',
		links: [
			{ label: 'Funcionalidades', href: '#producto' },
			{ label: 'Cómo funciona', href: '#como-funciona' },
			{ label: 'Módulos', href: '#modulos' },
			{ label: 'Preguntas frecuentes', href: '#faq' },
		],
	},
	{
		title: 'Acceso',
		links: [
			{ label: 'Solicita una demo', href: mailto('Solicitud de demo - Condora') },
			{ label: 'Soporte', href: mailto('Soporte - Condora') },
		],
	},
] as const

/**
 * Problems: el dominio real del producto, no resultados inventados.
 * Se evitan las promesas cuantitativas.
 */
export const problems = [
{
			title: 'El registro de propietarios vive en una hoja de cálculo',
			body: 'Unidades, propietarios y saldos repartidos entre el Excel, el grupo de WhatsApp y la memoria de la administración.',
		},
	{
		title: 'Cada cuota se cobra a mano',
		body: 'Se anota lo que entra, se persigue lo que falta y nadie tiene el estado de cuenta listo para la asamblea.',
	},
	{
		title: 'Los recibos no se archivan',
		body: 'Sin historial consolidado de pagos por unidad y período, cada reclamo acaba en una discusión sobre fechas.',
	},
	{
		title: 'El cierre de mes rehace todo',
		body: 'Calcular recaudado, pendientes y morosidad desde cero cada mes es trabajo que el software ya sabe hacer.',
	},
] as const

/**
 * Módulos reales del panel. Cada entrada corresponde a una pantalla de la que
 * existe código navegable; el texto describe la función, sin inventar
 * funciones ni resultados.
 *
 * No se incluye "Administración" (`/admin/outbox`). Existe en el sidebar del
 * panel, pero es una bandeja interna de tareas, no un módulo que un cliente
 * compre: anunciarlo como funcionalidad confunde en lugar de ayudar.
 *
 * Tampoco se incluyen `/reportes` ni `/configuracion`: enlazan en el sidebar
 * pero no tienen página implementada, así que no se pueden prometer.
 */
export const modules = [
	{
		id: 'dashboard',
		icon: 'chart',
		route: '/dashboard',
		title: 'Dashboard',
		stage: 'Cobranza',
		feedsFrom: 'Todo el período',
		feedsTo: 'Las cuotas y sus pagos',
		body: 'La foto del período en una pantalla: total recaudado, pagos pendientes, cuotas especiales activas y la evolución financiera.',
		points: ['Totales del período', 'Gráfico de evolución', 'Acceso directo a pagos'],
	},
	{
		id: 'cuotas',
		icon: 'receipt',
		route: '/cuotas',
		title: 'Cuotas',
		stage: 'Emisión',
		feedsFrom: 'El registro de propietarios cargado',
		feedsTo: 'Los pagos que se registran',
		body: 'Cuotas ordinarias y especiales, con su detalle, sus pagos asociados y el historial de cada período.',
		points: ['Ordinarias y especiales', 'Detalle por cuota', 'Pagos recibidos y asociados'],
	},
	{
		id: 'villas',
		icon: 'home',
		route: '/villas',
		title: 'Villas',
		stage: 'Registro',
		feedsFrom: '—',
		feedsTo: 'Las cuotas que se emiten',
		body: 'El registro de propietarios ordenado por unidad, con el detalle de cada villa y el estado de sus cuotas pendientes.',
		points: ['Listado por villa', 'Detalle por código', 'Cuotas pendientes por unidad'],
	},
	{
		id: 'pagos',
		icon: 'card',
		route: '/pagos/registrar',
		title: 'Pagos',
		stage: 'Cobranza',
		feedsFrom: 'Las cuotas emitidas',
		feedsTo: 'El saldo de cada unidad',
		body: 'Registro de pagos con su método y su asociación a la cuota que cancela, para que el saldo siempre esté al día.',
		points: ['Método de pago', 'Asociación a la cuota', 'Historial por unidad'],
	},
	{
		id: 'operaciones',
		icon: 'swap',
		route: '/operaciones',
		title: 'Operaciones',
		stage: 'Seguimiento',
		feedsFrom: '—',
		feedsTo: 'El histórico que se consulta',
		body: 'Los movimientos de la administración en un solo listado, ordenados y consultables por período.',
		points: ['Listado por período', 'Trazabilidad de movimientos'],
	},
] as const

/**
 * Palabras que rotan en el titular del hero.
 *
 * Todas son términos que el propio panel usa: `condominios` es su descripción
 * ("Plataforma de gestión de condominios") y las otras tres son módulos reales
 * del sidebar. La marco gramatical es "Gestión moderna de …", que admite las
 * cuatro sin ajustes.
 *
 * El orden va de lo más amplio a lo más concreto: primero de qué trata el
 * producto, después por qué se usa.
 */
export const heroWords = ['condominios', 'cuotas', 'pagos', 'operaciones'] as const

/** El flujo real: emitir cuota, registrar el pago, ver el resultado. */
export const steps = [
	{
		step: '01',
		title: 'Carga el registro de propietarios',
		body: 'Registra villas y unidades con sus propietarios. El cálculo de la cuota se prepara por villa y por mes.',
	},
	{
		step: '02',
		title: 'Emite las cuotas',
		body: 'Genera cuotas ordinarias o especiales y asígnalas a las unidades que las pagan.',
	},
	{
		step: '03',
		title: 'Registra los pagos',
		body: 'Cada pago entra con su método y se descuenta de la cuota correspondiente, dejando el saldo al día.',
	},
] as const

/**
 * Preguntas frecuentes. Todas responden sobre el producto que existe hoy; lo
 * que aún no está resuelto se responde en la demo, no con promesas.
 */
export const faqs = [
	{
		question: '¿Qué módulos trae Condora?',
		answer:
			'Dashboard, Cuotas, Villas, Pagos, Operaciones y una bandeja de Administración. Todos están construidos y se pueden ver en una demo con datos de ejemplo.',
	},
	{
		question: '¿Maneja cuotas especiales además de las ordinarias?',
		answer:
			'Sí. Las cuotas especiales se registran y se listan aparte de las ordinarias, con su propio estado y su relación con los pagos.',
	},
	{
		question: '¿Puedo ver el detalle de una villa o de una cuota?',
		answer:
			'Sí. Cada villa tiene su ficha con el detalle de la unidad, y cada cuota abre su expediente con los pagos recibidos y los asociados.',
	},
	{
		question: '¿Condora es un producto terminado?',
		answer:
			'Es un producto en construcción activa. Por eso el camino más corto es una demo: te mostramos lo que ya funciona y lo que está en camino, sin adornos.',
	},
] as const

export const legalNote =
	'Condora es un producto en desarrollo. La información de esta página describe las funcionalidades disponibles en la versión actual.'