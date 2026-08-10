---
title: "Base de datos principal"
description: "Base de datos principal de NocoBase: almacena los datos de las tablas del sistema y de negocio, es compatible con MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, sincroniza estructuras de tablas desde la base de datos y permite crear tablas normales, tablas de árbol, tablas SQL, etc."
keywords: "base de datos principal,MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase,sincronización de tablas de datos"
---
# Base de datos principal

## Introducción

La base de datos configurada en [Desplegar NocoBase](/ai/install-nocobase-app) se utiliza para almacenar los datos de las tablas del sistema de NocoBase y también admite el almacenamiento de datos de las tablas de negocio de los usuarios.

Las versiones de base de datos y las ediciones comerciales compatibles con la base de datos principal son las siguientes:

| Base de datos | Versión compatible | Edición comunitaria | Edición estándar | Edición profesional | Edición empresarial |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 10 | ✅ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.9 | ✅ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |

:::tip Nota

KingbaseES solo admite el modo compatible con PostgreSQL, mientras que OceanBase solo admite el modo compatible con MySQL.

:::

## Instalación de plugins

| Base de datos | Plugin correspondiente | Método de instalación |
| --- | --- | --- |
| MySQL | Ninguno | Plugin integrado; no es necesario instalarlo por separado. |
| PostgreSQL | Ninguno | Plugin integrado; no es necesario instalarlo por separado. |
| MariaDB | Ninguno | Plugin integrado; no es necesario instalarlo por separado. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Requiere una licencia comercial; el plugin se habilita de forma predeterminada después de la instalación. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Requiere una licencia comercial; el plugin se habilita de forma predeterminada después de la instalación. |

## Acceder a la fuente de datos principal

1. Haz clic en el menú de fuentes de datos de las funciones del sistema para acceder a la página de inicio de las fuentes de datos.
2. Selecciona la fuente de datos **Main** en la lista de fuentes de datos y haz clic en la acción **Configurar** para acceder a la base de datos principal y administrarla.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Administración de la fuente de datos principal

La base de datos principal proporciona funciones de administración de tablas de datos: permite buscar, crear, modificar y eliminar tablas de datos, así como sincronizar los campos de las tablas existentes en la base de datos; también permite crear, modificar y eliminar campos de las tablas de datos.
- **Filtrar**: buscar las tablas de datos administradas por la base de datos principal de NocoBase
- **Crear tabla de datos**: añadir una nueva tabla de datos de negocio
- **Editar**: modificar una tabla de datos de negocio
- **Eliminar**: eliminar una tabla de datos de negocio
- **Sincronizar desde la base de datos**: sincronizar la estructura de las tablas de datos existentes en la base de datos
- **Configurar campos**: crear, modificar y eliminar campos de las tablas de datos
-  **+**: el **+** de la pestaña permite administrar las categorías de las tablas de datos, así como crear, modificar y eliminar categorías
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### S sincronizar tablas existentes desde la base de datos

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Una característica importante de la fuente de datos principal es que permite sincronizar las tablas que ya existen en la base de datos con NocoBase para administrarlas. Esto significa:

- **Proteger las inversiones existentes**: si ya hay muchas tablas de negocio en tu base de datos, no es necesario volver a crearlas; puedes sincronizarlas y utilizarlas directamente
- **Integración flexible**: puedes incorporar a la administración de NocoBase las tablas creadas mediante otras herramientas, como scripts SQL o herramientas de administración de bases de datos
- **Migración progresiva**: permite migrar gradualmente los sistemas existentes a NocoBase, en lugar de reconstruirlos de una sola vez

Mediante la función «Cargar desde la base de datos», puedes:
1. Explorar todas las tablas de la base de datos
2. Seleccionar las tablas que deseas sincronizar
3. Identificar automáticamente la estructura de las tablas y los tipos de campos
4. Importarlas a NocoBase con un solo clic para administrarlas

### Admite varios tipos de estructuras de tablas

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase permite crear y administrar varios tipos de tablas de datos:
- **Tabla normal**: incluye campos del sistema de uso frecuente;
- **Tabla heredada**: permite crear una tabla principal y derivar de ella tablas secundarias. Las tablas secundarias heredan la estructura de la tabla principal y también pueden definir sus propias columnas.
- **Tabla de árbol**: tabla con estructura de árbol; actualmente solo admite el diseño de tabla de adyacencia;
- **Tabla de calendario**: se utiliza para crear tablas de eventos relacionados con calendarios;
- **Tabla de archivos**: se utiliza para administrar el almacenamiento de archivos;
- **Tabla SQL**: no es una tabla real de la base de datos, sino una forma rápida de mostrar consultas SQL de manera estructurada;
- **Tabla de vista**: conecta con vistas existentes de la base de datos;

### Admite la administración por categorías de las tablas de datos

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Proporciona una amplia variedad de tipos de campos

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversión flexible de tipos de campos

NocoBase admite la conversión flexible de tipos de campos dentro del mismo tipo de base de datos.

**Ejemplo: opciones de conversión de los campos de tipo String**

Cuando un campo de la base de datos es de tipo String, puedes convertirlo en NocoBase a cualquiera de las siguientes formas:

- **Tipos básicos**: texto de una línea, texto multilínea, número de teléfono móvil, correo electrónico, URL, contraseña, color, icono
- **Tipos de selección**: menú desplegable (selección única), opción única
- **Tipos multimedia enriquecidos**: Markdown, Markdown (Vditor), texto enriquecido, archivo adjunto (URL)
- **Tipos de fecha y hora**: fecha y hora (con zona horaria), fecha y hora (sin zona horaria)
- **Tipos avanzados**: codificación automática, selector de tablas de datos, cifrado

Este mecanismo de conversión flexible implica:
- **No es necesario modificar la estructura de la base de datos**: el tipo de almacenamiento subyacente del campo permanece sin cambios; solo cambia su forma de representación en NocoBase
- **Adaptación a los cambios del negocio**: a medida que cambian las necesidades del negocio, puedes ajustar rápidamente la forma de mostrar e interactuar con los campos
- **Seguridad de los datos**: el proceso de conversión no afecta a la integridad de los datos existentes

### Sincronización flexible a nivel de campo

NocoBase no solo permite sincronizar tablas completas, sino que también admite una administración detallada de la sincronización a nivel de campo:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Características de la sincronización de campos:

1. **Sincronización en tiempo real**: cuando cambia la estructura de una tabla de la base de datos, puedes sincronizar en cualquier momento los campos nuevos
2. **Sincronización selectiva**: puedes sincronizar únicamente los campos necesarios, en lugar de todos
3. **Identificación automática de tipos**: identifica automáticamente los tipos de campos de la base de datos y los asigna a los tipos de campos de NocoBase
4. **Conservación de la integridad de los datos**: el proceso de sincronización no afecta a los datos existentes

#### S escenarios de uso:

- **Evolución de la estructura de la base de datos**: cuando cambian las necesidades del negocio y es necesario añadir nuevos campos a la base de datos, puedes sincronizarlos rápidamente con NocoBase
- **Colaboración en equipo**: cuando otros miembros del equipo o el DBA añaden campos en la base de datos, puedes sincronizarlos oportunamente
- **Modo de administración híbrida**: algunos campos se administran mediante NocoBase y otros mediante métodos tradicionales, lo que permite combinarlos con flexibilidad

Este mecanismo de sincronización flexible permite que NocoBase se integre perfectamente en la arquitectura tecnológica existente, sin necesidad de cambiar la forma original de administrar la base de datos, y al mismo tiempo ofrece las ventajas del desarrollo low-code de NocoBase.

Para obtener más información, consulta el capítulo «[Campos de tablas de datos / Descripción general](../data-modeling/collection-fields/index.md)».