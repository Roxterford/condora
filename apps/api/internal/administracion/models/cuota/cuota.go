package cuota

import (
	"github.com/Sanaruca/condominio/internal/core/common/audit"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/core/common/mes"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	"github.com/Sanaruca/condominio/internal/core/exception"
)

var (
	ErrCuotaNoEncontrada = exception.New(exception.NOT_FOUND, "Cuota no encontrada")
)

type Cuota interface {
	ID() CuotaID
	Monto() quantity.Quantity
	Mes() mes.Mes
	Anio() int
	AsRegular() *CuotaRegular
	AsEspecial() *CuotaEspecial
	AsSemilla() *CuotaSemilla
}

type CuotaID string

func (id CuotaID) String() string { return string(id) }

type CuotaBase struct {
	id    CuotaID
	monto quantity.Quantity
	mes   mes.Mes
	anio  int
	Audit audit.FullAudit[string]
}

func (c CuotaBase) ID() CuotaID              { return c.id }
func (c CuotaBase) Monto() quantity.Quantity { return c.monto }
func (c CuotaBase) Mes() mes.Mes             { return c.mes }
func (c CuotaBase) Anio() int                { return c.anio }

func (c *CuotaBase) SetID(id CuotaID)                       { c.id = id }
func (c *CuotaBase) SetMonto(monto quantity.Quantity)       { c.monto = monto }
func (c *CuotaBase) SetMes(mes mes.Mes)                     { c.mes = mes }
func (c *CuotaBase) SetAnio(anio int)                       { c.anio = anio }
func (c *CuotaBase) SetAudit(audit audit.FullAudit[string]) { c.Audit = audit }

func (c CuotaBase) FilterSpec() filter.Spec {
	return filter.Spec{
		"id":    filter.TypeString,
		"monto": filter.TypeInt,
		"mes":   filter.TypeInt,
		"anio":  filter.TypeInt,
		// TODO: Tipo no es un campo que pertenese al modelo, esto  asume que su
		// representacion en la base de datos contiene un campo tipo. Por lo
		// tanto para el futuro debemos normalizar este tipo de campos para
		// evitar confuciones
		"tipo":          filter.TypeString,
		"registro":      filter.TypeUnknown,
		"actualizacion": filter.TypeUnknown,
	}
}
