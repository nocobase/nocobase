---
title: "Collections: definición de tablas de datos"
description: "Definir Collections en plugins de NocoBase: defineCollection, extendCollection, fields y la convención del directorio src/server/collections."
keywords: "Collections,defineCollection,extendCollection,tablas de datos,definición de Collection,NocoBase"
---

# Colecciones

En el desarrollo de **plugins** de NocoBase, la **colección (tabla de datos)** es uno de los conceptos centrales. Usted puede añadir o modificar estructuras de tablas de datos en sus **plugins** definiendo o extendiendo **colecciones**. A diferencia de las tablas de datos creadas a través de la interfaz de gestión de **fuentes de datos**, las **colecciones** definidas en el código suelen ser tablas de metadatos a nivel de sistema y no aparecerán en la lista de gestión de **fuentes de datos**.

## Definición de Colecciones

Siguiendo la estructura de directorios convencional, los archivos de **colección** deben ubicarse en el directorio `./src/server/collections`. Para crear nuevas tablas, utilice `defineCollection()`, y para extender tablas existentes, utilice `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Artículos de ejemplo',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Título', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Contenido' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autor' },
    },
  ],
});
```

En el ejemplo anterior:

- `name`: Nombre de la tabla (se generará automáticamente una tabla con el mismo nombre en la base de datos).
- `title`: Nombre de visualización de la tabla en la interfaz.
- `fields`: Colección de campos; cada campo incluye atributos como `type`, `name`, entre otros.

Cuando necesite añadir campos o modificar configuraciones para las **colecciones** de otros **plugins**, puede utilizar `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Después de activar el **plugin**, el sistema añadirá automáticamente el campo `isPublished` a la tabla `articles` existente.

:::tip
El directorio convencional se cargará completamente antes de que se ejecuten los métodos `load()` de todos los **plugins**, evitando así problemas de dependencia causados por la falta de carga de algunas tablas de datos.
:::

## Referencia Rápida de Tipos de Campo

En el apartado `fields` de `defineCollection`, `type` determina el tipo de columna que tendrá el campo en la base de datos. A continuación se listan todos los tipos de campo integrados:

### Texto

| type | Tipo en la base de datos | Descripción | Parámetros específicos |
|------|-----------|------|----------|
| `string` | VARCHAR(255) | Texto corto | `length?: number` (longitud personalizada), `trim?: boolean` |
| `text` | TEXT | Texto largo | `length?: 'tiny' \| 'medium' \| 'long'` (solo MySQL) |

### Números

| type | Tipo en la base de datos | Descripción | Parámetros específicos |
|------|-----------|------|----------|
| `integer` | INTEGER | Número entero | — |
| `bigInt` | BIGINT | Número entero grande | — |
| `float` | FLOAT | Número de coma flotante | — |
| `double` | DOUBLE | Coma flotante de doble precisión | — |
| `decimal` | DECIMAL(p,s) | Número de coma fija | `precision: number`, `scale: number` |

### Booleanos

| type | Tipo en la base de datos | Descripción |
|------|-----------|------|
| `boolean` | BOOLEAN | Valor booleano |

### Fecha y Hora

| type | Tipo en la base de datos | Descripción | Parámetros específicos |
|------|-----------|------|----------|
| `date` | DATE(3) | Fecha y hora (con milisegundos) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Solo fecha, sin hora | — |
| `time` | TIME | Solo hora | — |
| `unixTimestamp` | BIGINT | Marca de tiempo Unix | `accuracy?: 'second' \| 'millisecond'` |

:::tip
`date` es el tipo de fecha más utilizado. Si necesita diferenciar el tratamiento de las zonas horarias, también dispone de `datetimeTz` (con zona horaria) y `datetimeNoTz` (sin zona horaria).
:::

### Datos Estructurados

| type | Tipo en la base de datos | Descripción | Parámetros específicos |
|------|-----------|------|----------|
| `json` | JSON / JSONB | Datos JSON | `jsonb?: boolean` (utiliza JSONB en PostgreSQL) |
| `jsonb` | JSONB / JSON | Prioriza el uso de JSONB | — |
| `array` | ARRAY / JSON | Array | En PostgreSQL puede utilizarse el tipo ARRAY nativo |

### Generación de ID

| type | Tipo en la base de datos | Descripción | Parámetros específicos |
|------|-----------|------|----------|
| `uid` | VARCHAR(255) | ID corto generado automáticamente | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (true por defecto) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (12 por defecto), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | ID de tipo Snowflake | `autoFill?: boolean` (true por defecto) |

### Tipos Especiales

| type | Tipo en la base de datos | Descripción |
|------|-----------|------|
| `password` | VARCHAR(255) | Se almacena como hash con sal generada automáticamente |
| `virtual` | Sin columna real | Campo virtual; no se crea ninguna columna en la base de datos |
| `context` | Configurable | Se rellena automáticamente a partir del contexto de la petición (por ejemplo, `currentUser.id`) |

### Tipos de Relación

Los campos de relación no crean columnas en la base de datos, sino que establecen relaciones entre tablas en la capa ORM:

| type | Descripción | Parámetros clave |
|------|------|----------|
| `belongsTo` | Muchos a uno | `target` (tabla de destino), `foreignKey` (campo de clave foránea) |
| `hasOne` | Uno a uno | `target`, `foreignKey` |
| `hasMany` | Uno a muchos | `target`, `foreignKey` |
| `belongsToMany` | Muchos a muchos | `target`, `through` (tabla intermedia), `foreignKey`, `otherKey` |

Ejemplo de uso de los campos de relación:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Muchos a uno: el artículo pertenece a un autor
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // Uno a muchos: el artículo tiene varios comentarios
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Muchos a muchos: el artículo tiene varias etiquetas
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // nombre de la tabla intermedia
    },
  ],
});
```

### Parámetros Comunes

Todos los campos de columna admiten los siguientes parámetros:

| Parámetro | Tipo | Descripción |
|------|------|------|
| `name` | `string` | Nombre del campo (obligatorio) |
| `defaultValue` | `any` | Valor por defecto |
| `allowNull` | `boolean` | Si se permite el valor null |
| `unique` | `boolean` | Si el valor debe ser único |
| `primaryKey` | `boolean` | Si es clave primaria |
| `autoIncrement` | `boolean` | Si es autoincremental |
| `index` | `boolean` | Si se crea un índice |
| `comment` | `string` | Comentario del campo |

## Sincronización de la Estructura de la Base de Datos

Cuando un **plugin** se activa por primera vez, el sistema sincronizará automáticamente las configuraciones de la **colección** con la estructura de la base de datos. Si el **plugin** ya está instalado y en ejecución, después de añadir o modificar **colecciones**, deberá ejecutar manualmente el comando de actualización:

```bash
yarn nocobase upgrade
```

## Cómo Hacer que una Colección Aparezca en la Lista de Tablas de Datos de la Interfaz

Las tablas definidas mediante `defineCollection` son tablas internas del servidor y, por defecto, **no aparecen** en la lista de la gestión de fuentes de datos ni en la lista de selección de tablas de datos al añadir un bloque.

**Enfoque recomendado**: añada la tabla de datos correspondiente en la «[Gestión de fuentes de datos](../../data-sources/data-source-main/index.md)» de la interfaz de NocoBase. Una vez configurados los campos y los tipos de interfaz, la tabla aparecerá automáticamente en la lista de selección de tablas de datos del bloque.

![Se puede seleccionar la tabla propia al añadir un bloque](https://static-docs.nocobase.com/20260409143839.png)

Si realmente necesita registrarla desde el código del **plugin** (por ejemplo, en escenarios de demostración de **plugins** de ejemplo), puede hacerlo manualmente mediante `addCollection` en el **plugin** del cliente. Tenga en cuenta que el registro debe realizarse a través del patrón `eventBus` y no puede invocarse directamente en `load()`: `ensureLoaded()` vaciará y volverá a establecer todas las colecciones después de `load()`. Puede consultar un ejemplo completo en [Crear un plugin de gestión de datos full-stack](../client/examples/fullstack-plugin.md).

## Generación Automática de Recursos

Después de definir una **colección**, el sistema generará automáticamente un recurso correspondiente, sobre el cual podrá realizar directamente operaciones CRUD (crear, leer, actualizar, eliminar) a través de la API. Consulte [Gestor de Recursos](./resource-manager.md) para más información.

## Enlaces relacionados

- [Database](./database.md) — CRUD, Repository, transacciones y eventos de base de datos
- [DataSourceManager](./data-source-manager.md) — gestión de múltiples fuentes de datos y sus colecciones
- [Migration](./migration.md) — scripts de migración de datos para las actualizaciones de **plugins**
- [Plugin](./plugin.md) — ciclo de vida de la clase Plugin, métodos miembros y objeto `app`
- [ResourceManager](./resource-manager.md) — API REST personalizadas y manejadores de operaciones
- [Crear un plugin de gestión de datos full-stack](../client/examples/fullstack-plugin.md) — ejemplo completo con defineCollection + addCollection
- [Estructura del proyecto](../project-structure.md) — explicación de la convención del directorio `src/server/collections`
