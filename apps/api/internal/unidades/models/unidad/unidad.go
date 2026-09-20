package unidad

import (
	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	"github.com/Sanaruca/condominio/internal/core/exception"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad/estadounidad"
)

var (
	ErrUnidadNoEncontrada = exception.New(exception.NOT_FOUND, "Unidad no encontrada")
)

type UnidadID string
type UnidadCodigo string
type UnidadIDs interface {
	ID() UnidadID
	Codigo() UnidadCodigo
}

// UnidadConEstado es un snapshot ligero de una unidad con su estado, útil para
// decisiones de facturación sin hidratar la entidad completa.
type UnidadConEstado struct {
	IDs    UnidadIDs
	Estado estadounidad.EstadoDeUnidad
}

type uidswraper struct {
	id, codigo string
}

func (u uidswraper) ID() UnidadID {
	return UnidadID(u.id)
}
func (u uidswraper) Codigo() UnidadCodigo {
	return UnidadCodigo(u.codigo)
}

func WrapIDs(id, codigo string) UnidadIDs {
	return &uidswraper{id, codigo}
}

func (u UnidadID) String() string {
	return string(u)
}
func (u UnidadCodigo) String() string {
	return string(u)
}

type Unidad struct {
	id     UnidadID
	codigo UnidadCodigo
	estado estadounidad.EstadoDeUnidad
	deuda  quantity.Quantity
	wallet quantity.Quantity

	titular_primario sujeto.Titular
	// Contacto hace referencia a uno de los titulares de la unidad como contacto
	// principal de la misma. Este campo siempre debería hacer referencia a una
	// persona natural.
	contacto *sujeto.Persona

	descripcion string

	titulares core.Set[sujeto.Titular]
}

func (u *Unidad) ID() UnidadID                        { return u.id }
func (u *Unidad) Codigo() UnidadCodigo                { return u.codigo }
func (u *Unidad) Identities() UnidadIDs               { return u }
func (u *Unidad) Estado() estadounidad.EstadoDeUnidad { return u.estado }
func (u *Unidad) Deuda() quantity.Quantity            { return u.deuda }
func (u *Unidad) Wallet() quantity.Quantity           { return u.wallet }
func (u *Unidad) TitularPrimario() sujeto.Titular     { return u.titular_primario }

func (u *Unidad) Contacto() *sujeto.Persona {

	if u != nil {
		return u.contacto
	}

	return nil
}
func (u *Unidad) PoseeDeuda() bool { return u.deuda.Value() > 0 }
func (u *Unidad) Descripcion() string {
	if u == nil {
		return ""
	}
	return u.descripcion
}

func (u Unidad) FilterSpec() filter.Spec {
	return filter.Spec{
		"id":     filter.TypeString,
		"codigo": filter.TypeString,
		"estado": filter.TypeString,
		"deuda":  filter.TypeInt,
	}
}
