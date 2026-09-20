package distribucion

import (
	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
)

// DistribucionResultado es el resultado de repartir el total de una cuota entre
// las unidades que generan deuda.
type DistribucionResultado struct {
	// MontoUnidad es la cantidad que debe cada una de las unidades. Es idéntico
	// para todas.
	MontoUnidad quantity.Quantity
	// AjusteRedondeo es la diferencia que hace falta sumar al total de gastos
	// para que el reparto pueda ser exactamente igual entre todas las unidades.
	// Es siempre menor a la cantidad de unidades y mayor o igual a cero.
	AjusteRedondeo quantity.Quantity
}

// EstrategiaDeDistribucion reparte el monto total de una cuota entre las
// unidades que generan deuda. Es la abstracción sobre la que se apoyarán
// futuras estrategias de reparto.
type EstrategiaDeDistribucion interface {
	Distribuir(totalCuota quantity.Quantity, cantidadUnidades int) (DistribucionResultado, core.Error)
}