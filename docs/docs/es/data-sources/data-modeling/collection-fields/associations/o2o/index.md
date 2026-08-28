---
title: "Uno a uno"
description: "Campo de relación uno a uno (O2O): dos entidades de tabla se corresponden entre sí, y se utiliza para almacenar por separado distintos aspectos de una entidad."
keywords: "Uno a uno,O2O,HasOne,BelongsTo,campo de relación,NocoBase"
---

# Uno a uno

La relación entre los empleados y sus perfiles personales: cada empleado solo puede tener un registro de perfil personal, y cada registro de perfil personal solo puede corresponder a un empleado. En este caso, los empleados y los perfiles personales tienen una relación uno a uno.

En una relación uno a uno, la clave foránea puede ubicarse en la tabla de origen o en la tabla de destino. Si representa «tiene uno», es más adecuado colocar la clave foránea en la tabla de destino; si representa una «relación de pertenencia», es más adecuado colocarla en la tabla de origen.

En el ejemplo anterior, cada empleado solo tiene un perfil personal y cada perfil personal pertenece a un empleado, por lo que es más adecuado colocar esta clave foránea en la tabla de perfiles personales.

## Uno a uno (tiene uno)

Indica que un empleado tiene un registro de perfil personal

Relación ER

![texto alternativo](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Configuración del campo

![texto alternativo](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Uno a uno (relación de pertenencia)

Indica que un registro de perfil personal pertenece a un empleado

Relación ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Configuración del campo

![texto alternativo](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Descripción de los parámetros

### Source collection

Tabla de origen, es decir, la tabla en la que se encuentra el campo actual.

### Target collection

Tabla de destino, es decir, la tabla con la que se establece la relación.

### Foreign key

Se utiliza para establecer la relación entre dos tablas. En una relación uno a uno, la clave foránea puede ubicarse en la tabla de origen o en la tabla de destino. Si representa «tiene uno», es más adecuado colocar la clave foránea en la tabla de destino; si representa una «relación de pertenencia», es más adecuado colocarla en la tabla de origen.

### Source key <- Foreign key (clave foránea en la tabla de destino)

Campo al que hace referencia la restricción de clave foránea; debe ser único. Cuando la clave foránea se encuentra en la tabla de destino, representa «tiene uno».

### Target key <- Foreign key (clave foránea en la tabla de origen)

Campo al que hace referencia la restricción de clave foránea; debe ser único. Cuando la clave foránea se encuentra en la tabla de origen, representa una «relación de pertenencia».

### ON DELETE

ON DELETE se refiere a la regla de operación aplicada a las referencias de clave foránea de la tabla secundaria relacionada cuando se elimina un registro de la tabla principal. Es una opción que se utiliza al definir restricciones de clave foránea. Entre las opciones comunes de ON DELETE se incluyen:

- CASCADE: al eliminar un registro de la tabla principal, se eliminan automáticamente todos los registros relacionados de la tabla secundaria.
- SET NULL: al eliminar un registro de la tabla principal, el valor de la clave foránea relacionada en la tabla secundaria se establece en NULL.
- RESTRICT: opción predeterminada. Si existen registros relacionados en la tabla secundaria al intentar eliminar un registro de la tabla principal, se rechaza la eliminación del registro de la tabla principal.
- NO ACTION: similar a RESTRICT. Si existen registros relacionados en la tabla secundaria, se rechaza la eliminación del registro de la tabla principal.