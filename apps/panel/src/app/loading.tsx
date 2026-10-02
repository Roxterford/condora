/**
 * Fallback raíz de la navegación.
 *
 * Existe por dos motivos:
 *
 * 1. Garantizar el primer paint. Las páginas `villas/[codigo]`,
 *    `cuotas/[cuota_id]` y `cuotas/registrar` son Server Components que hacen
 *    `await execute()`. Sin un límite de Suspense por encima, un arranque en
 *    frío de la API retiene la respuesta HTML entera durante los 30-60 s que
 *    tarda Render, y el usuario vería una página en blanco durante ese tiempo.
 *    Con este fallback, React puede vaciar el shell (layout + pantalla de
 *    encendido) y luego ir rellenando la página.
 *
 * 2. Servir de estado de carga cuando la pantalla de encendido está apagada
 *    por `WAKE_SCREEN_ENABLED`. Por eso es autonomous: fondo, marca y texto.
 *
 * No carga el video a propósito. En la ruta normal queda tapada por la
 * pantalla de encendido, y en el resto de navegaciones no queremos pagar
 * ~280 KB por un skeleton.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[#05070a] px-6">
      <div className="relative flex size-12 items-center justify-center">
        <span className="wake-veil text-teal-400/40" />
        <span className="wake-veil text-teal-400/25 [animation-delay:0.9s]" />
        <span className="size-2.5 rounded-full bg-teal-400 shadow-[0_0_16px_rgba(20,184,166,0.8)]" />
      </div>

      <p className="font-mono text-[11px] tracking-[0.18em] text-white/35 uppercase">
        Conectando con tu condominio
      </p>

      <p className="max-w-sm text-pretty text-center text-[0.9375rem] leading-relaxed text-white/60">
        Estamos preparando la información y los avisos más recientes de tu comunidad.
      </p>

      <span className="sr-only">
        Conectando con tu condominio. Estamos preparando la información y los avisos más
        recientes de tu comunidad.
      </span>
    </div>
  );
}
