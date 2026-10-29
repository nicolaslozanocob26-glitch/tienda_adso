USE tienda_adso;

SET @agregar_apellido = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'clientes'
          AND COLUMN_NAME = 'apellido'
    ),
    'SELECT 1',
    'ALTER TABLE clientes ADD COLUMN apellido VARCHAR(100) NULL AFTER nombre'
);

PREPARE migracion FROM @agregar_apellido;
EXECUTE migracion;
DEALLOCATE PREPARE migracion;

SET @agregar_telefono = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'clientes'
          AND COLUMN_NAME = 'telefono'
    ),
    'SELECT 1',
    'ALTER TABLE clientes ADD COLUMN telefono VARCHAR(30) NULL AFTER correo'
);

PREPARE migracion FROM @agregar_telefono;
EXECUTE migracion;
DEALLOCATE PREPARE migracion;
