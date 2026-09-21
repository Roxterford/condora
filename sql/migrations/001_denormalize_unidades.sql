-- Migración: denormalizar campos calculados en tabla `unidades`
-- Elimina la dependencia de la vista pesada `unidades_info`

-- 1. Añadir columnas a la tabla base
ALTER TABLE unidades ADD COLUMN deuda_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE unidades ADD COLUMN estado_cuenta TEXT NOT NULL DEFAULT 'SOLVENTE';
ALTER TABLE unidades ADD COLUMN cuotas_pendientes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE unidades ADD COLUMN cuenta INTEGER NOT NULL DEFAULT 0;

-- 2. Asegurar que la vista original existe (se ejecuta antes via seeds/views.seed.ts)
--    Si no existe, crearla desde sql/views/unidades_info.sql

-- 3. Poblar columnas desde la vista original (migración de datos existentes)
--    SQLite no soporta UPDATE ... FROM; usar subconsultas correlacionadas
UPDATE unidades
SET
  deuda_total       = (SELECT ui.deuda_total       FROM unidades_info ui WHERE ui.codigo = unidades.codigo),
  estado_cuenta     = (SELECT ui.estado_cuenta     FROM unidades_info ui WHERE ui.codigo = unidades.codigo),
  cuotas_pendientes = (SELECT ui.cuotas_pendientes FROM unidades_info ui WHERE ui.codigo = unidades.codigo),
  cuenta            = (SELECT ui.cuenta            FROM unidades_info ui WHERE ui.codigo = unidades.codigo);

-- 4. Índices para filtros frecuentes de la UI
CREATE INDEX IF NOT EXISTS idx_unidades_deuda_total ON unidades(deuda_total);
CREATE INDEX IF NOT EXISTS idx_unidades_estado_cuenta ON unidades(estado_cuenta);
CREATE INDEX IF NOT EXISTS idx_unidades_cuotas_pendientes ON unidades(cuotas_pendientes);

-- 5. Eliminar la vista pesada y crear una ligera solo para joins de contacto/titular
DROP VIEW IF EXISTS unidades_info;

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