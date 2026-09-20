package gorm

import (
	"time"

	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota/estadoproyecto"
	"github.com/Sanaruca/condominio/internal/administracion/models/proveedor"
	"github.com/Sanaruca/condominio/internal/administracion/types/tipodecuota"
	"github.com/Sanaruca/condominio/internal/core/common/mes"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
)

type Recaudacion struct {
	Cuota              string
	Tipo               tipodecuota.TipoDeCuota
	Monto              int
	Mes                mes.Mes
	Anio               int
	Unidades           int
	UnidadesAplicadas  int `gorm:"column:unidades_aplicadas"`
	UnidadesSolventes  int `gorm:"column:unidades_solventes"`
	UnidadesPendientes int `gorm:"column:unidades_pendientes"`
	TotalEstimado      int
	Recaudado          int
	Pendiente          int
	PagosAsociados     int `gorm:"column:pagos_asociados"`
}

func (t Recaudacion) TableName() string {
	return "recaudacion"
}

func (r Recaudacion) ToDomainRecaudacion(qf *quantity.QuantityFactory) *cuota.Recaudacion {
	return &cuota.Recaudacion{
		Cuota:              cuota.CuotaID(r.Cuota),
		Tipo:               r.Tipo,
		Mes:                r.Mes,
		Anio:               r.Anio,
		MontoCuota:         qf.Assemble(int64(r.Monto)),
		MontoRecaudado:     qf.Assemble(int64(r.Recaudado)),
		MontoPendiente:     qf.Assemble(int64(r.Pendiente)),
		MontoEstimado:      qf.Assemble(int64(r.TotalEstimado)),
		Unidades:           r.Unidades,
		UnidadesAplicadas:  r.UnidadesAplicadas,
		UnidadesSolventes:  r.UnidadesSolventes,
		UnidadesPendientes: r.UnidadesPendientes,
		PagosAsociados:     r.PagosAsociados,
	}
}

type Proyecto struct {
	Titulo         string
	Cuota          string
	Estado         estadoproyecto.EstadoDeProyecto
	Descripcion    string
	Justificacion  string
	FechaLimite    time.Time
	InteresPorMora int `gorm:"column:interes_por_mora"`
	Registro       time.Time
	Actualizacion  time.Time
	RegistradoPor  string `gorm:"column:registrado_por"`
	ActualizadoPor string `gorm:"column:actualizado_por"`
}

func (p Proyecto) ToDomainProyecto(factory *cuota.ProyectoFactory) cuota.Proyecto {
	return *factory.Assemble(
		p.Titulo,
		p.Descripcion,
		p.Justificacion,
		p.Estado,
		p.FechaLimite,
		int64(p.InteresPorMora),
		p.Registro,
		p.Actualizacion,
		p.RegistradoPor,
		p.ActualizadoPor,
	)
}

type Proveedor struct {
	ID            string
	Rif           string
	Nombre        string
	Email         string
	Telefono      string
	Direccion     *string
	Registro      time.Time
	Actualizacion time.Time
}

func (t Proveedor) TableName() string {
	return "proveedores"
}

func (t Proveedor) ToDomainProveedor(factory *proveedor.ProveedorFactory) *proveedor.Proveedor {
	return factory.Assemble(
		t.ID,
		t.Rif,
		t.Nombre,
		t.Email,
		t.Telefono,
		t.Direccion,
		t.Registro,
		t.Actualizacion,
	)

}

type DestinoDePago struct {
	ID        string
	Operacion string
	Deuda     string
	Destinado int
	Fecha     time.Time
}
