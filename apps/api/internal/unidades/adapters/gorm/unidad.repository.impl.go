package gorm

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/Sanaruca/condominio/internal/core"
	gormAdapter "github.com/Sanaruca/condominio/internal/core/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad/estadounidad"
)

type GORMUnidadRepository struct {
	db *gorm.DB
	uf *unidad.UnidadFactory
	sf *sujeto.SujetoFactory
}

func NewGORMUnidadRepository(
	db *gorm.DB,
	unidadFactory *unidad.UnidadFactory,
	sujetoFactory *sujeto.SujetoFactory,
) unidad.UnidadRepository {

	if unidadFactory == nil {
		panic("unidad factory is nil")
	}

	if sujetoFactory == nil {
		panic("sujeto factory is nil")
	}

	return &GORMUnidadRepository{db, unidadFactory, sujetoFactory}
}

// ObtenerPorCodigo implements [unidad.UnidadRepository].
func (r *GORMUnidadRepository) ObtenerPorCodigo(
	ctx context.Context,
	codigo unidad.UnidadCodigo,
) (*unidad.Unidad, core.Error) {
	return r.obtenerPor(ctx, "codigo", string(codigo))
}

// ObtenerPorID implements [unidad.UnidadRepository].
func (r *GORMUnidadRepository) ObtenerPorID(
	ctx context.Context,
	id unidad.UnidadID,
) (*unidad.Unidad, core.Error) {
	return r.obtenerPor(ctx, "id", id.String())
}

// ! TODO: Be carefull
func (r *GORMUnidadRepository) obtenerPor(
	ctx context.Context,
	campo, input string,
) (*unidad.Unidad, core.Error) {

	unidad_row, err := gorm.G[UnidadInfo](r.db).
		Where(campo+" = ?", input). // ! TODO: Be carefull
		Preload("Contacto", nil).
		Preload("TitularPrimario", nil).
		Take(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	if err != nil {
		return nil, core.WrapError(err)
	}

	unidad := unidad_row.ToDomainUnidad(r.uf, r.sf)

	return &unidad, nil
}

func (r *GORMUnidadRepository) existsPor(
	ctx context.Context,
	campo, valor string,
) (bool, core.Error) {

	var u Unidad
	err := r.db.WithContext(ctx).Where(campo+" = ?", valor).Select("id").Take(&u).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}

	if err != nil {
		return false, core.WrapError(err)
	}

	return true, nil
}

func (r *GORMUnidadRepository) ExistsCodigo(
	ctx context.Context,
	codigo unidad.UnidadCodigo,
) (bool, core.Error) {
	return r.existsPor(ctx, "codigo", codigo.String())
}

func (r *GORMUnidadRepository) Exists(
	ctx context.Context,
	unidadID unidad.UnidadID,
) (bool, core.Error) {
	return r.existsPor(ctx, "id", unidadID.String())
}

// Guardar implements [unidad.UnidadRepository].
func (r *GORMUnidadRepository) Guardar(
	ctx context.Context,
	entity *unidad.Unidad,
) core.Error {

	if entity == nil {
		return core.NewValidationError("la unidad es nil")
	}

	var titularPrimarioID *string
	if entity.TitularPrimario() != nil {
		id := entity.TitularPrimario().ID().String()
		titularPrimarioID = &id
	}

	var contactoID *string
	if entity.Contacto() != nil {
		id := entity.Contacto().ID().String()
		contactoID = &id
	}

	var descripcion *string
	if d := entity.Descripcion(); d != "" {
		descripcion = &d
	}

	model := Unidad{
		ID:                entity.ID().String(),
		Codigo:            entity.Codigo().String(),
		Estado:            entity.Estado(),
		TitularPrimarioID: titularPrimarioID,
		ContactoID:        contactoID,
		Descripcion:       descripcion,
	}

	if err := r.db.WithContext(ctx).Save(&model).Error; err != nil {
		return core.WrapError(err)
	}

	return nil
}
func (r *GORMUnidadRepository) ObtenerTodas(ctx context.Context) ([]unidad.UnidadIDs, core.Error) {
	var unidades []Unidad
	if err := r.db.WithContext(ctx).Select("id, codigo").Find(&unidades).Error; err != nil {
		return nil, core.WrapError(err)
	}

	codigos := make([]unidad.UnidadIDs, len(unidades))
	for i, u := range unidades {
		codigos[i] = unidad.WrapIDs(u.ID, u.Codigo)
	}

	return codigos, nil
}

// ObtenerTodasConEstado implementa [unidad.UnidadRepository]. Trae id, codigo y
// estado de todas las unidades en una sola query (evita el N+1 de ObtenerEstado).
func (r *GORMUnidadRepository) ObtenerTodasConEstado(ctx context.Context) ([]unidad.UnidadConEstado, core.Error) {
	var unidades []Unidad
	if err := r.db.WithContext(ctx).Select("id, codigo, estado").Find(&unidades).Error; err != nil {
		return nil, core.WrapError(err)
	}

	result := make([]unidad.UnidadConEstado, len(unidades))
	for i, u := range unidades {
		result[i] = unidad.UnidadConEstado{
			IDs:    unidad.WrapIDs(u.ID, u.Codigo),
			Estado: estadounidad.EstadoDeUnidad(u.Estado),
		}
	}

	return result, nil
}

func (r *GORMUnidadRepository) ObtenerEstado(
	ctx context.Context,
	unidadCodigo unidad.UnidadCodigo,
) (estadounidad.EstadoDeUnidad, core.Error) {
	var u Unidad
	if err := r.db.WithContext(ctx).Where("codigo = ?", string(unidadCodigo)).Take(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", unidad.ErrUnidadNoEncontrada
		}
		return "", core.WrapError(err)
	}

	return estadounidad.EstadoDeUnidad(u.Estado), nil
}

func (r *GORMUnidadRepository) Obtener(
	ctx context.Context,
	f filter.Clause,
	p common.Paginator,
) (*common.Paginated[unidad.Unidad], core.Error) {
	p.Sanitize()
	// Obtener registros paginados
	registros, err := gorm.G[UnidadInfo](r.db).
		Scopes(gormAdapter.GFilter(f, map[string][]string{"deuda": {"deuda_total"}}), gormAdapter.GPaginate(p)).
		Preload("Contacto", nil).
		Preload("TitularPrimario", nil).
		Order("codigo asc"). // TODO: ordenar para que no pase 1, 10, 2, 20 ...
		Find(ctx)
	if err != nil {
		return nil, core.WrapError(err)
	}

	// Obtener total para la metadata de paginación
	total, err := gorm.G[UnidadInfo](
		r.db,
	).Scopes(gormAdapter.GFilter(f, map[string][]string{"deuda": {"deuda_total"}})).
		Count(ctx, "id")
	if err != nil {
		return nil, core.WrapError(err)
	}

	// Cálculo de páginas optimizado
	pages := (int(total) + p.Limit - 1) / p.Limit

	// 5. Mapeo final a objetos de dominio
	unidades := make([]unidad.Unidad, 0, len(registros))
	for _, u := range registros {
		// Se pasa el detalle (si no existe en el mapa, será el valor cero de la estructura)
		unidades = append(unidades, u.ToDomainUnidad(r.uf, r.sf))
	}

	return &common.Paginated[unidad.Unidad]{
		Data:  unidades,
		Total: int(total),
		Page:  p.Page,
		Pages: pages,
		Limit: p.Limit,
	}, nil
}
