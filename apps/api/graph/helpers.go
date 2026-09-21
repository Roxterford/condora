package graph

import (
	"context"

	"github.com/Sanaruca/condominio/graph/model"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	cc "github.com/Sanaruca/condominio/internal/core/context"
	finanzasQuery "github.com/Sanaruca/condominio/internal/finanzas/app/query"
	"github.com/Sanaruca/condominio/internal/finanzas/models/operacion"
)

///////////////////////////

func resolverObtenerGastos(
	ctx context.Context,
	r *Resolver,
	cuotaID string,
) ([]model.GastoType, error) {
	base, err := cc.Wrap(ctx).AsBase()
	if err != nil {
		return nil, err
	}

	ftr := filter.NewFilter[operacion.GastoBase](map[string]any{
		"cuota": map[string]any{
			"eq": cuotaID,
		},
	})

	gastos, err := r.Transacciones.Queries.ObtenerGastos.Exec(base, finanzasQuery.ObtenerGastosDTO{
		// TODO: estar atento al limite
		Paginator: common.Paginator{Limit: 100},
		Filter:    ftr,
	})
	if err != nil {
		return nil, err
	}

	data := make([]model.GastoType, len(gastos.Data))
	for i, gasto := range gastos.Data {
		data[i] = model.GastoTypeFromDomain(gasto)
	}

	return data, nil
}
