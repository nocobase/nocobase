# Obtener datos mediante API Keys

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

¡Hola y bienvenido a este tutorial!
En este documento le guiaremos paso a paso para usar las claves de API en NocoBase y obtener datos, tomando como ejemplo "Tareas pendientes" para ayudarle a entender los detalles de cada parte. Le rogamos leer atentamente y seguir los pasos.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Conocer el concepto de la clave de API

Antes de empezar, debemos aclarar: ¿qué es una clave de API? Es como un pase de entrada que permite confirmar si la solicitud a la API proviene de un usuario legítimo. Cuando accede al sistema NocoBase desde la web, una aplicación móvil o un script de backend, esta "llave secreta" permite al sistema verificar rápidamente su identidad.

En el encabezado HTTP encontraremos un formato como:

```txt
Authorization: Bearer {clave de API}
```

Aquí, "Bearer" indica que lo que sigue es una clave de API verificada, lo que permite confirmar rápidamente los permisos del solicitante.

En la práctica, las claves de API se utilizan habitualmente en los siguientes escenarios:

1. **Acceso desde aplicaciones cliente**: cuando los usuarios llaman a la API desde un navegador o una aplicación móvil, el sistema usa la clave de API para verificar la identidad del usuario y garantizar que solo los usuarios autorizados puedan obtener datos.
2. **Ejecución de tareas automatizadas**: las tareas programadas o scripts del backend, al actualizar datos o registrar logs, utilizan la clave de API para asegurar la seguridad y legitimidad de la solicitud.
3. **Desarrollo y pruebas**: durante la depuración y las pruebas, los desarrolladores usan claves de API para simular solicitudes reales y asegurar que la API responde correctamente.

En resumen, las claves de API no solo nos ayudan a verificar la identidad del solicitante, sino que también permiten supervisar las llamadas, limitar la frecuencia de las solicitudes y prevenir potenciales amenazas de seguridad, garantizando así un funcionamiento estable de NocoBase.

## 2 Crear una clave de API en NocoBase

### 2.1 Activar el plugin [API Keys](https://docs-cn.nocobase.com/handbook/api-keys)

Primero, asegúrese de tener activado el plugin integrado de NocoBase "Autenticación: API Keys". Una vez activado, en el centro de configuración del sistema aparecerá una nueva página de configuración de [API Keys](https://docs-cn.nocobase.com/handbook/api-keys).

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Crear una tabla de tareas para realizar pruebas

Para facilitar las pruebas, creamos previamente una tabla llamada `Tabla de tareas pendientes (todos)` con los siguientes campos:

- `id`
- `Título (title)`
- `Completada (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

A continuación, introducimos algunas tareas en esta tabla, por ejemplo:

- Comer
- Dormir
- Jugar a videojuegos

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Crear y vincular un rol

Como las claves de API se vinculan a roles de usuario, el sistema determina los permisos de la solicitud según el rol. Por lo tanto, antes de crear la clave de API, debemos crear un rol y asignarle los permisos correspondientes.
Le recomendamos crear un rol de prueba llamado "Rol API de tareas" y asignarle todos los permisos sobre la tabla de tareas.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Si al crear la clave de API no puede seleccionar el rol "Rol API del sistema de tareas", puede deberse a que el usuario actual aún no tiene asignado ese rol. En tal caso, primero asigne este rol al usuario actual:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Tras asignar el rol, actualice la página, vaya a la página de gestión de claves de API, haga clic en "Añadir clave de API" y verá que el rol "Rol API del sistema de tareas" ya aparece disponible.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Para una gestión más precisa, también podemos crear un usuario específico "Usuario API de tareas" para iniciar sesión en el sistema, probar permisos y gestionar claves de API; basta con asignarle de forma exclusiva el rol "Rol API de tareas".
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Crear y guardar la clave de API

Después de hacer clic en "Enviar", el sistema mostrará una notificación informando de la creación correcta de la clave de API y la mostrará en la ventana emergente. Asegúrese de copiarla y guardarla, porque, por motivos de seguridad, el sistema no volverá a mostrarla.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Por ejemplo, podría obtener una clave de API como esta:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Notas

- La validez de la clave de API depende de la duración seleccionada al solicitarla.
- La lógica de generación y verificación de la clave de API está estrechamente relacionada con la variable de entorno `APP_KEY`. No la modifique sin motivo, de lo contrario todas las claves de API del sistema dejarán de ser válidas.

## 3 Probar la validez de la clave de API

### 3.1 Usar el plugin [API Doc](https://docs-cn.nocobase.com/handbook/api-doc)

Abra el plugin de documentación de la API; podrá ver el método de solicitud, la dirección, los parámetros y los encabezados de cada API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Conocer las API básicas de creación, consulta, modificación y eliminación

A continuación se muestran ejemplos de las API básicas que ofrece NocoBase:

- **Consultar lista (interfaz list):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Encabezado:
  - Authorization: Bearer <clave de API>

  ```
- **Crear un registro (interfaz create):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Encabezado:
  - Authorization: Bearer <clave de API>

  Cuerpo (formato JSON), por ejemplo:
      {
          "title": "123"
      }
  ```
- **Modificar un registro (interfaz update):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Encabezado:
  - Authorization: Bearer <clave de API>

  Cuerpo (formato JSON), por ejemplo:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Eliminar un registro (interfaz delete):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Encabezado:
  - Authorization: Bearer <clave de API>
  ```

Donde `{baseURL}` es la dirección de su sistema NocoBase y `{collectionName}` es el nombre de la tabla. Por ejemplo, en una prueba local, la dirección sería `localhost:13000`, el nombre de la tabla `todos` y la URL de la solicitud:

```txt
http://localhost:13000/todos:list
```

### 3.3 Pruebas con Postman (ejemplo de la interfaz List)

Abra Postman, cree una nueva solicitud GET, introduzca la URL anterior y añada el encabezado `Authorization` con su clave de API:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
Tras enviar la solicitud, si todo va bien, recibirá una respuesta similar a:

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

Si la clave de API no se ha autorizado correctamente, podría aparecer un error como el siguiente:

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

Si esto ocurre, revise la configuración de permisos del rol, el rol asignado a la clave de API y el formato de la clave.

### 3.4 Copiar el código de la solicitud desde Postman

Tras una prueba exitosa, puede copiar el código de la solicitud de la interfaz List. Por ejemplo, el siguiente comando curl está copiado de Postman:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Mostrar las tareas pendientes en un [bloque iframe](https://docs-cn.nocobase.com/handbook/block-iframe)

Para que vea de forma más intuitiva el resultado de la solicitud a la API, podemos mostrar la lista de tareas obtenidas de NocoBase mediante una sencilla página HTML. Consulte el siguiente código de ejemplo:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

El código anterior muestra una sencilla "Todo List" en un bloque iframe; al cargar la página, llama a la API para obtener los registros de tareas y muestra el resultado en formato JSON.

Asimismo, en la siguiente animación podrá ver el efecto dinámico de toda la solicitud:

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 Resumen

Mediante los pasos anteriores hemos explicado en detalle cómo crear y usar claves de API en NocoBase. Desde activar el plugin, crear la tabla de datos y vincular el rol, hasta probar la API y mostrar los datos en un bloque iframe, cada paso es esencial. Finalmente, gracias a DeepSeek hemos implementado una página sencilla de tareas pendientes. Puede modificar y ampliar el código según sus necesidades.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[El código de esta página de ejemplo](https://forum.nocobase.com/t/api-api-key/3314) está disponible en un mensaje de la comunidad para que pueda consultarlo y comentarlo. Esperamos que este documento le ofrezca una guía clara, ¡que disfrute aprendiendo y trabajando!
