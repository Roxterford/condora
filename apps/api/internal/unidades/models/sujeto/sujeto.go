package sujeto

import (
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/audit"
	"github.com/Sanaruca/condominio/internal/core/exception"
)

var (
	ErrSujetoNoEncontrado = exception.New(exception.NOT_FOUND, "Sujeto no encontrado")
)

type SujetoID string

func (id SujetoID) String() string { return string(id) }

type Sujeto interface {
	ID() SujetoID
	DisplayName() string
	Email() common.Email
	Telefono() common.Phone
	Cedula() common.Rif
	Audit() audit.FullAudit[string]

	SetEmail(email common.Email)
	SetTelefono(telefono common.Phone)

	AsTitular() Titular
	AsPersona() *Persona
	AsEnte() *Ente
}

type sujeto struct {
	id       SujetoID
	cedula   common.Rif
	email    common.Email
	telefono common.Phone
	audit    audit.FullAudit[string]
}

func (s sujeto) ID() SujetoID                   { return s.id }
func (s sujeto) Cedula() common.Rif             { return s.cedula }
func (s sujeto) Email() common.Email            { return s.email }
func (s sujeto) Telefono() common.Phone         { return s.telefono }
func (s sujeto) Audit() audit.FullAudit[string] { return s.audit }

func (s *sujeto) SetEmail(email common.Email) {
	s.email = email
}
func (s *sujeto) SetTelefono(telefono common.Phone) {
	s.telefono = telefono
}
