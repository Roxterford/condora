package service

import (
	"github.com/Sanaruca/condominio/internal/administracion/models/deuda"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/unidades/app"
	"github.com/Sanaruca/condominio/internal/unidades/app/command"
	"github.com/Sanaruca/condominio/internal/unidades/app/query"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
)

type UnidadesService struct {
	Queries  app.Queries
	Commands app.Commands
}

func NewUnidadesService(
	unidadRepository unidad.UnidadRepository,
	sujetoRepository sujeto.SujetoRepository,
	deudaRepository deuda.DeudaRepository,
	unidadFactory *unidad.UnidadFactory,
	sujetoFactory *sujeto.SujetoFactory,
	emailFactory *common.EmailFactory,
	phoneFactory *common.PhoneFactory,
) *UnidadesService {
	return &UnidadesService{
		Queries: app.Queries{
			ObtenerUnidades:        query.NewObtenerUnidades(unidadRepository),
			ObtenerUnidad:          query.NewObtenerUnidad(unidadRepository),
			ObtenerUnidadPorCodigo: query.NewObtenerUnidadPorCodigo(unidadRepository),
			ObtenerSujeto:          query.NewObtenerSujeto(sujetoRepository),
		},
		Commands: app.Commands{
			RegistrarUnidad: command.NewRegistrarUnidad(
				unidadRepository,
				unidadFactory,
				sujetoRepository,
			),
			RegistrarSujeto: command.NewRegistrarSujeto(
				sujetoRepository,
				sujetoFactory,
			),
			ActualizarSujeto: command.NewActualizarSujeto(
				sujetoRepository,
				emailFactory,
				phoneFactory,
			),
		},
	}
}
