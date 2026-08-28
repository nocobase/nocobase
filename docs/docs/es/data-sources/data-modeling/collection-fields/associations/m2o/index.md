---
title: "Muchos a uno"
description: "Campo de relación muchos a uno (M2O): varias entidades se asocian con una misma entidad principal, como estudiantes y clases."
keywords: "Muchos a uno,M2O,BelongsTo,Relación,NocoBase"
---


# Muchos a uno

Una base de datos de una biblioteca contiene dos entidades: libros y autores. Un autor puede escribir varios libros, pero cada libro tiene un solo autor (en la mayoría de los casos). En este caso, la relación entre autores y libros es de muchos a uno. Varios libros pueden estar asociados con el mismo autor, pero cada libro solo puede tener un autor.

La relación ER es la siguiente:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Configuración del campo

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Descripción de los parámetros

### Source collection

Tabla de origen, es decir, la tabla en la que se encuentra el campo actual.

### Target collection

Tabla de destino, es decir, la tabla con la que se establece la relación.

### Foreign key

Campo de la tabla de origen utilizado para establecer la relación entre las dos tablas.

### Target key

Campo al que hace referencia la restricción de clave foránea; debe ser único.

### ON DELETE

ON DELETE se refiere a la regla de operación aplicada a las referencias de clave foránea de la tabla secundaria relacionada cuando se elimina un registro de la tabla principal. Es una opción que se utiliza al definir restricciones de clave foránea. Las opciones comunes de ON DELETE incluyen:

- CASCADE: al eliminar un registro de la tabla principal, elimina automáticamente todos los registros relacionados de la tabla secundaria.
- SET NULL: al eliminar un registro de la tabla principal, establece en NULL el valor de la clave foránea relacionada en la tabla secundaria.
- RESTRICT: opción predeterminada; si existen registros relacionados en la tabla secundaria, rechaza la eliminación del registro de la tabla principal.
- NO ACTION: similar a RESTRICT; si existen registros relacionados en la tabla secundaria, rechaza la eliminación del registro de la tabla principal.