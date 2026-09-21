package unidad

import (
	"context"

	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad/estadounidad"
)

type UnidadRepository interface {
	Exists(ctx context.Context, unidad UnidadID) (bool, core.Error)
	ExistsCodigo(ctx context.Context, unidad UnidadCodigo) (bool, core.Error)
	ObtenerPorID(
		ctx context.Context,
		id UnidadID,
	) (*Unidad, core.Error)
	ObtenerPorCodigo(
		ctx context.Context,
		codigo UnidadCodigo,
	) (*Unidad, core.Error)
	Obtener(
		ctx context.Context,
		filter filter.Clause,
		paginator common.Paginator,
	) (*common.Paginated[Unidad], core.Error)
	ObtenerTodas(ctx context.Context) ([]UnidadIDs, core.Error)
	ObtenerTodasConEstado(ctx context.Context) ([]UnidadConEstado, core.Error)
	ObtenerEstado(
		ctx context.Context,
		unidad UnidadCodigo,
	) (estadounidad.EstadoDeUnidad, core.Error)
	Guardar(ctx context.Context, unidad *Unidad) core.Error
	// Recalcular actualiza los campos denormalizados (deuda_total, estado_cuenta,
	// cuotas_pendientes, cuenta) de una unidad basándose en sus deudas, pagos y abonos.
	Recalcular(ctx context.Context, unidadID UnidadID) core.Error
}
