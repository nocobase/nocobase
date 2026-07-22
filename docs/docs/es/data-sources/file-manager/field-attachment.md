---
title: "Adjunto"
description: "El campo de adjuntos se utiliza para cargar y asociar archivos; los metadatos de los archivos se almacenan en la tabla de archivos."
keywords: "adjunto,attachment,carga de archivos,tabla de archivos,NocoBase"
---

# Adjunto (obsoleto)

## Introducción

:::warning Atención

El campo de adjuntos ha quedado obsoleto. Se recomienda utilizar el campo [tabla de archivos](./file-collection.md) o [URL de adjunto](../field-attachment-url/index.md).

:::

En NocoBase, **Adjunto (Attachment)** se utiliza para cargar archivos y asociar sus registros al registro de negocio actual.

El campo de adjuntos normalmente se asocia con una tabla de archivos. El archivo en sí se guarda mediante el motor de almacenamiento de archivos, mientras que sus metadatos, como el nombre, el tamaño, la URL y el tipo MIME, se almacenan en la tabla de archivos.

Si solo necesitas guardar el enlace a un archivo externo, selecciona [URL de adjunto](../field-attachment-url/index.md) o [URL](../data-modeling/collection-fields/basic/url.md).

## Casos de uso

Los adjuntos son adecuados para estos casos de negocio:

- Archivos adjuntos de contratos, facturas y comprobantes de reembolso
- Imágenes de productos, documentos de identidad de empleados y documentos de proyectos
- Capturas de pantalla de tickets y archivos adjuntos de incidencias
- Múltiples archivos asociados a registros de negocio

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Adjunto» para crear un campo de adjuntos.

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para los adjuntos corresponde a `attachment` y determina cómo se introducen y muestran en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Adjuntos del contrato», «Archivo de factura» o «Imagen del producto». Se recomienda utilizar un nombre que el personal de negocio pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de la creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El campo de adjuntos normalmente es un campo de relación asociado a los registros de archivos de la tabla de archivos. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Se puede limitar si el campo es obligatorio; normalmente, la cantidad, el tamaño y el tipo de archivos se controlan en el componente de carga o en la configuración del almacenamiento de archivos. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por bloques de página, permisos, flujos de trabajo y la API después de su creación. Confirma el nombre antes de crear el campo para evitar costes posteriores de reconfiguración.

:::

## Características del campo

El comportamiento predeterminado del campo de adjuntos es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `attachment`. |
| Field type predeterminado | `belongsToMany`. |
| Field type opcional | `belongsToMany` y otros tipos de relación, según la configuración específica del campo de archivos. |
| Componente de página | En el modo de edición se utiliza el componente de carga de adjuntos. |
| Filtrado | Normalmente se filtra según si está vacío o si tiene archivos asociados. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones básicas, como la obligatoriedad. Las restricciones de carga dependen de la configuración del componente. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre visible, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada de la base de datos principal, la edición normalmente consiste en realizar un mapeo de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre que se muestra para el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de realizar el cambio, debes confirmar que los datos existentes se pueden utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado al crear nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre visible. Afectará a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Si ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de adjuntos. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de adjuntos creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde la base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, la API, las importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración de negocio.

:::

## Uso en la configuración de páginas

El campo de adjuntos es adecuado para utilizarlo en formularios, detalles y escenarios de gestión de archivos.
![20260709231642](https://static-docs.nocobase.com/20260709231642.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Cargar uno o varios archivos. |
| Bloque de detalles | Ver, previsualizar o descargar adjuntos. |
| Bloque de tabla | Mostrar la cantidad de adjuntos o una entrada para acceder a ellos. |
| Flujo de trabajo | Utilizar los adjuntos como archivos relacionados con aprobaciones, notificaciones o exportaciones. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tabla normal](../data-source-main/general-collection.md) — Crea y gestiona campos en una tabla normal
- [Tabla de archivos](./file-collection.md) — Conoce cómo se almacenan los metadatos de los archivos
- [URL de adjunto](../field-attachment-url/index.md) — Guarda la dirección de un archivo externo
- [URL](../data-modeling/collection-fields/basic/url.md) — Guarda un enlace común