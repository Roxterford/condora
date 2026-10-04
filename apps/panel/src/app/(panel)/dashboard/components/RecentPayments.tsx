type Payment = {
  villa: string;
  resident: string;
  amount: string;
  type: string;
  status: string;
};

const payments: Payment[] = [
  {
    villa: "Villa 12",
    resident: "Carlos Mendoza",
    amount: "$350.00",
    type: "Mensualidad",
    status: "Completado",
  },
  {
    villa: "Villa 05",
    resident: "María Rodríguez",
    amount: "$350.00",
    type: "Mensualidad",
    status: "Completado",
  },
  {
    villa: "Villa 23",
    resident: "Juan Pérez",
    amount: "$500.00",
    type: "Especial",
    status: "Pendiente",
  },
  {
    villa: "Villa 08",
    resident: "Ana Gómez",
    amount: "$350.00",
    type: "Mensualidad",
    status: "Completado",
  },
];

const COMPLETADO = "Completado";

/**
 * Definición por columna de la grilla.
 *
 * En escritorio (`sm`+) la fila es una grilla de 5 columnas alineada con el
 * encabezado. En móvil pasa a 2 columnas y cada celda muestra su propio
 * rótulo, que se oculta en escritorio para no duplicar el encabezado.
 */
const COLUMNAS = [
  { label: "Villa", valor: (p: Payment) => p.villa, clase: "font-semibold text-gray-800" },
  { label: "Residente", valor: (p: Payment) => p.resident, clase: "text-gray-600" },
  { label: "Monto", valor: (p: Payment) => p.amount, clase: "font-semibold text-gray-800" },
  {
    label: "Tipo",
    clase: "",
    valor: (p: Payment) => (
      <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
        {p.type}
      </span>
    ),
  },
  {
    label: "Estado",
    clase: "",
    valor: (p: Payment) => (
      <span
        className={`px-3 py-1 rounded-full text-xs ${
          p.status === COMPLETADO ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {p.status}
      </span>
    ),
  },
] as const;

export default function RecentPayments() {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pagos Recientes</h2>
        <p className="text-gray-500 mt-1">Últimos pagos registrados en el sistema</p>
      </div>

      {/* Table Header — solo en escritorio; en móvil cada celda trae su rótulo */}
      <div className="hidden grid-cols-5 gap-4 text-sm text-gray-400 pb-4 border-b border-gray-100 sm:grid">
        {COLUMNAS.map((columna) => (
          <span key={columna.label}>{columna.label}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {payments.map((payment, index) => (
          <div
            key={index}
            className="grid grid-cols-2 items-center gap-x-4 gap-y-2 py-4 text-sm sm:grid-cols-5 sm:gap-y-0 sm:py-5"
          >
            {COLUMNAS.map((columna) => (
              <div key={columna.label} className={`min-w-0 ${columna.clase}`}>
                <span className="block text-xs text-gray-400 sm:hidden">{columna.label}</span>
                {columna.valor(payment)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}