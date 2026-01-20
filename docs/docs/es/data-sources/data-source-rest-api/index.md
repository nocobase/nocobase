---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



pkg: "@nocobase/plugin-data-source-rest-api"
---

# Fuente de datos REST API

## Introducción

Este plugin le permite integrar datos de fuentes REST API de manera sencilla.

## Instalación

Este plugin es comercial, por lo que necesita subirlo y activarlo a través del gestor de plugins.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Cómo añadir una fuente REST API

Una vez que haya activado el plugin, puede añadir una fuente REST API seleccionándola del menú desplegable "Add new" en la sección de gestión de fuentes de datos.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configure la fuente REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Cómo añadir una colección

En NocoBase, un recurso RESTful se mapea a una colección, como por ejemplo, un recurso de Usuarios.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Estos endpoints de API se mapean en NocoBase de la siguiente manera:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Para una guía completa sobre las especificaciones de diseño de la API de NocoBase, consulte la [documentación de la API](#).

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Consulte el capítulo "NocoBase API - Core" para obtener información detallada.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

La configuración de la colección para una fuente de datos REST API incluye lo siguiente:

### Listar

Mapee la interfaz para ver una lista de recursos.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Obtener

Mapee la interfaz para ver los detalles de un recurso.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Crear

Mapee la interfaz para crear un recurso.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Actualizar

Mapee la interfaz para actualizar un recurso.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Eliminar

Mapee la interfaz para eliminar un recurso.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Las interfaces de Listar y Obtener son obligatorias y deben configurarse.

## Depuración de la API

### Integración de parámetros de solicitud

Ejemplo: Configure los parámetros de paginación para la API de Listar. Si la API de terceros no soporta paginación de forma nativa, NocoBase paginará los datos basándose en la lista recuperada.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Tenga en cuenta que solo las variables añadidas en la interfaz surtirán efecto.

| Nombre del parámetro de la API de terceros | Parámetro de NocoBase               |
| ------------------------------------------ | ----------------------------------- |
| page                                       | {{request.params.page}}             |
| limit                                      | {{request.params.pageSize}}         |

Puede hacer clic en "Try it out" para depurar y ver la respuesta.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformación del formato de respuesta

El formato de respuesta de la API de terceros podría no ajustarse al estándar de NocoBase, por lo que necesita ser transformado para mostrarse correctamente en el frontend.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Ajuste las reglas de conversión según el formato de respuesta de la API de terceros para asegurar que la salida se ajuste al estándar de NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Descripción del proceso de depuración

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variables

La fuente de datos REST API ofrece tres tipos de variables para la integración de interfaces:

- Variables personalizadas de la fuente de datos
- Variables de solicitud de NocoBase
- Variables de respuesta de terceros

### Variables personalizadas de la fuente de datos

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Solicitud de NocoBase

- Params: Parámetros de consulta de URL (Search Params), que varían según la interfaz.
- Headers: Cabeceras de solicitud personalizadas, que proporcionan principalmente información X- específica de NocoBase.
- Body: El cuerpo de la solicitud.
- Token: El token de API para la solicitud actual de NocoBase.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Respuestas de terceros

Actualmente, solo está disponible el cuerpo de la respuesta.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

A continuación, se muestran las variables disponibles para cada interfaz:

### Listar

| Parámetro               | Descripción                                                |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Página actual                                              |
| request.params.pageSize | Número de elementos por página                             |
| request.params.filter   | Criterios de filtro (deben cumplir el formato de filtro de NocoBase) |
| request.params.sort     | Criterios de ordenación (deben cumplir el formato de ordenación de NocoBase) |
| request.params.appends  | Campos a cargar bajo demanda, típicamente para campos de asociación |
| request.params.fields   | Campos a incluir (lista blanca)                            |
| request.params.except   | Campos a excluir (lista negra)                             |

### Obtener

| Parámetro                 | Descripción                                                |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Obligatorio, típicamente el ID del registro actual         |
| request.params.filter     | Criterios de filtro (deben cumplir el formato de filtro de NocoBase) |
| request.params.appends    | Campos a cargar bajo demanda, típicamente para campos de asociación |
| request.params.fields     | Campos a incluir (lista blanca)                            |
| request.params.except     | Campos a excluir (lista negra)                             |

### Crear

| Parámetro                | Descripción                      |
| ------------------------ | -------------------------------- |
| request.params.whiteList | Lista blanca                     |
| request.params.blacklist | Lista negra                      |
| request.body             | Datos iniciales para la creación |

### Actualizar

| Parámetro                 | Descripción                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Obligatorio, típicamente el ID del registro actual |
| request.params.filter     | Criterios de filtro (deben cumplir el formato de filtro de NocoBase) |
| request.params.whiteList  | Lista blanca                                       |
| request.params.blacklist  | Lista negra                                        |
| request.body              | Datos para la actualización                        |

### Eliminar

| Parámetro                 | Descripción                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Obligatorio, típicamente el ID del registro actual |
| request.params.filter     | Criterios de filtro (deben cumplir el formato de filtro de NocoBase) |

## Configuración de campos

Los metadatos de los campos (Fields) se extraen de los datos de la interfaz CRUD del recurso adaptado para servir como los campos de la colección.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extraiga los metadatos de los campos.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Campos y vista previa.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Edite los campos (de forma similar a otras fuentes de datos).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Cómo añadir bloques de la fuente de datos REST API

Una vez que la colección esté configurada, ya puede añadir bloques a la interfaz.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)