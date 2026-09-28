import Image from "next/image";

const HERO_IMAGE_SRC = "/images/login_hero.webp";

export function LoginShowcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-muted lg:block">
      <Image
        src={HERO_IMAGE_SRC}
        alt="Comunidad de condominios gestionando sus finanzas con Condora"
        fill
        sizes="50vw"
        quality={90}
        className="object-cover"
        priority
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-black/70" />

      <div className="absolute inset-0 flex flex-col justify-between p-10 pt-56 xl:p-14 xl:pt-36">
        <div className="space-y-5">
          <h2 className="text-4xl font-light uppercase leading-[1.05] tracking-[-0.02em] text-white xl:text-[3.25rem]">
            Gestión <span className="font-extrabold">Moderna</span>,
            <br />
            <span className="font-extrabold">Comunidad</span>{" "}
            <span className="font-extrabold">Transparente</span>
          </h2>
          <p className="max-w-[40ch] text-sm leading-relaxed text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)] xl:text-base">
            Administra tu condominio con eficiencia y claridad. Pagos, reportes
            y comunicación en un solo lugar
          </p>
        </div>

        <Image
          src="/condora_blanco.svg"
          alt="Condora"
          width={140}
          height={27}
          className="h-6 w-auto drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
        />
      </div>
    </aside>
  );
}
