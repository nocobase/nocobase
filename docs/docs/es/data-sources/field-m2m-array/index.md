---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Muchos a Muchos (Array)

## Introducción

Esta característica le permite usar campos de tipo array en una **colección** de datos para almacenar múltiples claves únicas de la tabla de destino, estableciendo así una relación de muchos a muchos entre ambas tablas. Por ejemplo, imagine las entidades Artículos y Etiquetas. Un artículo puede estar vinculado a múltiples etiquetas, y la tabla de artículos almacena los IDs de los registros correspondientes de la tabla de etiquetas en un campo de tipo array.

:::warning{title=Nota}

- Siempre que sea posible, le recomendamos usar una **colección** intermedia para establecer una relación estándar de [muchos a muchos](../data-modeling/collection-fields/associations/m2m/index.md), en lugar de depender de este método.
- Actualmente, solo PostgreSQL soporta filtrar datos de la **colección** de origen usando campos de la tabla de destino para relaciones de muchos a muchos establecidas con campos de tipo array. Por ejemplo, en el escenario anterior, usted podría filtrar artículos basándose en otros campos de la tabla de etiquetas, como el título.

  :::

### Configuración del Campo

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Descripción de Parámetros

### Colección de origen

La **colección** de origen, donde reside el campo actual.

### Colección de destino

La **colección** de destino con la que se establece la relación.

### Clave foránea

El campo de tipo array en la **colección** de origen que almacena la clave de destino de la tabla de destino.

Las relaciones correspondientes para los tipos de campo array son las siguientes:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Clave de destino

El campo en la **colección** de destino que corresponde a los valores almacenados en el campo de tipo array de la tabla de origen. Este campo debe ser único.