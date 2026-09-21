/**
 * Generador determinista del mock masivo de Condora.
 *
 * Produce un script SQL autónomo y coherente con la lógica de negocio del
 * sistema:
 *
 *  - 520 unidades repartidas en TODOS los estados que maneja el dominio
 *    (ACTIVA, INHABITADA, EXENTA, EN_LITIGIO, SUSPENDIDA, PREVENTA).
 *  - Personas naturales y entes jurídicos (titulares y co-titulares).
 *  - 19 meses de historia (semilla + 18 meses regulares + 5 especiales),
 *    cada cuota con sus gastos asociados y Proyecto cuando es ESPECIAL.
 *  - Deudas generadas con la EstrategiaDistribucionLineal:
 *    invariante Σ deuda.monto == cuota.monto (todas las unidades deben igual).
 *  - Pagos en USD acreditados a deudas puntuales (destino_de_pagos), con
 *    clientes solventes, tardíos, parciales y morosos → deudas SALDADA,
 *    ABONADA y PENDIENTE.
 *  - Gastos en VED (con tasa por mes) y USD. Estados de proyecto CERRADO /
 *    ACTIVO. Ejemplos de operaciones COMPENSACION en transacciones.
 *
 * Reproducible: usa un PRNG con semilla fija.
 */

export interface Gasto {
  id: string
  concepto: string
  monto: number // escala 2 (centésimas de USD o de VED según moneda)
  moneda: 'VED' | 'USD'
  metodo: string
  tasa: number // escala 2; 0 cuando la moneda es USD
  rol: 'PROVEEDOR' | 'CONDOMINIO'
  proveedor: string | null
  cuota: string | null
  fecha: string // YYYY-MM-DD HH:mm:ss
  usd: number // Total() exacto, centésimas de USD
}

export interface CuotaMock {
  id: string
  tipo: 'SEMILLA' | 'REGULAR' | 'ESPECIAL'
  mes: number
  anio: number
  mesesTxt: string
  monto: number // cuota.monto = montoUnidad * elegibles
  montoUnidad: number // monto por unidad
  registro: string
  gastos: Gasto[]
}

// ---------------------------------------------------------------------------
// PRNG determinista (mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260920)
const rint = (min: number, max: number): number =>
  Math.floor(rand() * (max - min + 1)) + min
const hash = (n: number): number => {
  const x = Math.sin(n) * 10000
  return Math.abs(Math.floor(x)) % 100
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const pad = (n: number): string => String(n).padStart(2, '0')
const fmtDateTime = (y: number, mo: number, d: number, h = 8, mi = 0): string =>
  `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}:00`

const MESES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const sql = (s: string): string => s.replace(/'/g, "''")

const batch = (rows: string[], columns: number, prelude: string): string => {
  const chunks: string[] = []
  for (let i = 0; i < rows.length; i += columns) {
    chunks.push(`${prelude}\n  ${rows.slice(i, i + columns).join(',\n  ')};`)
  }
  return chunks.join('\n')
}

// ---------------------------------------------------------------------------
// Tasa de cambio por mes (VED → USD). Los montos son centésimas.
// ---------------------------------------------------------------------------

interface Periodo {
  anio: number
  mes: number
  tasa: number // centésimas de VED
  key: string
}

const PERIODOS: Periodo[] = []
{
  const base = [92, 100, 108, 117, 127, 138, 150, 163, 177, 192, 209, 227, 247, 268, 291, 316, 343, 372, 404]
  let anio = 2025
  let mes = 3
  for (let m = 0; m < base.length; m++) {
    PERIODOS.push({ anio, mes, tasa: base[m]! * 100, key: `${anio}-${pad(mes)}` })
    mes++
    if (mes > 12) {
      mes = 1
      anio++
    }
  }
}

// ---------------------------------------------------------------------------
// Estado de las unidades
// ---------------------------------------------------------------------------

const TOTAL_UNIDADES = 520
const ELEGIBLES = 465 // ACTIVA + INHABITADA + EN_LITIGIO (facturación LPH)

// 1..415 ACTIVA | 416..445 INHABITADA | 446..470 EXENTA | 471..490 EN_LITIGIO
// | 491..505 SUSPENDIDA | 506..520 PREVENTA
const estadoDeUnidad = (u: number): string => {
  if (u <= 415) return 'ACTIVA'
  if (u <= 445) return 'INHABITADA'
  if (u <= 470) return 'EXENTA'
  if (u <= 490) return 'EN_LITIGIO'
  if (u <= 505) return 'SUSPENDIDA'
  return 'PREVENTA'
}

const esElegible = (u: number): boolean => {
  const e = estadoDeUnidad(u)
  return e === 'ACTIVA' || e === 'INHABITADA' || e === 'EN_LITIGIO'
}

// ---------------------------------------------------------------------------
// Sujetos
// ---------------------------------------------------------------------------

const NOMBRES = [
  'María', 'José', 'Luis', 'Carmen', 'Ana', 'Pedro', 'Miguel', 'Rosa',
  'Jorge', 'Marta', 'Carlos', 'Laura', 'Andrés', 'Gabriela', 'Francisco',
  'Daniela', 'Ramón', 'Sofía', 'Alberto', 'Valentina', 'Enrique', 'Paola',
  'Iván', 'Natalia', 'Óscar', 'Carolina', 'Rafael', 'Verónica', 'Sergio',
  'Adriana',
]

const APELLIDOS = [
  'Rodríguez', 'González', 'Fernández', 'Pérez', 'Martínez', 'Gómez',
  'Sánchez', 'Rojas', 'Díaz', 'Mendoza', 'Suárez', 'Blanco', 'Contreras',
  'Rivero', 'Hernández', 'Torres', 'Medina', 'Rivas', 'Acosta', 'Morales',
  'Silva', 'Vargas', 'Castillo', 'Reyes', 'Ortiz', 'Castro', 'Aguilar',
  'Ortega', 'Marín', 'Chávez', 'Bermúdez', 'Peña', 'Núñez', 'Quintero',
  'Bravo', 'Cárdenas', 'Fuentes', 'León', 'Paredes', 'Salazar',
]

const persona = (n: number) => {
  const nomb1 = NOMBRES[(n * 7) % NOMBRES.length]!
  const nomb2 = NOMBRES[(n * 3 + 5) % NOMBRES.length]!
  const ape1 = APELLIDOS[(n * 5) % APELLIDOS.length]!
  const ape2 = APELLIDOS[(n * 3 + 2) % APELLIDOS.length]!
  const doc =
    n % 29 === 0
      ? `E-${(12000000 + n * 137).toString()}`
      : `V-${(10500000 + n * 173).toString()}`
  const tel = `+58 412 ${String(7000000 + n * 7919).slice(-7)}`
  const registroY = 2021 + (n % 5)
  const registroM = (n % 12) + 1
  const registroD = (n % 28) + 1
  return {
    id: `p-${n}`,
    nombre: `${nomb1} ${nomb2}`,
    apellido: `${ape1} ${ape2}`,
    doc,
    email: `propietario${String(n).padStart(3, '0')}@condora.com`,
    tel,
    registro: fmtDateTime(registroY, registroM, registroD),
  }
}

const JURIDICOS = [
  { nombre: 'Propiedades Comunales Los Próceres C.A.', rif: 'J-310000001', slug: 'propiedadescomunales', id: 'j-1' },
  { nombre: 'Asociación de Propietarios Horizonte', rif: 'J-310000002', slug: 'asociacionpropietarios', id: 'j-2' },
  { nombre: 'Urbanizadora Horizonte C.A.', rif: 'J-310000003', slug: 'urbanizadorahorizonte', id: 'j-3' },
  { nombre: 'Inversiones Inmobiliarias Andina C.A.', rif: 'J-310000004', slug: 'inmobiliariaandina', id: 'j-4' },
  { nombre: 'Renta Urbana C.A.', rif: 'J-310000005', slug: 'rentaurbana', id: 'j-5' },
  { nombre: 'Grupo Constructor Delta C.A.', rif: 'J-310000006', slug: 'constructordelta', id: 'j-6' },
  { nombre: 'Fondo de Inversión Capital Hogar', rif: 'J-310000007', slug: 'capitalhogar', id: 'j-7' },
  { nombre: 'Comercializadora del Centro C.A.', rif: 'J-310000008', slug: 'comercializadoracentro', id: 'j-8' },
  { nombre: 'Petrogas Servicios C.A.', rif: 'J-310000009', slug: 'petrogas', id: 'j-9' },
  { nombre: 'Transportes y Logística del Oeste C.A.', rif: 'J-310000010', slug: 'transportesoeste', id: 'j-10' },
  { nombre: 'Alimentos del Valle C.A.', rif: 'J-310000011', slug: 'alimentosvalle', id: 'j-11' },
  { nombre: 'Inmobiliaria Horizonte Comercial C.A.', rif: 'J-310000012', slug: 'horizontecomercial', id: 'j-12' },
]

// Representante (persona natural) de cada ente jurídico j-k → p-520+k
const repDeJuridico = (jId: string): string => `p-${520 + Number(jId.slice(2))}`

const titularUnidad = (u: number): string | null => {
  if (u >= 456 && u <= 460) return 'j-1'
  if (u >= 461 && u <= 465) return 'j-2'
  if (u >= 466 && u <= 470) return 'j-3'
  if (u >= 486 && u <= 490) return 'j-4'
  if (u >= 506 && u <= 520) return 'j-3'
  const mapa: Record<number, string> = {
    61: 'j-5', 122: 'j-5', 183: 'j-5',
    244: 'j-6', 305: 'j-6', 366: 'j-6', 407: 'j-6',
    30: 'j-7', 75: 'j-7', 160: 'j-7', 220: 'j-7',
    410: 'j-8', 430: 'j-8',
    96: 'j-9', 141: 'j-9',
    35: 'j-10', 52: 'j-10',
    300: 'j-11', 350: 'j-11',
    25: 'j-12',
  }
  return mapa[u] ?? `p-${u}`
}

// 446..455 = bienes comunes (casa de conserje, sala de usos, cuarto de bombas...)
const esBienComun = (u: number): boolean => u >= 446 && u <= 455

// ---------------------------------------------------------------------------
// Proveedores
// ---------------------------------------------------------------------------

const PROVEEDORES = [
  { id: 'pvdr0', nombre: 'Suministros Generales Los Próceres', rif: 'J-123456789', email: 'compras@suministrosproceres.com', telefono: '04121234567', direccion: 'Av. Principal, Edif. Comercial, Local 0', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr1', nombre: 'Servicios de Limpieza RZ', rif: 'J-111111111', email: 'contacto@limpiezaz.com', telefono: '04121111111', direccion: 'Calle 1, Local 1', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr2', nombre: 'Ascensores Seguros C.A.', rif: 'J-222222222', email: 'servicio@ascensores.com', telefono: '04122222222', direccion: 'Av. Libertador, Torre B', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr3', nombre: 'Vigilancia Total 24h', rif: 'J-333333333', email: 'ventas@vigilancia24.com', telefono: '04123333333', direccion: 'Urb. Las Flores, Qta. 3', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr4', nombre: 'Electricidad Comunal', rif: 'J-444444444', email: 'facturacion@electrica.com', telefono: '04124444444', direccion: 'Planta Baja, Local 4', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr5', nombre: 'Agua Potable y Mantenimiento', rif: 'J-555555555', email: 'agua@mantenimiento.com', telefono: '04125555555', direccion: 'Calle 5, Sector Norte', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr6', nombre: 'Jardines y Paisajismo Verde', rif: 'J-666666666', email: 'hola@jardinesverde.com', telefono: '04126666666', direccion: 'Av. Los Pinos, Local 6', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr7', nombre: 'Control de Plagas Profesional', rif: 'J-777777777', email: 'fumiga@controlplagas.com', telefono: '04127777777', direccion: 'Calle 7, Edif. San José', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr8', nombre: 'Piscinas y Recreación', rif: 'J-888888888', email: 'piscina@recreacion.com', telefono: '04128888888', direccion: 'Urb. El Lago, Piso 2', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr9', nombre: 'Seguros Condominales', rif: 'J-999999999', email: 'polizas@seguros.com', telefono: '04129999999', direccion: 'Av. Principal, Torre C', registro: '2025-02-10 09:00:00' },
  { id: 'pvdr10', nombre: 'Administración y Gerencia Condora C.A.', rif: 'J-310020001', email: 'contacto@admincondora.com', telefono: '04120000010', direccion: 'Torre Condora, Piso 3, Ofic. 3A', registro: '2025-01-05 09:00:00' },
  { id: 'pvdr11', nombre: 'FibraMax Internet Comunitario', rif: 'J-310020002', email: 'billing@fibramax.com', telefono: '04120000011', direccion: 'Centro Comercial Los Próceres, Piso 2', registro: '2025-01-05 09:00:00' },
  { id: 'pvdr12', nombre: 'Respaldos Energéticos C.A.', rif: 'J-310020003', email: 'servicio@respaldoenergetico.com', telefono: '04120000012', direccion: 'Zona Industrial, Galpón 12', registro: '2025-03-18 09:00:00' },
  { id: 'pvdr13', nombre: 'Seguridad Electrónica Visión Total', rif: 'J-310020004', email: 'proyectos@visiontotalcctv.com', telefono: '04120000013', direccion: 'Av. Bolívar, Edif. Visión, Local B', registro: '2025-03-18 09:00:00' },
  { id: 'pvdr14', nombre: 'Impermeabilizaciones del Sur', rif: 'J-310020005', email: 'obras@impermeabilizasur.com', telefono: '04120000014', direccion: 'Callejón Los Andes, Qta. 5', registro: '2025-06-02 09:00:00' },
  { id: 'pvdr15', nombre: 'Rehabilitación y Pinturas Oeste', rif: 'J-310020006', email: 'contratos@rehabilitoeste.com', telefono: '04120000015', direccion: 'Av. Los Farallones, Torre F', registro: '2025-05-12 09:00:00' },
  { id: 'pvdr16', nombre: 'Portones Automáticos Servicio', rif: 'J-310020007', email: 'soporte@portonesauto.com', telefono: '04120000016', direccion: 'Urb. Industrial, Calle 3, Local 7', registro: '2025-04-01 09:00:00' },
  { id: 'pvdr17', nombre: 'Prevención y Bomberos Integral', rif: 'J-310020008', email: 'inspeccion@prevencionintegral.com', telefono: '04120000017', direccion: 'Calle Principal, Edif. Protección, Nivel 1', registro: '2025-03-25 09:00:00' },
  { id: 'pvdr18', nombre: 'Jardinería Tropical', rif: 'J-310020009', email: 'diseno@jardineriatropical.com', telefono: '04120000018', direccion: 'Sector La Casona, Vivero 4', registro: '2025-04-15 09:00:00' },
  { id: 'pvdr19', nombre: 'Constructora Metro C.A.', rif: 'J-310020010', email: 'gerencia@constructometro.com', telefono: '04120000019', direccion: 'Av. Intercomunal, Edif. Metro, PB', registro: '2025-07-01 09:00:00' },
  { id: 'pvdr20', nombre: 'Equipos de Cómputo y Oficina', rif: 'J-310020011', email: 'ventas@equiposoficina.com', telefono: '04120000020', direccion: 'Centro Comercial Ciudad, Piso 1', registro: '2025-05-05 09:00:00' },
  { id: 'pvdr21', nombre: 'Decoración y Ambientación Común', rif: 'J-310020012', email: 'eventos@ambientacion.com', telefono: '04120000021', direccion: 'Av. Los Ilustres, Local 8', registro: '2025-06-20 09:00:00' },
]

// ---------------------------------------------------------------------------
// Cuotas y gastos
// ---------------------------------------------------------------------------

const METODOS = ['TRANSFERENCIA_NACIONAL', 'PAGO_MOVIL', 'EFECTIVO', 'TRANSFERENCIA_INTERNACIONAL', 'CHEQUE']

interface GastoSeed {
  concepto: string
  montoUsd: number // objetivo en USD (escala 2 al materializar)
  moneda: 'USD' | 'VED'
  metodo: string
  rol: 'PROVEEDOR' | 'CONDOMINIO'
  proveedor?: string
}

const gastoUSD = (concepto: string, montoUsd: number, metodo: string, proveedor: string): GastoSeed => ({
  concepto, montoUsd, moneda: 'USD', metodo, rol: 'PROVEEDOR', proveedor,
})

const gastoVED = (concepto: string, montoUsdTarget: number, metodo: string, rol: 'PROVEEDOR' | 'CONDOMINIO' = 'CONDOMINIO', proveedor?: string): GastoSeed => ({
  concepto, montoUsd: montoUsdTarget, moneda: 'VED', metodo, rol, proveedor,
})

// Materializa un GastoSeed → Gasto con el Total() EXACTO que calcula el dominio.
function materializarGasto(
  seed: GastoSeed,
  id: string,
  anio: number,
  mes: number,
  tasa: number,
  cuota: string | null,
  fecha: string,
): Gasto {
  if (seed.moneda === 'USD') {
    const monto = Math.round(seed.montoUsd * 100)
    return {
      id, concepto: seed.concepto, monto, moneda: 'USD', metodo: seed.metodo,
      tasa: 0, rol: seed.rol, proveedor: seed.proveedor ?? null, cuota, fecha, usd: monto,
    }
  }
  // Total() = round(montoVED * 100 / tasa)  → usamos el resultado exacto
  const ved = Math.round(seed.montoUsd * (tasa / 100) * 100)
  const usd = Math.round((ved * 100) / tasa)
  return {
    id, concepto: seed.concepto, monto: ved, moneda: 'VED', metodo: seed.metodo,
    tasa, rol: seed.rol, proveedor: seed.proveedor ?? null, cuota, fecha, usd,
  }
}

const metodoVar = (base: number): string => METODOS[hash(base) % METODOS.length]!

function gastosDePeriodo(anio: number, mes: number, m: number): GastoSeed[] {
  const out: GastoSeed[] = []
  const y = anio
  const mo = mes

  out.push(gastoUSD('Honorarios de administración de condominio', 1500 + (m % 3) * 15, 'TRANSFERENCIA_NACIONAL', 'pvdr10'))
  out.push(gastoUSD('Vigilancia y seguridad de áreas comunes', 1200 + (m % 2) * 20, 'TRANSFERENCIA_NACIONAL', 'pvdr3'))
  out.push(gastoUSD('Limpieza de áreas comunes', 430 + (m % 3) * 5, 'EFECTIVO', 'pvdr1'))
  out.push(gastoUSD('Internet comunitario', 95, 'TRANSFERENCIA_NACIONAL', 'pvdr11'))
  out.push(gastoVED(
    mo >= 6 && mo <= 9 ? 'Pago de servicio eléctrico (alumbrado y bombas de áreas comunes)' : 'Pago de servicio eléctrico de áreas comunes',
    mo >= 6 && mo <= 9 ? 1080 : 900,
    'TRANSFERENCIA_NACIONAL',
  ))
  out.push(gastoVED('Pago de servicio de agua potable', 180, 'PAGO_MOVIL'))
  out.push(gastoVED('Servicio de gas comunitario', 55, 'PAGO_MOVIL'))

  // Ocasionales según calendario (m es índice global 0..18 desde 2025-03)
  if (mo % 3 === 0) out.push(gastoUSD('Mantenimiento preventivo de ascensores', 240, 'TRANSFERENCIA_NACIONAL', 'pvdr2'))
  if ([4, 6, 8, 10, 12, 2].includes(mo)) out.push(gastoUSD('Mantenimiento de jardines y áreas verdes', 120, 'EFECTIVO', 'pvdr6'))
  if (mo === 6 || mo === 12) out.push(gastoUSD('Fumigación y control de plagas', 150, 'EFECTIVO', 'pvdr7'))
  if ([6, 7, 8, 9].includes(mo)) out.push(gastoUSD('Mantenimiento de piscina y tratamiento químico', 190, 'EFECTIVO', 'pvdr8'))
  if (mo === 5 || mo === 11) out.push(gastoUSD('Mantenimiento de bomba hidroneumática', 130, 'PAGO_MOVIL', 'pvdr5'))
  if (mo === 10 && y === 2025) out.push(gastoUSD('Póliza de seguro del edificio', 260, 'TRANSFERENCIA_NACIONAL', 'pvdr9'))
  if (mo === 7) out.push(gastoUSD('Inspección y recarga de extintores', 140, 'TRANSFERENCIA_NACIONAL', 'pvdr17'))
  if (mo === 5 || mo === 11) out.push(gastoUSD('Mantenimiento del sistema CCTV', 110, 'TRANSFERENCIA_NACIONAL', 'pvdr13'))
  if (mo === 8 && y === 2025) out.push(gastoUSD('Reparación de portón principal', 320, 'TRANSFERENCIA_NACIONAL', 'pvdr16'))
  if (mo === 3 && y === 2026) out.push(gastoUSD('Mantenimiento de portones automáticos', 240, 'TRANSFERENCIA_NACIONAL', 'pvdr16'))
  if (mo === 9 && y === 2025) out.push(gastoUSD('Pintura de área de parqueos', 280, 'TRANSFERENCIA_NACIONAL', 'pvdr15'))
  if (mo === 4 && y === 2026) out.push(gastoUSD('Rehabilitación de luminarias de pasillos', 190, 'TRANSFERENCIA_NACIONAL', 'pvdr4'))
  if (mo === 11 && y === 2025) out.push(gastoUSD('Cambio de luminarias comunes', 210, 'TRANSFERENCIA_NACIONAL', 'pvdr4'))
  if (mo === 6 && y === 2026) out.push(gastoUSD('Actualización de luminarias LED', 165, 'TRANSFERENCIA_NACIONAL', 'pvdr4'))
  if ((mo === 8 && y === 2025) || (mo === 3 && y === 2026)) out.push(gastoUSD('Suministros de limpieza y químicos', 95, 'EFECTIVO', 'pvdr0'))
  if (mo === 5 && y === 2025) out.push(gastoUSD('Servicio de mantenimiento a la generadora', 150, 'PAGO_MOVIL', 'pvdr12'))
  if (mo === 7 && y === 2026) out.push(gastoUSD('Servicio de mantenimiento a la generadora', 180, 'PAGO_MOVIL', 'pvdr12'))

  return out
}

function construirCuota(
  id: string,
  tipo: 'SEMILLA' | 'REGULAR' | 'ESPECIAL',
  anio: number,
  mes: number,
  m: number,
  seeds: GastoSeed[],
): CuotaMock {
  const tasa = PERIODOS[m]!.tasa
  const diaRegistro = tipo === 'SEMILLA' ? 1 : 2
  const gastos: Gasto[] = seeds.map((seed, k) => {
    const dia = Math.min(27, 2 + ((k * 7 + m * 3) % 25))
    const fecha = fmtDateTime(anio, mes, dia, 9 + (k % 9), (k * 13) % 60)
    return materializarGasto(seed, `gasto-${id}-${k + 1}`, anio, mes, tasa, id, fecha)
  })

  const totalUsd = gastos.reduce((acc, g) => acc + g.usd, 0)
  const montoUnidad = Math.ceil(totalUsd / ELEGIBLES)
  return {
    id,
    tipo,
    mes,
    anio,
    mesesTxt: `${MESES[mes]!} ${anio}`,
    monto: montoUnidad * ELEGIBLES,
    montoUnidad,
    registro: fmtDateTime(anio, mes, diaRegistro, 8, 0),
    gastos,
  }
}

function construirCuotas(): CuotaMock[] {
  const cuotas: CuotaMock[] = []

  // Semilla (2025-03): deudas iniciales de puesta en marcha
  cuotas.push(construirCuota('c-2025-03-semilla', 'SEMILLA', 2025, 3, 0, [
    { concepto: 'Constitución del fondo de reserva', montoUsd: 3000, moneda: 'USD', metodo: 'TRANSFERENCIA_NACIONAL', rol: 'CONDOMINIO' },
    { concepto: 'Útiles y papelería de puesta en marcha', montoUsd: 240, moneda: 'USD', metodo: 'EFECTIVO', rol: 'PROVEEDOR', proveedor: 'pvdr0' },
    { concepto: 'Legalización del libro de actas', montoUsd: 120, moneda: 'USD', metodo: 'EFECTIVO', rol: 'PROVEEDOR', proveedor: 'pvdr0' },
    { concepto: 'Traslado de mobiliario y mantenimiento inicial', montoUsd: 450, moneda: 'USD', metodo: 'TRANSFERENCIA_NACIONAL', rol: 'PROVEEDOR', proveedor: 'pvdr15' },
  ]))

  // Regulares 2025-04 .. 2026-09 (m=1..18)
  for (let m = 1; m < PERIODOS.length; m++) {
    const p = PERIODOS[m]!
    cuotas.push(construirCuota(`c-${p.key}-reg`, 'REGULAR', p.anio, p.mes, m, gastosDePeriodo(p.anio, p.mes, m)))
  }

  // Especiales (cada una con su Proyecto)
  const especiales: Array<{ key: string; seeds: GastoSeed[]; diaGastos: number }> = [
    { key: '2025-07', diaGastos: 4, seeds: [
      gastoUSD('Pintura de fachada — tramo A', 4200, 'TRANSFERENCIA_NACIONAL', 'pvdr15'),
      gastoUSD('Pintura de fachada — tramo B', 5100, 'TRANSFERENCIA_NACIONAL', 'pvdr15'),
    ] },
    { key: '2025-11', diaGastos: 4, seeds: [
      gastoUSD('Impermeabilización de techos — bloque 1', 6800, 'TRANSFERENCIA_NACIONAL', 'pvdr14'),
      gastoUSD('Impermeabilización de techos — bloque 2', 5600, 'TRANSFERENCIA_NACIONAL', 'pvdr14'),
    ] },
    { key: '2026-02', diaGastos: 4, seeds: [
      gastoUSD('Renovación de cámaras de CCTV', 3100, 'TRANSFERENCIA_NACIONAL', 'pvdr13'),
      gastoUSD('Renovación de portones automatizados', 3200, 'TRANSFERENCIA_NACIONAL', 'pvdr16'),
      gastoUSD('Instalación eléctrica y control de acceso', 1800, 'TRANSFERENCIA_NACIONAL', 'pvdr16'),
    ] },
    { key: '2026-05', diaGastos: 6, seeds: [
      gastoUSD('Reparación mayor de equipos de ascensores', 4600, 'TRANSFERENCIA_NACIONAL', 'pvdr2'),
    ] },
    { key: '2026-08', diaGastos: 4, seeds: [
      gastoUSD('Pavimentación de la placa de estacionamiento', 4200, 'TRANSFERENCIA_NACIONAL', 'pvdr19'),
      gastoUSD('Demarcación y señalización del parqueo', 2500, 'TRANSFERENCIA_NACIONAL', 'pvdr19'),
    ] },
  ]

  for (const esp of especiales) {
    const [a, me] = esp.key.split('-').map(Number)
    const m = PERIODOS.findIndex((p) => p.anio === a && p.mes === me)
    const cu = construirCuota(`c-${esp.key}-esp`, 'ESPECIAL', a as number, me as number, m, esp.seeds)
    for (let k = 0; k < cu.gastos.length; k++) {
      cu.gastos[k]!.fecha = fmtDateTime(a as number, me as number, esp.diaGastos + k, 10 + k, (k * 25) % 60)
    }
    cuotas.push(cu)
  }

  cuotas.sort((x, y) => (x.anio - y.anio) || (x.mes - y.mes))
  return cuotas
}

// ---------------------------------------------------------------------------
// Generación de pagos por perfil de cliente
// ---------------------------------------------------------------------------

interface PagoPlan {
  opId: string
  concepto: string
  monto: number
  metodo: string
  fecha: string
  unidadCodigo: string
  destinos: Array<{ id: string; deuda: string; destinado: number }>
  registrador: string
  full: boolean
  conceptos: string[]
}

const metodoPorTipo = (tipo: string, h: number): string => {
  const peso = h % 10
  switch (tipo) {
    case 'A':
      return peso <= 2 ? 'PAGO_MOVIL' : peso <= 5 ? 'TRANSFERENCIA_NACIONAL' : peso <= 7 ? 'TRANSFERENCIA_INTERNACIONAL' : 'EFECTIVO'
    case 'B':
      return peso <= 3 ? 'TRANSFERENCIA_NACIONAL' : peso <= 5 ? 'PAGO_MOVIL' : peso <= 8 ? 'EFECTIVO' : 'CHEQUE'
    case 'C':
      return peso <= 3 ? 'EFECTIVO' : peso <= 6 ? 'PAGO_MOVIL' : 'TRANSFERENCIA_NACIONAL'
    default:
      return 'EFECTIVO'
  }
}

const daysFrom = (base: Date, add: number): Date => new Date(base.getTime() + add * 86400000)

const fmtDate = (d: Date): string =>
  fmtDateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes())

function generarPagos(cuotas: CuotaMock[]): PagoPlan[] {
  const pagos: PagoPlan[] = []
  let opSeq = 0

  for (let u = 1; u <= ELEGIBLES; u++) {
    const mod = u % 10
    const tipo = mod <= 5 ? 'A' : mod <= 7 ? 'B' : mod === 8 ? 'C' : 'D'
    const unidadCodigo = `villa-${u}`
    let lastPay: PagoPlan | null = null

    const closeLast = () => {
      if (lastPay) {
        pagos.push(lastPay)
        lastPay = null
      }
    }

    for (let p = 0; p < cuotas.length; p++) {
      const c = cuotas[p]!
      const h = (u * 31 + p * 17) % 100
      const m = (p * 13 + u) % 100

      type Decision = { state: 'none' } | { state: 'full' } | { state: 'partial'; frac: number }
      let dec: Decision = { state: 'none' }

      if (tipo === 'A') {
        if (p === 23) dec = h % 11 === 0 ? { state: 'full' } : { state: 'none' }
        else if (p === 22) dec = h % 3 === 0 ? { state: 'full' } : { state: 'none' }
        else if (p === 21) dec = (h % 4) === 1 ? { state: 'none' } : { state: 'full' }
        else dec = h % 15 === 0 ? { state: 'none' } : { state: 'full' }
      } else if (tipo === 'B') {
        if (p <= 15) dec = h % 10 === 0 ? { state: 'none' } : { state: 'full' }
        else if (p <= 19) dec = h % 11 === 0 ? { state: 'none' } : { state: 'full' }
        else if (p === 20) dec = (h % 5) === 0 ? { state: 'none' } : { state: 'full' }
        else if (p === 21) dec = h % 10 <= 2 ? { state: 'full' } : { state: 'none' }
        else dec = { state: 'none' }
      } else if (tipo === 'C') {
        if (p <= 19) {
          const r = h % 10
          dec = r < 5 ? { state: 'full' } : r <= 7 ? { state: 'partial', frac: 0.4 + (m % 6) * 0.06 } : { state: 'none' }
        } else if (p <= 21) {
          dec = (h % 3) === 0 ? { state: 'partial', frac: 0.3 + (m % 4) * 0.05 } : { state: 'none' }
        } else dec = { state: 'none' }
      } else {
        if (p <= 17) {
          const r = h % 10
          dec = r < 2 ? { state: 'full' } : r <= 4 ? { state: 'partial', frac: 0.35 + (m % 5) * 0.05 } : { state: 'none' }
        } else if (p <= 19) {
          dec = h % 7 === 6 ? { state: 'partial', frac: 0.4 } : { state: 'none' }
        } else dec = { state: 'none' }
      }

      if (dec.state === 'none') continue

      // Fecha del pago según perfil y cuota
      let fecha: Date
      if (tipo === 'A') {
        fecha = daysFrom(new Date(c.registro), 9 + (h % 16))
      } else if (tipo === 'B') {
        const late = 1 + (h % 2)
        const c2 = cuotas[Math.min(p + late, cuotas.length - 1)]!
        fecha = new Date(fmtDateTime(c2.anio, c2.mes, Math.min(27, 12 + (h % 15)), 11, 0))
      } else {
        const plus = h % 2
        const c2 = cuotas[Math.min(p + plus, cuotas.length - 1)]!
        fecha = new Date(fmtDateTime(c2.anio, c2.mes, Math.min(27, 5 + (m % 20)), 9, 0))
      }

      const full = dec.state === 'full'
      const destinado = full
        ? c.montoUnidad
        : Math.max(1, Math.round((c.montoUnidad * (dec as { frac: number }).frac) / 50) * 50)

      const deudaId = `d-${c.id}-${pad(u)}`
      const mesTxt = c.mesesTxt

      // Fusionar pagos completos consecutivos (máx 3 cuotas, <=45 días).
      // Solo se fusionan operaciones que sean pagos completos.
      const mergeable =
        full &&
        lastPay !== null &&
        lastPay.full &&
        lastPay.destinos.length < 3 &&
        fecha.getTime() - new Date(lastPay.fecha).getTime() <= 45 * 86400000

      if (mergeable) {
        lastPay!.destinos.push({ id: `dp-${lastPay!.opId}-${lastPay!.destinos.length + 1}`, deuda: deudaId, destinado })
        lastPay!.monto += destinado
        lastPay!.fecha = fmtDate(fecha)
        lastPay!.conceptos = [...new Set([...(lastPay.conceptos ?? []), mesTxt])]
        continue
      }

      closeLast()

      opSeq++
      const opId = `pago-${String(opSeq).padStart(4, '0')}`
      lastPay = {
        opId,
        concepto: full ? `Pago de ${mesTxt}` : `Abono a cuota de ${mesTxt}`,
        monto: destinado,
        metodo: metodoPorTipo(tipo, (h + p) % 10),
        fecha: fmtDate(fecha),
        unidadCodigo,
        destinos: [{ id: `dp-${opId}-1`, deuda: deudaId, destinado }],
        registrador: (u + p) % 10 === 0 ? 'admin' : 'tester',
        full,
        conceptos: [mesTxt],
      }
    }
    closeLast()
  }

  // Concepto final limpio para operaciones con varias deudas
  for (const pago of pagos) {
    if (pago.destinos.length > 1 && pago.conceptos && pago.conceptos.length > 1) {
      pago.concepto = `Pago de cuotas ${pago.conceptos.join(' y ')}`
    }
  }

  return pagos
}

// ---------------------------------------------------------------------------
// Proyectos de las cuotas especiales
// ---------------------------------------------------------------------------

interface ProyectoMock {
  titulo: string
  cuota: string
  estado: 'ACTIVO' | 'BORRADOR' | 'CERRADO'
  descripcion: string
  justificacion: string
  fecha_limite: string
  interes_por_mora: number
  registro: string
}

const PROYECTOS: ProyectoMock[] = [
  {
    titulo: 'Proyecto de pintura de fachadas',
    cuota: 'c-2025-07-esp',
    estado: 'CERRADO',
    descripcion: 'Pintura integral de las fachadas de los bloques A y B, incluyendo áreas de circulación y columnas.',
    justificacion: 'Las fachadas presentaban deterioro avanzado por exposición a la intemperie; la asamblea aprobó el fondo especial.',
    fecha_limite: '2025-09-30 18:00:00',
    interes_por_mora: 1,
    registro: '2025-07-01 08:00:00',
  },
  {
    titulo: 'Impermeabilización de techos',
    cuota: 'c-2025-11-esp',
    estado: 'CERRADO',
    descripcion: 'Impermeabilización con manto asfáltico en los dos bloques residenciales y casetas de bombas.',
    justificacion: 'Filtraciones recurrentes en los últimos pisos durante la temporada de lluvias que afectaban áreas comunes y viviendas.',
    fecha_limite: '2026-01-31 18:00:00',
    interes_por_mora: 1,
    registro: '2025-11-01 08:00:00',
  },
  {
    titulo: 'Renovación de seguridad electrónica',
    cuota: 'c-2026-02-esp',
    estado: 'CERRADO',
    descripcion: 'Cambio de cámaras de vigilancia, actualización de portones automatizados y control de acceso con tarjetas.',
    justificacion: 'El sistema de CCTV tenía más de 8 años de operación y fallaba en puntos críticos del estacionamiento.',
    fecha_limite: '2026-03-31 18:00:00',
    interes_por_mora: 1,
    registro: '2026-02-01 08:00:00',
  },
  {
    titulo: 'Reparación mayor de ascensores',
    cuota: 'c-2026-05-esp',
    estado: 'ACTIVO',
    descripcion: 'Reemplazo de cables de tracción, guías y modernización del tablero de control de los dos ascensores.',
    justificacion: 'Los ascensores presentan paradas frecuentes y el diagnóstico técnico recomienda intervención mayor antes del vencimiento de la garantía.',
    fecha_limite: '2026-10-31 18:00:00',
    interes_por_mora: 1,
    registro: '2026-05-01 08:00:00',
  },
  {
    titulo: 'Pavimentación de la placa de estacionamiento',
    cuota: 'c-2026-08-esp',
    estado: 'ACTIVO',
    descripcion: 'Pavimentación, demarcación y señalización de la placa de estacionamiento del condominio.',
    justificacion: 'La placa presenta hundimientos y grietas que acumulan agua; la reparación evita daños estructurales mayores.',
    fecha_limite: '2026-11-30 18:00:00',
    interes_por_mora: 1,
    registro: '2026-08-01 08:00:00',
  },
]

// ---------------------------------------------------------------------------
// Transacciones de compensación (COMPENSACION)
// ---------------------------------------------------------------------------

interface Compensacion {
  id: string
  concepto: string
  fecha: string
  gastoId: string
  gasto: GastoSeed
  unidad: string
  deuda: string
  destinado: number
  reg: string
}

const ECOSISTEMA_COMP = [
  { id: 'tx-comp-1', un: 14, concepto: 'Compensación por suministros de limpieza', gastoId: 'gasto-comp-1', titulo: 'Suministros de limpieza quincena', proveedor: 'pvdr0' },
  { id: 'tx-comp-2', un: 87, concepto: 'Compensación por mantenimiento de ascensores', gastoId: 'gasto-comp-2', titulo: 'Mantenimiento extraordinario de ascensor', proveedor: 'pvdr2' },
  { id: 'tx-comp-3', un: 220, concepto: 'Compensación por jardinería', gastoId: 'gasto-comp-3', titulo: 'Poda especial de árboles', proveedor: 'pvdr6' },
]

/*
 * Genera compensaciones sobre deudas IMPAGAS de la unidad (nunca sobrepasa el
 * monto de la deuda). El crédito reconocido equivale al valor total de una
 * cuota que el propietario-programa debe y no ha pagado.
 */
function generarCompensaciones(cuotas: CuotaMock[], pagos: PagoPlan[]): Compensacion[] {
  const paidDeudas = new Set<string>()
  for (const p of pagos) for (const d of p.destinos) paidDeudas.add(d.deuda)

  const comps: Compensacion[] = []
  for (const s of ECOSISTEMA_COMP) {
    let target: { deuda: string; cuota: CuotaMock } | null = null
    for (let i = cuotas.length - 1; i >= 0 && !target; i--) {
      const did = `d-${cuotas[i]!.id}-${pad(s.un)}`
      if (!paidDeudas.has(did)) target = { deuda: did, cuota: cuotas[i]! }
    }
    if (!target) continue
    const destinado = target.cuota.montoUnidad
    const fecha = fmtDateTime(target.cuota.anio, target.cuota.mes, Math.min(27, 14 + (s.un % 8)), 14, 0)
    comps.push({
      id: s.id,
      concepto: s.concepto,
      fecha,
      gastoId: s.gastoId,
      gasto: {
        concepto: s.titulo,
        montoUsd: destinado / 100,
        moneda: 'USD',
        metodo: 'COMPENSACION',
        rol: 'PROVEEDOR',
        proveedor: s.proveedor,
      },
      unidad: `villa-${s.un}`,
      deuda: target.deuda,
      destinado,
      reg: 'admin',
    })
  }
  return comps
}

// ---------------------------------------------------------------------------
// Ensamblador de todo el SQL
// ---------------------------------------------------------------------------

export function generarSQL(): string {
  const out: string[] = []

  out.push('-- =============================================================')
  out.push('-- Mock masivo y coherente de Condora')
  out.push('-- 520 unidades · 24 cuotas (semilla + 18 meses + 5 especiales)')
  out.push('-- Generado por prisma/seeds/mocks/generador_mock_grande.ts')
  out.push('-- =============================================================')
  out.push('PRAGMA foreign_keys=OFF;')
  out.push('BEGIN;')

  // Limpieza (idempotente)
  out.push('DELETE FROM destino_de_pagos;')
  out.push('DELETE FROM transaccion_operaciones;')
  out.push('DELETE FROM transacciones;')
  out.push('DELETE FROM internal_operaciones;')
  out.push('DELETE FROM proyectos;')
  out.push('DELETE FROM internal_deudas;')
  out.push('DELETE FROM cuotas;')
  out.push('DELETE FROM proveedores;')
  out.push('DELETE FROM titularidades;')
  out.push('DELETE FROM unidades;')
  out.push('DELETE FROM sujetos;')
  out.push('DELETE FROM usuarios;')

  // Usuarios
  const PWD = "$2a$12$TWaUL3tJEuMNUfC7uiiAjelPshhEWyBePLxVzs34LWdi1TnpJN0ZO"
  out.push(`INSERT INTO usuarios (id, email, password) VALUES`)
  out.push(`  ('tester', 'tester@example.com', '${PWD}'),`)
  out.push(`  ('admin', 'admin@condora.com', '${PWD}');`)

  // Sujetos (personas 1..560, jurídicos j-1..j-12)
  const sujetos: string[] = []
  for (let n = 1; n <= 560; n++) {
    const per = persona(n)
    sujetos.push(
      `  ('${per.id}', 'PERSONA_NATURAL', '${per.doc}', '${sql(per.nombre)}', '${sql(per.apellido)}', NULL, NULL, '${per.email}', '${per.tel}', '${per.registro}')`,
    )
  }
  JURIDICOS.forEach((j, k) => {
    const regM = (9 + k) % 12 + 1
    const regD = (k % 24) + 1
    const rep = repDeJuridico(j.id)
    sujetos.push(
      `  ('${j.id}', 'ENTE_JURIDICO', '${j.rif}', NULL, NULL, '${sql(j.nombre)}', '${rep}', 'contacto@${j.slug}.com', '+58 212 ${String(3000000 + k * 11111).slice(-7)}', '2024-${pad(regM)}-${pad(regD)} 09:00:00')`,
    )
  })
  out.push(batch(sujetos, 300, `INSERT INTO sujetos (id, tipo, documento_identidad, nombres, apellidos, razon_social, representante, email, telefono, registro) VALUES`))

  // Unidades
  const DESCS = [
    'Villa tipo A con balcón', 'Villa tipo B de planta baja', 'Villa tipo C dos niveles',
    'Villa con estacionamiento cubierto', 'Villa con jardín privado', 'Villa tipo D esquina',
    'Villa tipo A, cercana al área de piscina', 'Villa tipo B con patio interno',
    'Villa tipo E, vista al parque', 'Villa tipo F, entrada independiente',
    'Villa tipo G, esquina con terraza', 'Villa tipo H amplia, dos baños',
    'Villa tipo A, tres habitaciones', 'Villa tipo B, una habitación',
    'Villa tipo D, uso mixto', 'Villa tipo C, amplia con estudio',
  ]
  const CONSERJE = 'p-560'
  const unidadesFinal: string[] = []
  for (let u = 1; u <= TOTAL_UNIDADES; u++) {
    const titular = esBienComun(u) ? null : titularUnidad(u)
    const contacto = esBienComun(u)
      ? CONSERJE
      : titular !== null && titular.startsWith('p-')
        ? titular
        : titular !== null
          ? repDeJuridico(titular)
          : CONSERJE
    const t = titular ? `'${titular}'` : 'NULL'
    unidadesFinal.push(
      `  ('u${u}', 'villa-${u}', '${estadoDeUnidad(u)}', ${t}, '${contacto}', '${sql(DESCS[u % DESCS.length]!)}')`,
    )
  }
  out.push(batch(unidadesFinal, 130, `INSERT INTO unidades (id, codigo, estado, titular_primario, contacto, descripcion) VALUES`))

  // Titularidades (principal + co-titulares)
  let tid = 0
  const titRows: string[] = []
  for (let u = 1; u <= TOTAL_UNIDADES; u++) {
    if (esBienComun(u)) continue
    const titular = titularUnidad(u)!
    tid++
    titRows.push(`  ('tit-${tid}', '${titular}', 'u${u}')`)
    // Co-titular persona para ~40 unidades de personas naturales
    if (titular.startsWith('p-') && (u * 7) % 41 === 0) {
      const co = 533 + ((u * 3) % 28)
      tid++
      titRows.push(`  ('tit-${tid}', 'p-${co}', 'u${u}')`)
    }
  }
  out.push(batch(titRows, 300, `INSERT INTO titularidades (id, titular, unidad) VALUES`))

  // Proveedores
  const proveedores: string[] = PROVEEDORES.map((p) =>
    `  ('${p.id}', '${p.rif}', '${sql(p.nombre)}', '${p.email}', '${p.telefono}', '${sql(p.direccion!)}', '${p.registro}', '${p.registro}')`,
  )
  out.push(batch(proveedores, 22, `INSERT INTO proveedores (id, rif, nombre, email, telefono, direccion, registro, actualizacion) VALUES`))

  // Cuotas
  const cuotas = construirCuotas()
  const cuotaRows: string[] = cuotas.map((c) =>
    `  ('${c.id}', '${c.tipo}', ${c.monto}, ${c.mes}, ${c.anio}, '${c.registro}', 'tester', '${c.registro}', 'tester')`,
  )
  out.push(`INSERT INTO cuotas (id, tipo, monto, mes, anio, registro, registrado_por, actualizacion, actualizado_por) VALUES`)
  out.push(cuotaRows.join(',\n') + ';')

  // Deudas (solo unidades elegibles, estrategia lineal)
  const deudaRows: string[] = []
  for (const c of cuotas) {
    const um = c.montoUnidad
    for (let u = 1; u <= ELEGIBLES; u++) {
      deudaRows.push(
        `  ('d-${c.id}-${pad(u)}', 'villa-${u}', '${c.id}', ${um}, '${c.registro}', '${c.registro}')`,
      )
    }
  }
  out.push(batch(deudaRows, 400, `INSERT INTO internal_deudas (id, unidad, cuota, monto, registro, actualizacion) VALUES`))

  // Pagos y compensaciones se calculan ANTES de los gastos porque las
  // compensaciones abonan deudas impagas de unidades (necesitan ver los pagos)
  const pagos = generarPagos(cuotas)
  const comps = generarCompensaciones(cuotas, pagos)

  // Gastos (operaciones DEBITO)
  const opGastos: string[] = []
  for (const c of cuotas) {
    for (const g of c.gastos) {
      opGastos.push(
        `  ('${g.id}', '${g.fecha}', '${sql(g.concepto)}', ${g.monto}, '${g.moneda}', '${g.metodo}', ${g.tasa}, 'DEBITO', '${g.rol}', '${g.cuota}', NULL, ${g.proveedor ? `'${g.proveedor}'` : 'NULL'}, 'tester', '${g.fecha}')`,
      )
    }
  }
  for (const comp of comps) {
    const g = comp.gasto
    opGastos.push(
      `  ('${comp.gastoId}', '${comp.fecha}', '${sql(g.concepto)}', ${Math.round(g.montoUsd * 100)}, 'USD', 'COMPENSACION', 0, 'DEBITO', 'PROVEEDOR', NULL, NULL, '${g.proveedor}', '${comp.reg}', '${comp.fecha}')`,
    )
  }
  out.push(batch(opGastos, 60, `INSERT INTO internal_operaciones (id, fecha, concepto, monto, moneda, metodo, tasa, tipo, rol, cuota, unidad_codigo, proveedor, registrado_por, registro) VALUES`))

  // Pagos (CREDITO UNIDAD) + destino_de_pagos
  const opPagos: string[] = []
  const destinos: string[] = []
  for (const pago of pagos) {
    opPagos.push(
      `  ('${pago.opId}', '${pago.fecha}', '${sql(pago.concepto)}', ${pago.monto}, 'USD', '${pago.metodo}', 0, 'CREDITO', 'UNIDAD', NULL, '${pago.unidadCodigo}', NULL, '${pago.registrador}', '${pago.fecha}')`,
    )
    for (const d of pago.destinos) {
      destinos.push(`  ('${d.id}', '${pago.opId}', '${d.deuda}', ${d.destinado}, '${pago.fecha}')`)
    }
  }

  // Compensaciones
  const compDestinos: string[] = []
  const compTxOps: string[] = []
  const compTx: string[] = []
  comps.forEach((comp, k) => {
    const opId = `pago-comp-${k + 1}`
    opPagos.push(
      `  ('${opId}', '${comp.fecha}', '${sql(`Compensación: ${comp.concepto}`)}', ${comp.destinado}, 'USD', 'COMPENSACION', 0, 'CREDITO', 'UNIDAD', NULL, '${comp.unidad}', NULL, '${comp.reg}', '${comp.fecha}')`,
    )
    compDestinos.push(`  ('dp-${opId}-1', '${opId}', '${comp.deuda}', ${comp.destinado}, '${comp.fecha}')`)
    compTx.push(
      `  ('${comp.id}', '${comp.fecha}', '${sql(comp.concepto)}', '${comp.reg}', '${comp.fecha}')`,
    )
    compTxOps.push(
      `  ('tpo-${comp.id}-1', '${comp.id}', '${comp.gastoId}', 1)`,
      `  ('tpo-${comp.id}-2', '${comp.id}', '${opId}', 2)`,
    )
  })

  out.push(batch(opPagos, 80, `INSERT INTO internal_operaciones (id, fecha, concepto, monto, moneda, metodo, tasa, tipo, rol, cuota, unidad_codigo, proveedor, registrado_por, registro) VALUES`))
  out.push(batch(destinos, 300, `INSERT INTO destino_de_pagos (id, operacion, deuda, destinado, fecha) VALUES`))
  out.push(batch(compDestinos, 10, `INSERT INTO destino_de_pagos (id, operacion, deuda, destinado, fecha) VALUES`))

  if (compTx.length > 0) {
    out.push(`INSERT INTO transacciones (id, fecha, concepto, registrado_por, registro) VALUES`)
    out.push(compTx.join(',\n') + ';')
    out.push(batch(compTxOps, 20, `INSERT INTO transaccion_operaciones (id, transaccion_id, operacion_id, posicion) VALUES`))
  }

  // Proyectos de cuotas especiales
  const proyRows: string[] = PROYECTOS.map((p) =>
    `  ('${sql(p.titulo)}', '${p.cuota}', '${p.estado}', '${sql(p.descripcion)}', '${sql(p.justificacion)}', '${p.fecha_limite}', ${p.interes_por_mora}, '${p.registro}', 'tester', '${p.registro}', 'tester')`,
  )
  out.push(`INSERT INTO proyectos (titulo, cuota, estado, descripcion, justificacion, fecha_limite, interes_por_mora, registro, registrado_por, actualizacion, actualizado_por) VALUES`)
  out.push(proyRows.join(',\n') + ';')

  out.push('COMMIT;')
  out.push('PRAGMA foreign_keys=ON;')

  return out.join('\n')
}