package sujeto

import (
	"regexp"
	"strings"

	"github.com/Sanaruca/condominio/internal/core"
	"github.com/Sanaruca/condominio/internal/core/utils"
)

var nameRegex = regexp.MustCompile(`^[a-zA-Z\p{L}]+([ \-'][a-zA-Z\p{L}]+)*$`)

type Persona struct {
	sujeto
	nombres   string
	apellidos string
}

func (p Persona) Nombres() string   { return p.nombres }
func (p Persona) Apellidos() string { return p.apellidos }
func (p Persona) DisplayName() string {
	nombre := strings.Fields(p.nombres)
	apellido := strings.Fields(p.apellidos)
	return strings.TrimSpace(utils.SliceFirst(nombre) + " " + utils.SliceFirst(apellido))
}

func (p *Persona) SetNombres(nombres string) core.Error {

	if !nameRegex.MatchString(nombres) {
		return core.NewInvalidArgumentError("Nombre no es valido")
	}

	p.nombres = nombres

	return nil
}

func (p Persona) AsTitular() Titular   { return &titular{Sujeto: &p, contacto: p} }
func (p *Persona) AsPersona() *Persona { return p }
func (p Persona) AsEnte() *Ente        { return nil }
