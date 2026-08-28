---
title: "Uno a muchos"
description: "Campo de relación uno a muchos (O2M): una entidad se relaciona con varias entidades secundarias, como autor y artículos."
keywords: "uno a muchos,O2M,HasMany,relación,NocoBase"
---

# Uno a muchos

La relación entre una clase y sus estudiantes es la siguiente: una clase puede tener varios estudiantes, pero cada estudiante solo puede pertenecer a una clase. En este caso, entre la clase y los estudiantes existe una relación uno a muchos.

La relación ER es la siguiente

![texto alternativo](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Configuración del campo

![texto alternativo](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Descripción de los parámetros

### Source collection

Tabla de origen, es decir, la tabla en la que se encuentra el campo actual.

### Target collection

Tabla de destino, es decir, la tabla con la que se establece la relación.

### Source key

Campo al que hace referencia la restricción de clave externa; debe ser único.

### Foreign key

Campo de la tabla de destino utilizado para establecer la relación entre las dos tablas.

### Target key

Campo de la tabla de destino utilizado para mostrar los registros de cada fila del bloque de relaciones; normalmente es un campo con valores únicos.

### ON DELETE

ON DELETE se refiere a la regla de operación aplicada a las referencias de clave externa de la tabla secundaria cuando se elimina un registro de la tabla principal. Es una opción que se utiliza al definir restricciones de clave externa. Las opciones comunes de ON DELETE incluyen:

- CASCADE: al eliminar un registro de la tabla principal, se eliminan automáticamente todos los registros relacionados de la tabla secundaria.
- SET NULL: al eliminar un registro de la tabla principal, el valor de la clave externa relacionada en la tabla secundaria se establece en NULL.
- RESTRICT: opción predeterminada; cuando se intenta eliminar un registro de la tabla principal, se rechaza la eliminación si existen registros relacionados en la tabla secundaria.
- NO ACTION: similar a RESTRICT; si existen registros relacionados en la tabla secundaria, se rechaza la eliminación del registro de la tabla principal.