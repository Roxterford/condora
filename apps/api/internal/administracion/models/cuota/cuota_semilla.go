package cuota

type CuotaSemilla struct {
	CuotaBase
}

func (c *CuotaSemilla) AsSemilla() *CuotaSemilla {
	return c
}

func (c *CuotaSemilla) AsRegular() *CuotaRegular {
	return nil
}

func (c *CuotaSemilla) AsEspecial() *CuotaEspecial {
	return nil
}
