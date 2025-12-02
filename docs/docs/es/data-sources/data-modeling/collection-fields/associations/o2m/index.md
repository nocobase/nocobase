:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Uno a muchos

La relación entre una clase y sus estudiantes es un ejemplo de relación uno a muchos: una clase puede tener varios estudiantes, pero cada estudiante pertenece a una sola clase.

Diagrama ER:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Configuración del campo:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Descripción de los parámetros

### Colección de origen

La colección de origen es la colección donde reside el campo actual.

### Colección de destino

La colección de destino es la colección con la que se asociará.

### Clave de origen

Es el campo en la colección de origen al que hace referencia la clave foránea. Debe ser único.

### Clave foránea

Es el campo en la colección de destino que se utiliza para establecer la asociación entre las dos colecciones.

### Clave de destino

Es el campo en la colección de destino que se usa para visualizar cada registro de fila en el bloque de relación, generalmente un campo único.

### ON DELETE

ON DELETE se refiere a las reglas que se aplican a las referencias de clave foránea en las colecciones secundarias relacionadas cuando se eliminan registros en la colección principal. Es una opción que se utiliza al definir una restricción de clave foránea. Las opciones comunes de ON DELETE incluyen:

- **CASCADE**: Cuando se elimina un registro en la colección principal, todos los registros relacionados en la colección secundaria se eliminan automáticamente.
- **SET NULL**: Cuando se elimina un registro en la colección principal, los valores de clave foránea en los registros de la colección secundaria relacionados se establecen en NULL.
- **RESTRICT**: Es la opción predeterminada; evita la eliminación de un registro de la colección principal si existen registros relacionados en la colección secundaria.
- **NO ACTION**: Similar a RESTRICT, evita la eliminación de un registro de la colección principal si existen registros relacionados en la colección secundaria.