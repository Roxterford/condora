"use client";

import {
  DollarSign,
  CircleDollarSign,
  AlertCircle,
  Receipt,
  CreditCardMinus,
  CreditCardPlus,
} from "lucide-react";

import StatCard from "../../../components/ui/StatCard";
import FinancialChart from "./components/FinancialChart";
import RecentPayments from "./components/RecentPayments";
import DashboardTabs from "./components/DashboardTabs";
import { Button } from "@/components/ui/button";
import { RegistrarGastoOverlay } from "@/features/administracion/components/registrar_gasto_overlay";
import { RegistrarPagoOverlay } from "@/features/administracion/components/registrar-pago-overlay";
import { useOverlay } from "@/hooks/useOverlay";
import { useQuery } from "@tanstack/react-query";
import { graphql } from "@/providers/graphql";
import { execute } from "@/providers/graphql/execute";

const PageQuery = graphql(/* GraphQL */ `
  query DashboardPage {
    proveedores: obtenerProveedores {
      id
      nombre
    }
  }
`);

export default function Dashboard() {
  const page = useQuery({
    queryKey: ["proveedores"],
    queryFn: () => execute(PageQuery),
  });

  const registrarGastoOverlay = useOverlay();
  const registrarPagoOverlay = useOverlay();
  return (
    <>
      {/* Title */}
      <header className="flex justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Condora
          </h1>
          <p className="text-lg text-gray-500 mt-2">
            Los Girasoles Villas Country
          </p>
        </div>

        <div className="flex self-start gap-2">
          <Button variant="outline" onClick={registrarGastoOverlay.open}>
            <CreditCardMinus /> Registrar Gasto
          </Button>
          <Button onClick={registrarPagoOverlay.open}>
            <CreditCardPlus /> Registrar Pago
          </Button>
        </div>
      </header>

      {/* Stat Cards */}
      <ul className="statcards | mt-8">
        <li>
          <StatCard
            title="Mensualidad"
            value="$9.00"
            subtitle="Junio 2025"
            color="bg-green-100"
            icon={<DollarSign className="text-green-600" />}
          />
        </li>

        <li>
          <StatCard
            title="Total Recaudado"
            value="$1,440"
            subtitle="+20% este mes"
            color="bg-blue-100"
            icon={<CircleDollarSign className="text-blue-600" />}
          />
        </li>

        <li>
          <StatCard
            title="Pagos Pendientes"
            value="100"
            subtitle="-3 este mes"
            color="bg-yellow-100"
            icon={<AlertCircle className="text-yellow-600" />}
          />
        </li>

        <li>
          <StatCard
            title="Cuotas Especiales"
            value="2"
            subtitle="Activas"
            color="bg-cyan-100"
            icon={<Receipt className="text-cyan-600" />}
          />
        </li>
      </ul>

      {/* Tabs */}
      <DashboardTabs />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-8">
        {/* Chart */}
        <div className="xl:col-span-3">
          <FinancialChart />
        </div>

        {/* Payments */}
        <div className="xl:col-span-2">
          <RecentPayments />
        </div>
      </div>

      {page.isLoading || (
        <RegistrarGastoOverlay
          proveedores={page.data?.data?.proveedores || []}
          {...registrarGastoOverlay.overlayProps}
        />
      )}

      <RegistrarPagoOverlay
        {...registrarPagoOverlay.overlayProps}
        onDone={registrarPagoOverlay.close}
      />
    </>
  );
}
