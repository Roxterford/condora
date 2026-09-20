package app

import (
	"github.com/Sanaruca/condominio/internal/administracion/app/command"
	"github.com/Sanaruca/condominio/internal/administracion/app/query"
)

type Queries struct {
	ObtenerProveedor           query.ObtenerProveedor
	ObtenerProveedores         query.ObtenerProveedores
	ObtenerCuotas              query.ObtenerCuotas
	ObtenerCuota               query.ObtenerCuota
	ObtenerRecaudacion         query.ObtenerRecaudacion
	ObtenerPeriodosDisponibles query.ObtenerPeriodosDisponibles
}

type Commands struct {
	RegistrarProveedor command.RegistrarProveedor
	EliminarProveedor  command.EliminarProveedor
	RegistrarCuota     command.RegistrarCuotaRegular
}
