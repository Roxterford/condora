package common

import (
	"fmt"
	"strings"

	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/exception"
)

const (
	DEFAULT_PHONE_SUBSCRIBER_LENGTH = 6
)

var (
	ErrInvalidPhoneFormat = exception.New(
		exception.INVALID_ARGUMENT,
		"formato de teléfono inválido",
	)
	ErrMissingPlusSign = exception.New(
		exception.INVALID_ARGUMENT,
		"el teléfono debe comenzar con el signo +",
	)
	ErrPhoneTooShort = exception.New(
		exception.INVALID_ARGUMENT,
		"el teléfono es demasiado corto",
	)
	ErrPhoneContainsNonDigits = exception.New(
		exception.INVALID_ARGUMENT,
		"el teléfono solo puede contener dígitos después del +",
	)
	ErrInvalidCountryCode  = exception.New(exception.INVALID_ARGUMENT, "código de país inválido")
	ErrInvalidProviderCode = exception.New(
		exception.INVALID_ARGUMENT,
		"código de proveedor inválido",
	)
	ErrInvalidSubscriberNumber = exception.New(
		exception.INVALID_ARGUMENT,
		"número de suscriptor inválido",
	)
	ErrSubscriberTooShort = exception.New(
		exception.INVALID_ARGUMENT,
		"el número de suscriptor es demasiado corto",
	)
	ErrSubscriberContainsNonDigits = exception.New(
		exception.INVALID_ARGUMENT,
		"el número de suscriptor solo puede contener dígitos",
	)
	ErrCountryNotAllowed  = exception.New(exception.INVALID_ARGUMENT, "país no permitido")
	ErrProviderNotAllowed = exception.New(exception.INVALID_ARGUMENT, "proveedor no permitido")
)

// PhoneFactory es una fabrica que valida y construye objetos Phone
type PhoneFactory struct {
	allowed_countries map[string]bool
	allowed_providers map[string]bool // Opcional
}

func NewPhoneFactory(countries []string, providers []string) *PhoneFactory {
	cMap := make(map[string]bool)
	for _, c := range countries {
		cMap[c] = true
	}
	pMap := make(map[string]bool)
	for _, p := range providers {
		pMap[p] = true
	}
	return &PhoneFactory{
		allowed_countries: cMap,
		allowed_providers: pMap,
	}
}

func (f *PhoneFactory) New(raw string) (Phone, core.Error) {
	clean := strings.ReplaceAll(raw, " ", "")

	// Validar que comience con +
	if !strings.HasPrefix(clean, "+") {
		return Phone{}, ErrMissingPlusSign
	}

	// Remover el + y validar que solo contenga dígitos
	number := clean[1:]
	if len(number) == 0 {
		return Phone{}, ErrPhoneTooShort
	}

	// Validar que todos los caracteres sean dígitos
	for _, digit := range number {
		if digit < '0' || digit > '9' {
			return Phone{}, ErrPhoneContainsNonDigits
		}
	}

	// Extraer las partes: país (2-3 dígitos), proveedor (3 dígitos), suscriptor (resto)
	if len(number) < 8 { // mínimo: 2+3+3
		return Phone{}, ErrPhoneTooShort
	}

	// Determinar longitud del código de país (2 o 3 dígitos)
	cc_len := 2
	if len(number) >= 10 && number[0:2] == "1" { // países como 1-XXX
		cc_len = 3
	}

	cc := number[0:cc_len]
	prov := number[cc_len : cc_len+3]
	sub := number[cc_len+3:]

	// Validar que el suscriptor no esté vacío
	if len(sub) == 0 {
		return Phone{}, ErrInvalidSubscriberNumber
	}

	// Validar longitud mínima del suscriptor
	if len(sub) < DEFAULT_PHONE_SUBSCRIBER_LENGTH {
		return Phone{}, ErrSubscriberTooShort
	}

	// Validar país
	if len(f.allowed_countries) > 0 && !f.allowed_countries[cc] {
		return Phone{}, ErrCountryNotAllowed
	}

	// Validar proveedor (opcional)
	if len(f.allowed_providers) > 0 && !f.allowed_providers[prov] {
		return Phone{}, ErrProviderNotAllowed
	}

	return Phone{
		country_code: cc,
		provider:     prov,
		subscriber:   sub,
	}, nil
}

type Phone struct {
	country_code string // ej: "58"
	provider     string // ej: "414"
	subscriber   string // ej: "1234567"
}

func (p Phone) CountryCode() string { return p.country_code }
func (p Phone) Provider() string    { return p.provider }
func (p Phone) Subscriber() string  { return p.subscriber }

// FullNumber devuelve el número completo con el signo +
func (p Phone) FullNumber() string {
	return fmt.Sprintf("+%s%s%s", p.country_code, p.provider, p.subscriber)
}

func (p Phone) String() string {
	return p.FullNumber()
}

func (f *PhoneFactory) Assemble(raw string) Phone {
	clean := strings.ReplaceAll(raw, " ", "")
	if !strings.HasPrefix(clean, "+") || len(clean) < 6 {
		return Phone{}
	}
	number := clean[1:]
	cc_len := 2
	cc := number[0:cc_len]
	prov := number[cc_len : cc_len+3]
	sub := number[cc_len+3:]

	return Phone{
		country_code: cc,
		provider:     prov,
		subscriber:   sub,
	}
}
