package gorm

import (
	"github.com/Sanaruca/condominio/internal/core/utils"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
)

type UnidadInfo struct {
	Unidad
	Wallet int `gorm:"column:cuenta"`
}

func (u *UnidadInfo) TableName() string {
	return "unidades_info"
}

func (u *UnidadInfo) ToDomainUnidad(
	unidadFactory *unidad.UnidadFactory,
	sujetoFactory *sujeto.SujetoFactory,
) unidad.Unidad {
	var contacto *sujeto.Persona
	if u.Contacto != nil && u.Contacto.Tipo == PERSONA_NATURAL {
		contacto = buildPersona(u.Contacto, sujetoFactory)
	}

	titularPrimario := BuildTitular(u.TitularPrimario, sujetoFactory)

	return unidadFactory.Assemble(
		u.ID,
		unidad.UnidadCodigo(u.Codigo),
		u.Estado,
		u.DeudaTotal,
		u.Wallet,
		titularPrimario,
		contacto,
		utils.SafeStr(u.Descripcion),
	)
}

// buildPersona encapsula la creación de la entidad Persona del dominio
func buildPersona(s *Sujeto, factory *sujeto.SujetoFactory) *sujeto.Persona {
	if s == nil {
		return nil
	}
	return factory.AssemblePersona(
		s.ID,
		s.DocumentoIdentidad,
		utils.SafeStr(s.Nombres),
		utils.SafeStr(s.Apellidos),
		s.Email,
		s.Telefono,
		s.Registro,
	)
}

// BuildTitular maneja la lógica de despacho según el tipo de sujeto
func BuildTitular(s *Sujeto, factory *sujeto.SujetoFactory) sujeto.Titular {
	if s == nil {
		return nil
	}

	var res sujeto.Sujeto

	switch s.Tipo {
	case PERSONA_NATURAL:
		res = buildPersona(s, factory)

	case ENTE_JURIDICO:
		var representante sujeto.Persona
		if repPtr := buildPersona(s.Representante, factory); repPtr != nil {
			representante = *repPtr
		}

		res = factory.AssembleEnte(
			s.ID,
			s.DocumentoIdentidad,
			utils.SafeStr(s.RazonSocial), // Corregido: ya no usa 'sujeto_contacto'
			s.Email,
			s.Telefono,
			representante,
			s.Registro,
		)
	}

	if res != nil {
		return res.AsTitular()
	}
	return nil
}
