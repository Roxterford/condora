import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Building2,
  IdCard,
  Mail,
  Phone,
  StickyNote,
  UsersRound,
} from "lucide-react";
import { AvatarIniciales } from "@/components/avatar-iniciales/avatar-iniciales";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { VillaPageQuery } from "@/providers/graphql/graphql";
import { EditarTitularButton } from "./editar-titular-button";
import { RegistrarTitularButton } from "./registrar-titular-button";

type Unidad = NonNullable<VillaPageQuery["unidad"]>;
type Titular = NonNullable<Unidad["titulares"]>[number];

export function DocumentosSection({ unidad }: { unidad: Unidad }) {
  const titulares = unidad.titulares ?? [];

  return (
    <>
      <h3>Información de la propiedad</h3>
      <p className="page-description">
        Documentos de identidad y datos de contacto de la propiedad
      </p>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <h4 className="font-medium text-foreground">Titulares</h4>
          {titulares.length > 0 && <RegistrarTitularButton variant="ghost" />}
        </div>

        {titulares.length === 0 ? (
          <Empty className="mt-4">
            <EmptyMedia variant="icon">
              <UsersRound />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Sin titulares registrados</EmptyTitle>
              <EmptyDescription>
                Esta propiedad aún no tiene titulares. Registra a la primera
                persona natural o ente jurídico como titular.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <RegistrarTitularButton />
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="space-y-5 mt-4">
            {titulares.map((titular) => (
              <TitularDocumento
                key={titular.id}
                titular={titular}
                esPrincipal={titular.id === unidad.titular_primario?.id}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h4 className="font-medium text-foreground">
          Contacto de la propiedad
        </h4>
        <ul className="space-y-5 mt-4">
          <PersonalIdentificacion persona={unidad.contacto} />
        </ul>
      </section>
    </>
  );
}

function TitularDocumento({
  titular,
  esPrincipal,
}: {
  titular: Titular;
  esPrincipal: boolean;
}) {
  const esEnte = titular.__typename === "Ente";

  return (
    <li className="rounded-xl border p-4 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 items-center">
          <AvatarIniciales nombre={titular.display_name} />
          <div className="grid gap-1">
            <div className="flex gap-2 items-center">
              <p className="font-medium">{titular.display_name}</p>
              {esPrincipal && (
                <Badge className="bg-teal-100 text-teal-700">Principal</Badge>
              )}
              <Badge
                variant="secondary"
                className={esEnte ? "bg-amber-100 text-amber-700" : ""}
              >
                {esEnte ? "Ente jurídico" : "Persona natural"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{titular.cedula}</p>
          </div>
        </div>
        <EditarTitularButton titular={titular} />
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        <Dato icon={<IdCard />} label="Documento" value={titular.cedula} />
        <Dato icon={<Mail />} label="Email" value={titular.email} />
        <Dato icon={<Phone />} label="Teléfono" value={titular.telefono} />
        <Dato
          icon={<StickyNote />}
          label="Registro"
          value={format(titular.registro, "d MMM yyyy", { locale: es })}
        />
        {esEnte && (
          <>
            <Dato
              icon={<Building2 />}
              label="Razón social"
              value={titular.razon_social}
            />
            {titular.representante && (
              <Dato
                icon={<Building2 />}
                label="Representante"
                value={`${titular.representante.display_name} · ${titular.representante.cedula}`}
              />
            )}
          </>
        )}
      </dl>
    </li>
  );
}

function PersonalIdentificacion({ persona }: { persona: Unidad["contacto"] }) {
  if (!persona) {
    return (
      <li className="text-sm text-muted-foreground">
        No se ha designado un contacto para esta propiedad
      </li>
    );
  }

  return (
    <li className="rounded-xl border p-4 space-y-3">
      <div className="flex gap-3 items-center">
        <AvatarIniciales nombre={persona.display_name} />
        <div className="grid gap-1">
          <p className="font-medium">{persona.display_name}</p>
          <p className="text-sm text-muted-foreground">{persona.cedula}</p>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        <Dato icon={<IdCard />} label="Documento" value={persona.cedula} />
        <Dato icon={<Mail />} label="Email" value={persona.email} />
        <Dato icon={<Phone />} label="Teléfono" value={persona.telefono} />
      </dl>
    </li>
  );
}

function Dato({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
