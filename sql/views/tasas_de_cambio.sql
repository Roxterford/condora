DROP VIEW IF EXISTS tasas_de_cambio CASCADE;
CREATE VIEW tasas_de_cambio AS
SELECT
  CAST(fecha AS date) AS fecha,
  tasa,
  'VED' AS moneda,
  COUNT(*)::int AS cantidad_operaciones
FROM
  operaciones
WHERE tasa > 0
GROUP BY CAST(fecha AS date), tasa
ORDER BY fecha DESC;
