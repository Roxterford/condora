package command

import (
	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/common"
	cc "github.com/Sanaruca/condominio/internal/core/context"
	"github.com/Sanaruca/condominio/internal/core/usecase"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
)

type ActualizarSujetoDTO struct {
	SujetoID sujeto.SujetoID
	Email    *string
	Telefono *string
	// TODO:
	Nombres     *string
	Apellidos   *string
	RazonSocial *string
}

type ActualizarSujeto usecase.Handler[cc.AdminContext, ActualizarSujetoDTO, any]

type actualizarSujeto struct {
	sujetos sujeto.SujetoRepository
	ef      *common.EmailFactory
	pf      *common.PhoneFactory
}

func NewActualizarSujeto(
	sujetoRepository sujeto.SujetoRepository,
	emailFactory *common.EmailFactory,
	phoneFactory *common.PhoneFactory,
) ActualizarSujeto {

	if sujetoRepository == nil {
		panic("sujetoRepository is nil")
	}

	if emailFactory == nil {
		panic("emailFactory is nil")
	}
	if phoneFactory == nil {
		panic("phoneFactory is nil")
	}

	return &actualizarSujeto{
		sujetos: sujetoRepository,
		ef:      emailFactory,
		pf:      phoneFactory,
	}
}

func (uc *actualizarSujeto) Exec(
	ctx cc.AdminContext,
	input ActualizarSujetoDTO,
) (any, core.Error) {

	if err := input.Validate(); err != nil {
		return nil, err
	}

	_sujeto, err := uc.sujetos.ObtenerPorID(ctx, input.SujetoID)

	if err != nil {
		return nil, err
	}

	if _sujeto == nil {
		return nil, sujeto.ErrSujetoNoEncontrado
	}

	if input.Email != nil {

		email, err := uc.ef.New(*input.Email)

		if err != nil {
			return nil, err
		}

		_sujeto.SetEmail(email)
	}

	if input.Telefono != nil {
		phone, err := uc.pf.New(*input.Telefono)

		if err != nil {
			return nil, err
		}
		_sujeto.SetTelefono(phone)
	}

	err = uc.sujetos.Guardar(ctx, _sujeto)

	if err != nil {
		return nil, err
	}

	return nil, nil

}

func (input ActualizarSujetoDTO) Validate() core.Error {
	if input.SujetoID == "" {
		return core.NewInvalidArgumentError("ID del sujeto es invalido")
	}

	return nil
}
