:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Muchos a Uno

Imagine una base de datos de una biblioteca con dos entidades: libros y autores. Un autor puede escribir varios libros, pero cada libro suele tener un solo autor. En este escenario, la relación entre autores y libros es de muchos a uno. Varios libros pueden estar asociados al mismo autor, pero cada libro solo puede tener un autor.

Diagrama ER:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Configuración del campo:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Descripción de los parámetros

### Colección de origen

La colección de origen, que es la colección donde reside el campo actual.

### Colección de destino

La colección de destino, con la que se asociará.

### Clave foránea

El campo en la colección de origen que se utiliza para establecer la asociación entre las dos colecciones.

### Clave de destino

El campo en la colección de destino al que hace referencia la clave foránea. Debe ser único.

### ON DELETE

ON DELETE se refiere a las reglas que se aplican a las referencias de clave foránea en las colecciones secundarias relacionadas cuando se eliminan registros de la colección principal. Es una opción que se utiliza al definir una restricción de clave foránea. Las opciones comunes de ON DELETE incluyen:

-   **CASCADE**: Cuando se elimina un registro de la colección principal, todos los registros relacionados en la colección secundaria se eliminan automáticamente.
-   **SET NULL**: Cuando se elimina un registro de la colección principal, los valores de la clave foránea en los registros relacionados de la colección secundaria se establecen en NULL.
-   **RESTRICT**: Es la opción predeterminada. Impide la eliminación de un registro de la colección principal si existen registros relacionados en la colección secundaria.
-   **NO ACTION**: Similar a RESTRICT, impide la eliminación de un registro de la colección principal si existen registros relacionados en la colección secundaria.