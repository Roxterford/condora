package httprouter

import (
	"net/http"

	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gorm.io/gorm"

	"github.com/Sanaruca/condominio/graph/loaders"
	gormAdapter "github.com/Sanaruca/condominio/internal/core/adapters/gorm"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
)

// Server agrupa las dependencias necesarias para registrar las rutas HTTP.
type Server struct {
	db          *gorm.DB
	outboxStore *gormAdapter.GormOutboxEventStore
	graphQL     http.Handler
	qf          *quantity.QuantityFactory
}

func NewServer(
	db *gorm.DB,
	outboxStore *gormAdapter.GormOutboxEventStore,
	quantityFactory *quantity.QuantityFactory,
	graphQL http.Handler,
) *Server {
	return &Server{
		db:          db,
		outboxStore: outboxStore,
		graphQL:     graphQL,
		qf:          quantityFactory,
	}
}

// Handler registra todas las rutas HTTP de la aplicación.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	// --- Health ---
	mux.HandleFunc("/health/live", handleHealthLive)
	mux.HandleFunc("/health/ready", s.handleHealthReady)

	// --- Metrics ---
	mux.Handle("/metrics", promhttp.Handler())

	// --- Admin Outbox (requieren auth) ---
	adminMux := http.NewServeMux()
	adminMux.Handle("/outbox/stats", s.chain(s.handleOutboxStats))
	adminMux.Handle("/outbox/pending", s.chain(s.handleOutboxPending))
	adminMux.Handle("/outbox/dlq", s.chain(s.handleOutboxDLQ))
	adminMux.Handle("/outbox/dlq/retry", s.chain(s.handleOutboxDlqRetry))
	mux.Handle("/admin/", http.StripPrefix("/admin", adminMux))

	// --- GraphQL ---
	mux.Handle("/", playground.Handler("GraphQL playground", "/query"))
	mux.Handle(
		"/query",
		correlationMiddleware(
			corsMiddleware(
				authMiddleware(
					loaders.Middleware(s.db, s.qf, s.graphQL),
				),
			)),
	)

	return mux
}

// chain aplica correlation, cors y auth en orden a un handler.
func (s *Server) chain(h http.HandlerFunc) http.Handler {
	return correlationMiddleware(corsMiddleware(authMiddleware(h)))
}
