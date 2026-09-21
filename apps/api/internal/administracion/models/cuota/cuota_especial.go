package cuota

type CuotaEspecial struct {
	CuotaBase
	Detalles Proyecto
}

func (c *CuotaEspecial) AsEspecial() *CuotaEspecial {
	return c
}

func (c *CuotaEspecial) AsRegular() *CuotaRegular {
	return nil
}

func (c *CuotaEspecial) AsSemilla() *CuotaSemilla {
	return nil
}
