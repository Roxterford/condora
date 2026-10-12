package cuota

import "fmt"

type CuotaRegular struct {
	CuotaBase
}

func (c *CuotaRegular) DisplayName() string {
	return fmt.Sprintf("%s %d", c.Mes().String(), c.anio)
}

func (c *CuotaRegular) AsRegular() *CuotaRegular {
	return c
}

func (c *CuotaRegular) AsEspecial() *CuotaEspecial {
	return nil
}

func (c *CuotaRegular) AsSemilla() *CuotaSemilla {
	return nil
}
