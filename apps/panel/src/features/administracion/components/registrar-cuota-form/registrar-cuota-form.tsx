"use client";

import { Button } from "@/components/ui/button";
import { useAppForm } from "@/hooks/useAppForm";
import { useOverlay } from "@/hooks/useOverlay";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import {
  Gasto,
  GastoAProveedor,
  Mes,
  Proveedor,
  RegistrarCuotaDto,
  TipoDeCuota,
  TypedDocumentString,
} from "@/providers/graphql/graphql";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, ShieldAlert, TriangleAlert } from "lucide-react";
import { useEffect, useState, type SubmitEventHandler } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { money } from "@/lib/money-display";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { HoldToConfirmButton } from "@/components/hold-to-confirm/hold-to-confirm-button";
import { AgregarGastoOverlay } from "../agregar-gasto-overlay";
import { DesgloseDeGastoItem, DesgloseDeGastos } from "../desglose_de_gastos";
import { GastoSidebar, GastoSidebarData } from "../gasto_sidebar/gasto-sidebar";
import { RegistrarGastoOverlay } from "../registrar_gasto_overlay";
import {
  SeleccionarGastosOverlay,
  SeleccionarGastosOverlayProps,
} from "../seleccionar-gastos-overlay";
import { EstrategiaDeDistribucionField } from "./fields/estrategia-de-distribucion";
import { PeriodoField } from "./fields/periodo";
import { TipoDeCuotaField } from "./fields/tipo-de-cuota";
import { defaultValues, MESES, RegistrarCuotaFormSchema } from "./schema";
import { ResumenDeCalculo } from "./resumen-de-calculo";

const PeriodosDisponiblesQuery = graphql(/* GraphQL */ `
  query ObtenerPerodosDisponibles {
    periodos: obtenerPeriodosDisponibles {
      anio
      mes
    }
  }
`);

const ResumenUnidadesQuery = graphql(/* GraphQL */ `
  query ResumenUnidadesParaCuota {
    resumen: obtenerResumenUnidades {
      unidades_activas
    }
  }
`);

const RegistrarCuotaMutation = graphql(/* GraphQL */ `
  mutation RegistrarCuota($input: RegistrarCuotaDTO!) {
    registrarCuota(input: $input) {
      __typename
      ... on Cuota {
        id
      }
    }
  }
`);

type ObtenerGastosHuerfanosResult = {
	gastos: { data: Array<Gasto | GastoAProveedor> };
};

const ObtenerGastosHuerfanosDocument = new TypedDocumentString<
	ObtenerGastosHuerfanosResult,
	Record<string, never>
>(`
  query ObtenerGastosHuerfanos {
    gastos: obtenerGastos(filter: { cuota: { eq: null } }) {
      data {
        __typename
        ... on Gasto {
          monto
          total
          operacion
          concepto
          metodo
          moneda
          tasa
          fecha
          registrado_por
          registro
        }
        ... on GastoAProveedor {
          proveedor {
            id
            nombre
            rif
            telefono
            email
          }
        }
      }
    }
  }
`);

export interface RegistrarCuotaFormProps {
  proveedores: Pick<Proveedor, "id" | "nombre">[];
}

export function RegistrarCuotaForm({ proveedores }: RegistrarCuotaFormProps) {
  const router = useRouter();
  const agregarGastoOverlay = useOverlay();
  const registrarGastoOverlay = useOverlay();
  const seleccionarGastosOverlay = useOverlay();
  const gastoSidebar = useOverlay();
  const confirmarCuota = useOverlay();
  const [selectedGasto, setSelectedGasto] = useState<GastoSidebarData | null>(
    null,
  );

  const [gastos, setGastos] = useState<DesgloseDeGastoItem[]>([]);

  const periodos = useQuery({
    queryKey: ["periodos.disponibles"],
    queryFn: () => execute(PeriodosDisponiblesQuery),
    select: ({ data, errors }) => {
      if (errors || !data) return;

      return data.periodos.reduce<Map<number, Set<Mes>>>((acc, it) => {
        const meses = acc.get(it.anio) ?? new Set<Mes>();
        meses.add(it.mes);
        return acc.set(it.anio, meses);
      }, new Map());
    },
  });

  const registrar = useMutation({
    mutationFn: (input: RegistrarCuotaDto) =>
      execute(RegistrarCuotaMutation, { input }),
  });

  const resumen = useQuery({
    queryKey: ["cuotas.registrar.resumen"],
    queryFn: () => execute(ResumenUnidadesQuery),
    select: ({ data }) => data?.resumen?.unidades_activas,
  });

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: RegistrarCuotaFormSchema,
      onBlur: RegistrarCuotaFormSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await registrar.mutateAsync({
        anio: value.anio_actual ? new Date().getFullYear() : value.anio,
        mes: value.mes,
        fecha_limite: value.fecha_limite,
        gastos: value.gastos.filter(Boolean),
        tipo: value.tipo,
      });

      if (res.errors?.length) {
        return toast.error(res.errors.at(0)?.message, {
          description: JSON.stringify(res.errors.at(0)?.locations, null, 4),
        });
      }

      toast.success("Cuota registrada con exito");
      const cuota = res.data?.registrarCuota;
      if (cuota) {
        router.push(`/cuotas/${cuota.id}`);
      }
    },
  });

  const handleGastosSelectos: SeleccionarGastosOverlayProps["onDone"] = (
    gastos,
  ) => {
    setGastos((prev) => [...prev, ...gastos]);
  };

  const handleDesglosePress = (gasto: DesgloseDeGastoItem) => {
    setSelectedGasto({
      id: gasto.operacion,
      concepto: gasto.concepto,
      monto_total: gasto.total,
      fecha: gasto.fecha,
      tasa: gasto.tasa,
      proveedor: gasto.proveedor,
    });
    gastoSidebar.open();
  };

  const handleSubmit: SubmitEventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    form.handleSubmit();
  };

  const handleConfirmarCuota = () => {
    confirmarCuota.close();
    form.handleSubmit();
  };

  useEffect(() => {
    form.setFieldValue("gastos", (prev) => gastos.map((it) => it.operacion));
  }, [gastos]);

  return (
    <>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <TipoDeCuotaField form={form} />
        <PeriodoField
          periodos={periodos.data}
          isLoading={periodos.isLoading}
          form={form}
        />

        <section>
          <div className="flex justify-between items-center">
            <h3>
              Desglose de gastos
              {gastos.length > 0 && <> ({gastos.length})</>}
            </h3>
            <Button
              type="button"
              variant="outline"
              onClick={agregarGastoOverlay.open}
            >
              <Plus /> Agregar Gasto
            </Button>
          </div>
          <DesgloseDeGastos
            data={gastos}
            onGastoPress={handleDesglosePress}
            onRemove={(g) =>
              setGastos((prev) =>
                prev.filter((it) => it.operacion != g.operacion),
              )
            }
          />
        </section>

        <EstrategiaDeDistribucionField form={form} />

        <form.Subscribe
          selector={(state) => state.values.estrategia}
          children={(estrategia) => (
            <ResumenDeCalculo
              gastos={gastos}
              estrategia={estrategia}
              unidadesActivas={resumen.data}
              isLoadingUnidades={resumen.isLoading}
            />
          )}
        />

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground/80">
          <TriangleAlert className="size-3.5 shrink-0" />
          <span>Una vez creada la cuota, esta acción no se puede deshacer.</span>
        </p>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancelar
          </Button>
          <form.Subscribe
            selector={(state) => state.isValid}
            children={(isValid) => (
              <Button
                type="button"
                disabled={registrar.isPending || !isValid}
                onClick={confirmarCuota.open}
              >
                Registrar
                {registrar.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Check />
                )}
              </Button>
            )}
          />
        </div>
      </form>
      <ConfirmacionDeCuota
        form={form}
        gastos={gastos}
        {...confirmarCuota.overlayProps}
        onConfirm={handleConfirmarCuota}
      />
      <GastoSidebar
        data={selectedGasto || undefined}
        {...gastoSidebar.overlayProps}
      />
      <AgregarGastoOverlay
        onSelect={(op) => {
          agregarGastoOverlay.close();
          if (op == "nuevo") return registrarGastoOverlay.open();
          if (op == "seleccionar") return seleccionarGastosOverlay.open();
          if (op == "todos") {
            execute(ObtenerGastosHuerfanosDocument)
              .then((res) => {
                if (res.errors?.length) {
                  return toast.error(res.errors.at(0)?.message);
                }

                const items = (res.data?.gastos.data ?? [])
                  .filter((g): g is GastoAProveedor => "proveedor" in g)
                  .map((g) => ({
                    operacion: g.operacion,
                    concepto: g.concepto,
                    moneda: g.moneda,
                    monto: g.monto,
                    fecha: g.fecha,
                    tasa: g.tasa,
                    total: g.total,
                    proveedor: g.proveedor,
                  }));

                setGastos((prev) => {
                  const existentes = new Set(prev.map((p) => p.operacion));
                  return [
                    ...prev,
                    ...items.filter((i) => !existentes.has(i.operacion)),
                  ];
                });

                toast.success(
                  `${items.length} gasto(s) huérfano(s) añadido(s)`,
                );
              })
              .catch(() =>
                toast.error("No se pudieron cargar los gastos huérfanos"),
              );
            return;
          }
        }}
        {...agregarGastoOverlay.overlayProps}
      />
      <SeleccionarGastosOverlay
        {...seleccionarGastosOverlay.overlayProps}
        omitIDs={form.getFieldValue("gastos")}
        onDone={(values) => {
          seleccionarGastosOverlay.close();
          handleGastosSelectos(values);
        }}
        onBack={() => {
          seleccionarGastosOverlay.close();
          agregarGastoOverlay.open();
        }}
      />
      <RegistrarGastoOverlay
        proveedores={proveedores}
        {...registrarGastoOverlay.overlayProps}
        onBack={() => {
          registrarGastoOverlay.close();
          agregarGastoOverlay.open();
        }}
      />
    </>
  );
}

const TIPO_LABEL: Record<TipoDeCuota, string> = {
  [TipoDeCuota.Regular]: "Mensualidad regular",
  [TipoDeCuota.Especial]: "Cuota especial",
  [TipoDeCuota.Semilla]: "Cuota semilla",
};

function ConfirmacionDeCuota({
  form,
  gastos,
  open,
  onOpenChange,
  onConfirm,
}: {
  form: any;
  gastos: DesgloseDeGastoItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const totalGastos = gastos.reduce((acc, g) => acc + g.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmar registro de cuota</DialogTitle>
          <DialogDescription>
            Verifica los datos antes de registrar la cuota.
          </DialogDescription>
        </DialogHeader>
        <form.Subscribe
          selector={(state: any) => state.values}
          children={(v: any) => {
            const anio = v.anio_actual ? new Date().getFullYear() : v.anio;
            const mesLabel = MESES.find((m) => m.value === v.mes)?.label;
            const estrategia = v.estrategia
              ?.charAt(0)
              .toUpperCase()
              .concat(v.estrategia.slice(1));

            return (
              <div className="grid gap-5">
                <div className="divide-y divide-border rounded-md border bg-muted/30">
                  <FilaResumen
                    label="Tipo de cuota"
                    value={TIPO_LABEL[v.tipo as TipoDeCuota]}
                  />
                  <FilaResumen label="Periodo" value={`${mesLabel} ${anio}`} />
                  <FilaResumen
                    label="Fecha límite"
                    value={
                      <>
                        {v.fecha_limite
                          ? format(v.fecha_limite, "dd/MM/yyyy")
                          : "—"}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {v.fecha_limite
                            ? formatDistanceToNow(v.fecha_limite, {
                                addSuffix: true,
                                locale: es,
                              })
                            : ""}
                        </span>
                      </>
                    }
                  />
                  <FilaResumen label="Estrategia" value={estrategia} />
                  <FilaResumen label="Gastos asociados" value={String(gastos.length)} />
                  <FilaResumen label="Total en gastos" value={money(totalGastos)} />
                </div>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" />
                  <span>
                    Esta acción no se puede deshacer una vez creada la cuota.
                  </span>
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange?.(false)}
                  >
                    Cancelar
                  </Button>
                  <HoldToConfirmButton onConfirm={onConfirm} duration={1000}>
                    Mantén para confirmar
                    <ShieldAlert className="ml-2 h-4 w-4" />
                  </HoldToConfirmButton>
                </div>
              </div>
            );
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function FilaResumen({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4 px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium tabular-nums">{value || "—"}</span>
    </div>
  );
}
