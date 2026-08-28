---
title: "URL"
description: "El campo URL se utiliza para guardar direcciones web, enlaces a sistemas externos, enlaces a documentos y otros tipos de direcciones."
keywords: "URL,enlace,dirección web,url,NocoBase"
---

# URL

## Introducción

En NocoBase, **URL (URL)** se utiliza para guardar direcciones web o enlaces.

El campo URL es adecuado para direcciones de sistemas externos, enlaces a documentos, direcciones de sitios web oficiales, direcciones de callback y otros contenidos similares. En comparación con el texto común, expresa de forma más clara la semántica de un enlace.

Si quieres cargar un archivo, selecciona [Adjunto](../media/field-attachment.md). Si solo necesitas texto descriptivo común, selecciona [Texto de una línea](./input.md) o [Texto de varias líneas](./textarea.md).

## Casos de uso

URL es adecuado para los siguientes escenarios empresariales:

- Sitios web oficiales de clientes y proveedores
- Enlaces a páginas de detalles de sistemas externos
- Enlaces a documentos contractuales y páginas de bases de conocimiento
- Direcciones de Webhook y direcciones de callback

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «URL» para crear un campo URL.

![20240512175641](https://static-docs.nocobase.com/20240512175641.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. URL corresponde a `url`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Sitio web oficial», «Enlace al documento» o «Dirección externa». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo URL es `string`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, este puede completarse automáticamente. |
| Validation rules | Reglas de validación. Se pueden configurar el formato de la URL, la longitud o si el campo es obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores debido a modificaciones.

:::

## Características del campo

El comportamiento predeterminado del campo URL es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `url`. |
| Field type predeterminado | `string`. |
| Field type opcional | `string`. |
| Componente de página | En el modo de edición se utiliza un campo de entrada; en el modo de lectura normalmente se muestra como un enlace. |
| Filtrado | Admite filtros de texto, como contiene, igual a, está vacío y no está vacío. |
| Ordenación | Admite la ordenación en los bloques de tabla. |
| Validación | Admite validaciones del formato de la URL, la longitud, la obligatoriedad, etc. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla sincronizada de la base de datos principal, normalmente la edición consiste en realizar un mapeo del campo: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Afectará a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que su formato sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo URL. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo URL creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo URL es adecuado para utilizarse en escenarios de detalles, tablas y navegación a sitios externos.
![20260709224747](https://static-docs.nocobase.com/20260709224747.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir una dirección de enlace. |
| Bloque de detalles | Mostrar y abrir el enlace. |
| Bloque de tabla | Mostrar un resumen del enlace o un enlace en el que se pueda hacer clic. |
| Flujo de trabajo | Utilizar el enlace como contenido de una notificación o como parámetro de una solicitud externa. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, las categorías y la lógica de mapeo de los campos
- [Tabla común](../../../data-source-main/general-collection.md) — Crea y administra campos en tablas comunes
- [Texto de una línea](./input.md) — Guarda textos cortos comunes
- [Adjunto](../media/field-attachment.md) — Carga y asocia archivos