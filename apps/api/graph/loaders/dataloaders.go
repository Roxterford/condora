package loaders

import (
	"context"
	"net/http"
	"time"

	"github.com/Sanaruca/condominio/graph/model"
	"github.com/Sanaruca/condominio/internal/core/common/quantity"
	"github.com/vikstrous/dataloadgen"
	"gorm.io/gorm"
)

type ctxKey string

const (
	loadersKey = ctxKey("dataloaders")
)

type Loaders struct {
	Unidad            *dataloadgen.Loader[string, *model.Unidad]
	UnidadIdentifiers *dataloadgen.Loader[string, *model.UnidadIdentifiers]
	Recaudacion       *dataloadgen.Loader[string, *model.Recaudacion]
}

func NewLoaders(db *gorm.DB, quantityFactory *quantity.QuantityFactory) *Loaders {
	if quantityFactory == nil {
		panic("quantityFactory is nil")
	}
	// define the data loader
	ur := &unidadReader{db: db, qf: quantityFactory}
	rr := &recaudacionReader{db: db, qf: quantityFactory}
	return &Loaders{
		Unidad: dataloadgen.NewLoader(
			ur.getUnidades,
			dataloadgen.WithWait(time.Millisecond),
		),
		UnidadIdentifiers: dataloadgen.NewLoader(
			ur.getIdentifiers,
			dataloadgen.WithWait(time.Millisecond),
		),
		Recaudacion: dataloadgen.NewLoader(
			rr.getRecaudaciones,
			dataloadgen.WithWait(time.Millisecond),
		),
	}
}

func Middleware(
	db *gorm.DB,
	quantityFactory *quantity.QuantityFactory,
	next http.Handler,
) http.Handler {
	// return a middleware that injects the loader to the request context
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		loader := NewLoaders(db, quantityFactory)
		r = r.WithContext(context.WithValue(r.Context(), loadersKey, loader))
		next.ServeHTTP(w, r)
	})
}

func For(ctx context.Context) *Loaders {
	return ctx.Value(loadersKey).(*Loaders)
}
