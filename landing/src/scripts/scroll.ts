/**
 * Paralaje ligado al scroll.
 *
 * El decorado de cada sección se desplaza a una velocidad distinta del
 * contenido, y eso es lo que hace que el scroll se sienta como profundidad en
 * lugar de una lista que sube. El JS solo mide; el movimiento se resuelve
 * escribiendo `--parallax-y` y dejando que CSS haga el `translate`. Un solo
 * `requestAnimationFrame` para todos los elementos, porque uno por elemento
 * multiplica las medidas sin ganar nada.
 *
 * Las entradas de las secciones no pasan por aquí: eso lo hace
 * `animation-timeline: view()` cuando el navegador lo soporta, con
 * IntersectionObserver como respaldo. Aquí solo vive el paralaje, que necesita
 * conocer la posición en la página y no la del elemento.
 *
 * Con `prefers-reduced-motion` no se registra nada: el decorado se queda donde
 * lo pone el CSS, que es el diseño bueno — el paralaje es una capa encima,
 * nunca la base.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------------------------------------------------------------------
 * Paralaje
 *
 * La profundidad sale de `data-parallax` y el sentido de `data-parallax-dir`.
 * ------------------------------------------------------------------------ */

function initParallax() {
	const items = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
	if (items.length === 0 || REDUCED_MOTION.matches) return;

	/**
	 * Amplitud en píxeles por unidad de profundidad, con el elemento en el centro
	 * del viewport. Antes eran 26 px y la sensación era que el decorado estaba
	 * quieto: el ojo solo registra depths de parallax a partir de unos 40 px.
	 * 68 px es suficiente para que la profundidad se note sin que el manchón se
	 * despegue del borde que lo ancla.
	 */
	const AMPLITUDE = 68;

	let raf = 0;

	const update = () => {
		raf = 0;
		const middle = window.innerHeight / 2;

		for (const item of items) {
			const box = item.getBoundingClientRect();

			// Lo que está fuera del viewport con holgura no se toca: escribir
			// en él es trabajo que no se ve.
			if (box.bottom < -240 || box.top > window.innerHeight + 240) continue;

			// -1 entra por abajo, 1 sale por arriba.
			const relative = (box.top + box.height / 2 - middle) / middle;
			const depth = Number(item.dataset.parallax) || 1;
			const sign = item.dataset.parallaxDir === 'reverse' ? -1 : 1;

			item.style.setProperty('--parallax-y', `${(relative * depth * sign * AMPLITUDE).toFixed(2)}px`);
		}
	};

	const schedule = () => {
		if (!raf) raf = requestAnimationFrame(update);
	};

	window.addEventListener('scroll', schedule, { passive: true });
	window.addEventListener('resize', schedule, { passive: true });
	update();
}

export { initParallax };
