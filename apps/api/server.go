package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/doganarif/govisual"
	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"github.com/vektah/gqlparser/v2/ast"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"

	"github.com/Sanaruca/condominio/graph"
	httprouter "github.com/Sanaruca/condominio/http"
	administracionGORM "github.com/Sanaruca/condominio/internal/administracion/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/administracion/app/command"
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota"
	"github.com/Sanaruca/condominio/internal/administracion/models/cuota/distribucion"
	"github.com/Sanaruca/condominio/internal/administracion/models/deuda"
	"github.com/Sanaruca/condominio/internal/administracion/models/proveedor"
	administracionService "github.com/Sanaruca/condominio/internal/administracion/service"
	gormAdapter "github.com/Sanaruca/condominio/internal/core/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/core/common"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	"github.com/Sanaruca/condominio/internal/core/envirotment"
	appLogger "github.com/Sanaruca/condominio/internal/core/lib/logger"
	transaccionesGorm "github.com/Sanaruca/condominio/internal/finanzas/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/finanzas/models/operacion"
	transaccionService "github.com/Sanaruca/condominio/internal/finanzas/service"
	"github.com/Sanaruca/condominio/internal/services/tasa"
	tasaCache "github.com/Sanaruca/condominio/internal/services/tasa/adapters/cache"
	tasaDolarAPI "github.com/Sanaruca/condominio/internal/services/tasa/adapters/dolarapi"
	tasaHybrid "github.com/Sanaruca/condominio/internal/services/tasa/adapters/hybrid"
	tasaLocal "github.com/Sanaruca/condominio/internal/services/tasa/adapters/local"
	sistemaService "github.com/Sanaruca/condominio/internal/sistema/service"
	unidadesGorm "github.com/Sanaruca/condominio/internal/unidades/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/unidades/models/sujeto"
	"github.com/Sanaruca/condominio/internal/unidades/models/unidad"
	unidadesService "github.com/Sanaruca/condominio/internal/unidades/service"
	"github.com/Sanaruca/condominio/internal/usuarios"
	usuariosGorm "github.com/Sanaruca/condominio/internal/usuarios/adapters/gorm"
	usuarioService "github.com/Sanaruca/condominio/internal/usuarios/service"
)

const defaultPort = "8081"
const defaultDecimalPlaces = quantity.DEFAULT_SCALE

func main() {
	// Initialize structured logger
	appLogger.Init()

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	db := setupDB()

	// AutoMigrate outbox events table
	if err := db.AutoMigrate(&gormAdapter.OutboxEvent{}); err != nil {
		appLogger.LegacyError(err)
	}
	if err := db.AutoMigrate(&gormAdapter.OutboxDLQ{}); err != nil {
		appLogger.LegacyError(err)
	}

	// Outbox Event Store (solo para inspección manual; publicación desenchufada)
	outboxStore := gormAdapter.NewGormOutboxEventStore(db)

	// Factories
	emailFactory := common.NewEmailFactory([]string{})
	phoneFactory := common.NewPhoneFactory([]string{"58"}, []string{})
	quantityFactory := quantity.NewFactory(defaultDecimalPlaces)
	cuotaFactory := cuota.NewCuotaFactory(cuota.NewProyectoFactory(), quantityFactory)
	unidadFactory := unidad.NewUnidadFactory(quantityFactory)
	sujetoFactory := sujeto.NewSujetoFactory(emailFactory, phoneFactory)
	proveedorFactory := proveedor.NewProveedorFactory(
		common.NewEmailFactory([]string{}),
		common.NewPhoneFactory([]string{}, []string{}),
	)
	operacionFactory := operacion.NewOperacionFactory()

	// Repositories
	usuarioRepository := usuariosGorm.NewUsuarioGORMRepository(db, usuarios.NewFactory())
	unidadRepository := unidadesGorm.NewGORMUnidadRepository(db, unidadFactory, sujetoFactory)
	sujetoRepository := unidadesGorm.NewSujetoRepository(db, sujetoFactory)
	proveedorRepository := administracionGORM.NewGORMProveedorRepository(db, proveedorFactory)
	deudaFactory := deuda.NewDeudaFactory(quantityFactory)
	deudaRepository := administracionGORM.NewGORMDeudaRepository(
		db,
		deudaFactory,
		quantityFactory,
		sujetoFactory,
	)
	recaudacionFinder := administracionGORM.NewGROMRecaudacionFinder(db, quantityFactory)
	gastosFinder := transaccionesGorm.NewGORMGastoFinder(db, quantityFactory, proveedorFactory)

	tasaLocalRepository := tasaLocal.NewGormLocalTasaRepository(db)
	tasaDolarAPIRepository := tasaDolarAPI.NewDolarAPITasaRepository()
	tasaRepository := tasaHybrid.NewHybridTasaRepository(
		tasaLocalRepository,
		[]tasa.TasaRepository{tasaDolarAPIRepository},
	)
	tasaCacheRepository := tasaCache.NewGormTasaCacheRepository(db)
	cuotaRepository := administracionGORM.NewGORMCuotaRepository(db, cuotaFactory)
	operacionRepository := transaccionesGorm.NewGORMOperacionRepository(
		db,
		quantityFactory,
		operacionFactory,
	)

	// UnitOfWork
	cuotaUoW := administracionGORM.NewGormUnitOfWork(
		db,
		func(tx *gorm.DB) command.CuotaUoWDeps {
			return command.CuotaUoWDeps{
				Cuotas: administracionGORM.NewGORMCuotaRepository(tx, cuotaFactory),
				Operaciones: transaccionesGorm.NewGORMOperacionRepository(
					tx,
					quantityFactory,
					operacionFactory,
				),
				Unidades: unidadesGorm.NewGORMUnidadRepository(tx, unidadFactory, sujetoFactory),
				Deudas: administracionGORM.NewGORMDeudaRepository(
					tx,
					deudaFactory,
					quantityFactory,
					sujetoFactory,
				),
			}
		},
	)

	// Services
	tasaService := tasa.NewTasaService(tasaRepository, tasaCacheRepository)

	administracionService := administracionService.New(
		proveedorRepository,
		cuotaRepository,
		recaudacionFinder,
		proveedorFactory,
		emailFactory,
		phoneFactory,
		cuotaFactory,
		operacionRepository,
		cuotaUoW,
		deudaFactory,
		unidad.NewFacturacionPolicyPorDefecto(),
		distribucion.NuevaEstrategiaDistribucionLineal(),
	)

	transaccionServiceInstance := transaccionService.New(
		operacionRepository,
		gastosFinder,
		operacionFactory,
		unidadRepository,
		quantityFactory,
		nil, // outbox desenchufado: los eventos ya no se persisten ni publican
	)

	srv := handler.New(
		graph.NewExecutableSchema(
			graph.Config{Resolvers: graph.NewResolver(usuarioService.New(usuarioRepository),
				administracionService,
				unidadesService.NewUnidadesService(
					unidadRepository,
					sujetoRepository,
					deudaRepository,
					unidadFactory,
					sujetoFactory,
					emailFactory,
					phoneFactory,
				),
				sistemaService.New(tasaService),
				transaccionServiceInstance,
				quantityFactory,
				db,
			)},
		),
	)
	srv.SetErrorPresenter(graph.ErrorPresenter)

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})

	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))

	srv.Use(extension.Introspection{})
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	handler := httprouter.NewServer(db, outboxStore, quantityFactory, srv).Handler()

	if envirotment.GetAppEnv() == envirotment.Dev {
		handler = govisual.Wrap(
			handler,
			govisual.WithRequestBodyLogging(true),
			govisual.WithResponseBodyLogging(true),
			govisual.WithIgnorePaths(
				"/api/worker/health",
				"/health/live",
				"/health/ready",
				"/metrics",
			),
		)
	}

	// Graceful shutdown
	server := &http.Server{
		Addr:    ":" + port,
		Handler: handler,
	}

	go func() {
		appLogger.Infof("starting server on port %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			appLogger.Fatalf("server failed: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	appLogger.Info("shutting down server...")

	// Shutdown HTTP server with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		appLogger.Fatalf("server forced to shutdown: %v", err)
	}

	appLogger.Info("server exited gracefully")
}

func findProjectRoot() string {
	cwd, _ := os.Getwd()
	dir := cwd
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(filepath.Join(dir, ".env")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return cwd
}

func setupDB() *gorm.DB {
	dsn := envirotment.Get(envirotment.DATABASE_URL)
	if dsn == "" {
		panic("DATABASE_URL is not set")
	}

	// Resolve relative SQLite paths against project root (where .env lives)
	if strings.HasPrefix(dsn, "file:./") {
		dsn = "file:" + filepath.Join(findProjectRoot(), dsn[6:])
	}

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		Logger:         gormLogger.Default.LogMode(gormLogger.Info),
		TranslateError: true,
	})
	if err != nil {
		panic("failed to connect database: " + err.Error())
	}

	return db
}

func init() {
	godotenv.Load("../../.env")
	godotenv.Load("../.env")
}
