---
title: "Definición de Collections"
description: "Definición de Collections en plugins NocoBase: defineCollection, extendCollection, fields, convención del directorio src/server/collections."
keywords: "Collections,defineCollection,extendCollection,tabla de datos,definición de Collection,NocoBase"
---

# Collections - tablas de datos

En el desarrollo de plugins de NocoBase, la **Collection (tabla de datos)** es uno de los conceptos más fundamentales. Puede agregar o modificar la estructura de tablas en un plugin definiendo o extendiendo Collections. A diferencia de las tablas creadas a través de la interfaz de "Gestión de fuentes de datos", **las Collections definidas por código suelen ser tablas de metadatos a nivel de sistema** y no aparecen en la lista de gestión de fuentes de datos.

## Definir una tabla

Según la convención de directorios, los archivos de Collection deben ubicarse en `./src/server/collections`. Para crear una nueva tabla, utilice `defineCollection()`; para extender una tabla existente, utilice `extendCollection()`.

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

- `name`: nombre de la tabla (se genera automáticamente una tabla con el mismo nombre en la base de datos).  
- `title`: nombre de visualización de la tabla en la interfaz.  
- `fields`: conjunto de campos; cada campo contiene propiedades como `type`, `name`, etc.  

Cuando necesite agregar campos o modificar la configuración de la Collection de otro plugin, utilice `extendCollection()`:

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

Una vez activado el plugin, el sistema agrega automáticamente el campo `isPublished` a la tabla `articles` existente.

:::tip Nota

Los directorios convencionales se cargan antes de que se ejecute el método `load()` de todos los plugins, lo que evita problemas de dependencia causados por tablas que aún no se han cargado.

:::

## Referencia rápida de tipos de campo

En los `fields` de `defineCollection`, el `type` determina el tipo de columna en la base de datos. A continuación se muestran todos los tipos de campo integrados:

### Texto

| type | Tipo en base de datos | Descripción | Parámetros específicos |
|------|----------------------|-------------|------------------------|
| `string` | VARCHAR(255) | Texto corto | `length?: number` (longitud personalizada), `trim?: boolean` |
| `text` | TEXT | Texto largo | `length?: 'tiny' \| 'medium' \| 'long'` (solo MySQL) |

### Numérico

| type | Tipo en base de datos | Descripción | Parámetros específicos |
|------|----------------------|-------------|------------------------|
| `integer` | INTEGER | Entero | — |
| `bigInt` | BIGINT | Entero grande | — |
| `float` | FLOAT | Punto flotante | — |
| `double` | DOUBLE | Doble precisión | — |
| `decimal` | DECIMAL(p,s) | Punto fijo | `precision: number`, `scale: number` |

### Booleano

| type | Tipo en base de datos | Descripción |
|------|----------------------|-------------|
| `boolean` | BOOLEAN | Valor booleano |

### Fecha y hora

| type | Tipo en base de datos | Descripción | Parámetros específicos |
|------|----------------------|-------------|------------------------|
| `date` | DATE(3) | Fecha y hora (con milisegundos) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Solo fecha, sin hora | — |
| `time` | TIME | Solo hora | — |
| `unixTimestamp` | BIGINT | Marca de tiempo Unix | `accuracy?: 'second' \| 'millisecond'` |

:::tip Nota

`date` es el tipo de fecha más utilizado. Si necesita distinguir el manejo de zonas horarias, también dispone de `datetimeTz` (con zona horaria) y `datetimeNoTz` (sin zona horaria).

:::

### Datos estructurados

| type | Tipo en base de datos | Descripción | Parámetros específicos |
|------|----------------------|-------------|------------------------|
| `json` | JSON / JSONB | Datos JSON | `jsonb?: boolean` (usa JSONB en PostgreSQL) |
| `jsonb` | JSONB / JSON | Prioriza JSONB | — |
| `array` | ARRAY / JSON | Arreglo | En PostgreSQL se puede usar el tipo ARRAY nativo |

### Generación de ID

| type | Tipo en base de datos | Descripción | Parámetros específicos |
|------|----------------------|-------------|------------------------|
| `uid` | VARCHAR(255) | ID corto generado automáticamente | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (true por defecto) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (12 por defecto), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake ID | `autoFill?: boolean` (true por defecto) |

### Tipos especiales

| type | Tipo en base de datos | Descripción |
|------|----------------------|-------------|
| `password` | VARCHAR(255) | Almacenado automáticamente con hash y sal |
| `virtual` | sin columna real | Campo virtual, no crea columna en la base de datos |
| `context` | configurable | Se completa automáticamente desde el contexto de la solicitud (por ejemplo `currentUser.id`) |

### Tipos de relación

Los campos de relación no crean columnas en la base de datos, sino que establecen relaciones entre tablas a nivel ORM:

| type | Descripción | Parámetros clave |
|------|-------------|-----------------|
| `belongsTo` | Muchos a uno | `target` (tabla destino), `foreignKey` (clave foránea) |
| `hasOne` | Uno a uno | `target`, `foreignKey` |
| `hasMany` | Uno a muchos | `target`, `foreignKey` |
| `belongsToMany` | Muchos a muchos | `target`, `through` (tabla intermedia), `foreignKey`, `otherKey` |

Ejemplos de uso de campos de relación:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Muchos a uno: un artículo pertenece a un autor
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // Uno a muchos: un artículo tiene varios comentarios
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Muchos a muchos: un artículo tiene varias etiquetas
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // Nombre de la tabla intermedia
    },
  ],
});
```

### Parámetros comunes

Todos los campos de columna admiten los siguientes parámetros:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `name` | `string` | Nombre del campo (obligatorio) |
| `defaultValue` | `any` | Valor por defecto |
| `allowNull` | `boolean` | Si se permite null |
| `unique` | `boolean` | Si es único |
| `primaryKey` | `boolean` | Si es clave primaria |
| `autoIncrement` | `boolean` | Si es autoincremental |
| `index` | `boolean` | Si se crea índice |
| `comment` | `string` | Comentario del campo |

## Sincronizar la estructura de la base de datos

Al activar el plugin por primera vez, el sistema sincroniza automáticamente la configuración de las Collections con la estructura de la base de datos. Si el plugin ya está instalado y en ejecución, después de agregar o modificar Collections es necesario ejecutar el comando de actualización para sincronizar la estructura de la base de datos:

```bash
nb app upgrade
```

Si la actualización del plugin requiere migrar datos existentes, por ejemplo renombrar un campo, dividir una tabla o rellenar valores por defecto, debe hacerse mediante [scripts de migración](./migration.md), en lugar de modificar la base de datos manualmente.

## Hacer que una Collection aparezca en la lista de tablas de la UI

Una tabla definida mediante `defineCollection` es una tabla interna del servidor; **por defecto no aparece** en la lista de "Gestión de fuentes de datos" ni en la lista de selección de tablas al "Agregar un bloque".

**Enfoque recomendado**: agregue la tabla correspondiente a través de "[Gestión de fuentes de datos](../../data-sources/data-source-main/index.md)" en la interfaz de NocoBase; una vez configurados los campos y los tipos de interfaz, la tabla aparecerá automáticamente en la lista de selección de tablas de los bloques.

![Seleccionar su propia tabla al agregar un bloque](https://static-docs.nocobase.com/20260409143839.png)

Si realmente necesita registrarla en el código del plugin (por ejemplo, en un escenario de demostración), puede registrarla manualmente en el plugin del cliente mediante `addCollection`. Tenga en cuenta que debe hacerse a través del modo `eventBus`; no puede llamarlo directamente en `load()` -- `ensureLoaded()` limpiará y restablecerá todas las collections después de `load()`. Vea el ejemplo completo en [Construir un plugin de gestión de datos front-end + back-end](../client/examples/fullstack-plugin.md).

## Recursos generados automáticamente

Una vez definida la Collection, NocoBase genera automáticamente los recursos REST API correspondientes: las operaciones CRUD listas para usar (`list`, `get`, `create`, `update`, `destroy`) no requieren código adicional. Si las operaciones CRUD integradas no son suficientes, por ejemplo si necesita una API de "importación masiva" o "resumen estadístico", puede registrar una acción personalizada mediante `resourceManager`. Consulte [ResourceManager - gestión de recursos](./resource-manager.md) para más detalles.

## Enlaces relacionados

- [Database](./database.md) -- CRUD, Repository, transacciones y eventos de base de datos
- [DataSourceManager - gestión de fuentes de datos](./data-source-manager.md) -- Gestionar múltiples fuentes de datos y sus colecciones
- [Migración de datos](./migration.md) -- Scripts de migración de datos durante la actualización de un plugin
- [Plugin](./plugin.md) -- Ciclo de vida de la clase del plugin, métodos miembro y objeto `app`
- [ResourceManager - gestión de recursos](./resource-manager.md) -- API REST personalizadas y handlers de acciones
- [Construir un plugin de gestión de datos front-end + back-end](../client/examples/fullstack-plugin.md) -- Ejemplo completo de defineCollection + addCollection
- [Estructura del proyecto](../project-structure.md) -- Detalle de la convención del directorio `src/server/collections`
