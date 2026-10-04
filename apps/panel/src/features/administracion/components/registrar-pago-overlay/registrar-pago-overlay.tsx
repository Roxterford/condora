"use client";
import { OverlayProps } from "@/components/overlay";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAppForm } from "@/hooks/useAppForm";
import { ArrowRight, Box, Check, Search } from "lucide-react";
import { useEffect, useRef, useState, type SubmitEventHandler } from "react";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  RegistrarPagoOverlayUnidadesQuery,
  Unidad,
} from "@/providers/graphql/graphql";

import { MetodoDeOperacion, Moneda } from "@/providers/graphql/graphql";

import {
  DestinoDePago,
  registrarPagoDefaultValues,
  RegistrarPagoFormSchema,
  type RegistrarPagoFocusField,
} from "./schema";
import { MoneyInput } from "@/lib/components/money-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/useDebounce";
import { money } from "@/lib/money-display";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { useRegistrarPago } from "@/features/pagos/useRegistrarPago";
import { Spinner } from "@/components/ui/spinner";

const UnidadesQuery = graphql(/* GraphQL */ `
  query RegistrarPagoOverlayUnidades($codigo_like: String!) {
    unidades: obtenerUnidades(
      filter: { codigo: { like: $codigo_like } }
      paginator: { limit: 10, page: 1 }
    ) {
      data {
        id
        codigo
        wallet
        deuda
      }
    }
  }
`);

const DEUDAS_MOCK = [
  { id: "cuota-ago-2026", label: "Cuota Ago 2026 · $120" },
  { id: "cuota-jul-2026", label: "Cuota Jul 2026 · $120" },
  { id: "cuota-jun-2026", label: "Cuota Jun 2026 · $120" },
  { id: "proyecto-piscina", label: "Proyecto Piscina · $200" },
];

const DESTINOS = [
  {
    value: DestinoDePago.AbonoCuenta,
    titulo: "Abono a cuenta",
    descripcion: "No se liga a una deuda; queda disponible para pagos futuros",
  },
  {
    value: DestinoDePago.DeudaEspecifica,
    titulo: "Deuda específica",
    descripcion: "Tú eliges la cuota o proyecto a abonar",
  },
  {
    value: DestinoDePago.MasAntigua,
    titulo: "Más antigua primero (FIFO)",
    descripcion:
      "El sistema destina a la deuda de mayor antigüedad / vencimiento",
  },
  {
    value: DestinoDePago.Recargo,
    titulo: "Recargo por pago tardío primero",
    descripcion: "Aplica al interés/mora y luego al capital",
  },
  {
    value: DestinoDePago.MayorSaldo,
    titulo: "Mayor saldo primero",
    descripcion: "A la deuda pendiente más alta",
  },
  {
    value: DestinoDePago.Prorrateo,
    titulo: "Prorrateo",
    descripcion: "Reparte el monto entre todas las deudas según su saldo",
  },
];

const METODOS: Array<{ value: MetodoDeOperacion | null; label: string }> = [
  { value: null, label: "Seleccione un metodo" },
  { value: MetodoDeOperacion.PagoMovil, label: "Pago móvil" },
  { value: MetodoDeOperacion.TransferenciaNacional, label: "Transferencia" },
  {
    value: MetodoDeOperacion.TransferenciaInternacional,
    label: "Transferencia internacional",
  },
  { value: MetodoDeOperacion.Efectivo, label: "Efectivo" },
  { value: MetodoDeOperacion.Compensacion, label: "Compensación" },
];

export interface RegistrarPagoOverlayProps extends OverlayProps {
  onDone?: () => void;
  unidad?: UnidadPayload | null;
  /**
   * Campo que recibe el foco al abrir el overlay.
   * Por defecto es `"unidad"`, la primera campo del formulario.
   */
  initialFocus?: RegistrarPagoFocusField;
}

export function RegistrarPagoOverlay({
  initialFocus = "unidad",
  ...props
}: RegistrarPagoOverlayProps) {
  const registrarPago = useRegistrarPago();

  const form = useAppForm({
    defaultValues: registrarPagoDefaultValues,
    validators: {
      onChange: RegistrarPagoFormSchema,
      onBlur: RegistrarPagoFormSchema,
    },
    onSubmit: ({ value }) => {
      if (registrarPago.isPending) return;
      registrarPago.mutate(
        { ...value, unidad: value.unidad.codigo },
        {
          onSuccess(res) {
            if (res.errors) {
              toast.error("error", { description: res.errors.at(0)?.message });
            } else {
              form.reset();
              toast.success("Pago registrado (prototipo)", {
                description: `Unidad ${value.unidad} · ${value.monto} ${value.moneda}`,
              });
              props.onDone?.();
            }
          },
        },
      );
    },
  });

  const [vistaDestino, setVistaDestino] = useState<"lista" | "detalle">(
    "lista",
  );
  const [busquedaUnidad, setBusquedaUnidad] = useState("");

  const inputRefs = {
    unidad: useRef<HTMLInputElement>(null),
    monto: useRef<HTMLInputElement>(null),
    fecha: useRef<HTMLInputElement>(null),
    tasa: useRef<HTMLInputElement>(null),
    metodo: useRef<HTMLButtonElement>(null),
    referencia: useRef<HTMLInputElement>(null),
    concepto: useRef<HTMLInputElement>(null),
  } satisfies Record<
    RegistrarPagoFocusField,
    React.RefObject<HTMLElement | null>
  >;

  const unidades = useQuery<RegistrarPagoOverlayUnidadesQuery>({
    queryKey: ["unidades-pago-overlay", busquedaUnidad],
    enabled: busquedaUnidad.trim().length > 0,
    queryFn: async () => {
      const response = await execute(UnidadesQuery, {
        codigo_like: `%${busquedaUnidad}%`,
      });
      return response.data as RegistrarPagoOverlayUnidadesQuery;
    },
  });

  useEffect(() => {
    if (props.open) {
      setVistaDestino("lista");
      form.setFieldValue("unidad", props.unidad as any);
    }
  }, [props.open]);

  const handleSubmit: SubmitEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  return (
    <Dialog {...props} modal={false}>
      <DialogContent
        className="md:min-w-lg max-h-[90dvh] max-w-2xl"
        initialFocus={inputRefs[initialFocus]}
      >
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Registra un abono de una unidad y su destino de aplicación.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4 overflow-y-auto max-h-[70dvh] -mx-6 px-6 pb-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>Unidad</FieldLabel>
              <>
                <form.AppField
                  name="unidad"
                  children={(field) => (
                    <section className="space-y-2">
                      <BuscarUnidadCombobox
                        value={field.state.value}
                        data={unidades.data?.unidades?.data ?? []}
                        onDebouceInputChange={(v) => setBusquedaUnidad(v)}
                        onValueChange={field.handleChange}
                        inputRef={inputRefs.unidad}
                      />
                      {field.state.value && (
                        <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/30">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Box />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {field.state.value.codigo}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Propietario
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-sm">
                              Deuda
                              <strong className="text-red-600 ml-1">
                                {" "}
                                {money(field.state.value.deuda)}
                              </strong>
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-xs"
                              children={
                                <Link
                                  target="__blank"
                                  href={`/villas/${field.state.value.codigo}`}
                                >
                                  Ver más
                                </Link>
                              }
                            />
                          </div>
                        </div>
                      )}
                    </section>
                  )}
                />
              </>
            </Field>

            <Field>
              <FieldLabel>Moneda</FieldLabel>
              <form.AppField
                name="moneda"
                children={(field) => (
                  <Tabs
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as Moneda)}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value={Moneda.Ved}>VED</TabsTrigger>
                      <TabsTrigger value={Moneda.Usd}>USD</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Monto</FieldLabel>
              <MontoField form={form} inputRef={inputRefs.monto} />
            </Field>

            <Field>
              <FieldLabel>Fecha</FieldLabel>
              <form.AppField name="fecha">
                {(field) => (
                  <DatePickerInput
                    ref={inputRefs.fecha}
                    value={field.state.value}
                    locale="es-VE"
                    onChange={(e) => field.handleChange(e ?? new Date())}
                  />
                )}
              </form.AppField>
            </Field>

            <Field>
              <FieldLabel>Tasa</FieldLabel>
              <TasaField form={form} inputRef={inputRefs.tasa} />
            </Field>

            <Field>
              <FieldLabel>Método</FieldLabel>
              <form.AppField
                name="metodo"
                children={(field) => (
                  <Select
                    items={METODOS}
                    value={field.state.value ?? null}
                    onValueChange={(e) => field.handleChange(e!)}
                  >
                    <SelectTrigger ref={inputRefs.metodo}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Metodos de pago</SelectLabel>
                        {METODOS.map((m) => (
                          <SelectItem
                            key={m.value}
                            value={m.value}
                            disabled={m.value === null}
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Referencia (nº de comprobante)</FieldLabel>
              <form.AppField
                name="referencia"
                children={(field) => (
                  <Input
                    ref={inputRefs.referencia}
                    placeholder="Ej. 000123456789"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Concepto</FieldLabel>
              <form.AppField
                name="concepto"
                children={(field) => (
                  <Input
                    ref={inputRefs.concepto}
                    placeholder="Pago cuota Agosto"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />
            </Field>
          </div>

          <CalculoPreview form={form} />

          <Separator />

          <FieldSet className="gap-3">
            <FieldLegend variant="label">Destino de pago</FieldLegend>
            <form.Subscribe selector={(state) => state.values.destino}>
              {(destinoSeleccionado) => (
                <div className="overflow-hidden rounded-md">
                  <div
                    className="flex transition-transform duration-200 ease-out"
                    style={{
                      transform:
                        vistaDestino === "detalle"
                          ? "translateX(-100%)"
                          : "translateX(0)",
                    }}
                  >
                    <div className="w-full shrink-0 space-y-2">
                      <RadioGroup
                        value={destinoSeleccionado}
                        onValueChange={(value) => {
                          form.setFieldValue("destino", value as DestinoDePago);
                          setVistaDestino("detalle");
                        }}
                        className="gap-2"
                      >
                        {DESTINOS.map((opcion) => (
                          <FieldLabel
                            key={opcion.value}
                            data-state={
                              destinoSeleccionado === opcion.value
                                ? "checked"
                                : "unchecked"
                            }
                          >
                            <Field
                              orientation="horizontal"
                              data-disabled={
                                opcion.value != DestinoDePago.AbonoCuenta
                              }
                            >
                              <RadioGroupItem
                                value={opcion.value}
                                disabled={
                                  opcion.value != DestinoDePago.AbonoCuenta
                                }
                              />
                              <FieldContent>
                                <FieldTitle>{opcion.titulo}</FieldTitle>
                                <FieldDescription>
                                  {opcion.descripcion}
                                </FieldDescription>
                              </FieldContent>
                            </Field>
                          </FieldLabel>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="w-full shrink-0 space-y-2">
                      <button
                        type="button"
                        onClick={() => setVistaDestino("lista")}
                        className="mb-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        ← Atrás
                      </button>
                      <DestinoDetalle form={form} />
                    </div>
                  </div>
                </div>
              )}
            </form.Subscribe>
          </FieldSet>

          <div className="text-sm text-muted-foreground">
            En modo automático el sistema aplica según la regla elegida y reduce
            el saldo pendiente; el remanente queda como <b>saldo a favor</b> de
            la unidad.
          </div>

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
                  Registrar pago
                  {registrarPago.isPending ? (
                    <Spinner />
                  ) : (
                    <Check className="ml-2 h-4 w-4" />
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

function MontoField(props: {
  form: any;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <props.form.Subscribe
      selector={(state: any) => state.values.moneda}
      children={(moneda: Moneda) => (
        <props.form.AppField
          name="monto"
          children={(field: any) => (
            <div className="relative">
              <MoneyInput
                id="amount"
                ref={props.inputRef}
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v)}
                placeholder="0,00"
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {moneda === Moneda.Ved ? "Bs" : "$"}
              </span>
            </div>
          )}
        />
      )}
    />
  );
}

function TasaField({
  form,
  inputRef,
}: {
  form: any;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <form.AppField
      name="tasa"
      children={(field: any) => (
        <div className="relative">
          <MoneyInput
            id="tasa"
            ref={inputRef}
            value={field.state.value}
            onValueChange={(v) => field.handleChange(v)}
            placeholder="0,00"
            className="pr-24"
            fractionDigits={2}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            <ArrowRight size={15} /> 1,00 USD
          </span>
        </div>
      )}
    />
  );
}

function CalculoPreview(props: { form: any }) {
  return (
    <props.form.Subscribe
      selector={(state: any) => ({
        moneda: state.values.moneda,
        monto: state.values.monto,
        tasa: state.values.tasa,
      })}
      children={({
        moneda,
        monto,
        tasa,
      }: {
        moneda: Moneda;
        monto: number;
        tasa: number;
      }) => {
        if (!(
          (moneda === Moneda.Usd || moneda === Moneda.Ved) &&
          monto > 0 &&
          tasa > 0
        )) {
          return null;
        }
        const montoEnDolares =
          moneda === Moneda.Ved ? monto / 100 / tasa : monto / 100;
        const montoTotal = money(montoEnDolares, Moneda.Usd);
        return (
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <span className="font-semibold text-base">
              Total
            </span>
            <span className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>
              {montoTotal} USD
            </span>
          </div>
        );
      }}
    />
  );
}

function DestinoDetalle(props: { form: any }) {
  return (
    <props.form.Subscribe
      selector={(state: any) => state.values.destino}
      children={(destino: any) => {
        if (destino === DestinoDePago.DeudaEspecifica) {
          return (
            <div className="space-y-2">
              <div className="text-sm font-medium">Selecciona la deuda</div>
              <props.form.AppField
                name="deuda_especifica"
                children={(field: any) => (
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="">Deuda a abonar</option>
                    {DEUDAS_MOCK.map((deuda) => (
                      <option key={deuda.id} value={deuda.id}>
                        {deuda.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          );
        }

        if (destino === DestinoDePago.AbonoCuenta) {
          return (
            <div className="text-sm text-muted-foreground">
              El pago queda registrado como <b>saldo a favor</b> de la unidad;
              no requiere destino.
            </div>
          );
        }

        const esProrrateo = destino === DestinoDePago.Prorrateo;
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium">Deuda más antigua</div>
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Cuota Jun 2026</div>
                  <div className="text-xs text-muted-foreground">
                    Vencida hace 57 días
                    <span className="text-destructive">· +$3,60 (3%)</span>
                  </div>
                </div>
                <div className="font-semibold">$120</div>
              </div>
            </div>
            {esProrrateo && (
              <>
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Cuota Jul 2026</div>
                      <div className="text-xs text-muted-foreground">
                        Vencida hace 27 días
                      </div>
                    </div>
                    <div className="font-semibold">≈ $40</div>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Cuota Ago 2026</div>
                      <div className="text-xs text-muted-foreground">
                        Vence en 5 días
                      </div>
                    </div>
                    <div className="font-semibold">≈ $40</div>
                  </div>
                </div>
              </>
            )}
            <div className="text-xs text-muted-foreground">
              {destino === DestinoDePago.Recargo
                ? "Se aplica primero al recargo por pago tardío y luego al capital."
                : destino === DestinoDePago.MayorSaldo
                  ? "El pago se aplicará a la deuda de mayor saldo."
                  : destino === DestinoDePago.Prorrateo
                    ? "Reparto proporcional según el saldo de cada deuda."
                    : "El pago se aplicará a la deuda de mayor antigüedad."}
            </div>
          </div>
        );
      }}
    />
  );
}

type UnidadPayload = Pick<Unidad, "id" | "codigo" | "wallet"| "deuda">;

interface BuscarUnidadComboboxProps {
  value?: UnidadPayload;
  data: Array<UnidadPayload>;
  onDebouceInputChange?: (value: string) => void;
  onValueChange?: (value: UnidadPayload) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}
function BuscarUnidadCombobox({
  value,
  data,
  onDebouceInputChange,
  onValueChange,
  inputRef,
}: BuscarUnidadComboboxProps) {
  const onDebounceChange = useDebounce((v: string) =>
    onDebouceInputChange?.(v),
  );

  return (
    <Combobox<UnidadPayload>
      items={data}
      value={value}
      itemToStringLabel={(v) => v.codigo}
      onInputValueChange={onDebounceChange}
      onValueChange={(v) => v && onValueChange?.(v)}
    >
      <ComboboxInput
        ref={inputRef}
        placeholder="Buscar unidad..."
        showClear={!!value}
      >
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent alignOffset={-28} className="w-60">
        <ComboboxEmpty>Unidad no encontrada.</ComboboxEmpty>
        <ComboboxList>
          {(unidad: UnidadPayload) => (
            <ComboboxItem key={unidad.codigo} value={unidad} className="p-3">
              <span className="font-medium">{unidad.codigo}</span>
              <span className="text-sm text-muted-foreground">
                Deuda: {money(unidad.wallet)}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
