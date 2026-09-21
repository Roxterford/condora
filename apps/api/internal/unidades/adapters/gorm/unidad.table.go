package gorm

import (
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad/estadounidad"
)

// Use UnidadInfo instead for queries
type Unidad struct {
	ID                string `gorm:"primaryKey"`
	Codigo            string
	Estado            estadounidad.EstadoDeUnidad
	TitularPrimarioID *string `gorm:"column:titular_primario"`
	ContactoID        *string `gorm:"column:contacto"`
	Descripcion       *string

	// Campos denormalizados (migración 001)
	DeudaTotal       int    `gorm:"column:deuda_total"`
	EstadoCuenta     string `gorm:"column:estado_cuenta"`
	CuotasPendientes int    `gorm:"column:cuotas_pendientes"`
	Cuenta           int    `gorm:"column:cuenta"`

	TitularPrimario *Sujeto
	Contacto        *Sujeto
}

func (u *Unidad) TableName() string {
	return "unidades"
}
