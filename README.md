# API de tienda ADSO

API REST construida con FastAPI para administrar clientes, productos y pedidos. La información se almacena en MySQL.

## Preparar el entorno

1. Crea y activa un entorno virtual, e instala las dependencias:

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Copia `.env.example` como `.env` y ajusta el usuario, la contraseña y los datos de conexión de MySQL.

   ```powershell
   Copy-Item .env.example .env
   ```

3. Con MySQL disponible, crea las tablas y carga los datos de ejemplo con un cliente MySQL:

   ```text
   sql/01_esquema.sql
   sql/02_datos_prueba.sql
   ```

   Ejecuta primero `01_esquema.sql` y después `02_datos_prueba.sql`.

   Si la base de datos ya existía antes de agregar apellido y teléfono a los clientes, ejecuta también `sql/03_migrar_clientes.sql`. La migración conserva los registros existentes.

## Iniciar la API

Desde la raíz del proyecto, con el entorno virtual activo:

```powershell
uvicorn app.main:app --reload
```

La API queda disponible en `http://127.0.0.1:8000`. La documentación interactiva de Swagger está en `http://127.0.0.1:8000/docs`.

## Rutas principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET`, `POST` | `/clientes` | Listar y crear clientes |
| `GET` | `/clientes/{cliente_id}` | Consultar un cliente |
| `GET` | `/productos` | Listar productos; acepta búsqueda y paginación |
| `GET`, `POST` | `/productos/{producto_id}` o `/productos` | Consultar o crear productos |
| `PATCH` | `/productos/{producto_id}/stock` | Actualizar existencias |
| `POST` | `/pedidos` | Crear un pedido y descontar existencias |
| `GET` | `/pedidos`, `/pedidos/{pedido_id}` | Listar pedidos y consultar su detalle |

Al listar productos se pueden usar los parámetros `buscar`, `pagina` y `limite`. Para crear pedidos, envía un `cliente_id` y una lista `items` con `producto_id` y `cantidad`.
