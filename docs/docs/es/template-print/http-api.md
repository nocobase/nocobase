---
title: "HTTP API de impresión de plantillas"
description: "HTTP API de impresión de plantillas de NocoBase: imprimir registros seleccionados, los resultados del filtrado actual o todos los datos que cumplan las condiciones mediante la Action templatePrint, y descargar los archivos Word, Excel, PowerPoint o PDF generados."
keywords: "impresión de plantillas,HTTP API,templatePrint,PDF,imprimir registros seleccionados,imprimir todo,NocoBase"
---

# HTTP API

La impresión de plantillas admite activar directamente la generación y descarga de documentos mediante HTTP API. Tanto si se trata de un Block de detalles como de un Block de tabla, en esencia se lanza la Action `templatePrint` sobre el Resource de negocio actual.

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

Notas:
- `<resource_name>` es el nombre del Resource correspondiente a la Collection actual.
- La API devuelve un flujo de archivo binario, no datos JSON.
- El llamante debe disponer del permiso de consulta del Resource actual y del permiso de uso del botón de impresión de plantilla correspondiente.
- La invocación de la API requiere transmitir el token JWT basado en el inicio de sesión del usuario mediante el header Authorization; de lo contrario, el acceso será rechazado.

## Parámetros del cuerpo de la solicitud

| Parámetro | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `templateName` | `string` | Sí | Nombre de la plantilla, correspondiente al identificador de plantilla configurado en la gestión de plantillas. |
| `blockName` | `string` | Sí | Tipo de Block. Para el Block de tabla, transmita `table`; para el Block de detalles, transmita `details`. |
| `timezone` | `string` | No | Zona horaria, por ejemplo `Asia/Shanghai`. Se utiliza para el renderizado de fecha y hora en la plantilla. |
| `uid` | `string` | No | El schema uid del botón de impresión de plantilla, utilizado para la verificación de permisos. |
| `convertedToPDF` | `boolean` | No | Si se convierte a PDF. Cuando se transmite `true`, se devuelve un archivo `.pdf`. |
| `queryParams` | `object` | No | Parámetros transmitidos a la consulta de datos subyacente. |
| `queryParams.page` | `number \| null` | No | Número de página de paginación. Establecido como `null` indica que no se aplica recorte por páginas. |
| `queryParams.pageSize` | `number \| null` | No | Número de registros por página. Establecido como `null` indica que no se aplica recorte por páginas. |
| `queryParams.filter` | `object` | No | Condición de filtrado, que se fusionará automáticamente con la condición de filtrado fija de ACL. |
| `queryParams.appends` | `string[]` | No | Campos relacionados que necesitan consulta adicional. |
| `queryParams.filterByTk` | `string \| object` | No | Comúnmente usado en el Block de detalles, para especificar el valor de la clave primaria. |
| `queryParams.sort` y otros parámetros | `any` | No | Otros parámetros de consulta se transmitirán tal cual a la consulta del Resource subyacente. |

## Block de tabla

El Block de tabla utiliza la misma API y especifica el modo de impresión de lista mediante `blockName: "table"`. El servidor ejecutará una consulta `find` sobre el Resource y pasará el array de resultados a la plantilla.

### Imprimir registros seleccionados o el resultado de la página actual

Adecuado para imprimir parte de los registros marcados desde el Block de tabla, o para imprimir manteniendo el contexto de paginación de la página actual. La práctica común es:

- Establecer `queryParams.page` y `queryParams.pageSize` con el número de página actual y el tamaño de página de la tabla.
- Componer las claves primarias de los registros marcados como condición `filter.id.$in`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

El significado de este tipo de solicitud es el siguiente:

- `blockName` es `table`, indica que se renderiza la plantilla con datos de lista.
- `filter.id.$in` se utiliza para especificar el conjunto de registros que se desean imprimir.
- `page` y `pageSize` mantienen el contexto de paginación actual, para que sea coherente con el comportamiento de la interfaz.
- `appends` permite añadir campos relacionados según sea necesario.

### Imprimir todos los datos que cumplan las condiciones

Adecuado para el modo de invocación al hacer clic en "Imprimir todos los registros" en el Block de tabla. En este caso, ya no se aplica recorte por la paginación de la página actual, sino que se obtienen directamente todos los datos que cumplan las condiciones de filtrado actuales.

El punto clave es transmitir explícitamente `queryParams.page` y `queryParams.pageSize` como `null`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

El significado de este tipo de solicitud es el siguiente:

- `page: null` y `pageSize: null` indican que se cancelan los límites de paginación.
- `filter: {}` indica que no se añaden condiciones de filtrado adicionales; si la interfaz ya tiene condiciones de filtrado, también pueden colocarse aquí directamente.
- El servidor consultará todos los datos que cumplan las condiciones y renderizará la plantilla en lote.

> Atención: el Block de tabla puede imprimir un máximo de 300 registros por vez. Si se supera el límite, la API devolverá un error `400`.

## Block de detalles

El Block de detalles también utiliza la Action `templatePrint`, pero normalmente transmite:

- `blockName: "details"`
- `queryParams.filterByTk` para especificar la clave primaria del registro actual
- `queryParams.appends` para especificar los campos relacionados que se desean consultar adicionalmente

El servidor ejecutará una consulta `findOne` sobre el Resource y pasará el objeto resultante a la plantilla.

## Resultado de respuesta

Tras una invocación exitosa, la API devuelve directamente un flujo de archivo; los headers de respuesta típicos son los siguientes:

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

Notas:

- Cuando `convertedToPDF` es `true`, la extensión del archivo devuelto es `.pdf`.
- En caso contrario, se devuelve un archivo del tipo original correspondiente a la plantilla, por ejemplo `.docx`, `.xlsx` o `.pptx`.
- El frontend normalmente activa la descarga del navegador según el nombre de archivo en `Content-Disposition`.

## Otros recursos
- [Usar API Keys en NocoBase](../integration/api-keys/usage.md)
