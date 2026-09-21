package cuota

import (
	"time"

	"github.com/lucsky/cuid"

	"github.com/Sanaruca/condominio/internal/administracion/models/cuota/estadoproyecto"
	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/common/audit"
	"github.com/Sanaruca/condominio/internal/core/common/mes"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
)

type CuotaFactory struct {
	proyectoFactory *ProyectoFactory
	qf              *quantity.QuantityFactory
}

func (f *CuotaFactory) ProyectoFactory() *ProyectoFactory {
	return f.proyectoFactory
}

func NewCuotaFactory(
	proyectoFactory *ProyectoFactory,
	quantityFactory *quantity.QuantityFactory,
) *CuotaFactory {
	if proyectoFactory == nil {
		panic("proyectoFactory is nil")
	}

	if quantityFactory == nil {
		panic("quantityFactory is nil")
	}

	return &CuotaFactory{
		proyectoFactory: proyectoFactory,
		qf:              quantityFactory,
	}
}

func (f *CuotaFactory) NuevaRegular(
	monto int,
	mes mes.Mes,
	anio int,
	registrador string,
) (*CuotaRegular, core.Error) {

	if monto <= 0 {
		return nil, core.NewValidationError("el monto debe ser mayor a cero")
	}

	if mes < 1 || mes > 12 {
		return nil, core.NewValidationError("el mes debe estar entre 1 y 12")
	}

	if anio < 2000 {
		return nil, core.NewValidationError("el año debe ser mayor a 2000")
	}

	ahora := time.Now()
	id := CuotaID(cuid.New())

	base := new(CuotaBase)
	base.SetID(id)
	base.SetMonto(f.qf.New(int64(monto)))
	base.SetMes(mes)
	base.SetAnio(anio)
	base.SetAudit(audit.FullAudit[string]{
		CreatedAt: ahora,
		CreatedBy: registrador,
		UpdatedAt: ahora,
		UpdatedBy: registrador,
	})

	return &CuotaRegular{
		CuotaBase: *base,
	}, nil
}

func (f *CuotaFactory) NuevaEspecial(
	mes mes.Mes, anio, monto int,
	titulo string,
	descripcion string,
	justificacion string,
	fecha_limite time.Time,
	interes_por_mora int64,
	registrador string,
) (*CuotaEspecial, core.Error) {

	if monto <= 0 {
		return nil, core.NewValidationError("el monto debe ser mayor a cero")
	}

	_proyecto, err := f.proyectoFactory.Nuevo(
		titulo,
		descripcion,
		justificacion,
		fecha_limite,
		interes_por_mora,
		registrador,
	)
	if err != nil {
		return nil, err
	}

	ahora := time.Now()
	id := CuotaID(cuid.New())

	base := new(CuotaBase)
	base.SetID(id)
	base.SetMonto(f.qf.New(int64(monto)))
	base.SetMes(mes)
	base.SetAnio(anio)
	base.SetAudit(audit.FullAudit[string]{
		CreatedAt: ahora,
		CreatedBy: registrador,
		UpdatedAt: ahora,
		UpdatedBy: registrador,
	})

	return &CuotaEspecial{
		CuotaBase: *base,
		Detalles:  *_proyecto,
	}, nil
}

func (f *CuotaFactory) NuevaSemilla(
	monto int,
	mes mes.Mes,
	anio int,
	registrador string,
) (*CuotaSemilla, core.Error) {

	if monto <= 0 {
		return nil, core.NewValidationError("el monto debe ser mayor a cero")
	}

	if mes < 1 || mes > 12 {
		return nil, core.NewValidationError("el mes debe estar entre 1 y 12")
	}

	if anio < 2000 {
		return nil, core.NewValidationError("el año debe ser mayor a 2000")
	}

	ahora := time.Now()
	id := CuotaID(cuid.New())

	base := new(CuotaBase)
	base.SetID(id)
	base.SetMonto(f.qf.New(int64(monto)))
	base.SetMes(mes)
	base.SetAnio(anio)
	base.SetAudit(audit.FullAudit[string]{
		CreatedAt: ahora,
		CreatedBy: registrador,
		UpdatedAt: ahora,
		UpdatedBy: registrador,
	})

	return &CuotaSemilla{
		CuotaBase: *base,
	}, nil
}

func (f *CuotaFactory) AssembleSemilla(
	id string,
	monto int,
	mes mes.Mes,
	anio int,
	creado_en time.Time,
	actualizado_en time.Time,
	registrador string,
) *CuotaSemilla {

	base := new(CuotaBase)
	base.SetID(CuotaID(id))
	base.SetMonto(f.qf.Assemble(int64(monto)))
	base.SetMes(mes)
	base.SetAnio(anio)
	base.SetAudit(audit.FullAudit[string]{
		CreatedAt: creado_en,
		CreatedBy: registrador,
		UpdatedAt: actualizado_en,
		UpdatedBy: registrador,
	})

	return &CuotaSemilla{
		CuotaBase: *base,
	}
}

func (f *CuotaFactory) AssembleRegular(
	id string,
	monto int,
	mes mes.Mes,
	anio int,
	creado_en time.Time,
	actualizado_en time.Time,
	registrador string,
) *CuotaRegular {

	base := new(CuotaBase)
	base.SetID(CuotaID(id))
	base.SetMonto(f.qf.Assemble(int64(monto)))
	base.SetMes(mes)
	base.SetAnio(anio)
	base.SetAudit(audit.FullAudit[string]{
		CreatedAt: creado_en,
		CreatedBy: registrador,
		UpdatedAt: creado_en,
		UpdatedBy: registrador,
	})

	return &CuotaRegular{
		CuotaBase: *base,
	}
}

func (f *CuotaFactory) AssembleEspecial(
	id string,
	mes mes.Mes, anio, monto int,
	titulo string,
	descripcion string,
	justificacion string,
	estado string,
	fecha_limite time.Time,
	interes_por_mora int64,
	creado_en time.Time,
	actualizado_en time.Time,
	registrado_por, actualizado_por string,
) *CuotaEspecial {
	_proyecto := f.proyectoFactory.Assemble(
		titulo,
		descripcion,
		justificacion,
		parseEstado(estado),
		fecha_limite,
		interes_por_mora,
		creado_en,
		actualizado_en,
		registrado_por,
		actualizado_por,
	)

	base := new(CuotaBase)
	base.SetID(CuotaID(id))
	base.SetMonto(f.qf.Assemble(int64(monto)))
	base.SetMes(mes)
	base.SetAnio(anio)
	base.SetAudit(audit.FullAudit[string]{
		CreatedAt: creado_en,
		CreatedBy: registrado_por,
		UpdatedAt: creado_en,
		UpdatedBy: actualizado_por,
	})

	return &CuotaEspecial{
		CuotaBase: *base,
		Detalles:  *_proyecto,
	}
}

func parseEstado(s string) estadoproyecto.EstadoDeProyecto {
	switch s {
	case "BORRADOR":
		return estadoproyecto.BORRADOR
	case "PUBLICADO":
		return estadoproyecto.ACTIVO
	case "CERRADO":
		return estadoproyecto.CERRADO
	default:
		return estadoproyecto.BORRADOR
	}
}
