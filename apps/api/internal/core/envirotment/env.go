package envirotment

import (
	"fmt"
	"os"
	"strings"
)

type AppEnv string

const (
	Dev AppEnv = "development"
	Stg AppEnv = "staging"
	Prd AppEnv = "production"
)

var app_env_aliases map[string]AppEnv = map[string]AppEnv{
	"dev":         Dev,
	"stg":         Stg,
	"prd":         Prd,
	"prod":        Prd,
	"development": Dev,
	"staging":     Stg,
	"production":  Prd,
}

const (
	// ENV
	APP_ENV = "APP_ENV"

	// APP
	SECRET_KEY        = "SECRET_KEY"
	MAIL_PORT         = "MAIL_PORT"
	MAIL_HOST         = "MAIL_HOST"
	MAIL_FROM_ADDRESS = "MAIL_FROM_ADDRESS"
	MAIL_PASSWORD     = "MAIL_PASSWORD"

	// DATABASE

	DATABASE_HOST     = "DATABASE_HOST"
	DATABASE_USER     = "DATABASE_USER"
	DATABASE_PASSWORD = "DATABASE_PASSWORD"
	DATABASE_PORT     = "DATABASE_PORT"
	DATABASE_DATABASE = "DATABASE_DATABASE"
	DATABASE_URL      = "DATABASE_URL"

	// REDIS

	REDIS_URL      = "REDIS_URL"
	REDIS_HOST     = "REDIS_HOST"
	REDIS_PORT     = "REDIS_PORT"
	REDIS_PASSWORD = "REDIS_PASSWORD"
	REDIS_DB       = "REDIS_DB"

	// EMISION DE CUOTAS
	MAX_MESES_FUTURO_CUOTA = "MAX_MESES_FUTURO_CUOTA"

	// CORS
	CORS_ALLOWED_ORIGINS = "CORS_ALLOWED_ORIGINS"
)

// corsOriginsSeparator delimita los origins permitidos en CORS_ALLOWED_ORIGINS.
const corsOriginsSeparator = ";"

// defaultCorsAllowedOrigins son los origins usados cuando CORS_ALLOWED_ORIGINS no esta definida.
var defaultCorsAllowedOrigins = []string{
	"http://localhost:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:3001",
	"http://localhost:4000",
	"http://localhost:4001",
	"http://127.0.0.1:4000",
	"http://127.0.0.1:4001",
}

// GetCorsAllowedOrigins devuelve los origins permitidos por CORS, separados por ';'
// en la variable de entorno. Si no hay valor configurado, devuelve los origins de desarrollo.
func GetCorsAllowedOrigins() []string {
	raw := os.Getenv(CORS_ALLOWED_ORIGINS)
	if strings.TrimSpace(raw) == "" {
		return defaultCorsAllowedOrigins
	}

	parts := strings.Split(raw, corsOriginsSeparator)
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return defaultCorsAllowedOrigins
	}

	return origins
}

const DefaultMaxMesesFuturoCuota = 1

func GetMaxMesesFuturoCuota() int {
	v := os.Getenv(MAX_MESES_FUTURO_CUOTA)
	if v == "" {
		return DefaultMaxMesesFuturoCuota
	}
	var n int
	if _, err := fmt.Sscanf(v, "%d", &n); err != nil || n < 0 {
		return DefaultMaxMesesFuturoCuota
	}
	return n
}

func Get(key string) string {
	return os.Getenv(key)
}

func GetSecretKey() string {
	return os.Getenv(SECRET_KEY)
}

func GetAppEnv() AppEnv {

	app_env := os.Getenv(APP_ENV)

	if app_env_alias, ok := app_env_aliases[app_env]; ok {
		return app_env_alias
	}

	return Dev
}
