package gorm

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/Sanaruca/condominio/internal/administracion/models/deuda"
	"github.com/Sanaruca/condominio/internal/administracion/types/estadodeuda"
	"github.com/Sanaruca/condominio/internal/core"
	gormAdapter "github.com/Sanaruca/condominio/internal/core/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	database "github.com/Sanaruca/condominio/internal/shared/adapters/gorm"
	uadapters "github.com/Sanaruca/condominio/internal/unidades/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
)

type GORMDeudaRepository struct {
	db            *gorm.DB
	deudaFactory  *deuda.DeudaFactory
	qf            *quantity.QuantityFactory
	sujetoFactory *sujeto.SujetoFactory
}

func NewGORMDeudaRepository(
	db *gorm.DB,
	deudaFactory *deuda.DeudaFactory,
	quantityFactory *quantity.QuantityFactory,
	sujetoFactory *sujeto.SujetoFactory,
) deuda.DeudaRepository {

	if deudaFactory == nil {
		panic("deudaFactory is nil")
	}
	if quantityFactory == nil {
		panic("qf is nil")
	}
	if sujetoFactory == nil {
		panic("sujetoFactory is nil")
	}

	return &GORMDeudaRepository{
		db:            db,
		deudaFactory:  deudaFactory,
		qf:            quantityFactory,
		sujetoFactory: sujetoFactory,
	}
}

// ObtenerConTitular implements [deuda.DeudaRepository].
func (r *GORMDeudaRepository) ObtenerConTitular(
	ctx context.Context,
	filter filter.Clause,
	paginator common.Paginator,
) (*common.Paginated[deuda.DeudaConTitular], core.Error) {
	paginator.Sanitize()

	rows, err := gorm.G[DeudaTable](
		r.db,
	).Scopes(
		gormAdapter.GFilter(filter),
		gormAdapter.GPaginate(paginator),
	).
		Preload("Unidad.TitularPrimario.Representante", nil).
		Preload("Abonos", nil).
		Find(ctx)

	if err != nil {
		return nil, core.WrapError(err)
	}

	total, err := gorm.G[DeudaTable](
		r.db,
	).Scopes(gormAdapter.GFilter(filter)).
		Count(ctx, "deudas.id")

	if err != nil {
		return nil, core.WrapError(err)
	}

	deudas := make([]deuda.DeudaConTitular, len(rows))

	for i, d := range rows {
		deudas[i] = deuda.DeudaConTitular{
			Deuda:   *d.ToDomainDeuda(r.deudaFactory, r.qf),
			Titular: uadapters.BuildTitular(d.Unidad.TitularPrimario, r.sujetoFactory),
		}
	}

	return common.NewPaginated(deudas, int(total), paginator), nil
}

// ObtenerDeudasDeUnidadPorCodigo implements [deuda.DeudaRepository].
func (r GORMDeudaRepository) ObtenerDeudasDeUnidadPorCodigo(
	ctx context.Context,
	unidadCodigo unidad.UnidadCodigo,
	paginator common.Paginator,
) (*common.Paginated[deuda.Deuda], core.Error) {
	return r.obtenerDeudasPor(ctx, "Unidad.codigo", string(unidadCodigo), paginator)
}

// ObtenerDeudasDeUnidadPorID implements [deuda.DeudaRepository].
func (r GORMDeudaRepository) ObtenerDeudasDeUnidadPorID(
	ctx context.Context,
	unidadID unidad.UnidadID,
	paginator common.Paginator,
) (*common.Paginated[deuda.Deuda], core.Error) {
	return r.obtenerDeudasPor(ctx, "Unidad.id", unidadID.String(), paginator)
}

func (r GORMDeudaRepository) obtenerDeudasPor(
	ctx context.Context,
	campo, valor string,
	paginator common.Paginator,
) (*common.Paginated[deuda.Deuda], core.Error) {

	paginator.Sanitize()

	rows, err := gorm.G[DeudaTable](r.db).
		Joins(clause.LeftJoin.Association("Unidad"),
			func(db gorm.JoinBuilder, joinTable, curTable clause.Table) error {
				db.Select("id")
				return nil
			},
		).
		Preload("Abonos", nil).
		Where(campo+" = ?", valor).
		Scopes(gormAdapter.GPaginate(paginator)).
		Find(ctx)

	if err != nil {
		return nil, core.WrapError(err)
	}

	total, err := gorm.G[DeudaTable](r.db).
		Joins(clause.LeftJoin.Association("Unidad"),
			func(db gorm.JoinBuilder, joinTable, curTable clause.Table) error {
				db.Select("id")
				return nil
			},
		).
		Where(campo+" = ?", valor).
		Count(ctx, "deudas.id")

	if err != nil {
		return nil, core.WrapError(err)
	}

	deudas := make([]deuda.Deuda, len(rows))

	for i, d := range rows {
		deudas[i] = *d.ToDomainDeuda(r.deudaFactory, r.qf)
	}

	return common.NewPaginated(deudas, int(total), paginator), nil

}

// Count implements [deuda.DeudaRepository].
func (r GORMDeudaRepository) Count(ctx context.Context, filter filter.Clause) (int, core.Error) {
	count, err := gorm.G[DeudaTable](r.db).Scopes(gormAdapter.GFilter(filter)).Count(ctx, "id")

	if err != nil {
		return 0, core.WrapError(err)
	}

	return int(count), nil
}

// GetLastDeudaWhereNotPagada implements [deuda.DeudaRepository].
func (r GORMDeudaRepository) GetLastDeudaWhereNotPagada(
	ctx context.Context,
	unidadCodigo unidad.UnidadCodigo,
) (*deuda.Deuda, core.Error) {
	_deuda, err := gorm.G[DeudaTable](r.db).Where(
		"unidad_codigo = ? AND estado <> ?",
		string(unidadCodigo),
		estadodeuda.Pagada,
	).Select("id", "deuda", "monto").Order("registro asc").Take(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	if err != nil {
		return nil, core.WrapError(err)
	}

	destinos, err := gorm.G[DestinoDePago](r.db).Where("deuda = ?", _deuda.ID).Find(ctx)

	if err != nil {
		return nil, core.WrapError(err)
	}

	abonos := make([]deuda.Abono, len(destinos))
	for i, destino := range destinos {
		abonos[i] = *r.deudaFactory.AssembleAbono(destino.Operacion, r.qf.Assemble(int64(destino.Destinado)), destino.Fecha)
	}

	return r.deudaFactory.Assemble(
		_deuda.ID,
		_deuda.Cuota,
		unidad.WrapIDs(_deuda.UnidadID, _deuda.UnidadCodigo),

		_deuda.Monto,
		_deuda.Registro,
		abonos,
	), nil
}

// Guardar implements [deuda.DeudaRepository].
func (r GORMDeudaRepository) Guardar(
	ctx context.Context,
	deudaEntity *deuda.Deuda,
) core.Error {
	now := time.Now().UTC()

	model := database.IDeuda{
		ID:            deudaEntity.ID(),
		UnidadID:      string(deudaEntity.Unidad().Codigo()),
		Monto:         int(deudaEntity.Monto().Value()),
		Cuota:         string(deudaEntity.CuotaID()),
		Registro:      deudaEntity.Registro(),
		Actualizacion: now,
	}

	// UPSERT: si existe actualiza monto y actualizacion, si no crea
	err := r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id"}},
			DoUpdates: clause.AssignmentColumns([]string{"monto", "actualizacion"}),
		}).
		Create(&model).Error

	if err != nil {
		return core.WrapError(err)
	}

	return nil
}
