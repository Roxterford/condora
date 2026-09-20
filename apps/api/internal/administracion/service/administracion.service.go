package service

import (
	"github.com/Sanaruca/condominio/internal/administracion/app"
	"github.com/Sanaruca/condominio/internal/administracion/app/command"
	"github.com/Sanaruca/condominio/internal/administracion/app/query"
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota/distribucion"
	"github.com/Sanaruca/condominio/internal/administracion/models/deuda"
	"github.com/Sanaruca/condominio/internal/administracion/models/periododisponible"
	"github.com/Sanaruca/condominio/internal/administracion/models/proveedor"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/finanzas/models/operacion"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
)

type AdministracionService struct {
	Queries  app.Queries
	Commands app.Commands
}

func New(
	proveedorRepository proveedor.ProveedorRepository,
	cuotaRepository cuota.CuotaRepository,
	recaudacionFinder cuota.RecaudacionFinder,
	proveedorFactory *proveedor.ProveedorFactory,
	emailFactory *common.EmailFactory,
	phoneFactory *common.PhoneFactory,
	cuotaFactory *cuota.CuotaFactory,
	operacionRepository operacion.OperacionRepository,
	uow common.UnitOfWork[command.CuotaUoWDeps],
	deudaFactory *deuda.DeudaFactory,
	facturacionPolicy unidad.FacturacionPolicy,
	estrategiaDistribucion distribucion.EstrategiaDeDistribucion,
) *AdministracionService {

	registrarProveedor := command.NewRegistrarProveedor(
		proveedorRepository,
		proveedorFactory,
		emailFactory,
		phoneFactory,
	)

	return &AdministracionService{
		Queries: app.Queries{
			ObtenerProveedor:   query.NewObtenerProveedor(proveedorRepository),
			ObtenerProveedores: query.NewObtenerProveedores(proveedorRepository),
			ObtenerCuotas:      query.NewObtenerCuotas(cuotaRepository),
			ObtenerCuota:       query.NewObtenerCuota(cuotaRepository),
			ObtenerRecaudacion: query.NewObtenerRecaudacion(recaudacionFinder),
			ObtenerPeriodosDisponibles: query.NewObtenerPeriodosDisponibles(
				cuotaRepository,
				periododisponible.NuevaCalculadoraDePeriodos(),
			),
		},
		Commands: app.Commands{
			RegistrarProveedor: registrarProveedor,
			EliminarProveedor:  command.NewEliminarProveedor(proveedorRepository),
			RegistrarCuota: command.NewRegistrarCuotaRegular(
				cuotaRepository,
				operacionRepository,
				cuotaFactory,
				uow,
				deudaFactory,
				facturacionPolicy,
				estrategiaDistribucion,
			),
		},
	}
}
