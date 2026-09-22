import { OverlayProps } from "@/components/overlay";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import styles from "./gasto-sidebar.module.css";
import { Proveedor } from "@/providers/graphql/graphql";

export interface GastoSidebarData {
  id: string;
  concepto: string;
  monto_total: number;
  fecha: Date;
  tasa: number;
  proveedor: Pick<Proveedor, "nombre" | "rif" | "telefono" | "email">;
}

export interface GastoSidebar extends OverlayProps {
  data?: GastoSidebarData;
}

export function GastoSidebar({
  open,
  onOpenChange,
  data: gasto,
}: GastoSidebar) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader className="px-8">
          <div className="flex gap-2 items-center">
            <SheetTitle className="font-semibold text-lg">
              Información de Pago
            </SheetTitle>
            <Badge variant="secondary">{gasto?.id.slice(-6) || "nil"}</Badge>
          </div>
        </SheetHeader>
        <div className="overflow-y-auto space-y-8">
          <section className={styles.section}>
            <div className={styles.infoboxes}>
              <div className={styles.infobox}>
                <span className={styles.infobox__title}>Total</span>
                <p className={`${styles.infobox__value} text-lg font-bold`}>
                  $ {gasto?.monto_total || "0,00"}
                </p>
              </div>
              <div className={styles.infoboxes__separator}></div>
              <div className={styles.infobox}>
                <span className={styles.infobox__title}>Tasa</span>
                <p className={styles.infobox__value}>Bs. {gasto?.tasa}</p>
              </div>
              <div className={styles.infoboxes__separator}></div>
              <div className={styles.infobox}>
                <span className={styles.infobox__title}>Fecha</span>
                <p className={styles.infobox__value}>
                  {gasto?.fecha.toLocaleDateString("es")}
                </p>
              </div>
            </div>
          </section>
          <section className={[styles.section, "space-y-5"].join(" ")}>
            <div className={styles.infobox}>
              <span className={[styles.infobox__title, ""].join(" ")}>
                Concepto
              </span>
              <p
                className={[
                  styles.infobox__value,
                  gasto?.concepto ? "" : "text-gray-300",
                ].join(" ")}
              >
                {gasto?.concepto || "(Sin concepto)"}
              </p>
            </div>
            <div className={styles.infobox}>
              <span className={styles.infobox__title}>Monto</span>
              <p className={styles.infobox__value}>{gasto?.monto_total} </p>
            </div>
          </section>
          <section className={styles.section}>
            <div className={styles.infoboxes}>
              <div className={styles.infobox} data-type="sm">
                <span className={styles.infobox__title}>ID</span>
                <p className={styles.infobox__value}>{gasto?.id}</p>
              </div>
              <div className={styles.infobox} data-type="sm">
                <span className={styles.infobox__title}>Registro</span>
                <p className={styles.infobox__value}>
                  {gasto?.fecha.toLocaleString("es-VE")}
                </p>
              </div>
            </div>
          </section>
          <section className={[styles.section, "space-y-2"].join(" ")}>
            <p className="font-semibold" style={{ fontSize: "1.1em" }}>
              Proveedor
            </p>
            <div className="grid place-items-center select-none rounded-lg size-15 font-medium text-3xl bg-indigo-100 text-indigo-500">
              {gasto?.proveedor.nombre.charAt(0).toUpperCase()}
            </div>
            <table className="w-full">
              <tbody>
                <tr>
                  <th className="text-start py-2">Nombre:</th>
                  <td className="text-end py-2">{gasto?.proveedor.nombre}</td>
                </tr>
                <tr>
                  <th className="text-start py-2">CI / RIF:</th>
                  <td className="text-end py-2">{gasto?.proveedor.rif}</td>
                </tr>
                <tr>
                  <th className="text-start py-2">Teléfono</th>
                  <td className="text-end py-2">{gasto?.proveedor.telefono}</td>
                </tr>
                <tr>
                  <th className="text-start py-2">Correo:</th>
                  <td className="text-end py-2">{gasto?.proveedor.email}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
