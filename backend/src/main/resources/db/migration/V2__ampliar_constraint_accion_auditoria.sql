-- Ampliar columna accion y actualizar su check constraint para incluir
-- los valores de auditoría de los endpoints del administrador.

ALTER TABLE log_auditoria
    ALTER COLUMN accion TYPE VARCHAR(50);

ALTER TABLE log_auditoria
    DROP CONSTRAINT IF EXISTS log_auditoria_accion_check;

ALTER TABLE log_auditoria
    ADD CONSTRAINT log_auditoria_accion_check CHECK (accion IN (
        'CONSULTAR_EXPEDIENTE',
        'MODIFICAR_EXPEDIENTE',
        'CAMBIAR_ESTADO_EXPEDIENTE',
        'REGISTRAR_ENTREVISTA',
        'REGISTRAR_CONSENTIMIENTO',
        'REGISTRAR_REPORTE',
        'MODIFICAR_REPORTE',
        'ENVIAR_REPORTE',
        'APROBAR_REPORTE',
        'RECHAZAR_REPORTE',
        'CONSULTAR_EXPEDIENTES_PENDIENTES',
        'CONSULTAR_TODOS_EXPEDIENTES',
        'CONSULTAR_TERAPEUTAS',
        'CONSULTAR_SUPERVISORES'
    ));
