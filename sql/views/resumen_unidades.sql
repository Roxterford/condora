-- Conteos para las StatCards de villas. `unidades_con_pendientes` y
-- `unidades_solventes` se calculan desde `unidades.deuda_total` (el mismo campo
-- que devuelven las tabs al filtrar por `deuda`), y no desde la vista `deudas`:
-- `deudas` solo ve unidades con cuotas generadas, por lo que las unidades sin
-- deuda alguna quedaban fuera de ambos conteos y el par no cuadraba con
-- `total_unidades`. Ahora `unidades_con_pendientes + unidades_solventes = total_unidades`.
DROP VIEW IF EXISTS resumen_unidades CASCADE;
CREATE VIEW resumen_unidades AS
SELECT
  (SELECT COUNT(*)::int FROM unidades) AS total_unidades,
  (SELECT COUNT(*)::int FROM unidades WHERE estado = 'ACTIVA') AS unidades_activas,
  (SELECT COUNT(*)::int FROM unidades WHERE estado = 'INHABITADA') AS unidades_inhabitadas,
  (SELECT COUNT(*)::int FROM unidades WHERE estado = 'EXENTA') AS unidades_exentas,
  (SELECT COUNT(*)::int FROM unidades WHERE estado = 'EN_LITIGIO') AS unidades_en_litigio,
  (SELECT COUNT(*)::int FROM unidades WHERE estado = 'SUSPENDIDA') AS unidades_suspendidas,
  (SELECT COUNT(*)::int FROM unidades WHERE estado = 'PREVENTA') AS unidades_preventa,
  (SELECT COUNT(*)::int FROM unidades WHERE deuda_total > 0) AS unidades_con_pendientes,
  (SELECT COUNT(*)::int FROM unidades WHERE deuda_total = 0) AS unidades_solventes,
  (SELECT COALESCE(SUM(deuda), 0)::int FROM deudas) AS total_pendiente,
  (SELECT COALESCE(SUM(monto), 0)::int FROM cuotas) AS total_asignado;
