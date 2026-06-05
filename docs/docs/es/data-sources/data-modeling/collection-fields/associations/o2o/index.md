:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Uno a Uno

En la relación entre empleados y perfiles personales, cada empleado solo puede tener un registro de perfil personal, y cada registro de perfil personal solo puede corresponder a un empleado. En este caso, la relación entre el empleado y el perfil personal es uno a uno.

La clave foránea en una relación uno a uno puede colocarse tanto en la colección de origen como en la colección de destino. Si representa "tiene uno", la clave foránea es más apropiada en la colección de destino; si representa "pertenece a", entonces la clave foránea es más adecuada en la colección de origen.

Por ejemplo, en el caso mencionado anteriormente, donde un empleado tiene solo un perfil personal y el perfil personal pertenece al empleado, es apropiado colocar la clave foránea en la colección de perfiles personales.

## Uno a Uno (Tiene Uno)

Esto indica que un empleado tiene un registro de perfil personal.

Relación ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Configuración de Campo

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Uno a Uno (Pertenece a)

Esto indica que un perfil personal pertenece a un empleado específico.

Relación ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Configuración de Campo

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Descripción de Parámetros

### Colección de origen

La colección de origen, es decir, la colección donde se encuentra el campo actual.

### Colección de destino

La colección de destino, la colección con la que se establece la relación.

### Clave foránea

Se utiliza para establecer una relación entre dos colecciones. En una relación uno a uno, la clave foránea puede colocarse tanto en la colección de origen como en la colección de destino. Si representa "tiene uno", la clave foránea es más apropiada en la colección de destino; si representa "pertenece a", entonces la clave foránea es más adecuada en la colección de origen.

### Clave de origen <- Clave foránea (Clave foránea en la colección de destino)

El campo referenciado por la restricción de clave foránea debe ser único. Cuando la clave foránea se coloca en la colección de destino, indica "tiene uno".

### Clave de destino <- Clave foránea (Clave foránea en la colección de origen)

El campo referenciado por la restricción de clave foránea debe ser único. Cuando la clave foránea se coloca en la colección de origen, indica "pertenece a".

### ON DELETE

ON DELETE se refiere a las reglas de acción para la referencia de clave foránea en la colección hija relacionada al eliminar registros de la colección padre. Es una opción que se define al establecer una restricción de clave foránea. Las opciones comunes de ON DELETE incluyen:

- CASCADE: Cuando se elimina un registro en la colección padre, se eliminan automáticamente todos los registros relacionados en la colección hija.
- SET NULL: Cuando se elimina un registro en la colección padre, el valor de la clave foránea en la colección hija relacionada se establece en NULL.
- RESTRICT: Opción predeterminada. Si se intenta eliminar un registro de la colección padre y existen registros relacionados en la colección hija, se rechaza la eliminación del registro padre.
- NO ACTION: Similar a RESTRICT. Si existen registros relacionados en la colección hija, se rechaza la eliminación del registro de la colección padre.