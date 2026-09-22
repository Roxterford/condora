package gorm

import (
	"context"

	"gorm.io/gorm"

	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/exception"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
)

type sujetoRepository struct {
	db      *gorm.DB
	factory *sujeto.SujetoFactory
}

func NewSujetoRepository(db *gorm.DB, factory *sujeto.SujetoFactory) sujeto.SujetoRepository {
	if factory == nil {
		panic("factory is nil")
	}

	return &sujetoRepository{db, factory}
}

// ObtenerPorID implements [sujeto.SujetoRepository].
func (r *sujetoRepository) ObtenerPorID(
	ctx context.Context,
	id sujeto.SujetoID,
) (sujeto.Sujeto, core.Error) {

	s, err := gorm.G[Sujeto](r.db).Where("id = ?", id).Preload("Representante", nil).Take(ctx)

	if exception.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	if err != nil {
		return nil, core.WrapError(err)
	}

	switch s.Tipo {
	case PERSONA_NATURAL:

		persona := s.ToDoaminPersona(r.factory)

		return &persona, nil

	case ENTE_JURIDICO:
		var razon_social string

		if s.RazonSocial != nil {
			razon_social = *s.RazonSocial
		}

		return r.factory.AssembleEnte(
			s.ID,
			s.DocumentoIdentidad,
			razon_social,
			s.DocumentoIdentidad,
			s.Email,
			s.Representante.ToDoaminPersona(r.factory),
			s.Registro,
		), nil
	default:
		return nil, core.NewError(exception.CONFLICT, "tipo de sujeto desconocido")
	}

}

func (r *sujetoRepository) existsPor(
	ctx context.Context,
	campo, valor string,
) (bool, core.Error) {

	var s Sujeto
	err := r.db.WithContext(ctx).Where(campo+" = ?", valor).Select("id").Take(&s).Error

	if exception.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}

	if err != nil {
		return false, core.WrapError(err)
	}

	return true, nil
}

func (r *sujetoRepository) ExistsDocumento(
	ctx context.Context,
	documento string,
) (bool, core.Error) {
	return r.existsPor(ctx, "documento_identidad", documento)
}

func (r *sujetoRepository) ExistsEmail(
	ctx context.Context,
	email string,
) (bool, core.Error) {
	return r.existsPor(ctx, "email", email)
}

// Guardar implements [sujeto.SujetoRepository].
func (r *sujetoRepository) Guardar(
	ctx context.Context,
	s sujeto.Sujeto,
) core.Error {

	if s == nil {
		return core.NewValidationError("el sujeto es nil")
	}

	var tipo TipoDeSujeto
	var nombres, apellidos, razonSocial *string
	var representanteID *string

	switch {
	case s.AsPersona() != nil:
		tipo = PERSONA_NATURAL
		if n := s.AsPersona().Nombres(); n != "" {
			nombres = &n
		}
		if a := s.AsPersona().Apellidos(); a != "" {
			apellidos = &a
		}
	case s.AsEnte() != nil:
		tipo = ENTE_JURIDICO
		if rs := s.AsEnte().RazonSocial(); rs != "" {
			razonSocial = &rs
		}
		if rep := s.AsEnte().Representante(); rep.ID().String() != "" {
			id := rep.ID().String()
			representanteID = &id
		}
	default:
		return core.NewValidationError("tipo de sujeto desconocido")
	}

	model := Sujeto{
		ID:                 s.ID().String(),
		Tipo:               tipo,
		DocumentoIdentidad: s.Cedula().String(),
		Nombres:            nombres,
		Apellidos:          apellidos,
		RazonSocial:        razonSocial,
		RepresentanteID:    representanteID,
		Email:              s.Email().String(),
		Telefono:           s.Telefono().String(),
		Registro:           s.Audit().CreatedAt,
	}

	if err := r.db.WithContext(ctx).Save(&model).Error; err != nil {
		return core.WrapError(err)
	}

	return nil
}
