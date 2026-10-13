package filter

// Operator define operadores lógicos
type LogicalOperator string

const (
	OPERATOR_AND LogicalOperator = "and"
	OPERATOR_OR  LogicalOperator = "or"
	OPERATOR_NOT LogicalOperator = "not"
)

// Condition define comparadores
type Condition string

const (
	CONDITON_EQ    Condition = "eq"
	CONDITON_NEQ   Condition = "neq"
	CONDITON_GT    Condition = "gt"
	CONDITON_GTE   Condition = "gte"
	CONDITON_LT    Condition = "lt"
	CONDITON_LTE   Condition = "lte"
	CONDITON_LIKE  Condition = "like"
	CONDITON_ILIKE Condition = "ilike"
	CONDITON_IN    Condition = "in"
	// ... agregar otros según necesidad
)

// ValueType define los tipos de datos soportados por el dominio
type ValueType string

const (
	TypeString  ValueType = "string"
	TypeInt     ValueType = "int"
	TypeFloat   ValueType = "float"
	TypeBool    ValueType = "bool"
	TypeDate    ValueType = "date"
	TypeUnknown ValueType = "unknown"
)

// // FilterSpec define el esquema permitido para un struct
// type FilterSpec map[string]ValueType
