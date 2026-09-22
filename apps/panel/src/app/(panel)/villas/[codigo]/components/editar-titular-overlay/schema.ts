import * as v from "valibot";
import { TipoDeSujeto, VillaPageQuery } from "@/providers/graphql/graphql";

type Unidad = NonNullable<VillaPageQuery["unidad"]>;

export type TitularSujeto = NonNullable<Unidad["titulares"]>[number];

export const EditarTitularSchema = v.variant("tipo", [
  v.object({
    tipo: v.literal(TipoDeSujeto.PersonaNatural),
    documento_identidad: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(3, "Ingrese el documento de identidad"),
    ),
    nombres: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(2, "Ingrese los nombres"),
    ),
    apellidos: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(2, "Ingrese los apellidos"),
    ),
    email: v.pipe(v.string(), v.trim(), v.email("Ingrese un email válido")),
    telefono: v.pipe(v.string(), v.trim(), v.minLength(7, "Ingrese el teléfono")),
  }),
  v.object({
    tipo: v.literal(TipoDeSujeto.EnteJuridico),
    documento_identidad: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(3, "Ingrese el documento de identidad"),
    ),
    razon_social: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(3, "Ingrese la razón social"),
    ),
    email: v.pipe(v.string(), v.trim(), v.email("Ingrese un email válido")),
    telefono: v.pipe(v.string(), v.trim(), v.minLength(7, "Ingrese el teléfono")),
  }),
]);

export type EditarTitularForm = v.InferOutput<typeof EditarTitularSchema>;

export function editarTitularDefaultValues(
  titular: TitularSujeto,
): EditarTitularForm {
  if (titular.__typename === "Ente") {
    return {
      tipo: TipoDeSujeto.EnteJuridico,
      documento_identidad: titular.cedula,
      razon_social: titular.razon_social,
      email: titular.email,
      telefono: titular.telefono,
    };
  }

  return {
    tipo: TipoDeSujeto.PersonaNatural,
    documento_identidad: titular.cedula,
    nombres: titular.nombres,
    apellidos: titular.apellidos,
    email: titular.email,
    telefono: titular.telefono,
  };
}
