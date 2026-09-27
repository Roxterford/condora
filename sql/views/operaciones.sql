DROP VIEW IF EXISTS operaciones CASCADE;
CREATE VIEW operaciones AS
SELECT
  o.*,
  u.id AS unidad_id
FROM
  internal_operaciones o
  LEFT JOIN unidades u ON u.codigo = o.unidad_codigo;
