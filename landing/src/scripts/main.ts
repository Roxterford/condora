/**
 * Interacciones de la landing. JS vanilla, sin dependencias.
 *
 * Estrategia de rendimiento:
 * - El script se carga como módulo (defer por naturaleza).
 * - Todas las animaciones de entrada preferscen CSS scroll-driven cuando el
 *   navegador las soporta; IntersectionObserver solo actúa como respaldo.
 * - Se respeta `prefers-reduced-motion` de forma nativa en CSS y aquí.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------------------------------------------------------------------
 * 1. Respaldo de animaciones de entrada con IntersectionObserver
 * ------------------------------------------------------------------------ */
function initRevealFallback() {
	const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
	if (targets.length === 0) return;

	// Si el navegador soporta scroll-driven animations, CSS ya se encarga.
	if (CSS.supports('animation-timeline', 'view()')) return;
	if (REDUCED_MOTION.matches) {
		targets.forEach((el) => el.setAttribute('data-revealed', ''));
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const el = entry.target as HTMLElement;
				el.setAttribute('data-revealed', '');
				observer.unobserve(el);
			}
		},
		{ rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
	);

	targets.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------------------------
 * 2. Header: sombra al hacer scroll + marcar la sección activa
 * ------------------------------------------------------------------------ */
function initHeader() {
	const header = document.querySelector<HTMLElement>('[data-header]');
	if (!header) return;

	const onScroll = () => {
		header.dataset.scrolled = String(window.scrollY > 12);
	};
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	const links = document.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Principal"] a[href^="#"]');
	const sections = [...links]
		.map((link) => {
			const selector = link.getAttribute('href');
			// Un href vacío o solo "#" no es un selector válido: se descarta.
			if (!selector || selector === '#') return null;
			try {
				return document.querySelector<HTMLElement>(selector);
			} catch {
				return null;
			}
		})
		.filter((el): el is HTMLElement => el !== null);

	if (sections.length === 0) return;

	const navObserver = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				links.forEach((link) => {
					const active = link.getAttribute('href') === `#${entry.target.id}`;
					link.toggleAttribute('data-active', active);
				});
			}
		},
		{ rootMargin: '-45% 0px -50% 0px' }
	);

	sections.forEach((section) => navObserver.observe(section));
}

/* ---------------------------------------------------------------------------
 * 3. Menú móvil
 * ------------------------------------------------------------------------ */
function initMobileMenu() {
	const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
	const panel = document.querySelector<HTMLElement>('[data-menu-panel]');
	if (!toggle || !panel) return;

	const close = () => {
		panel.hidden = true;
		toggle.setAttribute('aria-expanded', 'false');
		document.body.style.removeProperty('overflow');
	};

	const open = () => {
		panel.hidden = false;
		toggle.setAttribute('aria-expanded', 'true');
		document.body.style.overflow = 'hidden';
	};

	toggle.addEventListener('click', () => {
		panel.hidden ? open() : close();
	});

	panel.addEventListener('click', (event) => {
		if ((event.target as HTMLElement).closest('a')) close();
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !panel.hidden) {
			close();
			toggle.focus();
		}
	});

	const mq = window.matchMedia('(min-width: 64rem)');
	mq.addEventListener('change', () => mq.matches && close());
}

/* ---------------------------------------------------------------------------
 * 4. Acordeón de las FAQ
 *
 * Los `<details>` ya llevan `name="faq"`, que es la forma nativa de mantener
 * una sola respuesta abierta y no necesita JS. Este hook solo entra en juego
 * como respaldo en navegadores que ignoran ese atributo: la información
 * permanece accesible sin script en cualquier caso.
 * ------------------------------------------------------------------------ */
function initFaq() {
	const items = document.querySelectorAll<HTMLDetailsElement>('details[name="faq"]');
	if (items.length === 0) return;

	// Si el navegador agrupa por `name`, ya está resuelto de forma nativa.
	if (CSS.supports('selector(details[name])')) return;

	items.forEach((item) => {
		item.addEventListener('toggle', () => {
			if (!item.open) return;
			items.forEach((other) => other !== item && (other.open = false));
		});
	});
}

/* ---------------------------------------------------------------------------
 * Arranque
 * ------------------------------------------------------------------------ */
function boot() {
	initRevealFallback();
	initHeader();
	initMobileMenu();
	initFaq();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
	boot();
}