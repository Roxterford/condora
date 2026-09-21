package model

import (
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/core/common/moneda"
)

func (input *CuotaFilter) ToFilter() filter.Filter[cuota.CuotaBase] {
	return ApplyFilter[cuota.CuotaBase](input)
}

func RecaudacionFromDomain(recuadacion cuota.Recaudacion) Recaudacion {
	return Recaudacion{
		Moneda:             moneda.USD,
		MontoEstimado:      recuadacion.MontoEstimado.Float(),
		MontoRecaudado:     recuadacion.MontoRecaudado.Float(),
		MontoPendiente:     recuadacion.MontoPendiente.Float(),
		PagosAsociados:     int32(recuadacion.PagosAsociados),
		Unidades:           int32(recuadacion.Unidades),
		UnidadesAplicadas:  int32(recuadacion.UnidadesAplicadas),
		UnidadesSolventes:  int32(recuadacion.UnidadesSolventes),
		UnidadesPendientes: int32(recuadacion.UnidadesPendientes),
	}
}

func CuotaTypeFromDomain(cuota cuota.Cuota) CuotaType {
	if cuota == nil {
		return nil
	}
	cuota_regular := cuota.AsRegular()
	cuota_especial := cuota.AsEspecial()
	cuota_semilla := cuota.AsSemilla()

	if cuota_regular != nil {
		return CuotaRegular{
			ID:            string(cuota_regular.ID()),
			Monto:         cuota_regular.Monto().Float(),
			Mes:           cuota_regular.Mes(),
			Anio:          int32(cuota_regular.Anio()),
			Registro:      cuota_regular.Audit.CreatedAt,
			Actualizacion: cuota_regular.Audit.UpdatedAt,
		}
	}

	if cuota_especial != nil {
		return CuotaEspecial{
			ID:            string(cuota_especial.ID()),
			Monto:         cuota_especial.Monto().Float(),
			Mes:           cuota_especial.Mes(),
			Anio:          int32(cuota_especial.Anio()),
			Registro:      cuota_especial.Audit.CreatedAt,
			Actualizacion: cuota_especial.Audit.UpdatedAt,
			Detalles: &Proyecto{
				Titulo:         cuota_especial.Detalles.Titulo(),
				Estado:         cuota_especial.Detalles.Estado(),
				Descripcion:    cuota_especial.Detalles.Descripcion(),
				Justificacion:  cuota_especial.Detalles.Justificacion(),
				FechaLimite:    cuota_especial.Detalles.FechaLimite(),
				InteresPorMora: float64(cuota_especial.Detalles.InteresPorMora().Value()),
				Registro:       cuota_especial.Detalles.Audit.CreatedAt,
				Actualizacion:  cuota_especial.Detalles.Audit.UpdatedAt,
			},
		}
	}

	if cuota_semilla != nil {
		return CuotaSemilla{
			ID:            string(cuota_semilla.ID()),
			Monto:         cuota_semilla.Monto().Float(),
			Mes:           cuota_semilla.Mes(),
			Anio:          int32(cuota_semilla.Anio()),
			Registro:      cuota_semilla.Audit.CreatedAt,
			Actualizacion: cuota_semilla.Audit.UpdatedAt,
		}
	}

	return nil
}
