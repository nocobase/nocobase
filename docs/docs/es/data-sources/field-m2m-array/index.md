---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Muchos a muchos (matriz)"
description: "Utiliza un campo de tipo matriz para guardar varias claves únicas de la tabla de destino y establecer una relación de muchos a muchos, como la relación muchos a muchos entre artículos y etiquetas, sin necesidad de una tabla intermedia."
keywords: "muchos a muchos matriz,M2M Array,relación mediante matriz,BelongsToMany,NocoBase"
---
# Muchos a muchos (matriz)

## Introducción

Permite utilizar un campo de tipo matriz en una tabla de datos para guardar varias claves únicas de la tabla de destino y establecer así una relación de muchos a muchos con ella. Por ejemplo: existen dos entidades, artículos y etiquetas. Un artículo puede estar asociado a varias etiquetas; en la tabla de artículos, se utiliza un campo de tipo matriz para guardar los ID de los registros correspondientes de la tabla de etiquetas.

:::warning{title=Nota}

- Siempre que sea posible, utiliza una tabla intermedia para establecer una relación estándar de [muchos a muchos](../data-modeling/collection-fields/associations/m2m/index.md) y evita utilizar este tipo de relación.
- En las relaciones de muchos a muchos establecidas mediante campos de tipo matriz, actualmente solo PostgreSQL admite filtrar los datos de la tabla de origen utilizando los campos de la tabla de destino. Por ejemplo: en el caso anterior, puedes utilizar otros campos de la tabla de etiquetas, como el título, para filtrar los artículos.
  :::

### Configuración del campo

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Descripción de los parámetros

### Colección de origen

La tabla de origen, es decir, la tabla en la que se encuentra el campo actual.

### Colección de destino

La tabla de destino con la que se establece la relación.

### Clave foránea

El campo de tipo matriz que almacena en la tabla de origen las claves de destino de Target key.

Correspondencia de los tipos de campos de tipo matriz:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Clave de destino

El campo cuyos valores se almacenan en el campo de tipo matriz de la tabla de origen; debe ser único.
