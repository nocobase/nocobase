---
title: "Tabla de archivos"
description: "La tabla de archivos almacena el título, nombre, tamaño, tipo MIME, ruta, URL, dirección de vista previa, ubicación de almacenamiento y metainformación ampliada de los archivos, para asociarlos con campos de adjuntos."
keywords: "Tabla de archivos,File Collection,attachments,metainformación,adjuntos,NocoBase"
---

# Tabla de archivos

<PluginInfo name="file-manager"></PluginInfo>

## Introducción

La tabla de archivos es adecuada para almacenar metainformación de archivos, como el nombre, la extensión, el tamaño, el tipo MIME, la ruta, la URL, la dirección de vista previa, la ubicación de almacenamiento y los metadatos personalizados. El contenido del archivo se guarda mediante el motor de almacenamiento de archivos; la tabla de archivos almacena los metadatos del archivo.

La tabla de archivos solo se puede crear desde la página de la base de datos principal. Las bases de datos externas, las fuentes de datos de la API REST y las fuentes de datos externas de NocoBase no admiten la creación de tablas de archivos.

## Casos de uso

La tabla de archivos es adecuada para estos casos de uso:

- Adjuntos de contratos, archivos de facturas y comprobantes de reembolso
- Imágenes de productos, documentos de identidad de empleados y documentos de proyectos
- Archivos cargados, archivos de vista previa y archivos de descarga de registros empresariales
- Bibliotecas de adjuntos que requieren una gestión independiente de la metainformación de los archivos

## Flujo de uso

Por lo general, la tabla de archivos no se utiliza directamente como tabla principal de negocio. El flujo habitual es:

1. Crear una tabla de archivos para almacenar metainformación como el título, nombre, tamaño, tipo, URL y ubicación de almacenamiento del archivo.
2. Crear un campo de relación en la tabla de negocio para asociarlo con la tabla de archivos. Por ejemplo, asociar la tabla «Contratos» con la tabla de archivos «Adjuntos de contratos».
3. Añadir el campo de relación a un bloque de formulario de la tabla de negocio, para que los usuarios puedan cargar archivos al crear o editar registros de negocio.
4. Una vez completada la carga, NocoBase escribirá la metainformación del archivo en la tabla de archivos y asociará el registro del archivo con el registro de negocio actual mediante el campo de relación.
5. Mostrar el campo de adjuntos en los bloques de detalles, tabla o lista de la tabla de negocio, para que los usuarios puedan consultar, previsualizar o descargar los archivos.

## Configuración de creación

En la base de datos principal, haz clic en «Create collection» y selecciona «File collection» para crear una tabla de archivos.

![20240324090414](https://static-docs.nocobase.com/20240324090414.png)

La configuración de creación de una tabla de archivos es básicamente igual que la de una tabla normal. La tabla de archivos incluye de forma predeterminada un conjunto de campos de metainformación para almacenar el título, la ruta, la URL, la ubicación de almacenamiento y la información ampliada de los archivos cargados.

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que la tabla de datos se muestra en la interfaz, por ejemplo, «Adjuntos de contratos», «Archivos de facturas» o «Imágenes de productos». |
| Collection name | Nombre identificador de la tabla de datos, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. |
| Categories | Categorías de la tabla de datos. Las categorías solo afectan a la organización de la interfaz de gestión de tablas de datos y no modifican su estructura. |
| Description | Descripción de la tabla de datos. Puedes indicar qué archivos almacena esta tabla, quién los carga y con qué tablas de negocio está relacionada. |
| Preset fields | Campos predefinidos. Al crear una tabla de archivos, se recomienda conservar los campos del sistema y los campos integrados de la tabla de archivos. |

### Campos integrados

Después de crearla, la tabla de archivos normalmente contiene los siguientes campos integrados. El contenido de los archivos se guarda en el almacenamiento de archivos, mientras que la tabla de archivos almacena esta metainformación.

| Campo | Nombre del campo | Descripción |
| --- | --- | --- |
| ID | `id` | Campo de clave principal predeterminado, utilizado para identificar de forma única un registro de archivo. |
| Title | `title` | Título del archivo, normalmente utilizado para mostrarlo en la interfaz. |
| File name | `filename` | Nombre del archivo. |
| Extension name | `extname` | Extensión del archivo. |
| Size | `size` | Tamaño del archivo. |
| MIME type | `mimetype` | Tipo MIME del archivo. |
| Path | `path` | Ruta del archivo en el almacenamiento. |
| URL | `url` | Dirección de acceso al archivo. |
| Preview | `preview` | Dirección de vista previa del archivo. |
| Storage | `storage` / `storageId` | Almacenamiento al que pertenece el archivo. `storage` es el campo de relación y `storageId` es la clave externa correspondiente. |
| Meta | `meta` | Metainformación ampliada del archivo. |
| Fecha de creación | `createdAt` | Registra automáticamente la fecha y hora de creación del registro de archivo. |
| Creador | `createdBy` | Registra automáticamente el usuario que cargó o creó el registro de archivo. |
| Fecha de actualización | `updatedAt` | Registra automáticamente la fecha y hora de la última actualización del registro de archivo. |
| Actualizado por | `updatedBy` | Registra automáticamente el usuario que actualizó por última vez el registro de archivo. |
| Espacio | `space` | Disponible tras activar el [plugin de múltiples espacios](../../multi-app/multi-space/index.md), para aislar los datos por espacio. No aparece si no se ha activado la función de múltiples espacios. |

![20240324090527](https://static-docs.nocobase.com/20240324090527.png)

### Campo de clave principal

Al igual que las tablas normales, las tablas de archivos necesitan un campo de clave principal. Los campos de adjuntos y de relación utilizan la clave principal para asociar los metadatos de los archivos.

Si la tabla de archivos no tiene una clave principal, debes configurar «Record unique key» al editar la tabla de datos; de lo contrario, los registros de adjuntos podrían no asociarse, previsualizarse o editarse correctamente.

## Establecer relaciones
Crea un campo de relación en la tabla de negocio y asócialo con la tabla de archivos.

![20240324091529](https://static-docs.nocobase.com/20240324091529.png)

## Uso en la configuración de páginas

Los datos de la tabla de archivos normalmente se generan automáticamente al cargar archivos mediante el componente de adjuntos. Se utilizan en bloques de formulario, detalles o relaciones.

![20260710160424](https://static-docs.nocobase.com/20260710160424.png)

![20240324091321](https://static-docs.nocobase.com/20240324091321.png)

| Ubicación de configuración | Uso |
| --- | --- |
| [Bloque de formulario](../../interface-builder/blocks/data-blocks/form.md) | Cargar adjuntos en los registros de la tabla de negocio. |
| [Bloque de detalles](../../interface-builder/blocks/data-blocks/details.md) | Mostrar, previsualizar o descargar adjuntos. |
| [Bloque de tabla](../../interface-builder/blocks/data-blocks/table.md) | Mostrar campos de adjuntos en una lista. |
| [Bloque de relación](../../interface-builder/blocks/data-blocks/table.md) | Gestionar directamente los registros de archivos asociados con el registro de negocio actual. |


## Editar la configuración

En la lista de tablas de datos, haz clic en «Edit» a la derecha de la tabla de archivos para modificar configuraciones como el nombre visible de la tabla de datos, las categorías, la descripción, el modo de paginación simple y «Record unique key».

Los campos de metainformación de los archivos normalmente se rellenan automáticamente durante la carga. No se recomienda cambiar el significado de negocio de campos como `url`, `path` y `storageId`. Si necesitas ampliar la información de negocio de los archivos, puedes añadir campos, como «Tipo de archivo», «Fase» o «Archivado».

## Eliminar la tabla de datos

En la lista de tablas de datos, haz clic en «Delete» a la derecha de la tabla de archivos para eliminarla.

Eliminar la tabla de archivos eliminará los registros de metainformación de los archivos y los metadatos relacionados de Collection. Antes de eliminarla, confirma que los campos de adjuntos, los campos de relación, los bloques de página, los permisos, los flujos de trabajo y las API de las tablas de negocio ya no dependan de ella.

:::danger Advertencia

La tabla de archivos almacena los metadatos de los archivos. Eliminar los registros de la tabla de archivos puede invalidar las referencias a los adjuntos en los registros de negocio; la eliminación simultánea del contenido de los archivos depende del almacenamiento de archivos y de la configuración de negocio. Antes de realizar esta operación, confirma que los archivos ya no se utilicen en el negocio.

:::

## Enlaces relacionados

- [Tabla normal](../data-source-main/general-collection.md) — Consulta la configuración general y el uso de los bloques
- [Campos de la tabla de datos](../data-modeling/collection-fields/index.md) — Consulta la configuración de los campos de adjuntos y de relación
- [Gestor de archivos](../../plugins/@nocobase/plugin-file-manager/index.md) — Consulta la configuración relacionada con el almacenamiento de archivos
- [Espacios múltiples](../../multi-app/multi-space/index.md) — Obtén más información sobre los campos de espacio y las capacidades de aislamiento por espacio