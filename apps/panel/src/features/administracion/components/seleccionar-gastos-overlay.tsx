import { OverlayProps } from "@/components/overlay/overlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Check,
  ChevronRight,
  Plus,
  ReceiptText,
  SearchX,
  X,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";
import { useOverlay } from "@/hooks/useOverlay";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  GastoSidebar,
  GastoSidebarData,
} from "@/features/administracion/components/gasto_sidebar/gasto-sidebar";
import { GastoAProveedor } from "@/providers/graphql/graphql";
import { toast } from "sonner";

export interface SeleccionarGastosOverlayProps extends Omit<
  OverlayProps,
  "onDone"
> {
  omitIDs?: string[];
  onDone?(values: Array<GastoAProveedor>): void;
  onBack?(): void;
}

export function SeleccionarGastosOverlay(props: SeleccionarGastosOverlayProps) {
  const [gastos_selectos, setGastosSelectos] = useState<Array<GastoAProveedor>>(
    [],
  );
  const [gasto_detalle, setGastoDetalle] = useState<GastoSidebarData | null>(
    null,
  );
  const verDetalles = useOverlay();

  const handleVerDetalles = (g: GastoAProveedor) => {
    setGastoDetalle({
      id: g.operacion,
      concepto: g.concepto,
      monto_total: g.total,
      fecha: g.fecha,
      tasa: g.tasa,
      proveedor: g.proveedor,
    });
    verDetalles.open();
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Gastos</DialogTitle>
          <DialogDescription>
            Se encontraron gastos no asociados a ninguna cuota.
          </DialogDescription>
        </DialogHeader>
        <form>
          <Busqueda
            onAdd={(it) => setGastosSelectos((s) => [...s, it])}
            onVerDetalles={handleVerDetalles}
            omitIDs={gastos_selectos
              .map((it) => it.operacion ?? "")
              .concat(props.omitIDs ?? [])}
          />
        </form>
        <section>
          <p className="font-semibold">
            Gastos
            {gastos_selectos.length > 0 && (
              <>
                {" "}
                <span>({gastos_selectos.length})</span>
              </>
            )}
          </p>
          <hr />
          <ul className="mt-3  -mx-6 px-6 space-y-5 max-h-[40vh] min-h-[30vh] overflow-y-auto">
            {gastos_selectos.length === 0 && (
              <li className="grid">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ReceiptText />
                    </EmptyMedia>
                    <EmptyTitle>Añadir gastos</EmptyTitle>
                    <EmptyDescription>
                      Usa el buscador para agregar gastos sin asociar.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </li>
            )}
            {gastos_selectos.map((g) => (
              <li
                className="flex justify-between items-center py-2"
                key={g.operacion}
              >
                <div>
                  <p className="font-semibold">{g.concepto}</p>
                  <p className="text-sm text-gray-500">
                    {g.fecha?.toLocaleString()}
                  </p>
                </div>
                <div></div>
                <div className="flex gap-2">
                  <Button
                    variant={"outline"}
                    onClick={() => handleVerDetalles(g)}
                  >
                    Ver Detalles
                    <ChevronRight size={16} />
                  </Button>
                  <Button
                    variant={"outline"}
                    onClick={() =>
                      setGastosSelectos((s) =>
                        s.filter((it) => it.operacion != g.operacion),
                      )
                    }
                  >
                    Remover <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="flex gap-2 justify-end items-center">
          <Button
            variant={"outline"}
            onClick={() => props.onBack?.()}
          >
            Atras
          </Button>
          <Button
            onClick={() => {
              setGastosSelectos([]);
              props.onDone?.(gastos_selectos);
            }}
          >
            Añadir <Check />
          </Button>
        </section>
      </DialogContent>
      <GastoSidebar
        data={gasto_detalle ?? undefined}
        {...verDetalles.overlayProps}
      />
    </Dialog>
  );
}

// TODO: Añade un filtro para omitir los gastos omitidos (gastos ya selectos)
const BusquedaQuery = graphql(/* GraphQL */ `
  query BuscarGastosHuerfanos($busqueda: String) {
    gastos: obtenerGastos(
      filter: { concepto: { like: $busqueda }, cuota: { eq: null } }
    ) {
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
          metodo
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
            actualizado_en
            creado_en
            direccion
          }
        }
      }
    }
  }
`);

interface BusquedaProps {
  onAdd(transaccion: GastoAProveedor): void;

  onVerDetalles?(gasto: GastoAProveedor): void;
  omitIDs: string[];
}

function Busqueda({ onAdd, onVerDetalles, omitIDs }: BusquedaProps) {
  const state = useOverlay();

  const [busqueda, setBusqueda] = useState("");
  const buscarOperaciones = useQuery({
    queryKey: ["operaciones.search", busqueda],
    queryFn: ({ queryKey: [, busqueda] }) =>
      execute(BusquedaQuery, { busqueda }),
  });

  const handleDebouceChange = useDebounce((v: string) => {
    setBusqueda(`%${v}%`);
  });

  useEffect(() => {
    if (busqueda === "") return;
    state.open();
  }, [busqueda]);

  useEffect(() => {
    if (
      buscarOperaciones.isSuccess &&
      buscarOperaciones.data &&
      buscarOperaciones.data.errors
    ) {
      console.error(buscarOperaciones.data.errors);
      toast.error("error", {
        description: () => (
          <pre>{JSON.stringify(buscarOperaciones.data?.errors, null, 2)}</pre>
        ),
      });
    }
  }, [buscarOperaciones.isSuccess, buscarOperaciones.data]);

  return (
    <Popover
      open={state.isOpen}
      onOpenChange={(open) => {
        if (!open) state.close();
      }}
    >
      <PopoverTrigger
        nativeButton={false}
        render={
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(e) => handleDebouceChange(e.target.value)}
              onFocus={state.open}
              placeholder="Ej. Reparación de Bomba de Agua"
            ></InputGroupInput>
          </InputGroup>
        }
      />
      <PopoverContent
        align="center"
        side="bottom"
        collisionAvoidance={{ side: "flip", fallbackAxisSide: "none" }}
        className="w-(--anchor-width) max-h-[30vh]"
        initialFocus={false}
      >
        {(buscarOperaciones.data?.data?.gastos.data.filter(
          (it) => !omitIDs.includes(it.operacion),
        ).length ?? 0) === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>Sin resultados</EmptyTitle>
              <EmptyDescription>
                No se encontraron gastos sin asociar con ese nombre.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-5 overflow-y-auto min-h-0 -mx-4 px-4">
            {buscarOperaciones.data?.data?.gastos.data
              .filter((it) => !omitIDs.includes(it.operacion))
              .map((gasto) => (
              <li
                className="flex justify-between items-center py-2"
                key={gasto.operacion}
              >
                <div>
                  <p className="font-semibold">{gasto.concepto}</p>
                  <p className="text-sm text-gray-500">
                    {gasto.fecha.toLocaleDateString()}
                  </p>
                </div>
                <div></div>
                <div className="flex gap-2">
                  <Button
                    variant={"outline"}
                    onClick={() => {
                      if (gasto.__typename !== "GastoAProveedor") return;

                      onVerDetalles?.(gasto);
                    }}
                  >
                    Ver Detalles
                    <ChevronRight size={16} />
                  </Button>
                  <Button
                    onClick={() => {
                      if (gasto.__typename !== "GastoAProveedor") return;

                      onAdd(gasto);
                    }}
                  >
                    Agregar <Plus />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
