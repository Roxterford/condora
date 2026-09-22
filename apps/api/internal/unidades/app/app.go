package app

import (
	"github.com/Sanaruca/condominio/internal/unidades/app/command"
	"github.com/Sanaruca/condominio/internal/unidades/app/query"
)

type Queries struct {
	ObtenerUnidades        query.ObtenerUnidades
	ObtenerUnidad          query.ObtenerUnidad
	ObtenerUnidadPorCodigo query.ObtenerUnidadPorCodigo
	ObtenerSujeto          query.ObtenerSujeto
}

type Commands struct {
	RegistrarUnidad  command.RegistrarUnidad
	RegistrarSujeto  command.RegistrarSujeto
	ActualizarSujeto command.ActualizarSujeto
}
