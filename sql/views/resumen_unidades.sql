DROP VIEW IF EXISTS resumen_unidades;
CREATE VIEW resumen_unidades AS
SELECT 
  (SELECT COUNT(*) FROM unidades) AS total_unidades,
  (SELECT COUNT(*) FROM unidades WHERE estado = 'ACTIVA') AS unidades_activas,
  (SELECT COUNT(*) FROM unidades WHERE estado = 'INHABITADA') AS unidades_inhabitadas,
  (SELECT COUNT(*) FROM unidades WHERE estado = 'EXENTA') AS unidades_exentas,
  (SELECT COUNT(*) FROM unidades WHERE estado = 'EN_LITIGIO') AS unidades_en_litigio,
  (SELECT COUNT(*) FROM unidades WHERE estado = 'SUSPENDIDA') AS unidades_suspendidas,
  (SELECT COUNT(*) FROM unidades WHERE estado = 'PREVENTA') AS unidades_preventa,
  (SELECT COUNT(DISTINCT unidad_codigo) FROM deudas WHERE deuda > 0) AS unidades_con_pendientes,
  (SELECT COUNT(DISTINCT unidad_codigo) FROM deudas WHERE unidad_codigo NOT IN (SELECT unidad_codigo FROM deudas WHERE deuda > 0)) AS unidades_solventes,
  (SELECT SUM(deuda) FROM deudas) AS total_pendiente,
  (SELECT SUM(monto) FROM cuotas) AS total_asignado;