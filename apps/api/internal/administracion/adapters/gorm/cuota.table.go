package gorm

import (
	"time"

	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	"github.com/Sanaruca/condominio/internal/administracion/types/tipodecuota"
	"github.com/Sanaruca/condominio/internal/core/common/mes"
)

type Cuota struct {
	ID             string
	Tipo           tipodecuota.TipoDeCuota
	Monto          int
	Mes            mes.Mes
	Anio           int
	Registro       time.Time
	RegistradoPor  string `gorm:"column:registrado_por"`
	Actualizacion  time.Time
	ActualizadoPor string `gorm:"column:actualizado_por"`

	// Relations
	Proyecto *Proyecto `gorm:"foreignKey:cuota"`
}

func (t Cuota) TableName() string {
	return "cuotas"
}

func (c Cuota) ToDomainCuota(factory *cuota.CuotaFactory) cuota.Cuota {

	switch c.Tipo {
	case tipodecuota.Regular:
		return factory.AssembleRegular(
			c.ID,
			c.Monto,
			c.Mes,
			c.Anio,
			c.Registro,
			c.Actualizacion,
			c.RegistradoPor,
		)

	case tipodecuota.Especial:
		return factory.AssembleEspecial(
			c.ID,
			c.Mes,
			c.Anio,
			c.Monto,
			c.Proyecto.Titulo,
			c.Proyecto.Descripcion,
			c.Proyecto.Justificacion,
			c.Proyecto.Estado.String(),
			c.Proyecto.FechaLimite,
			int64(c.Proyecto.InteresPorMora),
			c.Proyecto.Registro,
			c.Proyecto.Actualizacion,
			c.Proyecto.RegistradoPor,
			c.Proyecto.ActualizadoPor,
		)

	case tipodecuota.Semilla:
		return factory.AssembleSemilla(
			c.ID,
			c.Monto,
			c.Mes,
			c.Anio,
			c.Registro,
			c.Actualizacion,
			c.RegistradoPor,
		)
	}

	return nil
}
