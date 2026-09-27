package sql_test

import (
	"context"
	"testing"

	"github.com/Sanaruca/condominio/internal/core/common/filter"
	"github.com/Sanaruca/condominio/internal/core/common/filter/sql"
)

func build(t *testing.T, root filter.Clause, opts ...sql.SQLBuilderOption) (string, []any) {
	t.Helper()
	s, args, err := sql.NewSQLBuilder(opts...).Build(root)
	if err != nil {
		t.Fatalf("Build() error = %v", err)
	}
	return s, args
}

func pred(field string, cond filter.Condition, value any) *filter.PredicateClause {
	return &filter.PredicateClause{Field: field, Condition: cond, Value: value}
}

// PostgreSQL pliega los identificadores sin comillas a minúsculas, así que todas
// las columnas deben salir entrecomilladas.
func TestBuild_QuoteaCadaParteDelIdentificador(t *testing.T) {
	tests := []struct {
		name  string
		root  filter.Clause
		alias map[string][]string
		want  string
	}{
		{
			name: "columna simple",
			root: pred("codigo", filter.CONDITON_EQ, "villa-1"),
			want: `"codigo" = ?`,
		},
		{
			name: "alias GORM con mayusculas",
			root: pred("cuota", filter.CONDITON_EQ, "c-1"),
			alias: map[string][]string{
				"cuota": {`Cuota__id`},
			},
			want: `"Cuota__id" = ?`,
		},
		{
			name: "ruta tabla.columna",
			root: pred("codigo", filter.CONDITON_EQ, "villa-1"),
			alias: map[string][]string{
				"codigo": {`Unidad.codigo`},
			},
			want: `"Unidad"."codigo" = ?`,
		},
		{
			// Regresión: se aplicaba quoteIdentifier dos veces (una en
			// writeColumnPredicate y otra en handleInCondition) y GORM terminaba
			// ejecutando WHERE """id""" IN (...), que en PostgreSQL es 42703.
			name: "IN cita la columna una sola vez",
			root: pred("id", filter.CONDITON_IN, []any{"a", "b"}),
			want: `"id" IN (?, ?)`,
		},
		{
			name: "IN con alias",
			root: pred("id", filter.CONDITON_IN, []any{"a"}),
			alias: map[string][]string{
				"id": {`Cuota__id`},
			},
			want: `"Cuota__id" IN (?)`,
		},
		{
			name: "IS NULL",
			root: pred("cuota", filter.CONDITON_EQ, nil),
			want: `"cuota" IS NULL`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			opts := []sql.SQLBuilderOption{sql.WithContext(context.Background())}
			if tt.alias != nil {
				opts = append(opts, sql.WithFieldAlias(tt.alias))
			}
			got, _ := build(t, tt.root, opts...)
			if got != tt.want {
				t.Errorf("Build() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestBuild_AliasMultipleSeUneConOR(t *testing.T) {
	root := pred("estado", filter.CONDITON_EQ, "PENDIENTE")

	got, _ := build(t, root,
		sql.WithContext(context.Background()),
		sql.WithFieldAlias(map[string][]string{
			"estado": {`deudas.estado`, `"Estado"`},
		}),
	)

	want := `("deudas"."estado" = ? OR """Estado""" = ?)`
	if got != want {
		t.Errorf("Build() = %q, want %q", got, want)
	}
}

func TestBuild_ColegillaYEscapeDeComillas(t *testing.T) {
	root := pred("unidad", filter.CONDITON_EQ, "villa-1")

	got, _ := build(t, root,
		sql.WithContext(context.Background()),
		sql.WithFieldAlias(map[string][]string{
			"unidad": {`"Mi Unidad".codigo`},
		}),
	)

	// Una comilla interna se escapa duplicándola, para que un alias que ya
	// venía entrecomillado siga siendo un identificador válido.
	want := `"""Mi Unidad"""."codigo" = ?`
	if got != want {
		t.Errorf("Build() = %q, want %q", got, want)
	}
}

func TestBuild_PropagaArgumentos(t *testing.T) {
	root := &filter.LogicalClause{
		Operator: filter.OPERATOR_AND,
		Children: []filter.Clause{
			pred("codigo", filter.CONDITON_EQ, "villa-1"),
			pred("id", filter.CONDITON_IN, []any{"a", "b"}),
		},
	}

	got, args := build(t, root, sql.WithContext(context.Background()))

	want := `("codigo" = ? AND "id" IN (?, ?))`
	if got != want {
		t.Errorf("Build() = %q, want %q", got, want)
	}
	if len(args) != 3 {
		t.Fatalf("len(args) = %d, want 3 (%v)", len(args), args)
	}
	if args[0] != "villa-1" {
		t.Errorf("args[0] = %v, want villa-1", args[0])
	}
}

func TestBuild_NilDevuelveVacio(t *testing.T) {
	s, args := build(t, nil, sql.WithContext(context.Background()))
	if s != "" || args != nil {
		t.Errorf("Build(nil) = (%q, %v), want (\"\", nil)", s, args)
	}
}
