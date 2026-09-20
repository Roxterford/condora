package distribucion

import (
	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
)

// EstrategiaDistribucionLineal reparte el monto total de la cuota en partes
// iguales entre las unidades que generan deuda. Cuando el total no es divisible
// exactamente, se redondea hacia arriba con un ajuste de redondeo que se suma al
// total de la cuota, garantizando que todas las unidades deban exactamente lo
// mismo.
type EstrategiaDistribucionLineal struct{}

func NuevaEstrategiaDistribucionLineal() EstrategiaDeDistribucion {
	return EstrategiaDistribucionLineal{}
}

// Distribuir implementa [EstrategiaDeDistribucion].
func (EstrategiaDistribucionLineal) Distribuir(
	totalCuota quantity.Quantity,
	cantidadUnidades int,
) (DistribucionResultado, core.Error) {
	if cantidadUnidades <= 0 {
		return DistribucionResultado{}, core.NewValidationError("la cantidad de unidades debe ser mayor a cero")
	}

	total := totalCuota.Value()
	n := int64(cantidadUnidades)

	montoUnidad := total / n
	var ajuste int64
	if total%n != 0 {
		montoUnidad++
		ajuste = montoUnidad*n - total
	}

	return DistribucionResultado{
		MontoUnidad:    quantity.New(montoUnidad, totalCuota.Scale()),
		AjusteRedondeo: quantity.New(ajuste, totalCuota.Scale()),
	}, nil
}