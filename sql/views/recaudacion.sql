DROP VIEW IF EXISTS recaudacion CASCADE;
CREATE VIEW recaudacion AS
SELECT
  c.id AS cuota,
  c.monto,
  c.mes,
  c.anio,
  (SELECT COUNT(*)::int FROM unidades) AS unidades,
  COUNT(DISTINCT d.id)::int AS unidades_aplicadas,
  (SELECT COUNT(DISTINCT d2.unidad)
   FROM internal_deudas d2
   JOIN destino_de_pagos dp2 ON dp2.deuda = d2.id
   WHERE d2.cuota = c.id)::int AS unidades_solventes,
  (SELECT COUNT(DISTINCT d2.unidad)
   FROM internal_deudas d2
   LEFT JOIN destino_de_pagos dp2 ON dp2.deuda = d2.id
   WHERE d2.cuota = c.id AND (dp2.destinado IS NULL OR dp2.destinado = 0))::int AS unidades_pendientes,
  c.monto::int AS total_estimado,
  COALESCE(SUM(dp.destinado), 0)::int AS recaudado,
  (c.monto - COALESCE(SUM(dp.destinado), 0))::int AS pendiente,
  COUNT(DISTINCT dp.operacion)::int AS pagos_asociados
FROM cuotas c
LEFT JOIN internal_deudas d ON d.cuota = c.id
LEFT JOIN destino_de_pagos dp ON dp.deuda = d.id
GROUP BY c.id, c.monto;
