package gorm

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	"github.com/Sanaruca/condominio/internal/administracion/types/tipodecuota"
	"github.com/Sanaruca/condominio/internal/core"
	gormAdapter "github.com/Sanaruca/condominio/internal/core/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/audit"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/core/common/periodo"
)

type GORMCuotaRepository struct {
	db      *gorm.DB
	factory *cuota.CuotaFactory
}

func WrapCuotaRepository(repo cuota.CuotaRepository) *GORMCuotaRepository {
	r, ok := repo.(*GORMCuotaRepository)
	if !ok {
		panic("repo is not a *GORMCuotaRepository")
	}
	return r
}

func (r *GORMCuotaRepository) WithDB(db *gorm.DB) cuota.CuotaRepository {
	clone := *r
	clone.db = db
	return &clone
}

func NewGORMCuotaRepository(db *gorm.DB, factory *cuota.CuotaFactory) cuota.CuotaRepository {
	if factory == nil {
		panic("factory is nil")
	}
	return &GORMCuotaRepository{db: db, factory: factory}
}

// Count implements [cuota.CuotaRepository].
func (r *GORMCuotaRepository) Count(ctx context.Context, filter filter.Clause) (int, core.Error) {
	count, err := gorm.G[Cuota](r.db).Scopes(gormAdapter.GFilter(filter)).Count(ctx, "id")
	if err != nil {
		return 0, core.WrapError(err)
	}
	return int(count), nil
}

// Guardar implements [cuota.CuotaRepository].
func (r *GORMCuotaRepository) Guardar(
	ctx context.Context,
	cuotaEntity cuota.Cuota,
) (cuota.CuotaID, core.Error) {
	var tipo tipodecuota.TipoDeCuota
	var proyecto *Proyecto
	var audit audit.FullAudit[string]

	if cuotaEntity.AsRegular() != nil {
		tipo = tipodecuota.Regular
		audit = cuotaEntity.AsRegular().Audit
	} else if cuotaEntity.AsEspecial() != nil {
		tipo = tipodecuota.Especial
		esp := cuotaEntity.AsEspecial()
		audit = esp.Audit
		proyecto = &Proyecto{
			Titulo:         esp.Detalles.Titulo(),
			Descripcion:    esp.Detalles.Descripcion(),
			Justificacion:  esp.Detalles.Justificacion(),
			FechaLimite:    esp.Detalles.FechaLimite(),
			InteresPorMora: int(esp.Detalles.InteresPorMora().Value()),
			Estado:         esp.Detalles.Estado(),
			Registro:       esp.Audit.CreatedAt,
			Actualizacion:  esp.Audit.UpdatedAt,
			RegistradoPor:  esp.Audit.CreatedBy,
			ActualizadoPor: esp.Audit.UpdatedBy,
		}
	} else if cuotaEntity.AsSemilla() != nil {
		tipo = tipodecuota.Semilla
		audit = cuotaEntity.AsSemilla().Audit
	}

	model := Cuota{
		ID:             string(cuotaEntity.ID()),
		Tipo:           tipo,
		Monto:          int(cuotaEntity.Monto().Value()),
		Mes:            cuotaEntity.Mes(),
		Anio:           cuotaEntity.Anio(),
		Registro:       audit.CreatedAt,
		RegistradoPor:  audit.CreatedBy,
		Actualizacion:  audit.UpdatedAt,
		ActualizadoPor: audit.UpdatedBy,
		Proyecto:       proyecto,
	}

	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return "", core.WrapError(err)
	}

	return cuotaEntity.ID(), nil
}

// ObtenerPorID implements [cuota.CuotaRepository].
func (r *GORMCuotaRepository) ObtenerPorID(
	ctx context.Context,
	id cuota.CuotaID,
) (cuota.Cuota, core.Error) {
	cuota, err := gorm.G[Cuota](
		r.db,
	).Preload("Proyecto", nil).
		Where("id = ?", id.String()).
		Take(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, core.WrapError(err)
	}

	return cuota.ToDomainCuota(r.factory), nil
}

func (r *GORMCuotaRepository) Obtener(
	ctx context.Context,
	filter filter.Clause,
	paginator common.Paginator,
) (*common.Paginated[cuota.Cuota], core.Error) {

	// Obtener registros paginados
	registros, err := gorm.G[Cuota](r.db).
		Scopes(gormAdapter.GFilter(filter), gormAdapter.GPaginate(paginator)).
		Joins(clause.LeftJoin.Association("Proyecto"), nil).
		Find(ctx)
	if err != nil {
		return nil, core.WrapError(err)
	}

	// Obtener total para la metadata de paginación
	total, err := gorm.G[Cuota](r.db).Scopes(gormAdapter.GFilter(filter)).Count(ctx, "id")
	if err != nil {
		return nil, core.WrapError(err)
	}

	// Cálculo de páginas optimizado
	pages := (int(total) + paginator.Limit - 1) / paginator.Limit

	// 5. Mapeo final a objetos de dominio
	cuotas := make([]cuota.Cuota, 0, len(registros))
	for _, c := range registros {
		// Se pasa el detalle (si no existe en el mapa, será el valor cero de la estructura)
		cuotas = append(cuotas, c.ToDomainCuota(r.factory))
	}

	return &common.Paginated[cuota.Cuota]{
		Data:  cuotas,
		Total: int(total),
		Page:  paginator.Page,
		Pages: pages,
		Limit: paginator.Limit,
	}, nil
}

// ObtenerPeriodosEmitidos implements [cuota.CuotaRepository].
func (r *GORMCuotaRepository) ObtenerPeriodosEmitidos(
	ctx context.Context,
) ([]periodo.Periodo, core.Error) {
	registros, err := gorm.G[Cuota](r.db).Find(ctx)
	if err != nil {
		return nil, core.WrapError(err)
	}

	out := make([]periodo.Periodo, 0, len(registros))
	for _, c := range registros {
		out = append(out, periodo.Assemble(c.Mes, c.Anio))
	}
	return out, nil
}
