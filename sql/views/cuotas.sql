DROP VIEW IF EXISTS cuotas CASCADE;
CREATE VIEW cuotas AS
SELECT
  c.id,
  c.tipo,
  c.monto,
  c.mes,
  c.anio,
  c.registro,
  c.registrado_por,
  c.actualizacion,
  c.actualizado_por,
  CASE
    WHEN c.tipo = 'ESPECIAL' THEN p.titulo
    ELSE
      CASE c.mes
        WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
      END || ' ' || c.anio
  END AS nombre
FROM
  internal_cuotas c
  LEFT JOIN proyectos p ON p.cuota = c.id;