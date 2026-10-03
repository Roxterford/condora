function initAnimateOnScroll() {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
  const selectors = [
    '.animate-on-scroll',
    '.animate-fade',
    '.animate-slide-up',
    '.animate-slide-up-lg',
    '.animate-slide-down',
    '.animate-slide-left',
    '.animate-slide-right',
    '[data-animate-on-scroll]',
    '[data-animate-draw]'
  ].join(', ');

  const targets = document.querySelectorAll<HTMLElement>(selectors);
  if (targets.length === 0) return;

  if (REDUCED_MOTION.matches) {
    targets.forEach((el) => el.classList.add('animate-active'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('animate-active');
        observer.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -5% 0px', threshold: 0.05 }
  );

  targets.forEach((el) => {
    if (!el.classList.contains('animate-active')) {
      observer.observe(el);
    }
  });
}

export { initAnimateOnScroll };
