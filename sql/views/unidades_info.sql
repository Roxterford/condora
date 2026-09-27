DROP VIEW IF EXISTS unidades_info CASCADE;

-- Vista ligera: lee los campos ya denormalizados en `unidades` y enriquece con
-- los datos de contacto y titular primario. Evita el N+1 de la vista pesada.
CREATE VIEW unidades_info AS
SELECT
  u.id,
  u.codigo,
  u.estado,
  u.deuda_total,
  u.estado_cuenta,
  u.cuotas_pendientes,
  u.cuenta,
  u.contacto,
  u.titular_primario,
  u.descripcion,
  c.id AS contacto_id,
  c.tipo AS contacto_tipo,
  c.documento_identidad AS contacto_documento,
  c.nombres AS contacto_nombres,
  c.apellidos AS contacto_apellidos,
  c.razon_social AS contacto_razon_social,
  c.representante AS contacto_representante,
  c.email AS contacto_email,
  c.telefono AS contacto_telefono,
  c.registro AS contacto_registro,
  t.id AS titular_primario_id,
  t.tipo AS titular_tipo,
  t.documento_identidad AS titular_documento,
  t.nombres AS titular_nombres,
  t.apellidos AS titular_apellidos,
  t.razon_social AS titular_razon_social,
  t.representante AS titular_representante,
  t.email AS titular_email,
  t.telefono AS titular_telefono,
  t.registro AS titular_registro
FROM unidades u
LEFT JOIN sujetos c ON u.contacto = c.id
LEFT JOIN sujetos t ON u.titular_primario = t.id;
