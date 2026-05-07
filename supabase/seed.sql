-- =============================================================
-- SEED: Catálogo HVAC y datos de ejemplo
-- =============================================================

-- ---------------------------------------------------------------
-- OBRAS DE EJEMPLO
-- ---------------------------------------------------------------
INSERT INTO obras (nombre, codigo, cliente, direccion) VALUES
  ('Torre Costanera Centro', 'OBR-2024-001', 'Costanera Center S.A.', 'Av. Andrés Bello 2425, Las Condes'),
  ('Hospital Padre Hurtado Ampliación', 'OBR-2024-002', 'Ministerio de Salud', 'Esperanza 2150, San Ramón'),
  ('Mall Florida Center Remodelación', 'OBR-2024-003', 'Florida Center S.A.', 'Vicuña Mackenna 6100, La Florida'),
  ('Edificio Corporativo Sanhattan', 'OBR-2024-004', 'Inversiones Sanhattan Ltda.', 'El Bosque Norte 0177, Las Condes'),
  ('Hotel Mandarin Oriental', 'OBR-2025-001', 'Mandarin Oriental Group', 'Av. Presidente Kennedy 4601, Vitacura');

-- ---------------------------------------------------------------
-- CATÁLOGO HVAC
-- ---------------------------------------------------------------

-- DUCTOS GALVANIZADOS
INSERT INTO materiales (codigo, nombre, descripcion, categoria, unidad, precio_referencia) VALUES
  ('DUC-GV-150x100', 'Ducto galvanizado 150x100mm', 'Ducto rectangular galvanizado calibre 26, tramos de 1.2m', 'ductos', 'm', 4500),
  ('DUC-GV-200x100', 'Ducto galvanizado 200x100mm', 'Ducto rectangular galvanizado calibre 26, tramos de 1.2m', 'ductos', 'm', 5800),
  ('DUC-GV-300x150', 'Ducto galvanizado 300x150mm', 'Ducto rectangular galvanizado calibre 24, tramos de 1.2m', 'ductos', 'm', 8200),
  ('DUC-GV-400x200', 'Ducto galvanizado 400x200mm', 'Ducto rectangular galvanizado calibre 24, tramos de 1.2m', 'ductos', 'm', 11500),
  ('DUC-GV-600x300', 'Ducto galvanizado 600x300mm', 'Ducto rectangular galvanizado calibre 22, tramos de 1.2m', 'ductos', 'm', 18000),
  ('DUC-GV-800x400', 'Ducto galvanizado 800x400mm', 'Ducto rectangular galvanizado calibre 22, tramos de 1.2m', 'ductos', 'm', 24000),
  ('DUC-CIR-200', 'Ducto circular galvanizado Ø200mm', 'Ducto espiral galvanizado, tramos de 3m', 'ductos', 'm', 6500),
  ('DUC-CIR-315', 'Ducto circular galvanizado Ø315mm', 'Ducto espiral galvanizado, tramos de 3m', 'ductos', 'm', 9800),
  ('DUC-CIR-400', 'Ducto circular galvanizado Ø400mm', 'Ducto espiral galvanizado, tramos de 3m', 'ductos', 'm', 14200),
  ('DUC-FLEX-200', 'Ducto flexible Ø200mm', 'Ducto flexible aluminio/poliéster, rollo 10m', 'ductos', 'm', 3200),

-- FAN COILS
  ('FC-CASSETTE-24K', 'Fan Coil Cassette 24.000 BTU', 'Fan Coil tipo cassette 4 vías, 24.000 BTU, 220V', 'fancoils', 'un', 485000),
  ('FC-CASSETTE-36K', 'Fan Coil Cassette 36.000 BTU', 'Fan Coil tipo cassette 4 vías, 36.000 BTU, 220V', 'fancoils', 'un', 620000),
  ('FC-CASSETTE-48K', 'Fan Coil Cassette 48.000 BTU', 'Fan Coil tipo cassette 4 vías, 48.000 BTU, 220V', 'fancoils', 'un', 780000),
  ('FC-PISO-TECHO-24K', 'Fan Coil Piso-Techo 24.000 BTU', 'Fan Coil piso-techo, 24.000 BTU, 220V', 'fancoils', 'un', 420000),
  ('FC-PISO-TECHO-36K', 'Fan Coil Piso-Techo 36.000 BTU', 'Fan Coil piso-techo, 36.000 BTU, 220V', 'fancoils', 'un', 550000),
  ('FC-DUCTO-1000CFM', 'Fan Coil para ductos 1000 CFM', 'Fan Coil horizontal para ductos, 1000 CFM, 2 tubos', 'fancoils', 'un', 890000),
  ('FC-DUCTO-2000CFM', 'Fan Coil para ductos 2000 CFM', 'Fan Coil horizontal para ductos, 2000 CFM, 2 tubos', 'fancoils', 'un', 1250000),

-- CHILLERS
  ('CHILLER-30TR', 'Chiller aire-agua 30 TR', 'Chiller condensado por aire, 30 toneladas de refrigeración', 'chillers', 'un', 12500000),
  ('CHILLER-60TR', 'Chiller aire-agua 60 TR', 'Chiller condensado por aire, 60 toneladas de refrigeración', 'chillers', 'un', 22000000),
  ('CHILLER-100TR', 'Chiller tornillo 100 TR', 'Chiller condensado por agua, compresor tornillo, 100 TR', 'chillers', 'un', 38000000),
  ('TORRE-ENFRIAM-30TR', 'Torre de enfriamiento 30 TR', 'Torre de enfriamiento de tiro inducido, 30 TR', 'chillers', 'un', 4800000),

-- SISTEMAS VRF
  ('VRF-UM-8HP', 'Unidad exterior VRF 8 HP', 'Unidad condensadora VRF inverter 8 HP, 380V trifásico', 'vrf', 'un', 3200000),
  ('VRF-UM-14HP', 'Unidad exterior VRF 14 HP', 'Unidad condensadora VRF inverter 14 HP, 380V trifásico', 'vrf', 'un', 5400000),
  ('VRF-UM-20HP', 'Unidad exterior VRF 20 HP', 'Unidad condensadora VRF inverter 20 HP, 380V trifásico', 'vrf', 'un', 7800000),
  ('VRF-UI-CASS-9K', 'Unidad interior VRF cassette 9.000 BTU', 'Unidad interior cassette 4 vías VRF, 9.000 BTU', 'vrf', 'un', 380000),
  ('VRF-UI-CASS-18K', 'Unidad interior VRF cassette 18.000 BTU', 'Unidad interior cassette 4 vías VRF, 18.000 BTU', 'vrf', 'un', 520000),
  ('VRF-REFNET-JUNC', 'Refnet junction box', 'Caja de distribución de refrigerante VRF', 'vrf', 'un', 45000),

-- VENTILACIÓN
  ('VENT-IND-1500CFM', 'Ventilador industrial 1500 CFM', 'Ventilador centrífugo industrial, 1500 CFM, 220V', 'ventilacion', 'un', 320000),
  ('VENT-EXTRACTOR-400', 'Extractor de techo Ø400mm', 'Extractor axial para techo, Ø400mm, 220V', 'ventilacion', 'un', 145000),
  ('VENT-REJILLA-300x200', 'Rejilla de ventilación 300x200mm', 'Rejilla de ventilación aluminio con aletas ajustables', 'ventilacion', 'un', 12500),
  ('VENT-DIFFUSER-600x600', 'Difusor cuadrado 600x600mm', 'Difusor cuadrado aluminio con plenum, 600x600mm', 'ventilacion', 'un', 28000),
  ('VENT-UMA-5000CFM', 'Unidad Manejadora 5000 CFM', 'UMA horizontal, 5000 CFM, filtros G4+F7, batería agua', 'ventilacion', 'un', 2800000),

-- ACCESORIOS DUCTOS
  ('ACC-CODO-90-200', 'Codo 90° ducto Ø200mm', 'Codo galvanizado 90°, Ø200mm', 'accesorios', 'un', 8500),
  ('ACC-TE-200', 'Tee ducto Ø200mm', 'Pieza T galvanizada Ø200mm', 'accesorios', 'un', 12000),
  ('ACC-REDUC-200-150', 'Reducción 200 a 150mm', 'Reducción concéntrica galvanizada Ø200-150mm', 'accesorios', 'un', 6500),
  ('ACC-COMPUERTA-300', 'Compuerta de regulación 300mm', 'Compuerta rectangular de regulación de caudal', 'accesorios', 'un', 35000),
  ('ACC-COMPUERTA-INCENDIO', 'Compuerta cortafuego 400x300mm', 'Compuerta cortafuego EI120, 400x300mm, motorizada', 'accesorios', 'un', 185000),
  ('ACC-SILENCIADOR-400', 'Silenciador acústico 400x300mm', 'Silenciador rectangular 1000mm largo, 400x300mm', 'accesorios', 'un', 95000),
  ('ACC-BRIDA-200', 'Brida para ducto Ø200mm', 'Brida de unión galvanizada Ø200mm', 'accesorios', 'un', 2800),

-- AISLACIÓN
  ('AISL-LANA-50MM', 'Lana de vidrio 50mm', 'Panel lana de vidrio 50mm, revestimiento kraft, 1.2x0.6m', 'aislacion', 'm2', 8500),
  ('AISL-ELASTOMERICO-13', 'Aislante elastomérico 13mm', 'Tubería elastomérica 13mm espesor, Ø1/2"-2"', 'aislacion', 'm', 3200),
  ('AISL-ARMAFLEX-25', 'Armaflex 25mm tuberías', 'Aislante elastomérico Armaflex 25mm para tuberías', 'aislacion', 'm', 5800),
  ('AISL-DUCTO-25MM', 'Aislante para ductos 25mm', 'Manta aislante aluminizada 25mm para ductos, rollo 12m2', 'aislacion', 'm2', 6200),

-- CONTROL Y AUTOMATIZACIÓN
  ('CTR-TERMOSTATO-PROG', 'Termostato programable', 'Termostato digital programable 7 días, 230V', 'control', 'un', 45000),
  ('CTR-VALVULA-2V-DN25', 'Válvula motorizada 2 vías DN25', 'Válvula motorizada 2 vías DN25, actuador 230V', 'control', 'un', 85000),
  ('CTR-VALVULA-3V-DN25', 'Válvula motorizada 3 vías DN25', 'Válvula motorizada 3 vías DN25, actuador 230V', 'control', 'un', 95000),
  ('CTR-SENSOR-TEMP', 'Sensor de temperatura ambiente', 'Sensor temperatura ambiente 0-50°C, salida 4-20mA', 'control', 'un', 28000),
  ('CTR-BMS-GATEWAY', 'Gateway BMS BACnet/IP', 'Gateway protocolo BACnet IP/MSTP para integración BMS', 'control', 'un', 320000);

-- ---------------------------------------------------------------
-- FUNCIÓN PÚBLICA: stats del dashboard
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_pedidos',       COUNT(*),
    'pedidos_borrador',    COUNT(*) FILTER (WHERE estado = 'borrador'),
    'pedidos_pendientes',  COUNT(*) FILTER (WHERE estado = 'pendiente'),
    'pedidos_aprobados',   COUNT(*) FILTER (WHERE estado = 'aprobado'),
    'pedidos_rechazados',  COUNT(*) FILTER (WHERE estado = 'rechazado'),
    'pedidos_en_proceso',  COUNT(*) FILTER (WHERE estado = 'en_proceso'),
    'pedidos_completados', COUNT(*) FILTER (WHERE estado = 'completado')
  )
  INTO result
  FROM pedidos
  WHERE (
    supervisor_id = auth.uid()
    OR get_my_rol() IN ('adquisiciones', 'administrador')
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
