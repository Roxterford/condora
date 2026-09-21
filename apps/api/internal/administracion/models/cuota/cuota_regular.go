package cuota

type CuotaRegular struct {
	CuotaBase
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
