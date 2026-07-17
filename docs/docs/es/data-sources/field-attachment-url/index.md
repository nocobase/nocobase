---
title: "URL de archivo adjunto"
description: "El campo URL de archivo adjunto se utiliza para guardar direcciones de archivos externos y es adecuado para escenarios en los que no se carga el archivo en sí."
keywords: "URL de archivo adjunto,attachment url,archivo externo,URL,NocoBase"
---

# URL de archivo adjunto

## Introducción

En NocoBase, **URL de archivo adjunto (Attachment URL)** se utiliza para guardar direcciones de acceso a archivos externos.

El campo URL de archivo adjunto es adecuado para escenarios en los que los archivos ya están almacenados en sistemas externos, almacenamiento de objetos o CDN, y solo es necesario guardar la dirección de acceso en NocoBase.

Si necesitas que NocoBase cargue y administre los archivos, selecciona [Archivo adjunto](../file-manager/field-attachment.md). Si solo necesitas una dirección web común, selecciona [URL](../data-modeling/collection-fields/basic/url.md).

## Casos de uso

El campo URL de archivo adjunto es adecuado para los siguientes casos de negocio:

- Direcciones de archivos en almacenamiento de objetos externo
- Direcciones de imágenes en CDN
- Direcciones de documentos de sistemas de terceros
- Enlaces a archivos después de migrar datos históricos

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «URL de archivo adjunto» para crear un campo URL de archivo adjunto.

![20241017092323](https://static-docs.nocobase.com/20241017092323.png)

![20241017092456](https://static-docs.nocobase.com/20241017092456.png)

![20241017092759](https://static-docs.nocobase.com/20241017092759.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. URL de archivo adjunto corresponde a `attachmentUrl`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Dirección del archivo», «URL de imagen» o «Archivo adjunto externo». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. URL de archivo adjunto normalmente utiliza `string` o `text` para guardar la dirección. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Se pueden configurar el formato de la URL, la longitud o si el campo es obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y API. Confirma la nomenclatura antes de crearlo para evitar el coste de ajustar la configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado del campo URL de archivo adjunto es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `attachmentUrl`. |
| Field type predeterminado | `string`. |
| Field type opcional | `string` y `text`, según la configuración real del campo. |
| Componente de página | En el modo de edición se utiliza un componente de entrada de URL o de dirección de archivo adjunto. |
| Filtrado | Admite filtros de texto y la comprobación de valores vacíos. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones de formato de URL, longitud, obligatoriedad, etc. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, normalmente la edición consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar Field type o Field interface no equivale a modificar simplemente un nombre mostrado. Afectará a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma en que se utilizan las variables en los flujos de trabajo. Si ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo URL de archivo adjunto. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo URL de archivo adjunto creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde la base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

La eliminación de un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración de negocio.

:::

## Uso en la configuración de páginas

El campo URL de archivo adjunto es adecuado para mostrar y acceder a archivos externos.
![20260709231803](https://static-docs.nocobase.com/20260709231803.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir la dirección de un archivo externo. |
| Bloque de detalles | Mostrar el enlace al archivo. |
| Bloque de tabla | Mostrar el enlace o un acceso mediante miniatura. |
| Flujo de trabajo | Incluir la dirección del archivo en una notificación o solicitud externa. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tablas normales](../data-source-main/general-collection.md) — Crear y administrar campos en una tabla normal
- [Archivos adjuntos](../file-manager/field-attachment.md) — Cargar y asociar archivos de NocoBase
- [URL](../data-modeling/collection-fields/basic/url.md) — Guardar enlaces comunes
