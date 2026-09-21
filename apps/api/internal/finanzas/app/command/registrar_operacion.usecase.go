// TODO: Aplicar Idempotencia

package command

import (
	"time"

	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/common/events"
	"github.com/Sanaruca/condominio/internal/core/common/moneda"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	cc "github.com/Sanaruca/condominio/internal/core/context"
	"github.com/Sanaruca/condominio/internal/core/usecase"
	"github.com/Sanaruca/condominio/internal/finanzas/models/operacion"
	"github.com/Sanaruca/condominio/internal/finanzas/types/metodoperacion"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
)

type TipoTransaccion string

const (
	TipoPago      TipoTransaccion = "pago"
	TipoGasto     TipoTransaccion = "gasto"
	TipoReembolso TipoTransaccion = "reembolso"
)

type RegistrarTransaccionDTO struct {
	Tipo         TipoTransaccion
	Unidad       *unidad.UnidadCodigo
	Proveedor    *string
	Concepto     string
	Monto        int
	Moneda       moneda.Moneda
	Metodo       metodoperacion.MetodoDeOperacion
	Tasa         int
	Fecha        *time.Time
	Referencia   *string
	CuotaID      *string
	EsCondominio bool
}

type RegistrarOperacion usecase.Handler[cc.AdminContext, RegistrarTransaccionDTO, *operacion.Operacion]

type registrarTransaccion struct {
	repo     operacion.OperacionRepository
	factory  *operacion.OperacionFactory
	unidades unidad.UnidadRepository
	qf       *quantity.QuantityFactory
	outbox   events.OutboxEventStoreInterface
}

func NewRegistrarTransaccion(
	repo operacion.OperacionRepository,
	factory *operacion.OperacionFactory,
	unidadRepo unidad.UnidadRepository,
	quantityFactory *quantity.QuantityFactory,
	outbox events.OutboxEventStoreInterface,
) RegistrarOperacion {
	if repo == nil {
		panic("repo is nil")
	}
	if factory == nil {
		panic("factory is nil")
	}
	if unidadRepo == nil {
		panic("unidadRepo is nil")
	}
	if quantityFactory == nil {
		panic("qf is nil")
	}
	if outbox == nil {
		panic("outbox is nil")
	}
	return &registrarTransaccion{
		repo:     repo,
		factory:  factory,
		unidades: unidadRepo,
		qf:       quantityFactory,
		outbox:   outbox,
	}
}

func (uc *registrarTransaccion) Exec(
	ctx cc.AdminContext,
	input RegistrarTransaccionDTO,
) (*operacion.Operacion, core.Error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	fecha := *input.Fecha

	tasaVal := int64(input.Tasa)
	monto := uc.qf.Assemble(int64(input.Monto))
	tasaQ := uc.qf.Assemble(tasaVal)

	correlationID := cc.MustCorrelationID(ctx)
	causationID := correlationID // Para comandos, el causationID suele ser el mismo correlationID

	var op *operacion.Operacion
	var err error

	switch input.Tipo {
	case TipoPago:
		if input.Unidad == nil {
			return nil, core.NewValidationError("La unidad es requerida para pagos")
		}
		unidadCodigo := string(*input.Unidad)
		exists, e := uc.unidades.ExistsCodigo(ctx, *input.Unidad)
		if e != nil {
			return nil, e
		}
		if !exists {
			return nil, unidad.ErrUnidadNoEncontrada
		}
		op, err = uc.factory.NuevoPago(
			unidadCodigo,
			input.Concepto,
			monto,
			input.Moneda,
			input.Metodo,
			tasaQ,
			fecha,
			ctx.Session().Usuario().ID,
			correlationID,
			causationID,
		)

	case TipoGasto:
		op, err = uc.factory.NuevoGasto(
			input.Concepto,
			input.Proveedor,
			input.EsCondominio,
			monto,
			input.Moneda,
			input.Metodo,
			tasaQ,
			fecha,
			input.CuotaID,
			ctx.Session().Usuario().ID,
			correlationID,
			causationID,
		)

	case TipoReembolso:
		if input.Unidad == nil {
			return nil, core.NewValidationError("La unidad es requerida para reembolsos")
		}
		op, err = uc.factory.NuevoReembolso(
			string(*input.Unidad),
			input.Concepto,
			monto,
			input.Moneda,
			input.Metodo,
			tasaQ,
			fecha,
			ctx.Session().Usuario().ID,
			correlationID,
			causationID,
		)

	default:
		return nil, core.NewValidationError("Tipo de transaccion no valido")
	}

	if err != nil {
		return nil, core.WrapError(err)
	}

	if err := uc.repo.Guardar(ctx, op); err != nil {
		return nil, err
	}

	// Si es un pago, recalcular los campos denormalizados de la unidad
	// TODO: también llamar después de aplicar el pago a deudas (crear destino_de_pagos)
	if input.Tipo == TipoPago && input.Unidad != nil {
		if err := uc.unidades.Recalcular(ctx, unidad.UnidadID(*input.Unidad)); err != nil {
			return nil, err
		}
	}

	for _, event := range op.PullEvents() {
		if err := uc.outbox.AddEvent(ctx, event); err != nil {
			return nil, core.WrapError(err)
		}
	}
	op.ClearEvents()

	return op, nil
}

func (dto *RegistrarTransaccionDTO) Validate() core.Error {

	if err := dto.Metodo.Validate(); err != nil {
		return err
	}

	if err := dto.Moneda.Validate(); err != nil {
		return err
	}

	if dto.Moneda == moneda.VED && dto.Tasa < 1 {
		return core.NewValidationError("La tasa es requerida para transacciones en VED")
	}

	if dto.Fecha == nil {
		now := time.Now()
		dto.Fecha = &now
	}

	if dto.Fecha.After(time.Now()) {
		return core.NewInvalidArgumentError("La fecha no puede ser futura")
	}

	if dto.Concepto == "" {
		return core.NewValidationError("El concepto es requerido")
	}
	if dto.Monto < 1 {
		return core.NewValidationError("El monto debe ser mayor a 0")
	}

	return nil
}
