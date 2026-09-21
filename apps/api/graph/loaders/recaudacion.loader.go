package loaders

import (
	"context"

	"github.com/Sanaruca/condominio/graph/model"
	"github.com/Sanaruca/condominio/internal/core/common/moneda"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	database "github.com/Sanaruca/condominio/internal/shared/adapters/gorm"
	"gorm.io/gorm"
)

type recaudacionReader struct {
	db *gorm.DB
	qf *quantity.QuantityFactory
}

func GetRecaudacion(ctx context.Context, cuotaID string) (*model.Recaudacion, error) {
	loaders := For(ctx)
	return loaders.Recaudacion.Load(ctx, cuotaID)
}

func (r *recaudacionReader) getRecaudaciones(
	ctx context.Context,
	cuotaIDs []string,
) ([]*model.Recaudacion, []error) {

	rows, err := gorm.G[database.Recaudacion](r.db).
		Where("cuota IN ?", cuotaIDs).
		Find(ctx)

	if err != nil {
		return nil, []error{err}
	}

	byCuota := make(map[string]database.Recaudacion, len(rows))

	for _, row := range rows {
		byCuota[row.Cuota] = row
	}

	recaudaciones := make([]*model.Recaudacion, len(cuotaIDs))

	for i, id := range cuotaIDs {

		row, ok := byCuota[id]

		if !ok {
			// una cuota puede no tener recaudacion asociada
			continue
		}

		recaudaciones[i] = &model.Recaudacion{
			Moneda:             moneda.USD,
			MontoEstimado:      r.qf.Assemble(int64(row.TotalEstimado)).Float(),
			MontoRecaudado:     r.qf.Assemble(int64(row.Recaudado)).Float(),
			MontoPendiente:     r.qf.Assemble(int64(row.Pendiente)).Float(),
			PagosAsociados:     int32(row.PagosAsociados),
			Unidades:           int32(row.Unidades),
			UnidadesAplicadas:  int32(row.UnidadesAplicadas),
			UnidadesSolventes:  int32(row.UnidadesSolventes),
			UnidadesPendientes: int32(row.UnidadesPendientes),
		}
	}

	return recaudaciones, nil
}
