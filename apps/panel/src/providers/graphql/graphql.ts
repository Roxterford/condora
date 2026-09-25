/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
};

export type Abono = {
  __typename?: 'Abono';
  fecha: Scalars['DateTime']['output'];
  monto: Scalars['Float']['output'];
  pago: Scalars['ID']['output'];
};

export type ActualizarSujetoDto = {
  email?: InputMaybe<Scalars['String']['input']>;
  telefono?: InputMaybe<Scalars['String']['input']>;
};

export type BooleanCondition = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  neq?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Cuota = {
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  gastos: Array<GastoType>;
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  recaudacion: Recaudacion;
  registro: Scalars['DateTime']['output'];
};

export type CuotaEspecial = Cuota & {
  __typename?: 'CuotaEspecial';
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  detalles: Proyecto;
  gastos: Array<GastoType>;
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  recaudacion: Recaudacion;
  registro: Scalars['DateTime']['output'];
};

export type CuotaFilter = {
  and?: InputMaybe<Array<CuotaFilter>>;
  id?: InputMaybe<StringCondition>;
  monto?: InputMaybe<IntCondition>;
  not?: InputMaybe<CuotaFilter>;
  or?: InputMaybe<Array<CuotaFilter>>;
};

export type CuotaRegular = Cuota & {
  __typename?: 'CuotaRegular';
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  gastos: Array<GastoType>;
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  recaudacion: Recaudacion;
  registro: Scalars['DateTime']['output'];
};

export type CuotaSemilla = Cuota & {
  __typename?: 'CuotaSemilla';
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  gastos: Array<GastoType>;
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  recaudacion: Recaudacion;
  registro: Scalars['DateTime']['output'];
};

export type CuotaType = CuotaEspecial | CuotaRegular | CuotaSemilla;

export type Deuda = {
  __typename?: 'Deuda';
  abonos?: Maybe<Array<Abono>>;
  cuota: Deuda__CuotaType;
  deuda: Scalars['Float']['output'];
  estado: EstadoDeDeuda;
  id: Scalars['String']['output'];
  monto: Scalars['Float']['output'];
  registro: Scalars['DateTime']['output'];
  titular?: Maybe<Deuda__Titular>;
  unidad: UnidadIdentifiers;
};

export type DeudaFilter = {
  and?: InputMaybe<Array<DeudaFilter>>;
  cuota?: InputMaybe<StringCondition>;
  estado?: InputMaybe<StringCondition>;
  not?: InputMaybe<DeudaFilter>;
  or?: InputMaybe<Array<DeudaFilter>>;
  unidad?: InputMaybe<StringCondition>;
};

export type Deuda__Cuota = {
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  nombre: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
};

export type Deuda__CuotaEspecial = Deuda__Cuota & {
  __typename?: 'Deuda__CuotaEspecial';
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  nombre: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
};

export type Deuda__CuotaRegular = Deuda__Cuota & {
  __typename?: 'Deuda__CuotaRegular';
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  nombre: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
};

export type Deuda__CuotaSemilla = Deuda__Cuota & {
  __typename?: 'Deuda__CuotaSemilla';
  actualizacion: Scalars['DateTime']['output'];
  anio: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  mes: Mes;
  monto: Scalars['Float']['output'];
  nombre: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
};

export type Deuda__CuotaType = Deuda__CuotaEspecial | Deuda__CuotaRegular | Deuda__CuotaSemilla;

export type Deuda__Titular = {
  __typename?: 'Deuda__Titular';
  cedula: Scalars['String']['output'];
  display_name: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  telefono: Scalars['String']['output'];
};

export type Ente = Sujeto & {
  __typename?: 'Ente';
  cedula: Scalars['String']['output'];
  display_name: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  razon_social: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  representante: Persona;
  telefono: Scalars['String']['output'];
};

export enum EstadoDeDeuda {
  Abonada = 'ABONADA',
  Pendiente = 'PENDIENTE',
  Saldada = 'SALDADA'
}

export enum EstadoDeProyecto {
  Activo = 'ACTIVO',
  Borrador = 'BORRADOR',
  Cerrado = 'CERRADO'
}

export enum EstadoDeUnidad {
  Activa = 'ACTIVA',
  EnLitigio = 'EN_LITIGIO',
  Exenta = 'EXENTA',
  Inhabitada = 'INHABITADA',
  Preventa = 'PREVENTA',
  Suspendida = 'SUSPENDIDA'
}

export type Gasto = {
  concepto: Scalars['String']['output'];
  cuota?: Maybe<Scalars['ID']['output']>;
  fecha: Scalars['DateTime']['output'];
  metodo: MetodoDeOperacion;
  moneda: Moneda;
  monto: Scalars['Float']['output'];
  operacion: Scalars['ID']['output'];
  registrado_por: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  tasa: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  transaccion?: Maybe<Scalars['ID']['output']>;
};

export type GastoACondominio = Gasto & IOperacion & {
  __typename?: 'GastoACondominio';
  concepto: Scalars['String']['output'];
  cuota?: Maybe<Scalars['ID']['output']>;
  fecha: Scalars['DateTime']['output'];
  metodo: MetodoDeOperacion;
  moneda: Moneda;
  monto: Scalars['Float']['output'];
  operacion: Scalars['ID']['output'];
  registrado_por: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  tasa: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  transaccion?: Maybe<Scalars['ID']['output']>;
};

export type GastoAProveedor = Gasto & IOperacion & {
  __typename?: 'GastoAProveedor';
  concepto: Scalars['String']['output'];
  cuota?: Maybe<Scalars['ID']['output']>;
  fecha: Scalars['DateTime']['output'];
  metodo: MetodoDeOperacion;
  moneda: Moneda;
  monto: Scalars['Float']['output'];
  operacion: Scalars['ID']['output'];
  proveedor: Proveedor;
  registrado_por: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  tasa: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  transaccion?: Maybe<Scalars['ID']['output']>;
};

export type GastoFilter = {
  and?: InputMaybe<Array<GastoFilter>>;
  concepto?: InputMaybe<StringCondition>;
  cuota?: InputMaybe<StringCondition>;
  not?: InputMaybe<GastoFilter>;
  or?: InputMaybe<Array<GastoFilter>>;
};

export type GastoType = GastoACondominio | GastoAProveedor;

export type IOperacion = {
  concepto: Scalars['String']['output'];
  fecha: Scalars['DateTime']['output'];
  metodo: MetodoDeOperacion;
  moneda: Moneda;
  monto: Scalars['Float']['output'];
  operacion: Scalars['ID']['output'];
  registrado_por: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  tasa: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
};

export type IntCondition = {
  eq?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  neq?: InputMaybe<Scalars['Int']['input']>;
};

export type LoginCredentialsDto = {
  __typename?: 'LoginCredentialsDTO';
  token: Scalars['String']['output'];
};

export enum Mes {
  Abril = 'ABRIL',
  Agosto = 'AGOSTO',
  Diciembre = 'DICIEMBRE',
  Enero = 'ENERO',
  Febrero = 'FEBRERO',
  Julio = 'JULIO',
  Junio = 'JUNIO',
  Marzo = 'MARZO',
  Mayo = 'MAYO',
  Noviembre = 'NOVIEMBRE',
  Octubre = 'OCTUBRE',
  Septiembre = 'SEPTIEMBRE'
}

export enum MetodoDeOperacion {
  Cheque = 'Cheque',
  Compensacion = 'Compensacion',
  Efectivo = 'Efectivo',
  PagoMovil = 'PagoMovil',
  TransferenciaInternacional = 'TransferenciaInternacional',
  TransferenciaNacional = 'TransferenciaNacional'
}

export enum Moneda {
  Usd = 'USD',
  Ved = 'VED'
}

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  actualizarSujeto: Scalars['Boolean']['output'];
  login: LoginCredentialsDto;
  registrarCuota: CuotaType;
  registrarGasto?: Maybe<Operacion>;
  registrarPago: Operacion;
  registrarSujeto: Sujeto;
  registrarUnidad: Unidad;
};


export type MutationActualizarSujetoArgs = {
  data: ActualizarSujetoDto;
  id: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRegistrarCuotaArgs = {
  input: RegistrarCuotaDto;
};


export type MutationRegistrarGastoArgs = {
  input: RegistrarGastoDto;
};


export type MutationRegistrarPagoArgs = {
  input?: InputMaybe<RegistrarPagoDto>;
};


export type MutationRegistrarSujetoArgs = {
  input: RegistrarSujetoDto;
};


export type MutationRegistrarUnidadArgs = {
  input: RegistrarUnidadDto;
};

export type ObtenerProveedoresDto = {
  and?: InputMaybe<Array<ObtenerProveedoresDto>>;
  id?: InputMaybe<StringCondition>;
  not?: InputMaybe<ObtenerProveedoresDto>;
  or?: InputMaybe<Array<ObtenerProveedoresDto>>;
};

export type Operacion = {
  __typename?: 'Operacion';
  concepto: Scalars['String']['output'];
  cuota?: Maybe<Scalars['ID']['output']>;
  fecha: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  metodo: MetodoDeOperacion;
  moneda: Moneda;
  monto: Scalars['Float']['output'];
  proveedor?: Maybe<Scalars['String']['output']>;
  registrado_por: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  rol: RolDestinoDeOperacion;
  tasa: Scalars['Float']['output'];
  tipo: TipoDeOperacion;
  total: Scalars['Float']['output'];
  unidad?: Maybe<Unidad>;
  unidad_codigo?: Maybe<Scalars['String']['output']>;
};

export type OperacionFilter = {
  and?: InputMaybe<Array<OperacionFilter>>;
  concepto?: InputMaybe<StringCondition>;
  not?: InputMaybe<OperacionFilter>;
  or?: InputMaybe<Array<OperacionFilter>>;
  proveedor_nombre?: InputMaybe<StringCondition>;
  tipo?: InputMaybe<StringCondition>;
  unidad?: InputMaybe<StringCondition>;
};

export type OperacionType = GastoACondominio | GastoAProveedor | Pago;

export type PaginatedCuota = {
  __typename?: 'PaginatedCuota';
  data: Array<CuotaType>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginatedDeuda = {
  __typename?: 'PaginatedDeuda';
  data: Array<Deuda>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginatedGasto = {
  __typename?: 'PaginatedGasto';
  data: Array<GastoType>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginatedOperacion = {
  __typename?: 'PaginatedOperacion';
  data: Array<OperacionType>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginatedPago = {
  __typename?: 'PaginatedPago';
  data: Array<Pago>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginatedUnidad = {
  __typename?: 'PaginatedUnidad';
  data: Array<Unidad>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Paginator = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};

export type Pago = IOperacion & {
  __typename?: 'Pago';
  concepto: Scalars['String']['output'];
  fecha: Scalars['DateTime']['output'];
  metodo: MetodoDeOperacion;
  moneda: Moneda;
  monto: Scalars['Float']['output'];
  operacion: Scalars['ID']['output'];
  registrado_por: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  tasa: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  unidad: UnidadIdentifiers;
};

export type PagoFilter = {
  and?: InputMaybe<Array<PagoFilter>>;
  not?: InputMaybe<PagoFilter>;
  or?: InputMaybe<Array<PagoFilter>>;
  unidad?: InputMaybe<StringCondition>;
};

export type PeriodoDisponible = {
  __typename?: 'PeriodoDisponible';
  anio: Scalars['Int']['output'];
  mes: Mes;
};

export type Persona = Sujeto & {
  __typename?: 'Persona';
  apellidos: Scalars['String']['output'];
  cedula: Scalars['String']['output'];
  display_name: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  nombres: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  telefono: Scalars['String']['output'];
};

export type Proveedor = {
  __typename?: 'Proveedor';
  actualizado_en: Scalars['DateTime']['output'];
  creado_en: Scalars['DateTime']['output'];
  direccion?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  nombre: Scalars['String']['output'];
  rif: Scalars['String']['output'];
  telefono?: Maybe<Scalars['String']['output']>;
};

export type Proyecto = {
  __typename?: 'Proyecto';
  actualizacion: Scalars['DateTime']['output'];
  descripcion: Scalars['String']['output'];
  estado: EstadoDeProyecto;
  fecha_limite: Scalars['DateTime']['output'];
  interes_por_mora: Scalars['Float']['output'];
  justificacion: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  titulo: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  obtenerCuota?: Maybe<CuotaType>;
  obtenerCuotas: PaginatedCuota;
  obtenerDeudas: PaginatedDeuda;
  obtenerGastos: PaginatedGasto;
  obtenerOperaciones: PaginatedOperacion;
  obtenerPagos: PaginatedPago;
  obtenerPeriodosDisponibles: Array<PeriodoDisponible>;
  obtenerProveedores: Array<Proveedor>;
  obtenerResumenUnidades: UnidadesResumen;
  obtenerTasa: Tasa;
  obtenerUnidad?: Maybe<Unidad>;
  obtenerUnidadPorCodigo?: Maybe<Unidad>;
  obtenerUnidades?: Maybe<PaginatedUnidad>;
};


export type QueryObtenerCuotaArgs = {
  id: Scalars['String']['input'];
};


export type QueryObtenerCuotasArgs = {
  filter?: InputMaybe<CuotaFilter>;
  paginator?: InputMaybe<Paginator>;
};


export type QueryObtenerDeudasArgs = {
  filtro?: InputMaybe<DeudaFilter>;
  paginador?: InputMaybe<Paginator>;
};


export type QueryObtenerGastosArgs = {
  filter?: InputMaybe<GastoFilter>;
  paginator?: InputMaybe<Paginator>;
};


export type QueryObtenerOperacionesArgs = {
  filtro?: InputMaybe<OperacionFilter>;
  paginador?: InputMaybe<Paginator>;
};


export type QueryObtenerPagosArgs = {
  filtro?: InputMaybe<PagoFilter>;
  paginador?: InputMaybe<Paginator>;
};


export type QueryObtenerPeriodosDisponiblesArgs = {
  anio?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryObtenerProveedoresArgs = {
  filter?: InputMaybe<ObtenerProveedoresDto>;
};


export type QueryObtenerTasaArgs = {
  anio?: InputMaybe<Scalars['Int']['input']>;
  dia?: InputMaybe<Scalars['Int']['input']>;
  mes?: InputMaybe<Mes>;
};


export type QueryObtenerUnidadArgs = {
  id: Scalars['ID']['input'];
};


export type QueryObtenerUnidadPorCodigoArgs = {
  codigo: Scalars['String']['input'];
};


export type QueryObtenerUnidadesArgs = {
  filter?: InputMaybe<UnidadFilter>;
  paginator?: InputMaybe<Paginator>;
};

export type Recaudacion = {
  __typename?: 'Recaudacion';
  moneda: Moneda;
  monto_estimado: Scalars['Float']['output'];
  monto_pendiente: Scalars['Float']['output'];
  monto_recaudado: Scalars['Float']['output'];
  pagos_asociados: Scalars['Int']['output'];
  unidades: Scalars['Int']['output'];
  unidades_aplicadas: Scalars['Int']['output'];
  unidades_pendientes: Scalars['Int']['output'];
  unidades_solventes: Scalars['Int']['output'];
};

export type RegistrarCuotaDto = {
  anio?: InputMaybe<Scalars['Int']['input']>;
  descripcion?: InputMaybe<Scalars['String']['input']>;
  fecha_limite?: InputMaybe<Scalars['DateTime']['input']>;
  gastos: Array<Scalars['ID']['input']>;
  justificacion?: InputMaybe<Scalars['String']['input']>;
  mes?: InputMaybe<Mes>;
  tipo: TipoDeCuota;
  titulo?: InputMaybe<Scalars['String']['input']>;
};

export type RegistrarGastoDto = {
  concepto: Scalars['String']['input'];
  fecha?: InputMaybe<Scalars['DateTime']['input']>;
  metodo: MetodoDeOperacion;
  moneda?: InputMaybe<Moneda>;
  monto: Scalars['Int']['input'];
  proveedor: Scalars['ID']['input'];
  referencia?: InputMaybe<Scalars['String']['input']>;
  tasa: Scalars['Int']['input'];
};

export type RegistrarPagoDto = {
  concepto?: InputMaybe<Scalars['String']['input']>;
  fecha?: InputMaybe<Scalars['DateTime']['input']>;
  metodo: MetodoDeOperacion;
  moneda: Moneda;
  monto: Scalars['Int']['input'];
  referencia?: InputMaybe<Scalars['String']['input']>;
  tasa: Scalars['Int']['input'];
  unidad: Scalars['ID']['input'];
};

export type RegistrarProveedorDto = {
  direccion?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  nombre: Scalars['String']['input'];
  rif: Scalars['String']['input'];
  telefono: Scalars['String']['input'];
};

export type RegistrarSujetoDto = {
  apellidos?: InputMaybe<Scalars['String']['input']>;
  documento_identidad: Scalars['String']['input'];
  email: Scalars['String']['input'];
  nombres?: InputMaybe<Scalars['String']['input']>;
  razon_social?: InputMaybe<Scalars['String']['input']>;
  representante?: InputMaybe<Scalars['ID']['input']>;
  telefono: Scalars['String']['input'];
  tipo: TipoDeSujeto;
};

export type RegistrarUnidadDto = {
  codigo: Scalars['String']['input'];
  contacto?: InputMaybe<Scalars['ID']['input']>;
  descripcion?: InputMaybe<Scalars['String']['input']>;
  estado: EstadoDeUnidad;
  titular_primario?: InputMaybe<Scalars['ID']['input']>;
};

export enum RolDestinoDeOperacion {
  Condominio = 'Condominio',
  Proveedor = 'Proveedor',
  Unidad = 'Unidad'
}

export type StringCondition = {
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  like?: InputMaybe<Scalars['String']['input']>;
  neq?: InputMaybe<Scalars['String']['input']>;
  regex?: InputMaybe<Scalars['String']['input']>;
};

export type Sujeto = {
  cedula: Scalars['String']['output'];
  display_name: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  registro: Scalars['DateTime']['output'];
  telefono: Scalars['String']['output'];
};

export type Tasa = {
  __typename?: 'Tasa';
  fecha: Scalars['String']['output'];
  fuente: Scalars['String']['output'];
  moneda: Scalars['String']['output'];
  tipo: Scalars['String']['output'];
  valor: Scalars['Float']['output'];
};

export enum TipoDeCuota {
  Especial = 'Especial',
  Regular = 'Regular',
  Semilla = 'Semilla'
}

export enum TipoDeOperacion {
  Credito = 'Credito',
  Debito = 'Debito'
}

export enum TipoDeSujeto {
  EnteJuridico = 'ENTE_JURIDICO',
  PersonaNatural = 'PERSONA_NATURAL'
}

export type Titular = Ente | Persona;

export type Unidad = {
  __typename?: 'Unidad';
  codigo: Scalars['String']['output'];
  contacto?: Maybe<Persona>;
  deuda: Scalars['Float']['output'];
  estado: EstadoDeUnidad;
  id: Scalars['String']['output'];
  titular_primario?: Maybe<Titular>;
  titulares?: Maybe<Array<Titular>>;
  wallet: Scalars['Float']['output'];
};

export type UnidadFilter = {
  and?: InputMaybe<Array<UnidadFilter>>;
  codigo?: InputMaybe<StringCondition>;
  deuda?: InputMaybe<IntCondition>;
  estado?: InputMaybe<StringCondition>;
  id?: InputMaybe<StringCondition>;
  not?: InputMaybe<UnidadFilter>;
  or?: InputMaybe<Array<UnidadFilter>>;
};

export type UnidadIdentifiers = {
  __typename?: 'UnidadIdentifiers';
  codigo: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type UnidadesResumen = {
  __typename?: 'UnidadesResumen';
  total_asignado: Scalars['Float']['output'];
  total_pendiente: Scalars['Float']['output'];
  total_unidades: Scalars['Int']['output'];
  unidades_activas: Scalars['Int']['output'];
  unidades_con_pendientes: Scalars['Int']['output'];
  unidades_en_litigio: Scalars['Int']['output'];
  unidades_exentas: Scalars['Int']['output'];
  unidades_inhabitadas: Scalars['Int']['output'];
  unidades_preventa: Scalars['Int']['output'];
  unidades_solventes: Scalars['Int']['output'];
  unidades_suspendidas: Scalars['Int']['output'];
};

export type EstadoPagosVillaQueryVariables = Exact<{
  filtro?: InputMaybe<DeudaFilter>;
  paginador?: InputMaybe<Paginator>;
}>;


export type EstadoPagosVillaQuery = { __typename?: 'Query', deudas: { __typename?: 'PaginatedDeuda', limit: number, page: number, pages: number, total: number, data: Array<{ __typename?: 'Deuda', id: string, monto: number, deuda: number, estado: EstadoDeDeuda, unidad: { __typename?: 'UnidadIdentifiers', id: string, codigo: string }, titular?: { __typename?: 'Deuda__Titular', id: string, display_name: string } | null }> } };

export type ConteoDeudasPorEstadoQueryVariables = Exact<{
  filtro?: InputMaybe<DeudaFilter>;
  paginador?: InputMaybe<Paginator>;
}>;


export type ConteoDeudasPorEstadoQuery = { __typename?: 'Query', deudas: { __typename?: 'PaginatedDeuda', total: number } };

export type CuotaPageQueryVariables = Exact<{
  cuota_id: Scalars['String']['input'];
}>;


export type CuotaPageQuery = { __typename?: 'Query', cuota?:
    | { __typename: 'CuotaEspecial', id: string, mes: Mes, anio: number, registro: Date, recaudacion: { __typename?: 'Recaudacion', moneda: Moneda, monto_estimado: number, monto_recaudado: number, monto_pendiente: number, unidades_aplicadas: number, unidades_solventes: number, unidades_pendientes: number }, gastos: Array<
        | { __typename: 'GastoACondominio', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number }
        | { __typename: 'GastoAProveedor', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number, proveedor: { __typename?: 'Proveedor', id: string, nombre: string, rif: string, telefono?: string | null, email?: string | null } }
      >, detalles: { __typename?: 'Proyecto', titulo: string, descripcion: string, justificacion: string, fecha_limite: Date, estado: EstadoDeProyecto } }
    | { __typename: 'CuotaRegular', id: string, mes: Mes, anio: number, registro: Date, recaudacion: { __typename?: 'Recaudacion', moneda: Moneda, monto_estimado: number, monto_recaudado: number, monto_pendiente: number, unidades_aplicadas: number, unidades_solventes: number, unidades_pendientes: number }, gastos: Array<
        | { __typename: 'GastoACondominio', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number }
        | { __typename: 'GastoAProveedor', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number, proveedor: { __typename?: 'Proveedor', id: string, nombre: string, rif: string, telefono?: string | null, email?: string | null } }
      > }
    | { __typename: 'CuotaSemilla', id: string, mes: Mes, anio: number, registro: Date, recaudacion: { __typename?: 'Recaudacion', moneda: Moneda, monto_estimado: number, monto_recaudado: number, monto_pendiente: number, unidades_aplicadas: number, unidades_solventes: number, unidades_pendientes: number }, gastos: Array<
        | { __typename: 'GastoACondominio', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number }
        | { __typename: 'GastoAProveedor', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number, proveedor: { __typename?: 'Proveedor', id: string, nombre: string, rif: string, telefono?: string | null, email?: string | null } }
      > }
   | null };

export type CuotasPageQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type CuotasPageQuery = { __typename?: 'Query', cuotas: { __typename?: 'PaginatedCuota', limit: number, page: number, pages: number, total: number, data: Array<
      | { __typename: 'CuotaEspecial', id: string, monto: number, mes: Mes, anio: number, registro: Date, recaudacion: { __typename?: 'Recaudacion', unidades_aplicadas: number, pagos_asociados: number, monto_estimado: number, monto_recaudado: number, moneda: Moneda }, detalles: { __typename?: 'Proyecto', titulo: string, descripcion: string } }
      | { __typename: 'CuotaRegular', id: string, monto: number, mes: Mes, anio: number, registro: Date, recaudacion: { __typename?: 'Recaudacion', unidades_aplicadas: number, pagos_asociados: number, monto_estimado: number, monto_recaudado: number, moneda: Moneda } }
      | { __typename: 'CuotaSemilla', id: string, monto: number, mes: Mes, anio: number, registro: Date, recaudacion: { __typename?: 'Recaudacion', unidades_aplicadas: number, pagos_asociados: number, monto_estimado: number, monto_recaudado: number, moneda: Moneda } }
    > } };

export type RegistrarCuotaPageQueryVariables = Exact<{ [key: string]: never; }>;


export type RegistrarCuotaPageQuery = { __typename?: 'Query', obtenerProveedores: Array<{ __typename?: 'Proveedor', id: string, nombre: string }> };

export type DashboardPageQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardPageQuery = { __typename?: 'Query', proveedores: Array<{ __typename?: 'Proveedor', id: string, nombre: string }> };

export type OperacionesPageQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  filtro?: InputMaybe<OperacionFilter>;
  limit: Scalars['Int']['input'];
}>;


export type OperacionesPageQuery = { __typename?: 'Query', proveedores: Array<{ __typename?: 'Proveedor', id: string, nombre: string }>, operaciones: { __typename?: 'PaginatedOperacion', limit: number, page: number, pages: number, total: number, data: Array<
      | { __typename: 'GastoACondominio', fecha: Date, operacion: string, concepto: string, metodo: MetodoDeOperacion, monto: number, moneda: Moneda, registro: Date, tasa: number, total: number }
      | { __typename: 'GastoAProveedor', fecha: Date, operacion: string, concepto: string, metodo: MetodoDeOperacion, monto: number, moneda: Moneda, registro: Date, tasa: number, total: number, proveedor: { __typename?: 'Proveedor', nombre: string, rif: string, telefono?: string | null, email?: string | null } }
      | { __typename: 'Pago', fecha: Date, operacion: string, concepto: string, metodo: MetodoDeOperacion, monto: number, moneda: Moneda, registro: Date, tasa: number, total: number, unidad: { __typename?: 'UnidadIdentifiers', id: string, codigo: string } }
    > } };

export type UnidadTitularQueryVariables = Exact<{
  codigo: Scalars['String']['input'];
}>;


export type UnidadTitularQuery = { __typename?: 'Query', unidad?: { __typename?: 'Unidad', codigo: string, titular_primario?:
      | { __typename: 'Ente', id: string, display_name: string, cedula: string, email: string, telefono: string }
      | { __typename: 'Persona', id: string, display_name: string, cedula: string, email: string, telefono: string }
     | null } | null };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  pass: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'LoginCredentialsDTO', token: string } };

export type RegistrarPagoPageQueryVariables = Exact<{
  codigo_like: Scalars['String']['input'];
}>;


export type RegistrarPagoPageQuery = { __typename?: 'Query', unidades?: { __typename?: 'PaginatedUnidad', data: Array<{ __typename?: 'Unidad', id: string, codigo: string }> } | null };

export type VillaDeudasQueryVariables = Exact<{
  codigo: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type VillaDeudasQuery = { __typename?: 'Query', deudas: { __typename?: 'PaginatedDeuda', limit: number, page: number, pages: number, total: number, data: Array<{ __typename?: 'Deuda', id: string, deuda: number, monto: number, estado: EstadoDeDeuda, cuota:
        | { __typename: 'Deuda__CuotaEspecial', id: string, nombre: string }
        | { __typename: 'Deuda__CuotaRegular', id: string, nombre: string }
        | { __typename: 'Deuda__CuotaSemilla', id: string, nombre: string }
       }> } };

export type EditarTitularMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  data: ActualizarSujetoDto;
}>;


export type EditarTitularMutation = { __typename?: 'Mutation', actualizarSujeto: boolean };

export type VillaPagosQueryVariables = Exact<{
  codigo: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type VillaPagosQuery = { __typename?: 'Query', pagos: { __typename?: 'PaginatedPago', limit: number, page: number, pages: number, total: number, data: Array<{ __typename: 'Pago', fecha: Date, operacion: string, concepto: string, metodo: MetodoDeOperacion, moneda: Moneda, monto: number, registro: Date, tasa: number, total: number, unidad: { __typename?: 'UnidadIdentifiers', id: string, codigo: string } }> } };

export type RegistrarTitularMutationVariables = Exact<{
  input: RegistrarSujetoDto;
}>;


export type RegistrarTitularMutation = { __typename?: 'Mutation', registrarSujeto:
    | { __typename?: 'Ente', id: string, display_name: string }
    | { __typename?: 'Persona', id: string, display_name: string }
   };

export type VillaPageQueryVariables = Exact<{
  codigo: Scalars['String']['input'];
  estado_deuda_pendiente: Scalars['String']['input'];
}>;


export type VillaPageQuery = { __typename?: 'Query', ultimo_pago: { __typename?: 'PaginatedPago', data: Array<{ __typename?: 'Pago', fecha: Date, metodo: MetodoDeOperacion, total: number }> }, unidad?: { __typename?: 'Unidad', id: string, codigo: string, estado: EstadoDeUnidad, wallet: number, deuda: number, contacto?: { __typename?: 'Persona', id: string, cedula: string, display_name: string, email: string, telefono: string, registro: Date } | null, titular_primario?:
      | { __typename: 'Ente', id: string, cedula: string, display_name: string, email: string, telefono: string }
      | { __typename: 'Persona', id: string, cedula: string, display_name: string, email: string, telefono: string }
     | null, titulares?: Array<
      | { __typename: 'Ente', id: string, cedula: string, display_name: string, email: string, telefono: string, registro: Date, razon_social: string, representante: { __typename?: 'Persona', id: string, display_name: string, cedula: string, email: string, telefono: string } }
      | { __typename: 'Persona', id: string, cedula: string, display_name: string, email: string, telefono: string, registro: Date, nombres: string, apellidos: string }
    > | null } | null, deudas_pendientes: { __typename?: 'PaginatedDeuda', total: number } };

export type VillasPageQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  filtro?: InputMaybe<UnidadFilter>;
  limit: Scalars['Int']['input'];
}>;


export type VillasPageQuery = { __typename?: 'Query', resumen: { __typename?: 'UnidadesResumen', total_unidades: number, unidades_solventes: number, unidades_con_pendientes: number, total_pendiente: number }, villas?: { __typename?: 'PaginatedUnidad', limit: number, page: number, pages: number, total: number, data: Array<{ __typename?: 'Unidad', codigo: string, estado: EstadoDeUnidad, wallet: number, deuda: number, contacto?: { __typename?: 'Persona', id: string, email: string, telefono: string } | null, titular_primario?:
        | { __typename: 'Ente', id: string, cedula: string, display_name: string, razon_social: string }
        | { __typename: 'Persona', id: string, cedula: string, display_name: string, nombres: string, apellidos: string }
       | null }> } | null };

export type CuotaDetalleQueryVariables = Exact<{
  cuota_id: Scalars['String']['input'];
}>;


export type CuotaDetalleQuery = { __typename?: 'Query', cuota?:
    | { __typename: 'CuotaEspecial', id: string, monto: number, mes: Mes, anio: number, registro: Date, actualizacion: Date, detalles: { __typename?: 'Proyecto', titulo: string, descripcion: string, justificacion: string, fecha_limite: Date, estado: EstadoDeProyecto }, recaudacion: { __typename?: 'Recaudacion', moneda: Moneda, monto_estimado: number, monto_recaudado: number, monto_pendiente: number, pagos_asociados: number, unidades: number, unidades_aplicadas: number, unidades_solventes: number, unidades_pendientes: number }, gastos: Array<
        | { __typename: 'GastoACondominio', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number }
        | { __typename: 'GastoAProveedor', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number, proveedor: { __typename?: 'Proveedor', id: string, nombre: string } }
      > }
    | { __typename: 'CuotaRegular', id: string, monto: number, mes: Mes, anio: number, registro: Date, actualizacion: Date, recaudacion: { __typename?: 'Recaudacion', moneda: Moneda, monto_estimado: number, monto_recaudado: number, monto_pendiente: number, pagos_asociados: number, unidades: number, unidades_aplicadas: number, unidades_solventes: number, unidades_pendientes: number }, gastos: Array<
        | { __typename: 'GastoACondominio', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number }
        | { __typename: 'GastoAProveedor', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number, proveedor: { __typename?: 'Proveedor', id: string, nombre: string } }
      > }
    | { __typename: 'CuotaSemilla', id: string, monto: number, mes: Mes, anio: number, registro: Date, actualizacion: Date, recaudacion: { __typename?: 'Recaudacion', moneda: Moneda, monto_estimado: number, monto_recaudado: number, monto_pendiente: number, pagos_asociados: number, unidades: number, unidades_aplicadas: number, unidades_solventes: number, unidades_pendientes: number }, gastos: Array<
        | { __typename: 'GastoACondominio', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number }
        | { __typename: 'GastoAProveedor', operacion: string, concepto: string, moneda: Moneda, monto: number, fecha: Date, tasa: number, total: number, proveedor: { __typename?: 'Proveedor', id: string, nombre: string } }
      > }
   | null, deudas: { __typename?: 'PaginatedDeuda', data: Array<{ __typename?: 'Deuda', id: string, deuda: number, estado: EstadoDeDeuda, unidad: { __typename?: 'UnidadIdentifiers', codigo: string }, titular?: { __typename?: 'Deuda__Titular', display_name: string } | null }> } };

export type GlobalSearchQueryVariables = Exact<{
  busqueda: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GlobalSearchQuery = { __typename?: 'Query', unidades?: { __typename?: 'PaginatedUnidad', total: number, data: Array<{ __typename?: 'Unidad', codigo: string, estado: EstadoDeUnidad, deuda: number, titular_primario?:
        | { __typename: 'Ente', id: string, cedula: string, display_name: string, razon_social: string }
        | { __typename: 'Persona', id: string, cedula: string, display_name: string, nombres: string, apellidos: string }
       | null }> } | null, operaciones: { __typename?: 'PaginatedOperacion', total: number, data: Array<
      | { __typename: 'GastoACondominio', fecha: Date, operacion: string, concepto: string, monto: number, moneda: Moneda }
      | { __typename: 'GastoAProveedor', fecha: Date, operacion: string, concepto: string, monto: number, moneda: Moneda, proveedor: { __typename?: 'Proveedor', nombre: string } }
      | { __typename: 'Pago', fecha: Date, operacion: string, concepto: string, monto: number, moneda: Moneda, unidad: { __typename?: 'UnidadIdentifiers', id: string, codigo: string } }
    > }, proveedores: Array<{ __typename?: 'Proveedor', id: string, nombre: string, rif: string }> };

export type ObtenerPerodosDisponiblesQueryVariables = Exact<{ [key: string]: never; }>;


export type ObtenerPerodosDisponiblesQuery = { __typename?: 'Query', periodos: Array<{ __typename?: 'PeriodoDisponible', anio: number, mes: Mes }> };

export type ResumenUnidadesParaCuotaQueryVariables = Exact<{ [key: string]: never; }>;


export type ResumenUnidadesParaCuotaQuery = { __typename?: 'Query', resumen: { __typename?: 'UnidadesResumen', unidades_activas: number } };

export type RegistrarCuotaMutationVariables = Exact<{
  input: RegistrarCuotaDto;
}>;


export type RegistrarCuotaMutation = { __typename?: 'Mutation', registrarCuota:
    | { __typename: 'CuotaEspecial', id: string }
    | { __typename: 'CuotaRegular', id: string }
    | { __typename: 'CuotaSemilla', id: string }
   };

export type RegistrarPagoOverlayUnidadesQueryVariables = Exact<{
  codigo_like: Scalars['String']['input'];
}>;


export type RegistrarPagoOverlayUnidadesQuery = { __typename?: 'Query', unidades?: { __typename?: 'PaginatedUnidad', data: Array<{ __typename?: 'Unidad', id: string, codigo: string, wallet: number, deuda: number }> } | null };

export type RegistrarGastoOverlayMutationVariables = Exact<{
  input: RegistrarGastoDto;
}>;


export type RegistrarGastoOverlayMutation = { __typename?: 'Mutation', registrarGasto?: { __typename?: 'Operacion', id: string, concepto: string } | null };

export type BuscarGastosHuerfanosQueryVariables = Exact<{
  busqueda?: InputMaybe<Scalars['String']['input']>;
}>;


export type BuscarGastosHuerfanosQuery = { __typename?: 'Query', gastos: { __typename?: 'PaginatedGasto', data: Array<
      | { __typename: 'GastoACondominio', monto: number, total: number, operacion: string, concepto: string, metodo: MetodoDeOperacion, moneda: Moneda, tasa: number, fecha: Date, registrado_por: string, registro: Date }
      | { __typename: 'GastoAProveedor', monto: number, total: number, operacion: string, concepto: string, metodo: MetodoDeOperacion, moneda: Moneda, tasa: number, fecha: Date, registrado_por: string, registro: Date, proveedor: { __typename?: 'Proveedor', id: string, nombre: string, rif: string, telefono?: string | null, email?: string | null, actualizado_en: Date, creado_en: Date, direccion?: string | null } }
    > } };

export type RegistrarPagoMutationVariables = Exact<{
  input: RegistrarPagoDto;
}>;


export type RegistrarPagoMutation = { __typename?: 'Mutation', registrarPago: { __typename?: 'Operacion', id: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const EstadoPagosVillaDocument = new TypedDocumentString(`
    query EstadoPagosVilla($filtro: DeudaFilter, $paginador: Paginator) {
  deudas: obtenerDeudas(filtro: $filtro, paginador: $paginador) {
    data {
      id
      unidad {
        id
        codigo
      }
      titular {
        id
        display_name
      }
      monto
      deuda
      estado
    }
    limit
    page
    pages
    total
  }
}
    `) as unknown as TypedDocumentString<EstadoPagosVillaQuery, EstadoPagosVillaQueryVariables>;
export const ConteoDeudasPorEstadoDocument = new TypedDocumentString(`
    query ConteoDeudasPorEstado($filtro: DeudaFilter, $paginador: Paginator) {
  deudas: obtenerDeudas(filtro: $filtro, paginador: $paginador) {
    total
  }
}
    `) as unknown as TypedDocumentString<ConteoDeudasPorEstadoQuery, ConteoDeudasPorEstadoQueryVariables>;
export const CuotaPageDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<CuotaPageQuery, CuotaPageQueryVariables>;
export const CuotasPageDocument = new TypedDocumentString(`
    query CuotasPage($page: Int!, $limit: Int!) {
  cuotas: obtenerCuotas(paginator: {limit: $limit, page: $page}) {
    data {
      __typename
      ... on Cuota {
        id
        monto
        mes
        anio
        registro
        recaudacion {
          unidades_aplicadas
          pagos_asociados
          monto_estimado
          monto_recaudado
          moneda
        }
      }
      ... on CuotaEspecial {
        detalles {
          titulo
          descripcion
        }
        recaudacion {
          unidades_aplicadas
          pagos_asociados
          monto_estimado
          monto_recaudado
          moneda
        }
      }
    }
    limit
    page
    pages
    total
  }
}
    `) as unknown as TypedDocumentString<CuotasPageQuery, CuotasPageQueryVariables>;
export const RegistrarCuotaPageDocument = new TypedDocumentString(`
    query RegistrarCuotaPage {
  obtenerProveedores {
    id
    nombre
  }
}
    `) as unknown as TypedDocumentString<RegistrarCuotaPageQuery, RegistrarCuotaPageQueryVariables>;
export const DashboardPageDocument = new TypedDocumentString(`
    query DashboardPage {
  proveedores: obtenerProveedores {
    id
    nombre
  }
}
    `) as unknown as TypedDocumentString<DashboardPageQuery, DashboardPageQueryVariables>;
export const OperacionesPageDocument = new TypedDocumentString(`
    query OperacionesPage($page: Int!, $filtro: OperacionFilter, $limit: Int!) {
  proveedores: obtenerProveedores {
    id
    nombre
  }
  operaciones: obtenerOperaciones(
    paginador: {limit: $limit, page: $page}
    filtro: $filtro
  ) {
    data {
      __typename
      ... on IOperacion {
        fecha
        operacion
        concepto
        metodo
        monto
        moneda
        registro
        tasa
        total
      }
      ... on GastoAProveedor {
        proveedor {
          nombre
          rif
          telefono
          email
        }
      }
      ... on Pago {
        unidad {
          id
          codigo
        }
      }
    }
    limit
    page
    pages
    total
  }
}
    `) as unknown as TypedDocumentString<OperacionesPageQuery, OperacionesPageQueryVariables>;
export const UnidadTitularDocument = new TypedDocumentString(`
    query UnidadTitular($codigo: String!) {
  unidad: obtenerUnidadPorCodigo(codigo: $codigo) {
    codigo
    titular_primario {
      __typename
      ... on Sujeto {
        id
        display_name
        cedula
        email
        telefono
      }
    }
  }
}
    `) as unknown as TypedDocumentString<UnidadTitularQuery, UnidadTitularQueryVariables>;
export const LoginDocument = new TypedDocumentString(`
    mutation Login($email: String!, $pass: String!) {
  login(email: $email, password: $pass) {
    token
  }
}
    `) as unknown as TypedDocumentString<LoginMutation, LoginMutationVariables>;
export const RegistrarPagoPageDocument = new TypedDocumentString(`
    query RegistrarPagoPage($codigo_like: String!) {
  unidades: obtenerUnidades(
    filter: {codigo: {like: $codigo_like}}
    paginator: {limit: 5, page: 1}
  ) {
    data {
      id
      codigo
    }
  }
}
    `) as unknown as TypedDocumentString<RegistrarPagoPageQuery, RegistrarPagoPageQueryVariables>;
export const VillaDeudasDocument = new TypedDocumentString(`
    query VillaDeudas($codigo: String!, $page: Int!, $limit: Int!) {
  deudas: obtenerDeudas(
    filtro: {unidad: {eq: $codigo}}
    paginador: {limit: $limit, page: $page}
  ) {
    data {
      id
      cuota {
        __typename
        ... on Deuda__Cuota {
          id
          nombre
        }
      }
      deuda
      monto
      estado
    }
    limit
    page
    pages
    total
  }
}
    `) as unknown as TypedDocumentString<VillaDeudasQuery, VillaDeudasQueryVariables>;
export const EditarTitularDocument = new TypedDocumentString(`
    mutation EditarTitular($id: ID!, $data: ActualizarSujetoDTO!) {
  actualizarSujeto(id: $id, data: $data)
}
    `) as unknown as TypedDocumentString<EditarTitularMutation, EditarTitularMutationVariables>;
export const VillaPagosDocument = new TypedDocumentString(`
    query VillaPagos($codigo: String!, $page: Int!, $limit: Int!) {
  pagos: obtenerPagos(
    filtro: {unidad: {eq: $codigo}}
    paginador: {limit: $limit, page: $page}
  ) {
    data {
      __typename
      fecha
      operacion
      concepto
      metodo
      moneda
      monto
      registro
      tasa
      total
      unidad {
        id
        codigo
      }
    }
    limit
    page
    pages
    total
  }
}
    `) as unknown as TypedDocumentString<VillaPagosQuery, VillaPagosQueryVariables>;
export const RegistrarTitularDocument = new TypedDocumentString(`
    mutation RegistrarTitular($input: RegistrarSujetoDTO!) {
  registrarSujeto(input: $input) {
    id
    display_name
  }
}
    `) as unknown as TypedDocumentString<RegistrarTitularMutation, RegistrarTitularMutationVariables>;
export const VillaPageDocument = new TypedDocumentString(`
    query VillaPage($codigo: String!, $estado_deuda_pendiente: String!) {
  ultimo_pago: obtenerPagos(
    filtro: {unidad: {eq: $codigo}}
    paginador: {limit: 1, page: 1}
  ) {
    data {
      fecha
      metodo
      total
    }
  }
  unidad: obtenerUnidadPorCodigo(codigo: $codigo) {
    id
    codigo
    estado
    wallet
    deuda
    contacto {
      id
      cedula
      display_name
      email
      telefono
      registro
    }
    titular_primario {
      __typename
      ... on Sujeto {
        id
        cedula
        display_name
        email
        telefono
      }
    }
    titulares {
      __typename
      ... on Sujeto {
        id
        cedula
        display_name
        email
        telefono
        registro
      }
      ... on Persona {
        nombres
        apellidos
      }
      ... on Ente {
        razon_social
        representante {
          id
          display_name
          cedula
          email
          telefono
        }
      }
    }
  }
  deudas_pendientes: obtenerDeudas(
    filtro: {unidad: {eq: $codigo}, estado: {eq: $estado_deuda_pendiente}}
  ) {
    total
  }
}
    `) as unknown as TypedDocumentString<VillaPageQuery, VillaPageQueryVariables>;
export const VillasPageDocument = new TypedDocumentString(`
    query VillasPage($page: Int!, $filtro: UnidadFilter, $limit: Int!) {
  resumen: obtenerResumenUnidades {
    total_unidades
    unidades_solventes
    unidades_con_pendientes
    total_pendiente
  }
  villas: obtenerUnidades(
    filter: $filtro
    paginator: {limit: $limit, page: $page}
  ) {
    data {
      codigo
      estado
      wallet
      deuda
      contacto {
        id
        email
        telefono
      }
      titular_primario {
        __typename
        ... on Sujeto {
          id
          cedula
          display_name
        }
        ... on Persona {
          nombres
          apellidos
        }
        ... on Ente {
          razon_social
        }
      }
    }
    limit
    page
    pages
    total
  }
}
    `) as unknown as TypedDocumentString<VillasPageQuery, VillasPageQueryVariables>;
export const CuotaDetalleDocument = new TypedDocumentString(`
    query CuotaDetalle($cuota_id: String!) {
  cuota: obtenerCuota(id: $cuota_id) {
    __typename
    ... on CuotaRegular {
      id
      monto
      mes
      anio
      registro
      actualizacion
      recaudacion {
        moneda
        monto_estimado
        monto_recaudado
        monto_pendiente
        pagos_asociados
        unidades
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
          }
        }
      }
    }
    ... on CuotaEspecial {
      id
      monto
      mes
      anio
      registro
      actualizacion
      detalles {
        titulo
        descripcion
        justificacion
        fecha_limite
        estado
      }
      recaudacion {
        moneda
        monto_estimado
        monto_recaudado
        monto_pendiente
        pagos_asociados
        unidades
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
          }
        }
      }
    }
    ... on CuotaSemilla {
      id
      monto
      mes
      anio
      registro
      actualizacion
      recaudacion {
        moneda
        monto_estimado
        monto_recaudado
        monto_pendiente
        pagos_asociados
        unidades
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
          }
        }
      }
    }
  }
  deudas: obtenerDeudas(
    filtro: {cuota: {eq: $cuota_id}, estado: {neq: "SALDADA"}}
  ) {
    data {
      id
      deuda
      estado
      unidad {
        codigo
      }
      titular {
        display_name
      }
    }
  }
}
    `) as unknown as TypedDocumentString<CuotaDetalleQuery, CuotaDetalleQueryVariables>;
export const GlobalSearchDocument = new TypedDocumentString(`
    query GlobalSearch($busqueda: String!, $limit: Int!) {
  unidades: obtenerUnidades(
    filter: {codigo: {like: $busqueda}}
    paginator: {limit: $limit, page: 1}
  ) {
    data {
      codigo
      estado
      deuda
      titular_primario {
        __typename
        ... on Sujeto {
          id
          cedula
          display_name
        }
        ... on Persona {
          nombres
          apellidos
        }
        ... on Ente {
          razon_social
        }
      }
    }
    total
  }
  operaciones: obtenerOperaciones(
    paginador: {limit: $limit, page: 1}
    filtro: {or: [{concepto: {like: $busqueda}}, {unidad: {like: $busqueda}}, {proveedor_nombre: {like: $busqueda}}]}
  ) {
    data {
      __typename
      ... on IOperacion {
        fecha
        operacion
        concepto
        monto
        moneda
      }
      ... on Pago {
        unidad {
          id
          codigo
        }
      }
      ... on GastoAProveedor {
        proveedor {
          nombre
        }
      }
    }
    total
  }
  proveedores: obtenerProveedores {
    id
    nombre
    rif
  }
}
    `) as unknown as TypedDocumentString<GlobalSearchQuery, GlobalSearchQueryVariables>;
export const ObtenerPerodosDisponiblesDocument = new TypedDocumentString(`
    query ObtenerPerodosDisponibles {
  periodos: obtenerPeriodosDisponibles {
    anio
    mes
  }
}
    `) as unknown as TypedDocumentString<ObtenerPerodosDisponiblesQuery, ObtenerPerodosDisponiblesQueryVariables>;
export const ResumenUnidadesParaCuotaDocument = new TypedDocumentString(`
    query ResumenUnidadesParaCuota {
  resumen: obtenerResumenUnidades {
    unidades_activas
  }
}
    `) as unknown as TypedDocumentString<ResumenUnidadesParaCuotaQuery, ResumenUnidadesParaCuotaQueryVariables>;
export const RegistrarCuotaDocument = new TypedDocumentString(`
    mutation RegistrarCuota($input: RegistrarCuotaDTO!) {
  registrarCuota(input: $input) {
    __typename
    ... on Cuota {
      id
    }
  }
}
    `) as unknown as TypedDocumentString<RegistrarCuotaMutation, RegistrarCuotaMutationVariables>;
export const RegistrarPagoOverlayUnidadesDocument = new TypedDocumentString(`
    query RegistrarPagoOverlayUnidades($codigo_like: String!) {
  unidades: obtenerUnidades(
    filter: {codigo: {like: $codigo_like}}
    paginator: {limit: 10, page: 1}
  ) {
    data {
      id
      codigo
      wallet
      deuda
    }
  }
}
    `) as unknown as TypedDocumentString<RegistrarPagoOverlayUnidadesQuery, RegistrarPagoOverlayUnidadesQueryVariables>;
export const RegistrarGastoOverlayDocument = new TypedDocumentString(`
    mutation RegistrarGastoOverlay($input: RegistrarGastoDTO!) {
  registrarGasto(input: $input) {
    id
    concepto
  }
}
    `) as unknown as TypedDocumentString<RegistrarGastoOverlayMutation, RegistrarGastoOverlayMutationVariables>;
export const BuscarGastosHuerfanosDocument = new TypedDocumentString(`
    query BuscarGastosHuerfanos($busqueda: String) {
  gastos: obtenerGastos(filter: {concepto: {like: $busqueda}, cuota: {eq: null}}) {
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
    `) as unknown as TypedDocumentString<BuscarGastosHuerfanosQuery, BuscarGastosHuerfanosQueryVariables>;
export const RegistrarPagoDocument = new TypedDocumentString(`
    mutation RegistrarPago($input: RegistrarPagoDTO!) {
  registrarPago(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<RegistrarPagoMutation, RegistrarPagoMutationVariables>;