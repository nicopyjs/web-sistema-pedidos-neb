-- =============================================================
-- Sistema de Pedidos de Materiales HVAC
-- Migración inicial
-- =============================================================

-- ---------------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- búsqueda por texto

-- ---------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------
CREATE TYPE rol_usuario AS ENUM ('supervisor', 'adquisiciones', 'administrador');

CREATE TYPE estado_pedido AS ENUM (
  'borrador',
  'pendiente',
  'aprobado',
  'rechazado',
  'en_proceso',
  'completado'
);

CREATE TYPE categoria_hvac AS ENUM (
  'ductos',
  'fancoils',
  'chillers',
  'vrf',
  'ventilacion',
  'accesorios',
  'aislacion',
  'control',
  'otros'
);

-- ---------------------------------------------------------------
-- TABLA: profiles
-- ---------------------------------------------------------------
CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      TEXT        NOT NULL,
  apellido    TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  rol         rol_usuario NOT NULL DEFAULT 'supervisor',
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- TABLA: obras
-- ---------------------------------------------------------------
CREATE TABLE obras (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  codigo      TEXT        NOT NULL UNIQUE,
  cliente     TEXT,
  direccion   TEXT,
  activa      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- TABLA: materiales (catálogo HVAC)
-- ---------------------------------------------------------------
CREATE TABLE materiales (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo            TEXT          NOT NULL UNIQUE,
  nombre            TEXT          NOT NULL,
  descripcion       TEXT,
  categoria         categoria_hvac NOT NULL,
  unidad            TEXT          NOT NULL,
  precio_referencia DECIMAL(12,2),
  activo            BOOLEAN       NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- TABLA: pedidos
-- ---------------------------------------------------------------
CREATE TABLE pedidos (
  id                           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                       TEXT          NOT NULL UNIQUE,
  obra_id                      UUID          NOT NULL REFERENCES obras(id),
  supervisor_id                UUID          NOT NULL REFERENCES profiles(id),
  maestro                      TEXT          NOT NULL,
  estado                       estado_pedido NOT NULL DEFAULT 'borrador',
  observaciones                TEXT,
  observaciones_adquisiciones  TEXT,
  fecha_requerida              DATE,
  created_at                   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- TABLA: pedido_items
-- ---------------------------------------------------------------
CREATE TABLE pedido_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID        NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  material_id     UUID        NOT NULL REFERENCES materiales(id),
  cantidad        DECIMAL(10,3) NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(12,2),
  observacion     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- TABLA: pedido_historial
-- ---------------------------------------------------------------
CREATE TABLE pedido_historial (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id        UUID          NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior  estado_pedido,
  estado_nuevo     estado_pedido NOT NULL,
  usuario_id       UUID          REFERENCES profiles(id),
  comentario       TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------------
CREATE INDEX idx_pedidos_obra        ON pedidos(obra_id);
CREATE INDEX idx_pedidos_supervisor  ON pedidos(supervisor_id);
CREATE INDEX idx_pedidos_estado      ON pedidos(estado);
CREATE INDEX idx_pedidos_created     ON pedidos(created_at DESC);
CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX idx_historial_pedido    ON pedido_historial(pedido_id);
CREATE INDEX idx_materiales_cat      ON materiales(categoria);
CREATE INDEX idx_materiales_nombre   ON materiales USING gin(nombre gin_trgm_ops);

-- ---------------------------------------------------------------
-- FUNCIÓN: auto-numeración de pedidos (P-YYYY-XXXXX)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_pedido_numero()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num  INT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1
    INTO seq_num
    FROM pedidos
   WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  NEW.numero := 'P-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pedido_numero
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_pedido_numero();

-- ---------------------------------------------------------------
-- FUNCIÓN: updated_at automático
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_obras_updated     BEFORE UPDATE ON obras      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pedidos_updated   BEFORE UPDATE ON pedidos    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- FUNCIÓN: registrar historial al cambiar estado
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_pedido_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO pedido_historial(pedido_id, estado_anterior, estado_nuevo, usuario_id)
    VALUES (NEW.id, OLD.estado, NEW.estado, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_pedido_historial
  AFTER UPDATE OF estado ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION log_pedido_estado();

-- ---------------------------------------------------------------
-- FUNCIÓN: crear profile al registrarse un usuario
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nombre, apellido, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'rol')::rol_usuario, 'supervisor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras              ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_historial   ENABLE ROW LEVEL SECURITY;

-- Helper: rol del usuario actual
CREATE OR REPLACE FUNCTION get_my_rol()
RETURNS rol_usuario AS $$
  SELECT rol FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "Usuarios ven su propio profile"
  ON profiles FOR SELECT USING (id = auth.uid() OR get_my_rol() IN ('adquisiciones', 'administrador'));

CREATE POLICY "Admin gestiona profiles"
  ON profiles FOR ALL USING (get_my_rol() = 'administrador');

CREATE POLICY "Usuario actualiza su profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- obras
CREATE POLICY "Todos los usuarios autenticados ven obras activas"
  ON obras FOR SELECT USING (auth.uid() IS NOT NULL AND activa = true);

CREATE POLICY "Admin gestiona obras"
  ON obras FOR ALL USING (get_my_rol() = 'administrador');

-- materiales
CREATE POLICY "Todos ven materiales activos"
  ON materiales FOR SELECT USING (auth.uid() IS NOT NULL AND activo = true);

CREATE POLICY "Admin y adquisiciones gestionan materiales"
  ON materiales FOR ALL USING (get_my_rol() IN ('administrador', 'adquisiciones'));

-- pedidos
CREATE POLICY "Supervisor ve sus propios pedidos"
  ON pedidos FOR SELECT
  USING (
    supervisor_id = auth.uid()
    OR get_my_rol() IN ('adquisiciones', 'administrador')
  );

CREATE POLICY "Supervisor crea pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (supervisor_id = auth.uid() AND get_my_rol() = 'supervisor');

CREATE POLICY "Supervisor edita sus pedidos en borrador"
  ON pedidos FOR UPDATE
  USING (
    (supervisor_id = auth.uid() AND estado = 'borrador')
    OR get_my_rol() IN ('adquisiciones', 'administrador')
  );

CREATE POLICY "Admin elimina pedidos"
  ON pedidos FOR DELETE USING (get_my_rol() = 'administrador');

-- pedido_items
CREATE POLICY "Ver items según acceso al pedido"
  ON pedido_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_id
        AND (p.supervisor_id = auth.uid() OR get_my_rol() IN ('adquisiciones', 'administrador'))
    )
  );

CREATE POLICY "Insertar items en pedidos propios"
  ON pedido_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_id
        AND p.supervisor_id = auth.uid()
        AND p.estado = 'borrador'
    )
  );

CREATE POLICY "Eliminar items en pedidos propios borrador"
  ON pedido_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_id
        AND p.supervisor_id = auth.uid()
        AND p.estado = 'borrador'
    )
  );

-- historial
CREATE POLICY "Ver historial según acceso al pedido"
  ON pedido_historial FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos p
      WHERE p.id = pedido_id
        AND (p.supervisor_id = auth.uid() OR get_my_rol() IN ('adquisiciones', 'administrador'))
    )
  );
