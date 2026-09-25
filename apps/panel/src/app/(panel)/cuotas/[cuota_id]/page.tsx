import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import styles from "./page.module.css";
import {
  Building2,
  CalendarDays,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  FileText,
  FolderKanban,
  Home,
  WalletCards,
} from "lucide-react";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";
import { renderGraphql } from "@/providers/graphql/render";
import { CuotaPageQuery } from "@/providers/graphql/graphql";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/ui/StatCard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DesgloseDeGastoItem } from "@/features/administracion/components/desglose_de_gastos";
import { money } from "@/lib/money-display";
import { GastosDesglose } from "./components/gastos-desglose";
import { EstadoPagosVilla } from "./components/estado-pagos-villa";

const PageQuery = graphql(/* GraphQL */ `
  query CuotaPage($cuota_id: String!) {
    cuota: obtenerCuota(id: $cuota_id) {
      __typename
      ... on Cuota {
        id
        mes
        anio
        registro
        recaudacion {
          moneda
          monto_estimado
          monto_recaudado
          monto_pendiente
          unidades_aplicadas
          unidades_solventes
          unidades_pendientes
        }
        gastos {
          __typename
          ... on Gasto {
            operacion
            concepto
            moneda
            monto
            fecha
            tasa
            total
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
      ... on CuotaEspecial {
        detalles {
          titulo
          descripcion
          justificacion
          fecha_limite
          estado
        }
      }
    }
  }
`);

type Cuota = NonNullable<CuotaPageQuery["cuota"]>;

export default async function CuotaPage({
  params,
}: {
  params: Promise<{ cuota_id: string }>;
}) {
  const { cuota_id } = await params;

  return renderGraphql(await execute(PageQuery, { cuota_id }), ({ cuota }) => {
    if (!cuota) {
      return <div>Not found</div>;
    }

    return (
      <>
        <header>
          <div>
            <h1>
              {cuota.__typename === "CuotaEspecial"
                ? cuota.detalles.titulo
                : `${cuota.mes} ${cuota.anio}`}
            </h1>
            <p className="page-description">
              Detalle de cuota{" "}
              {cuota.__typename === "CuotaEspecial" ? "especial" : "regular"}
            </p>
          </div>
        </header>

        <StatsSection cuota={cuota} />

        <RecaudacionSection cuota={cuota} />

        <ProyectoSection cuota={cuota} />

        <section className="mt-10">
          <h2>Estado de Pagos por Villa</h2>
          <p className="page-description">
            Seguimiento de pagos de cada villa para esta{" "}
            {cuota.__typename === "CuotaEspecial" ? "cuota especial" : "cuota"}
          </p>
          <Suspense fallback={null}>
            <EstadoPagosVilla cuota_id={cuota_id} />
          </Suspense>
        </section>
      </>
    );
  });
}

function StatsSection({ cuota }: { cuota: Cuota }) {
  const recaudacion = cuota.recaudacion;
  const porcentaje = porcentajeRecaudacion(recaudacion);
  const estado = estadoRecaudacion(porcentaje);

  return (
    <ul className="statcards | mt-10">
      <li>
        <StatCard
          title={"Presupuesto estimado"}
          value={money(recaudacion.monto_estimado, recaudacion.moneda)}
          subtitle={
            cuota.__typename === "CuotaEspecial"
              ? "Cuota especial"
              : "Cuota regular"
          }
          icon={<WalletCards className="text-primary" />}
          color="bg-primary/10"
        />
      </li>
      <li>
        <StatCard
          title={"Monto por villa"}
          value={money(montoPorVilla(recaudacion), recaudacion.moneda)}
          subtitle={"Estrategia lineal"}
          icon={<Home className="text-indigo-600" />}
          color="bg-indigo-100"
        />
      </li>
      <li>
        <StatCard
          title={"Unidades con deuda"}
          value={recaudacion.unidades_aplicadas}
          subtitle={`${recaudacion.unidades_solventes} solventes · ${recaudacion.unidades_pendientes} pendientes`}
          icon={<Building2 className="text-violet-600" />}
          color="bg-violet-100"
        />
      </li>
      <li>
        <StatCard
          title={"Fecha límite de pago"}
          value={
            cuota.__typename === "CuotaEspecial"
              ? format(cuota.detalles.fecha_limite, "d MMM yyyy", {
                  locale: es,
                })
              : "No aplica"
          }
          subtitle={
            cuota.__typename === "CuotaEspecial"
              ? cuota.detalles.titulo
              : "Cuota regular"
          }
          icon={<CalendarDays className="text-teal-600" />}
          color="bg-teal-100"
        />
      </li>
      <li>
        <StatCard
          title={"Estado de recaudación"}
          value={estado.label}
          valueClassName={estado.valueClassName}
          subtitle={`${porcentaje.toFixed(2)}% recaudado`}
          icon={estado.icon}
          color={estado.color}
        />
      </li>
    </ul>
  );
}

function RecaudacionSection({ cuota }: { cuota: Cuota }) {
  const recaudacion = cuota.recaudacion;
  const porcentaje = porcentajeRecaudacion(recaudacion);

  return (
    <section className="mt-10">
      <h2>Resumen de Recaudación</h2>
      <p className="page-description">
        Progreso de pagos recibidos para esta{" "}
        {cuota.__typename === "CuotaEspecial" ? "cuota especial" : "cuota"}
      </p>

      <div className="mt-10 flex justify-between gap-10">
        <div>
          <h3 className={styles.infobox__title}>Pagos recibidos</h3>
          <p className={styles.infobox__value}>
            {recaudacion.unidades_solventes}/{recaudacion.unidades_aplicadas}
          </p>
        </div>
        <div>
          <h3 className={styles.infobox__title}>Unidades pendientes</h3>
          <p className={styles.infobox__value}>
            {recaudacion.unidades_pendientes}
          </p>
        </div>
        <div>
          <h3 className={styles.infobox__title}>Monto recaudado</h3>
          <p className={styles.infobox__value}>
            {money(recaudacion.monto_recaudado, recaudacion.moneda)}
          </p>
        </div>
        <div>
          <h3 className={styles.infobox__title}>Monto pendiente</h3>
          <p className={styles.infobox__value}>
            {money(recaudacion.monto_pendiente, recaudacion.moneda)}
          </p>
        </div>
        <div>
          <h3 className={styles.infobox__title}>Porcentaje</h3>
          <p className={styles.infobox__value}>{porcentaje.toFixed(2)}%</p>
        </div>
      </div>

      <div className="text-end">
        <span className="text-muted-foreground">{porcentaje.toFixed(2)}%</span>
        <Progress value={porcentaje} />
      </div>
    </section>
  );
}

function ProyectoSection({ cuota }: { cuota: Cuota }) {
  const esEspecial = cuota.__typename === "CuotaEspecial";

  return (
    <>
      <section className="mt-10">
        <h2>Detalles del Proyecto</h2>
        <p className="page-description">
          Información del proyecto asociado, si la cuota lo posee
        </p>

        <div className="mt-6">
          {esEspecial ? (
            <div className="space-y-6">
              <div>
                <h3>Descripción</h3>
                {cuota.detalles.descripcion ? (
                  <p className="mt-1">{cuota.detalles.descripcion}</p>
                ) : (
                  <div className="mt-1 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Esta cuota no incluye una descripción del proyecto
                  </div>
                )}
              </div>
              <div>
                <h3>Justificación</h3>
                {cuota.detalles.justificacion ? (
                  <p className="mt-1">{cuota.detalles.justificacion}</p>
                ) : (
                  <div className="mt-1 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Esta cuota no incluye una justificación
                  </div>
                )}
              </div>
              <div>
                <h3>Documentos adjuntos</h3>
                <div className="mt-4">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileText />
                      </EmptyMedia>
                      <EmptyTitle>Sin documentos</EmptyTitle>
                      <EmptyDescription>
                        No hay documentos adjuntos para esta cuota
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              </div>
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban />
                </EmptyMedia>
                <EmptyTitle>Cuota regular</EmptyTitle>
                <EmptyDescription>
                  Esta cuota no está asociada a ningún proyecto
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2>Desglose de gastos</h2>
        <p className="page-description">
          Desglose de gastos asociados a esta cuota
        </p>

        <div className="mt-6">
          <GastosDesglose
            gastos={cuota.gastos.reduce<DesgloseDeGastoItem[]>(
              (acc, it) =>
                it.__typename !== "GastoAProveedor" ? acc : [...acc, it],
              [],
            )}
          />
        </div>
      </section>
    </>
  );
}

function porcentajeRecaudacion(recaudacion: Cuota["recaudacion"]): number {
  if (!recaudacion.monto_estimado) return 0;
  return (recaudacion.monto_recaudado / recaudacion.monto_estimado) * 100;
}

function montoPorVilla(recaudacion: Cuota["recaudacion"]): number {
  if (!recaudacion.unidades_aplicadas) return 0;
  return recaudacion.monto_estimado / recaudacion.unidades_aplicadas;
}

function estadoRecaudacion(porcentaje: number): {
  label: string;
  icon: React.ReactNode;
  color: string;
  valueClassName?: string;
} {
  if (porcentaje >= 100) {
    return {
      label: "Recaudada",
      icon: <CircleCheckBig className="text-green-700" />,
      color: "bg-green-100",
      valueClassName: "text-green-700",
    };
  }
  if (porcentaje > 0) {
    return {
      label: "En curso",
      icon: <CircleAlert className="text-yellow-700" />,
      color: "bg-yellow-100",
      valueClassName: "text-yellow-700",
    };
  }
  return {
    label: "Sin recaudación",
    icon: <CircleDashed className="text-gray-500" />,
    color: "bg-gray-100",
    valueClassName: "text-gray-500",
  };
}
