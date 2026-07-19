---
title: "Fuente de datos REST API"
description: "Conecta datos de fuentes REST API, asigna recursos RESTful a Collections, configura las asignaciones de las interfaces List/Get/Create/Update/Destroy y admite operaciones CRUD."
keywords: "Fuente de datos REST API, API externa, asignación de interfaces, asignación de Collection, NocoBase"
---

# Fuente de datos REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Introducción

Se utiliza para conectar datos provenientes de una REST API.

## Instalación

Este plugin es comercial. Para conocer los detalles de activación, consulta: [Guía de activación de plugins comerciales](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Añadir una fuente REST API

Después de activar el plugin, selecciona REST API en el menú desplegable Add new de la gestión de fuentes de datos.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configurar la fuente REST API

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Añadir una Collection

Los recursos RESTful son las Collections de NocoBase; por ejemplo, el recurso Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

La configuración correspondiente en la API de NocoBase es:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Para consultar la especificación completa de diseño de la API de NocoBase, consulta la documentación de la API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Consulta la sección «NocoBase API - Core».

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

La configuración de la Collection de la fuente de datos REST API es la siguiente:

### List

Configura la asignación de la interfaz para consultar la lista de recursos.

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Configura la asignación de la interfaz para consultar los detalles de un recurso.

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Configura la asignación de la interfaz para crear un recurso.

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Configura la asignación de la interfaz para actualizar un recurso.
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Configura la asignación de la interfaz para eliminar un recurso.

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

Las interfaces List y Get son obligatorias.
## Depurar la API

### Conectar los parámetros de la solicitud

Ejemplo: configura los parámetros de paginación para la interfaz List (si la API de terceros no admite la paginación, los datos de la lista obtenidos se paginarán).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Ten en cuenta que solo tendrán efecto las variables que se hayan añadido en la interfaz.

| Nombre del parámetro de la API de terceros | Parámetro de NocoBase         |
| ------------------------------------------ | ----------------------------- |
| page                                       | {{request.params.page}}       |
| limit                                      | {{request.params.pageSize}}   |

Puedes hacer clic en Try it out para depurar y consultar el resultado de la respuesta.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Conversión del formato de respuesta

El formato de respuesta de una API de terceros puede no coincidir con el estándar de NocoBase; es necesario convertirlo para que se muestre correctamente en el frontend.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Ajusta las reglas de conversión según el formato de respuesta de la API de terceros para adaptarlo al estándar de salida de NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Descripción del proceso de depuración

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Conversión de la información de error

Cuando se produce un error en la API de terceros, el formato de la información de error de la respuesta puede no coincidir con el estándar de NocoBase; es necesario convertirlo para que se muestre correctamente en el frontend.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Si no se configura la conversión de la información de error, de forma predeterminada se convertirá en un mensaje de error que incluye el código de estado HTTP.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Después de configurar la conversión de la información de error, esta se adapta al estándar de salida de NocoBase y el frontend puede mostrar correctamente la información de error de la API de terceros.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variables

La fuente de datos REST API proporciona tres tipos de variables para conectar las interfaces:

- Variables personalizadas de la fuente de datos
- Solicitud de NocoBase
- Respuesta de terceros

### Variables personalizadas de la fuente de datos

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Solicitud de NocoBase

- Params: parámetros de consulta de la URL (Search Params); los Params pueden variar según la interfaz.
- Headers: cuerpo de la solicitud; proporciona principalmente algunos encabezados X- personalizados de NocoBase.
- Body: cuerpo de la solicitud.
- Token: token de API de la solicitud actual de NocoBase.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Respuesta de terceros

Actualmente, solo se proporciona el Body de la respuesta.

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Las variables disponibles al conectar cada interfaz son las siguientes:

### List

| Parámetro                 | Descripción                                                     |
| ------------------------- | --------------------------------------------------------------- |
| request.params.page      | Página actual                                                    |
| request.params.pageSize  | Cantidad de elementos por página                                |
| request.params.filter    | Condiciones de filtrado (deben cumplir el formato Filter de NocoBase) |
| request.params.sort      | Reglas de ordenación (deben cumplir el formato Sort de NocoBase)   |
| request.params.appends   | Campos que se cargarán según sea necesario, generalmente para cargar relaciones bajo demanda |
| request.params.fields    | Campos que la interfaz debe devolver (lista blanca)             |
| request.params.except    | Campos que se deben excluir (lista negra)                       |

### Get

| Parámetro                 | Descripción                                                     |
| ------------------------- | --------------------------------------------------------------- |
| request.params.filterByTk | Obligatorio; normalmente es el ID de los datos actuales          |
| request.params.filter     | Condiciones de filtrado (deben cumplir el formato Filter de NocoBase) |
| request.params.appends    | Campos que se cargarán según sea necesario, generalmente para cargar relaciones bajo demanda |
| request.params.fields     | Campos que la interfaz debe devolver (lista blanca)             |
| request.params.except     | Campos que se deben excluir (lista negra)                       |

### Create

| Parámetro                | Descripción          |
| ------------------------ | -------------------- |
| request.params.whiteList | Lista blanca         |
| request.params.blacklist | Lista negra          |
| request.body             | Datos iniciales que se crearán |

### Update

| Parámetro                  | Descripción                                                     |
| -------------------------- | --------------------------------------------------------------- |
| request.params.filterByTk  | Obligatorio; normalmente es el ID de los datos actuales          |
| request.params.filter      | Condiciones de filtrado (deben cumplir el formato Filter de NocoBase) |
| request.params.whiteList   | Lista blanca                                                   |
| request.params.blacklist   | Lista negra                                                    |
| request.body               | Datos que se actualizarán                                      |

### Destroy

| Parámetro                 | Descripción                                                     |
| ------------------------- | --------------------------------------------------------------- |
| request.params.filterByTk | Obligatorio; normalmente es el ID de los datos actuales          |
| request.params.filter     | Condiciones de filtrado (deben cumplir el formato Filter de NocoBase) |

## Configurar campos

Extrae los metadatos de los campos (Fields) de los datos de las interfaces CRUD del recurso adaptado para utilizarlos como campos de la Collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extraer los metadatos de los campos.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Campos y vista previa.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Editar campos (de forma similar a otras fuentes de datos).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Añadir un bloque de fuente de datos REST API

Una vez configurada la Collection, puedes añadir bloques desde la interfaz.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)