DROP VIEW IF EXISTS gastos CASCADE;
CREATE VIEW gastos AS
SELECT
  o.id AS operacion,
  COALESCE(bo.transaccion_id, NULL) AS transaccion,
  o.tipo,
  o.rol,
  o.monto,
  o.cuota,
  o.unidad_codigo,
  o.proveedor,
  o.concepto,
  o.fecha,
  o.monto AS total,
  o.moneda,
  o.metodo,
  o.tasa,
  o.registro
FROM operaciones o
LEFT JOIN transaccion_operaciones bo ON bo.operacion_id = o.id
WHERE o.tipo = 'DEBITO';
