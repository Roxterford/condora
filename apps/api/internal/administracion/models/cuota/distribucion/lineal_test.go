package distribucion_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/Sanaruca/condominio/internal/administracion/models/cuota/distribucion"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
)

func TestLinealReparteEquitativamente(t *testing.T) {
	estrategia := distribucion.NuevaEstrategiaDistribucionLineal()

	resultado, err := estrategia.Distribuir(quantity.New(1000, 2), 5)

	assert.NoError(t, err)
	assert.Equal(t, int64(200), resultado.MontoUnidad.Value())
	assert.Equal(t, int64(0), resultado.AjusteRedondeo.Value())
	assert.Equal(t, int64(1000), cuadre(resultado, 5))
}

func TestLinealRedondeaAlAlzaCuandoNoDivide(t *testing.T) {
	estrategia := distribucion.NuevaEstrategiaDistribucionLineal()

	resultado, err := estrategia.Distribuir(quantity.New(1000, 2), 3)

	assert.NoError(t, err)
	assert.Equal(t, int64(334), resultado.MontoUnidad.Value())
	assert.Equal(t, int64(2), resultado.AjusteRedondeo.Value())
	assert.Equal(t, int64(1000), cuadre(resultado, 3))
	assert.Equal(t, int64(1002), resultado.MontoUnidad.Value()*int64(3))
}

func TestLinealConUnaSolaUnidadAsumeElTotal(t *testing.T) {
	estrategia := distribucion.NuevaEstrategiaDistribucionLineal()

	resultado, err := estrategia.Distribuir(quantity.New(500, 2), 1)

	assert.NoError(t, err)
	assert.Equal(t, int64(500), resultado.MontoUnidad.Value())
	assert.Equal(t, int64(0), resultado.AjusteRedondeo.Value())
}

func TestLinealConTotalMenorQueUnidades(t *testing.T) {
	estrategia := distribucion.NuevaEstrategiaDistribucionLineal()

	resultado, err := estrategia.Distribuir(quantity.New(100, 2), 15)

	assert.NoError(t, err)
	assert.Equal(t, int64(7), resultado.MontoUnidad.Value())
	assert.Equal(t, int64(5), resultado.AjusteRedondeo.Value())
	assert.Equal(t, int64(100), cuadre(resultado, 15))
	assert.Equal(t, int64(105), resultado.MontoUnidad.Value()*int64(15))
}

func TestLinealAjusteSiempreCuadraElTotal(t *testing.T) {
	estrategia := distribucion.NuevaEstrategiaDistribucionLineal()

	for total := int64(1); total <= 1000; total++ {
		for unidades := 1; unidades <= 20; unidades++ {
			resultado, err := estrategia.Distribuir(quantity.New(total, 2), unidades)

			assert.NoError(t, err)
			assert.Equal(t, total, cuadre(resultado, unidades))
			assert.GreaterOrEqual(t, resultado.AjusteRedondeo.Value(), int64(0))
			assert.Less(t, resultado.AjusteRedondeo.Value(), int64(unidades))
			assert.GreaterOrEqual(t, resultado.MontoUnidad.Value(), int64(1))
		}
	}
}

func TestLinealRechazaCeroUnidades(t *testing.T) {
	estrategia := distribucion.NuevaEstrategiaDistribucionLineal()

	_, err := estrategia.Distribuir(quantity.New(1000, 2), 0)

	assert.Error(t, err)
}

// cuadre recupera el total original de una distribución: montos iguales por
// unidad menos el ajuste de redondeo.
func cuadre(resultado distribucion.DistribucionResultado, unidades int) int64 {
	return resultado.MontoUnidad.Value()*int64(unidades) - resultado.AjusteRedondeo.Value()
}