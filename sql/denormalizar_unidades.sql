-- Recalcula los campos denormalizados de `unidades` a partir de las deudas y
-- los pagos. Es el equivalente batch del `Recalcular` de la API
-- (apps/api/internal/unidades/adapters/gorm/unidad.repository.impl.go) y se
-- ejecuta una sola vez, después de cargar el mock.
--
-- PostgreSQL resuelve esto con un UPDATE ... FROM, que en SQLite hubo que
-- emular con subconsultas correlacionadas.
WITH deudas AS (
  SELECT
    d.unidad,
    SUM(d.monto - COALESCE(dp.destinado, 0))::int AS deuda
  FROM internal_deudas d
  LEFT JOIN destino_de_pagos dp ON dp.deuda = d.id
  GROUP BY d.unidad
),
asignado AS (
  SELECT
    d.unidad,
    SUM(c.monto)::int AS monto_asignado,
    COUNT(*)::int AS cuotas
  FROM internal_deudas d
  JOIN cuotas c ON c.id = d.cuota
  GROUP BY d.unidad
),
pagos AS (
  SELECT
    op.unidad_codigo,
    COALESCE(SUM(op.monto), 0)::int AS pagado
  FROM operaciones op
  WHERE op.tipo = 'CREDITO'
    AND op.rol = 'UNIDAD'
  GROUP BY op.unidad_codigo
),
destinos AS (
  SELECT
    op.unidad_codigo,
    COALESCE(SUM(dp.destinado), 0)::int AS destinado
  FROM destino_de_pagos dp
  JOIN operaciones op ON dp.operacion = op.id
  WHERE op.tipo = 'CREDITO'
    AND op.rol = 'UNIDAD'
  GROUP BY op.unidad_codigo
)
UPDATE unidades u
SET
  deuda_total = COALESCE(deudas.deuda, 0),
  estado_cuenta = CASE
    WHEN COALESCE(deudas.deuda, 0) = 0 THEN 'SOLVENTE'
    WHEN COALESCE(deudas.deuda, 0) < COALESCE(asignado.monto_asignado, 0) THEN 'ABONADA'
    ELSE 'PENDIENTE'
  END,
  cuotas_pendientes = COALESCE(asignado.cuotas, 0),
  cuenta = COALESCE(pagos.pagado, 0) - COALESCE(destinos.destinado, 0)
FROM deudas
LEFT JOIN asignado ON asignado.unidad = deudas.unidad
LEFT JOIN pagos ON pagos.unidad_codigo = deudas.unidad
LEFT JOIN destinos ON destinos.unidad_codigo = deudas.unidad
WHERE deudas.unidad = u.codigo;
