:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Uso de claves API en NocoBase

Esta guía le mostrará cómo usar claves API en NocoBase para obtener datos, utilizando un ejemplo práctico de "Tareas pendientes". Siga las instrucciones paso a paso para comprender el flujo de trabajo completo.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Entendiendo las claves API

Una clave API es un token de seguridad que autentica las solicitudes API de usuarios autorizados. Funciona como una credencial que valida la identidad del solicitante al acceder al sistema NocoBase a través de aplicaciones web, aplicaciones móviles o scripts de backend.

En el encabezado de una solicitud HTTP, el formato es el siguiente:

```txt
Authorization: Bearer {clave API}
```

El prefijo "Bearer" indica que la cadena que le sigue es una clave API autenticada utilizada para verificar los permisos del solicitante.

### Casos de uso comunes

Las claves API se utilizan típicamente en los siguientes escenarios:

1.  **Acceso de aplicaciones cliente**: Los navegadores web y las aplicaciones móviles utilizan claves API para autenticar la identidad del usuario, asegurando que solo los usuarios autorizados puedan acceder a los datos.
2.  **Ejecución de tareas automatizadas**: Los procesos en segundo plano y las tareas programadas utilizan claves API para ejecutar de forma segura actualizaciones, sincronización de datos y operaciones de registro.
3.  **Desarrollo y pruebas**: Los desarrolladores utilizan claves API durante la depuración y las pruebas para simular solicitudes autenticadas y verificar las respuestas de la API.

Las claves API ofrecen múltiples ventajas de seguridad: verificación de identidad, monitoreo de uso, limitación de la tasa de solicitudes y prevención de amenazas, lo que garantiza el funcionamiento estable y seguro de NocoBase.

## 2 Creación de claves API en NocoBase

### 2.1 Active el plugin de autenticación: Claves API

Asegúrese de que el [plugin de autenticación: Claves API](/plugins/@nocobase/plugin-api-keys/) integrado esté activado. Una vez habilitado, aparecerá una nueva página de configuración de claves API en los ajustes del sistema.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Cree una colección de prueba

Para fines de demostración, cree una **colección** llamada `todos` con los siguientes campos:

- `id`
- `title` (título)
- `completed` (completado)

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Agregue algunos registros de ejemplo a la colección:

- Comer
- Dormir
- Jugar

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Cree y asigne un rol

Las claves API están vinculadas a roles de usuario, y el sistema determina los permisos de solicitud basándose en el rol asignado. Antes de crear una clave API, debe crear un rol y configurar los permisos adecuados. Cree un rol llamado "Rol API Tareas Pendientes" y concédale acceso completo a la **colección** `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Si el "Rol API Tareas Pendientes" no está disponible al crear una clave API, asegúrese de que el usuario actual tenga asignado este rol:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Después de asignar el rol, actualice la página y navegue a la página de administración de claves API. Haga clic en "Agregar clave API" para verificar que el "Rol API Tareas Pendientes" aparece en la selección de roles.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Para un mejor control de acceso, considere crear una cuenta de usuario dedicada (por ejemplo, "Usuario API Tareas Pendientes") específicamente para la administración y prueba de claves API. Asigne el "Rol API Tareas Pendientes" a este usuario.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Genere y guarde la clave API

Después de enviar el formulario, el sistema mostrará un mensaje de confirmación con la clave API recién generada. **Importante**: Copie y almacene esta clave de forma segura de inmediato, ya que no se volverá a mostrar por razones de seguridad.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Ejemplo de clave API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Notas importantes

- El período de validez de la clave API está determinado por la configuración de caducidad configurada durante su creación.
- La generación y verificación de claves API dependen de la variable de entorno `APP_KEY`. **No modifique esta variable**, ya que hacerlo invalidará todas las claves API existentes en el sistema.

## 3 Prueba de autenticación con clave API

### 3.1 Uso del plugin de documentación API

Abra el [plugin de documentación API](/plugins/@nocobase/plugin-api-doc/) para ver los métodos de solicitud, URLs, parámetros y encabezados de cada punto final de la API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Entendiendo las operaciones CRUD básicas

NocoBase proporciona APIs CRUD (Crear, Leer, Actualizar, Eliminar) estándar para la manipulación de datos:

-   **Consulta de lista (API `list`):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Encabezado de la solicitud:
    - Authorization: Bearer <clave API>

    ```
-   **Crear registro (API `create`):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Encabezado de la solicitud:
    - Authorization: Bearer <clave API>

    Cuerpo de la solicitud (en formato JSON), por ejemplo:
        {
            "title": "123"
        }
    ```
-   **Actualizar registro (API `update`):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Encabezado de la solicitud:
    - Authorization: Bearer <clave API>

    Cuerpo de la solicitud (en formato JSON), por ejemplo:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Eliminar registro (API `destroy`):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Encabezado de la solicitud:
    - Authorization: Bearer <clave API>
    ```

Donde:
-   `{baseURL}`: La URL de su sistema NocoBase
-   `{collectionName}`: El nombre de la **colección**

Ejemplo: Para una instancia local en `localhost:13000` con una **colección** llamada `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Pruebas con Postman

Cree una solicitud GET en Postman con la siguiente configuración:
-   **URL**: El punto final de la solicitud (por ejemplo, `http://localhost:13000/api/todos:list`)
-   **Headers** (Encabezados): Agregue el encabezado `Authorization` con el valor:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Respuesta exitosa:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Respuesta de error (clave API inválida/caducada):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Solución de problemas**: Si la autenticación falla, verifique los permisos del rol, la vinculación de la clave API y el formato del token.

### 3.4 Exportar código de solicitud

Postman le permite exportar la solicitud en varios formatos. Ejemplo de comando cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Uso de claves API en bloques JS

NocoBase 2.0 permite escribir código JavaScript nativo directamente en las páginas utilizando bloques JS. Este ejemplo demuestra cómo obtener datos de una API externa usando claves API.

### Creación de un bloque JS

En su página de NocoBase, agregue un bloque JS y utilice el siguiente código para obtener los datos de la lista de tareas pendientes:

```javascript
// Obtener datos de la lista de tareas pendientes usando la clave API
async function fetchTodos() {
  try {
    // Mostrar mensaje de carga
    ctx.message.loading('Obteniendo datos...');

    // Cargar la librería axios para solicitudes HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Error al cargar la librería HTTP');
      return;
    }

    // Clave API (reemplácela con su clave API real)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Realizar la solicitud API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Mostrar resultados
    console.log('Lista de tareas pendientes:', response.data);
    ctx.message.success(`Se obtuvieron ${response.data.data.length} elementos con éxito`);

    // Puede procesar los datos aquí
    // Por ejemplo: mostrarlos en una tabla, actualizar campos de formulario, etc.

  } catch (error) {
    console.error('Error al obtener los datos:', error);
    ctx.message.error('Error al obtener los datos: ' + error.message);
  }
}

// Ejecutar la función
fetchTodos();
```

### Puntos clave

-   **ctx.requireAsync()**: Carga dinámicamente librerías externas (como axios) para solicitudes HTTP.
-   **ctx.message**: Muestra notificaciones al usuario (mensajes de carga, éxito, error).
-   **Autenticación con clave API**: Pase la clave API en el encabezado `Authorization` con el prefijo `Bearer`.
-   **Manejo de la respuesta**: Procese los datos devueltos según sea necesario (mostrar, transformar, etc.).

## 5 Resumen

Esta guía ha cubierto el flujo de trabajo completo para usar claves API en NocoBase:

1.  **Configuración**: Activación del plugin de claves API y creación de una **colección** de prueba.
2.  **Configuración**: Creación de roles con permisos adecuados y generación de claves API.
3.  **Pruebas**: Validación de la autenticación con claves API usando Postman y el plugin de documentación API.
4.  **Integración**: Uso de claves API en bloques JS.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)


**Recursos adicionales:**
- [Documentación del plugin de claves API](/plugins/@nocobase/plugin-api-keys/)
- [Plugin de documentación API](/plugins/@nocobase/plugin-api-doc/)