package graph

import (
	"context"
	"fmt"

	"github.com/Sanaruca/condominio/graph/model"
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota/estadoproyecto"
	"github.com/Sanaruca/condominio/internal/administracion/types/tipodecuota"
	"github.com/Sanaruca/condominio/internal/core"
	gormAdapter "github.com/Sanaruca/condominio/internal/core/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	cc "github.com/Sanaruca/condominio/internal/core/context"
	database "github.com/Sanaruca/condominio/internal/shared/adapters/gorm"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ObtenerCuotas is the resolver for the obtenerCuotas field.
func (r *queryResolver) ObtenerCuotas(ctx context.Context, filtro *model.CuotaFilter, paginador *model.Paginator) (*model.PaginatedCuota, error) {
	_, e := cc.Wrap(ctx).AsBase()

	if e != nil {
		return nil, e
	}

	paginator := paginador.ToDomainPaginator()

	inputMap, mapErr := model.StructToMap(filtro)

	if mapErr != nil {
		return nil, core.WrapError(mapErr)
	}

	ftr, err := filter.Parse(inputMap)

	if err != nil {
		return nil, core.WrapError(err)
	}

	if err := filter.
		NewValidator(model.GetFilterSpec(filtro)).
		Validate(ftr); err != nil {
		return nil, core.WrapError(err)
	}

	tabla := new(database.Cuota).TableName()

	aliases := map[string][]string{
		"id":                 {"id"},
		"monto":              {"monto"},
		"tipo":               {"tipo"},
		"mes":                {"mes"},
		"anio":               {"anio"},
		"registro":           {"registro"},
		"actualizacion":      {"actualizacion"},
		"nombre":             {"nombre"},
	}

	rows, err := gorm.G[database.Cuota](r.db).
		Joins(
			clause.LeftJoin.Association("Proyecto"),
			func(db gorm.JoinBuilder, joinTable, curTable clause.Table) error {
				db.Select("titulo", "cuota", "estado", "descripcion", "justificacion", "fecha_limite", "interes_por_mora", "registro", "registrado_por", "actualizacion", "actualizado_por")
				return nil
			},
		).
		Scopes(
			gormAdapter.GFilter(ftr, aliases),
			gormAdapter.GPaginate(paginator),
		).
		Order(fmt.Sprintf("%s.registro DESC", tabla)).
		Find(ctx)

	if err != nil {
		return nil, core.WrapError(err)
	}

	total, err := gorm.G[database.Cuota](r.db).
		Joins(clause.LeftJoin.Association("Proyecto"), nil).
		Scopes(gormAdapter.GFilter(ftr, aliases)).
		Count(ctx, "id")

	if err != nil {
		return nil, core.WrapError(err)
	}

	data := make([]model.CuotaType, len(rows))

	for i, c := range rows {
		displayName := c.NombreCompleto()
		montoFloat := r.qf.Assemble(int64(c.Monto)).Float()

		switch c.Tipo {
		case tipodecuota.Regular:
			data[i] = model.CuotaRegular{
				ID:            c.ID,
				DisplayName:   displayName,
				Monto:         montoFloat,
				Mes:           c.Mes,
				Anio:          int32(c.Anio),
				Registro:      c.Registro,
				Actualizacion: c.Actualizacion,
				Recaudacion:   &model.Recaudacion{},
				Gastos:        []model.GastoType{},
			}
		case tipodecuota.Especial:
			var detalles *model.Proyecto
			if c.Proyecto != nil {
				detalles = &model.Proyecto{
					Titulo:         c.Proyecto.Titulo,
					Estado:         estadoproyecto.EstadoDeProyecto(c.Proyecto.Estado),
					Descripcion:    c.Proyecto.Descripcion,
					Justificacion:  c.Proyecto.Justificacion,
					FechaLimite:    c.Proyecto.FechaLimite,
					InteresPorMora: float64(c.Proyecto.InteresPorMora),
					Registro:       c.Proyecto.Registro,
					Actualizacion:  c.Proyecto.Actualizacion,
				}
			}
			data[i] = model.CuotaEspecial{
				ID:            c.ID,
				DisplayName:   displayName,
				Monto:         montoFloat,
				Mes:           c.Mes,
				Anio:          int32(c.Anio),
				Registro:      c.Registro,
				Actualizacion: c.Actualizacion,
				Detalles:      detalles,
				Recaudacion:   &model.Recaudacion{},
				Gastos:        []model.GastoType{},
			}
		case tipodecuota.Semilla:
			data[i] = model.CuotaSemilla{
				ID:            c.ID,
				DisplayName:   displayName,
				Monto:         montoFloat,
				Mes:           c.Mes,
				Anio:          int32(c.Anio),
				Registro:      c.Registro,
				Actualizacion: c.Actualizacion,
				Recaudacion:   &model.Recaudacion{},
				Gastos:        []model.GastoType{},
			}
		}
	}

	cuotas := common.NewPaginated(data, int(total), paginator)

	return &model.PaginatedCuota{
		Data:  cuotas.Data,
		Total: int32(cuotas.Total),
		Page:  int32(cuotas.Page),
		Pages: int32(cuotas.Pages),
		Limit: int32(cuotas.Limit),
	}, nil
}