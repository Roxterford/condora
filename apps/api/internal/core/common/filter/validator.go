package filter

import (
	"fmt"
	"math"
	"reflect"

	"github.com/Sanaruca/condominio/internal/core/lib/logger"
)

// Validator verifica que el árbol cumpla con el Spec
type Validator struct {
	FilterSpec Spec
}

func NewValidator(filterSpec Spec) *Validator {
	return &Validator{filterSpec}
}

func (v *Validator) Validate(root Clause) error {
	logger.Debug("Validando filtro")
	if root == nil {
		return nil
	}
	if v.FilterSpec.IsEmpty() {
		return fmt.Errorf("especificación de filtro vacía")
	}
	return root.Accept(v)
}

func (v *Validator) VisitLogical(clause *LogicalClause) error {
	if len(clause.Children) == 0 {
		return fmt.Errorf("operador lógico '%s' vacío", clause.Operator)
	}
	for _, child := range clause.Children {
		if err := child.Accept(v); err != nil {
			return err
		}
	}
	return nil
}

func (v *Validator) VisitPredicate(clause *PredicateClause) error {
	// 1. Validar si el campo existe en el Spec
	expectedType, exists := v.FilterSpec[clause.Field]
	if !exists {
		return fmt.Errorf("campo no permitido: '%s'", clause.Field)
	}

	// 2. Validar que null solo se use con eq/neq (IS NULL / IS NOT NULL)
	if clause.Value == nil && clause.Condition != CONDITON_EQ && clause.Condition != CONDITON_NEQ {
		return fmt.Errorf("campo '%s': null solo es válido con eq/neq", clause.Field)
	}

	// 2b. Validar que los valores de lista solo se usen con la condición IN
	if isListValue(clause.Value) && clause.Condition != CONDITON_IN {
		return fmt.Errorf("campo '%s': los valores de lista solo son válidos con la condición 'in'", clause.Field)
	}

	// 3. Validar que la condición sea compatible con el tipo (Lógica simplificada)
	if err := validateConditionForType(clause.Condition, expectedType); err != nil {
		return fmt.Errorf("campo '%s': %w", clause.Field, err)
	}

	// 4. Validar que el valor sea del tipo correcto
	if err := validateValueType(clause.Value, expectedType); err != nil {
		return fmt.Errorf("campo '%s': valor inválido: %w", clause.Field, err)
	}

	return nil
}

// Helpers de validación (Desacoplados)

func validateConditionForType(cond Condition, t ValueType) error {
	// Aquí puedes usar un mapa estático o switch, pero mantenlo simple
	switch t {
	case TypeString:
		switch cond {
		case CONDITON_EQ, CONDITON_NEQ, CONDITON_LIKE, CONDITON_ILIKE, CONDITON_IN:
			return nil
		default:
			return fmt.Errorf("condición '%s' no soportada para String", cond)
		}
	case TypeInt, TypeFloat:
		switch cond {
		case CONDITON_EQ,
			CONDITON_NEQ,
			CONDITON_GT,
			CONDITON_LT,
			CONDITON_GTE,
			CONDITON_LTE,
			CONDITON_IN:
			return nil
		default:
			return fmt.Errorf("condición '%s' no soportada para Numéricos", cond)
		}
	case TypeBool:
		if cond != CONDITON_EQ && cond != CONDITON_NEQ {
			return fmt.Errorf("bool solo soporta eq/neq")
		}
	}
	return nil
}

func validateValueType(val any, expected ValueType) error {
	if val == nil {
		return nil
	}

	// Soporta valores de lista (condición IN): valida cada elemento contra el tipo esperado.
	if rv := reflect.ValueOf(val); rv.Kind() == reflect.Slice || rv.Kind() == reflect.Array {
		for i := 0; i < rv.Len(); i++ {
			if err := validateValueType(rv.Index(i).Interface(), expected); err != nil {
				return fmt.Errorf("elemento %d: %w", i, err)
			}
		}
		return nil
	}

	switch v := val.(type) {
	case string:
		if expected != TypeString {
			return fmt.Errorf("se esperaba %s, se recibió string", expected)
		}
		return nil

	case int, int32, int64:
		if expected != TypeInt && expected != TypeFloat {
			return fmt.Errorf("se esperaba numérico, se recibió entero")
		}
		return nil

	case float32, float64:
		// Nota Crítica: JSON decodifica números como float64 por defecto.
		// Debemos ser flexibles si esperamos un Int pero recibimos un float sin decimales (ej: 10.0).
		if expected == TypeInt {
			// Verificamos si es un entero disfrazado de float
			fVal := v.(float64)
			if fVal != math.Trunc(fVal) {
				return fmt.Errorf("se esperaba int, se recibió float con decimales")
			}
		} else if expected != TypeFloat {
			return fmt.Errorf("se esperaba %s, se recibió float", expected)
		}
		return nil

	case bool:
		if expected != TypeBool {
			return fmt.Errorf("se esperaba %s, se recibió bool", expected)
		}
		return nil

	default:
		return fmt.Errorf("tipo de dato no soportado o desconocido: %T", v)
	}
}

// isListValue reporta si el valor es un slice/array (usado por la condición IN).
func isListValue(val any) bool {
	if val == nil {
		return false
	}
	rv := reflect.ValueOf(val)
	return rv.Kind() == reflect.Slice || rv.Kind() == reflect.Array
}
