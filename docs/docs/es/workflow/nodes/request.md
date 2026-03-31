---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Solicitud HTTP

## Introducción

Cuando necesite interactuar con otro sistema web, puede utilizar el nodo de Solicitud HTTP. Al ejecutarse, este nodo envía una solicitud HTTP a la dirección especificada según su configuración. Puede transportar datos en formato JSON o `application/x-www-form-urlencoded` para interactuar con sistemas externos.

Si está familiarizado con herramientas de envío de solicitudes como Postman, dominará rápidamente el uso del nodo de Solicitud HTTP. A diferencia de estas herramientas, todos los parámetros en el nodo de Solicitud HTTP pueden usar variables de contexto del flujo de trabajo actual, lo que permite una integración orgánica con los procesos de negocio de su sistema.

## Instalación

Este plugin está integrado, por lo que no requiere instalación.

## Creación de un nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ("+") en el flujo para añadir un nodo de "Solicitud HTTP":

![HTTP 请求_添加](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Configuración del nodo

![HTTP请求节点_节点配置](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Método de solicitud

Métodos de solicitud HTTP opcionales: `GET`, `POST`, `PUT`, `PATCH` y `DELETE`.

### URL de la solicitud

La URL del servicio HTTP, que debe incluir la parte del protocolo (`http://` o `https://`). Se recomienda usar `https://`.

### Formato de datos de la solicitud

Este es el `Content-Type` en el encabezado de la solicitud. Para ver los formatos compatibles, consulte la sección "[Cuerpo de la solicitud](#request-body)".

### Configuración de encabezados de la solicitud

Pares clave-valor para la sección de encabezados (Header) de la solicitud. Los valores pueden usar variables del contexto del flujo de trabajo.

:::info{title=Sugerencia}
El encabezado de solicitud `Content-Type` se configura a través del formato de datos de la solicitud. No es necesario rellenarlo aquí, y cualquier intento de sobrescribirlo será ineficaz.
:::

### Parámetros de la solicitud

Pares clave-valor para la sección de parámetros de consulta (query) de la solicitud. Los valores pueden usar variables del contexto del flujo de trabajo.

### Cuerpo de la solicitud

La parte del cuerpo (Body) de la solicitud. Se admiten diferentes formatos según el `Content-Type` seleccionado.

#### `application/json`

Admite texto en formato JSON estándar. Puede insertar variables del contexto del flujo de trabajo usando el botón de variable en la esquina superior derecha del editor de texto.

:::info{title=Sugerencia}
Las variables deben usarse dentro de una cadena JSON, por ejemplo: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Formato de pares clave-valor. Los valores pueden usar variables del contexto del flujo de trabajo. Cuando se incluyen variables, se analizarán como una plantilla de cadena y se concatenarán en el valor de cadena final.

#### `application/xml`

Admite texto en formato XML estándar. Puede insertar variables del contexto del flujo de trabajo usando el botón de variable en la esquina superior derecha del editor de texto.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Admite pares clave-valor para datos de formulario. Se pueden cargar archivos cuando el tipo de datos se establece en un objeto de archivo. Los archivos solo se pueden seleccionar a través de variables de objetos de archivo existentes en el contexto, como los resultados de una consulta en una colección de archivos o datos relacionados de una colección de archivos asociada.

:::info{title=Sugerencia}
Al seleccionar datos de archivo, asegúrese de que la variable corresponda a un único objeto de archivo, y no a una lista de archivos (en una consulta de relación uno a muchos o muchos a muchos, el valor del campo de relación será un array).
:::

### Configuración de tiempo de espera

Cuando una solicitud no responde durante mucho tiempo, la configuración de tiempo de espera (timeout) puede usarse para cancelar su ejecución. Si la solicitud excede el tiempo de espera, el flujo de trabajo actual se terminará prematuramente con un estado de fallo.

### Ignorar fallos

El nodo de solicitud considera los códigos de estado HTTP estándar entre `200` y `299` (inclusive) como exitosos, y todos los demás como fallidos. Si la opción "Ignorar solicitudes fallidas y continuar el flujo de trabajo" está marcada, los nodos subsiguientes en el flujo de trabajo continuarán ejecutándose incluso si la solicitud falla.

## Uso del resultado de la respuesta

El resultado de la respuesta de una solicitud HTTP puede ser analizado por el nodo de [Consulta JSON](./json-query.md) para su uso en nodos subsiguientes.

A partir de la versión `v1.0.0-alpha.16`, tres partes del resultado de la respuesta del nodo de solicitud pueden usarse como variables separadas:

*   Código de estado de la respuesta
*   Encabezados de la respuesta
*   Datos de la respuesta

![HTTP请求节点_响应结果使用](https://static-docs.nocobase.com/20240529110610.png)

El código de estado de la respuesta suele ser un código de estado HTTP estándar en formato numérico, como `200`, `403`, etc. (según lo proporcione el proveedor del servicio).

Los encabezados de la respuesta (Response headers) están en formato JSON. Tanto los encabezados como los datos de respuesta en formato JSON aún deben ser analizados utilizando un nodo JSON antes de poder utilizarlos.

## Ejemplo

Por ejemplo, podemos usar el nodo de solicitud para conectarnos con una plataforma en la nube y enviar SMS de notificación. La configuración para una API de SMS en la nube, tomando como ejemplo la interfaz de envío de SMS de Alibaba Cloud, podría ser la siguiente (deberá consultar la documentación específica de la API para adaptar los parámetros):

![HTTP请求节点_节点配置](https://static-docs.nocobase.com/20240515124004.png)

Cuando el flujo de trabajo active este nodo, se llamará a la API de SMS de Alibaba Cloud con el contenido configurado. Si la solicitud es exitosa, se enviará un SMS a través del servicio de SMS en la nube.