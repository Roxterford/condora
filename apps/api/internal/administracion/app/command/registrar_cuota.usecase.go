package command

import (
	"time"

	validation "github.com/go-ozzo/ozzo-validation/v4"

	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota/distribucion"
	"github.com/Sanaruca/condominio/internal/administracion/models/deuda"
	"github.com/Sanaruca/condominio/internal/administracion/models/periododisponible"
	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/adapters/ozzo"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/core/common/mes"
	"github.com/Sanaruca/condominio/internal/core/common/periodo"
	cc "github.com/Sanaruca/condominio/internal/core/context"
	"github.com/Sanaruca/condominio/internal/core/envirotment"
	"github.com/Sanaruca/condominio/internal/core/usecase"
	"github.com/Sanaruca/condominio/internal/finanzas/models/operacion"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
)

type RegistrarCuotaRegularDTO struct {
	Mes         mes.Mes
	Anio        int
	FechaLimite time.Time
	Gastos      []string
}

type CuotaUoWDeps struct {
	Cuotas      cuota.CuotaRepository
	Operaciones operacion.OperacionRepository
	Unidades    unidad.UnidadRepository
	Deudas      deuda.DeudaRepository
}

type RegistrarCuotaRegular usecase.Handler[cc.AdminContext, RegistrarCuotaRegularDTO, *cuota.CuotaRegular]

type registrarCuotaRegular struct {
	cuotas                 cuota.CuotaRepository
	operaciones            operacion.OperacionRepository
	cf                     *cuota.CuotaFactory
	uow                    common.UnitOfWork[CuotaUoWDeps]
	deudaFactory           *deuda.DeudaFactory
	facturacionPolicy      unidad.FacturacionPolicy
	estrategiaDistribucion distribucion.EstrategiaDeDistribucion
}

func NewRegistrarCuotaRegular(
	cuotaRepository cuota.CuotaRepository,
	operacionRepository operacion.OperacionRepository,
	cuotaFactory *cuota.CuotaFactory,
	uow common.UnitOfWork[CuotaUoWDeps],
	deudaFactory *deuda.DeudaFactory,
	facturacionPolicy unidad.FacturacionPolicy,
	estrategiaDistribucion distribucion.EstrategiaDeDistribucion,
) RegistrarCuotaRegular {

	if cuotaRepository == nil {
		panic("cuotaRepository is nil")
	}

	if operacionRepository == nil {
		panic("operacionRepository is nil")
	}

	if cuotaFactory == nil {
		panic("cuotaFactory is nil")
	}

	if uow == nil {
		panic("uow is nil")
	}

	if deudaFactory == nil {
		panic("deudaFactory is nil")
	}

	if facturacionPolicy == nil {
		panic("facturacionPolicy is nil")
	}

	if estrategiaDistribucion == nil {
		panic("estrategiaDistribucion is nil")
	}

	return &registrarCuotaRegular{
		cuotas:                 cuotaRepository,
		operaciones:            operacionRepository,
		cf:                     cuotaFactory,
		uow:                    uow,
		deudaFactory:           deudaFactory,
		facturacionPolicy:      facturacionPolicy,
		estrategiaDistribucion: estrategiaDistribucion,
	}
}

func (uc registrarCuotaRegular) Exec(
	ctx cc.AdminContext,
	input RegistrarCuotaRegularDTO,
) (*cuota.CuotaRegular, core.Error) {

	if len(input.Gastos) == 0 {
		return nil, core.NewValidationError("Debe proporcionar al menos un gasto")
	}

	ftr, err := filter.Parse(map[string]any{
		"id": map[string]any{
			"in": input.Gastos,
		},
	})
	if err != nil {
		return nil, core.WrapError(err)
	}

	gastos, err := uc.operaciones.Obtener(ctx, ftr, common.Paginator{})
	if err != nil {
		return nil, core.WrapError(err)
	}

	if len(gastos.Data) != len(input.Gastos) {
		return nil, core.NewValidationError(
			"Uno o varios de los gastos proporcionados no fue encontrado",
		)
	}

	periodoCandidato, perr := periodo.Nuevo(input.Mes, input.Anio)
	if perr != nil {
		return nil, perr
	}

	emitidos, eerr := uc.cuotas.ObtenerPeriodosEmitidos(ctx)
	if eerr != nil {
		return nil, eerr
	}

	regla, rerr := periododisponible.Nuevo(envirotment.GetMaxMesesFuturoCuota())
	if rerr != nil {
		return nil, rerr
	}

	if verr := periododisponible.NuevaCalculadoraDePeriodos().EsValidoParaEmision(
		periodoCandidato,
		periodo.DesdeTime(time.Now()),
		regla,
		emitidos,
		false,
	); verr != nil {
		return nil, verr
	}

	monto := gastos.Data[0].Total()
	for _, gasto := range gastos.Data[1:] {
		monto = monto.HappyAdd(gasto.Total())
	}

	var _cuota *cuota.CuotaRegular

	txerr := uc.uow.Do(ctx, func(tx CuotaUoWDeps) error {
		elegibles, err := uc.obtenerElegibles(ctx, tx.Unidades)
		if err != nil {
			return err
		}

		montoCuota := monto
		montoUnidad := int64(0)

		if len(elegibles) > 0 {
			reparto, derr := uc.estrategiaDistribucion.Distribuir(monto, len(elegibles))
			if derr != nil {
				return derr
			}

			montoCuota = monto.HappyAdd(reparto.AjusteRedondeo)
			montoUnidad = reparto.MontoUnidad.Value()
		}

		_cuota, err = uc.cf.NuevaRegular(
			int(montoCuota.Value()),
			input.Mes,
			input.Anio,
			ctx.Session().Usuario().ID,
		)
		if err != nil {
			return err
		}

		if _, err := tx.Cuotas.Guardar(ctx, _cuota); err != nil {
			return err
		}

		for _, gasto := range gastos.Data {
			if err := gasto.AsignarCuota(_cuota.ID().String()); err != nil {
				return err
			}
			if err := tx.Operaciones.Guardar(ctx, &gasto); err != nil {
				return err
			}
		}

		for _, _unidad := range elegibles {
			_nuevaDeuda, derr := uc.deudaFactory.NuevaDeuda(
				_cuota.ID(),
				_unidad.IDs,
				int(montoUnidad),
			)
			if derr != nil {
				return derr
			}

			if err := tx.Deudas.Guardar(ctx, _nuevaDeuda); err != nil {
				return err
			}
		}

		return nil
	})

	if txerr != nil {
		return nil, core.WrapError(txerr)
	}

	return _cuota, nil
}

// obtenerElegibles recupera, según la política de facturación vigente, las
// unidades obligadas a contribuir con la cuota. El snapshot de unidades y
// estado se toma en la misma transacción que la emisión de la cuota, no a
// posteriori.
func (uc registrarCuotaRegular) obtenerElegibles(
	ctx cc.AdminContext,
	repo unidad.UnidadRepository,
) ([]unidad.UnidadConEstado, error) {
	unidades, err := repo.ObtenerTodasConEstado(ctx)
	if err != nil {
		return nil, err
	}

	elegibles := make([]unidad.UnidadConEstado, 0, len(unidades))
	for _, _unidad := range unidades {
		if uc.facturacionPolicy.GeneraDeudaPorCuotaRegular(_unidad.Estado) {
			elegibles = append(elegibles, _unidad)
		}
	}

	return elegibles, nil
}

func (input *RegistrarCuotaRegularDTO) Validate() core.Error {

	unduplicatedIDs := core.NewSetFromSlice(input.Gastos, func(it string) string { return it })
	input.Gastos = unduplicatedIDs.ToSlice()

	if err := input.Mes.Validate(); err != nil {
		return err
	}

	err := validation.ValidateStruct(input,
		validation.Field(
			&input.Gastos,
			validation.Required,
			validation.Max(100),
		),
	)

	if err != nil {
		return ozzo.FirstOzzoErrorAdapter(input, err)
	}

	return nil
}
