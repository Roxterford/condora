DROP VIEW IF EXISTS unidades_stats;
CREATE VIEW unidades_stats AS
SELECT 
  (SELECT COUNT(*) FROM unidades) AS total_unidades,
  (SELECT COUNT(DISTINCT unidad_id) FROM deudas WHERE deuda > 0) AS unidades_con_pendientes,
  (SELECT SUM(deuda) FROM deudas) AS total_pendiente;