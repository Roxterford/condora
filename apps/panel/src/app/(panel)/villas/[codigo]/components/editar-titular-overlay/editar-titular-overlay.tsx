"use client";

import { OverlayProps } from "@/components/overlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAppForm } from "@/hooks/useAppForm";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useEffect, type SubmitEventHandler } from "react";
import {
  editarTitularDefaultValues,
  EditarTitularSchema,
  TitularSujeto,
} from "./schema";

const EditarTitularMutation = graphql(/* GraphQL */ `
  mutation EditarTitular($id: ID!, $data: ActualizarSujetoDTO!) {
    actualizarSujeto(id: $id, data: $data)
  }
`);

export type EditarTitularOverlayProps = OverlayProps & {
  titular: TitularSujeto;
};

export function EditarTitularOverlay({
  titular,
  ...props
}: EditarTitularOverlayProps) {
  const router = useRouter();
  const esEnte = titular.__typename === "Ente";

  const editar = useMutation({
    mutationKey: ["villas.editar-titular", titular.id],
    mutationFn: (variables: {
      id: string;
      data: { email: string; telefono: string };
    }) => execute(EditarTitularMutation, variables),
  });

  const form = useAppForm({
    defaultValues: editarTitularDefaultValues(titular),
    validators: {
      onChange: EditarTitularSchema,
      onBlur: EditarTitularSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await editar.mutateAsync({
        id: titular.id,
        data: { email: value.email, telefono: value.telefono },
      });

      if (res.errors?.length) {
        return toast.error(res.errors.at(0)?.message);
      }

      toast.success("Titular actualizado", {
        description: `${titular.display_name} fue actualizado correctamente`,
      });
      router.refresh();
      props.onDone?.();
    },
  });

  useEffect(() => {
    if (props.open) {
      form.reset();
    }
  }, [props.open]);

  const handleSubmit: SubmitEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar titular</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Actualiza la información de contacto de {titular.display_name}.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <FieldSet className="gap-4">
            <form.AppField name="documento_identidad">
              {(field) => (
                <Field>
                  <FieldLabel>Documento de identidad (RIF/C.I.)</FieldLabel>
                  <FieldContent>
                    <Input disabled value={field.state.value} />
                    <FieldError errors={field.state.meta.errors} />
                  </FieldContent>
                </Field>
              )}
            </form.AppField>

            {esEnte ? (
              <form.AppField name="razon_social">
                {(field) => (
                  <Field>
                    <FieldLabel>Razón social</FieldLabel>
                    <FieldContent>
                      <Input disabled value={field.state.value} />
                      <FieldError errors={field.state.meta.errors} />
                    </FieldContent>
                  </Field>
                )}
              </form.AppField>
            ) : (
              <>
                <form.AppField name="nombres">
                  {(field) => (
                    <Field>
                      <FieldLabel>Nombres</FieldLabel>
                      <FieldContent>
                        <Input disabled value={field.state.value} />
                        <FieldError errors={field.state.meta.errors} />
                      </FieldContent>
                    </Field>
                  )}
                </form.AppField>
                <form.AppField name="apellidos">
                  {(field) => (
                    <Field>
                      <FieldLabel>Apellidos</FieldLabel>
                      <FieldContent>
                        <Input disabled value={field.state.value} />
                        <FieldError errors={field.state.meta.errors} />
                      </FieldContent>
                    </Field>
                  )}
                </form.AppField>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.AppField name="email">
                {(field) => (
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <FieldContent>
                      <Input
                        type="email"
                        placeholder="ej. titular@correo.com"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </FieldContent>
                  </Field>
                )}
              </form.AppField>
              <form.AppField name="telefono">
                {(field) => (
                  <Field>
                    <FieldLabel>Teléfono</FieldLabel>
                    <FieldContent>
                      <Input
                        placeholder="Ej. 0414-1234567"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </FieldContent>
                  </Field>
                )}
              </form.AppField>
            </div>
          </FieldSet>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onOpenChange?.(false)}
            >
              Cancelar
            </Button>
            <form.Subscribe
              selector={(state) => state.isValid}
              children={(isValid) => (
                <Button type="submit" disabled={!isValid}>
                  Guardar cambios
                  {editar.isPending ? (
                    <Spinner />
                  ) : (
                    <Check className="ml-1 h-4 w-4" />
                  )}
                </Button>
              )}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
