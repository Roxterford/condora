package gorm

import (
	"fmt"
	"strings"
	"time"

	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	estadoproyecto "github.com/Sanaruca/condominio/internal/administracion/models/cuota/estadoproyecto"
	estadodeuda "github.com/Sanaruca/condominio/internal/administracion/models/deuda/estadodeuda"
	"github.com/Sanaruca/condominio/internal/administracion/types/tipodecuota"
	"github.com/Sanaruca/condominio/internal/core/common/mes"
	"github.com/Sanaruca/condominio/internal/core/common/moneda"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	"github.com/Sanaruca/condominio/internal/core/utils"
	"github.com/Sanaruca/condominio/internal/finanzas/types/metodoperacion"
	"github.com/Sanaruca/condominio/internal/finanzas/types/roldestinoperacion"
	"github.com/Sanaruca/condominio/internal/finanzas/types/tipoperacion"
	estadounidad "github.com/Sanaruca/condominio/internal/unidades/models/unidad/estadounidad"
)

// TipoDeSujeto solo existe localmente en el adapter de Sujeto; no tiene
// representacion de dominio reutilizable.
type TipoDeSujeto string

const (
	TipoDeSujetoPersonaNatural TipoDeSujeto = "PERSONA_NATURAL"
	TipoDeSujetoEnteJuridico   TipoDeSujeto = "ENTE_JURIDICO"
)

func (ts TipoDeSujeto) PersonaNatural() bool {
	return ts == TipoDeSujetoPersonaNatural
}
func (ts TipoDeSujeto) EnteJuridico() bool {
	return ts == TipoDeSujetoEnteJuridico
}

// Usuario -> usuarios
type Usuario struct {
	ID       string `gorm:"primaryKey"`
	Email    string
	Password string
}

func (Usuario) TableName() string { return "usuarios" }

// Proyecto -> proyectos
type Proyecto struct {
	Titulo         string
	CuotaID        *string `gorm:"primaryKey;column:cuota"`
	Estado         estadoproyecto.EstadoDeProyecto
	Descripcion    string
	Justificacion  string
	FechaLimite    time.Time
	InteresPorMora int
	Registro       time.Time
	RegistradoPor  string `gorm:"column:registrado_por"`
	Actualizacion  time.Time
	ActualizadoPor string `gorm:"column:actualizado_por"`
}

func (Proyecto) TableName() string { return "proyectos" }

// Unidad -> unidades
type Unidad struct {
	ID                string `gorm:"primaryKey"`
	Codigo            string
	Estado            estadounidad.EstadoDeUnidad
	TitularPrimarioID *string `gorm:"column:titular_primario"`
	ContactoID        *string `gorm:"column:contacto"`
	Descripcion       *string

	// Campos denormalizados (migración 001)
	DeudaTotal       int    `gorm:"column:deuda_total"`
	EstadoCuenta     string `gorm:"column:estado_cuenta"`
	CuotasPendientes int    `gorm:"column:cuotas_pendientes"`
	Cuenta           int    `gorm:"column:cuenta"`

	TitularPrimario *Sujeto `gorm:"foreignKey:TitularPrimarioID"`
	Contacto        *Sujeto
}

func (Unidad) TableName() string { return "unidades" }

type ResumenUnidades struct {
	TotalUnidades         int
	UnidadesActivas       int
	UnidadesInhabitadas   int
	UnidadesExentas       int
	UnidadesEnLitigio     int
	UnidadesSuspendidas   int
	UnidadesPreventa      int
	UnidadesConPendientes int
	UnidadesSolventes     int
	TotalPendiente        int
	TotalAsignado         int
}

func (ResumenUnidades) TableName() string { return "resumen_unidades" }

// Sujeto -> sujetos
type Sujeto struct {
	ID                 string `gorm:"primaryKey"`
	Tipo               TipoDeSujeto
	DocumentoIdentidad string
	Nombres            *string
	Apellidos          *string
	RazonSocial        *string
	RepresentanteID    *string `gorm:"column:representante"`
	Email              string
	Telefono           string
	Registro           time.Time

	Representante *Sujeto
}

func (s Sujeto) DisplayName() string {

	switch s.Tipo {

	case TipoDeSujetoPersonaNatural:

		if s.Nombres != nil && s.Apellidos != nil {
			return fmt.Sprintf(
				"%s %s",
				utils.SliceFirst(strings.Split(*s.Nombres, " ")),
				utils.SliceFirst(strings.Split(*s.Apellidos, " ")),
			)
		}

	case TipoDeSujetoEnteJuridico:

		if s.RazonSocial != nil {
			return *s.RazonSocial
		}

	}
	return "Nombre Desconocido"
}
func (Sujeto) TableName() string { return "sujetos" }

// Titularidad -> titularidades
type Titularidad struct {
	ID        string `gorm:"primaryKey"`
	TitularID string `gorm:"column:titular"`
	Unidad    string `gorm:"column:unidad"`

	Titular Sujeto
}

func (Titularidad) TableName() string { return "titularidades" }

type Pago struct {
	Operacion     string                           `gorm:"column:operacion"`
	UnidadID      string                           `gorm:"column:unidad_id"`
	UnidadCodigo  string                           `gorm:"column:unidad_codigo"`
	Fecha         time.Time                        `gorm:"column:fecha"`
	Concepto      string                           `gorm:"column:concepto"`
	Monto         int                              `gorm:"column:monto"`
	Moneda        moneda.Moneda                    `gorm:"column:moneda"`
	Metodo        metodoperacion.MetodoDeOperacion `gorm:"column:metodo"`
	Tasa          int                              `gorm:"column:tasa"`
	RegistradoPor string                           `gorm:"column:registrado_por"`
	Registro      time.Time                        `gorm:"column:registro"`
}

// IOperacion -> internal_operaciones (tabla base, escrituras)
type IOperacion struct {
	ID            string `gorm:"primaryKey"`
	Fecha         time.Time
	Concepto      string
	Monto         int
	Moneda        moneda.Moneda
	Metodo        metodoperacion.MetodoDeOperacion
	Tasa          int
	Tipo          tipoperacion.TipoDeOperacion
	Rol           roldestinoperacion.RolDestinoDeOperacion
	Cuota         *string `gorm:"column:cuota"`
	UnidadCodigo  *string `gorm:"column:unidad_codigo"`
	ProveedorID   *string `gorm:"column:proveedor"`
	RegistradoPor string  `gorm:"column:registrado_por"`
	Registro      time.Time

	Unidad    *Unidad    `gorm:"foreignKey:UnidadCodigo;references:Codigo"`
	Proveedor *Proveedor `gorm:"foreignKey:ProveedorID"`
}

func (o IOperacion) Total(qf *quantity.QuantityFactory) quantity.Quantity {

	monto := qf.Assemble(int64(o.Monto))
	tasa := qf.Assemble(int64(o.Tasa))

	switch o.Moneda {
	case moneda.USD:
		return monto
	case moneda.VED:
		return monto.HappyDiv(tasa)
	}

	return qf.Assemble(0)
}

func (IOperacion) TableName() string { return "internal_operaciones" }

// Operacion -> operaciones (vista de lectura, expone unidad_id y unidad_codigo)
type Operacion struct {
	IOperacion
	UnidadID *string `gorm:"column:unidad_id"`
}

func (Operacion) TableName() string { return "operaciones" }

// ITransaccion -> transacciones
type ITransaccion struct {
	ID            string `gorm:"primaryKey"`
	Fecha         time.Time
	Concepto      string
	RegistradoPor string `gorm:"column:registrado_por"`
	Registro      time.Time
}

func (ITransaccion) TableName() string { return "transacciones" }

// ITransaccionOperacion -> transaccion_operaciones
type ITransaccionOperacion struct {
	ID            string `gorm:"primaryKey"`
	TransaccionID string `gorm:"column:transaccion_id"`
	OperacionID   string `gorm:"column:operacion_id"`
	Posicion      int
}

func (ITransaccionOperacion) TableName() string { return "transaccion_operaciones" }

// Gasto (view) -> gastos
type Gasto struct {
	Operacion     string  `gorm:"primaryKey"`
	Transaccion   *string `gorm:"column:transaccion"`
	Fecha         time.Time
	Concepto      string
	Monto         int
	Moneda        moneda.Moneda
	Metodo        metodoperacion.MetodoDeOperacion
	Tasa          int
	Tipo          tipoperacion.TipoDeOperacion
	Rol           roldestinoperacion.RolDestinoDeOperacion
	Cuota         *string `gorm:"column:cuota"`
	UnidadCodigo  *string `gorm:"column:unidad_codigo"`
	ProveedorID   *string `gorm:"column:proveedor_id"`
	RegistradoPor string  `gorm:"column:registrado_por"`
	Registro      time.Time
}

func (Gasto) TableName() string { return "gastos" }

func (c Cuota) ToDomainCuota(factory *cuota.CuotaFactory) cuota.Cuota {

	switch c.Tipo {
	case tipodecuota.Regular:
		return factory.AssembleRegular(
			c.ID,
			c.Monto,
			c.Mes,
			c.Anio,
			c.Registro,
			c.Actualizacion,
			c.RegistradoPor,
		)

	case tipodecuota.Especial:
		return factory.AssembleEspecial(
			c.ID,
			c.Mes,
			c.Anio,
			c.Monto,
			c.Proyecto.Titulo,
			c.Proyecto.Descripcion,
			c.Proyecto.Justificacion,
			c.Proyecto.Estado.String(),
			c.Proyecto.FechaLimite,
			int64(c.Proyecto.InteresPorMora),
			c.Proyecto.Registro,
			c.Proyecto.Actualizacion,
			c.Proyecto.RegistradoPor,
			c.Proyecto.ActualizadoPor,
		)

	case tipodecuota.Semilla:
		return factory.AssembleSemilla(
			c.ID,
			c.Monto,
			c.Mes,
			c.Anio,
			c.Registro,
			c.Actualizacion,
			c.RegistradoPor,
		)
	}

	return nil
}

// DestinoDePago -> destino_de_pagos
type DestinoDePago struct {
	ID        string `gorm:"primaryKey"`
	Operacion string `gorm:"column:operacion"`
	Deuda     string `gorm:"column:deuda"`
	Destinado int
	Fecha     time.Time
}

func (DestinoDePago) TableName() string { return "destino_de_pagos" }

// Cuota -> cuotas
type Cuota struct {
	ID             string `gorm:"primaryKey"`
	Tipo           tipodecuota.TipoDeCuota
	Monto          int
	Mes            mes.Mes
	Anio           int
	Registro       time.Time
	RegistradoPor  string `gorm:"column:registrado_por"`
	Actualizacion  time.Time
	ActualizadoPor string `gorm:"column:actualizado_por"`

	Proyecto *Proyecto `gorm:"foreignKey:CuotaID"`
}

func (Cuota) TableName() string { return "cuotas" }
func (c Cuota) Nombre() string {
	if c.Tipo.Regular() {
		return fmt.Sprintf("Cuota %s %d", c.Mes.String(), c.Anio)
	}

	if c.Tipo.Especial() {

		if c.Proyecto == nil {
			return "NULL"
		}

		return c.Proyecto.Titulo
	}

	return "Cuota sin nombre"
}

// Proveedor -> proveedores

type Proveedor struct {
	ID            string `gorm:"primaryKey"`
	RIF           string
	Nombre        string
	Email         string
	Telefono      string
	Direccion     *string
	Registro      time.Time
	Actualizacion time.Time
}

func (Proveedor) TableName() string { return "proveedores" }

// IDeuda -> internal_deudas
type IDeuda struct {
	ID            string `gorm:"primaryKey"`
	UnidadID      string `gorm:"column:unidad"`
	Cuota         string `gorm:"column:cuota"`
	Monto         int
	Registro      time.Time
	Actualizacion time.Time
}

func (IDeuda) TableName() string { return "internal_deudas" }

// Deuda (view) -> deudas
type Deuda struct {
	ID            string `gorm:"primaryKey"`
	UnidadID      string `gorm:"column:unidad_id"`
	UnidadCodigo  string `gorm:"column:unidad_codigo"`
	CuotaID       string `gorm:"column:cuota"`
	Monto         int
	Deuda         int
	Estado        estadodeuda.EstadoDeDeuda
	Registro      time.Time
	Actualizacion time.Time

	Cuota  Cuota           `gorm:"foreignKey:CuotaID;references:ID"`
	Unidad Unidad          `gorm:"foreignKey:UnidadID;references:ID"`
	Abonos []DestinoDePago `gorm:"foreignKey:Deuda"`
}

func (Deuda) TableName() string { return "deudas" }

// Recaudacion (view) -> recaudacion
type Recaudacion struct {
	Cuota              string `gorm:"primaryKey"`
	Monto              int
	Mes                int
	Anio               int
	Unidades           int
	UnidadesAplicadas  int `gorm:"column:unidades_aplicadas"`
	UnidadesSolventes  int `gorm:"column:unidades_solventes"`
	UnidadesPendientes int `gorm:"column:unidades_pendientes"`
	TotalEstimado      int `gorm:"column:total_estimado"`
	Recaudado          int
	Pendiente          int
	PagosAsociados     int `gorm:"column:pagos_asociados"`
}

func (Recaudacion) TableName() string { return "recaudacion" }

// UnidadInfo (view) -> unidades_info
type UnidadInfo struct {
	Unidad
	Wallet int `gorm:"column:cuenta"`
}

func (UnidadInfo) TableName() string { return "unidades_info" }

// TasaDeCambio (view) -> tasas_de_cambio
type TasaDeCambio struct {
	Origen   string
	Tasa     int
	Fecha    time.Time
	OrigenID string `gorm:"primaryKey;column:origen_id"`
}

func (TasaDeCambio) TableName() string { return "tasas_de_cambio" }
