DROP VIEW IF EXISTS pagos;
CREATE VIEW pagos AS SELECT
	o.id AS operacion,
	o.unidad_id,
	o.unidad_codigo,
	o.fecha,
  	o.concepto,
  	o.monto,
  	o.moneda,
  	o.metodo,
  	o.tasa,
  	o.registrado_por,
  	o.registro
FROM operaciones o 
WHERE o.tipo = 'CREDITO';