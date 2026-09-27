DROP VIEW IF EXISTS unidades_stats CASCADE;
CREATE VIEW unidades_stats AS
SELECT
  (SELECT COUNT(*)::int FROM unidades) AS total_unidades,
  (SELECT COUNT(DISTINCT unidad_id) FROM deudas WHERE deuda > 0)::int AS unidades_con_pendientes,
  (SELECT COALESCE(SUM(deuda), 0)::int FROM deudas) AS total_pendiente;
