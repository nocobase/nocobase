:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Relación de Muchos a Muchos

En un sistema de inscripción a cursos, tenemos dos entidades principales: estudiantes y cursos. Un estudiante puede inscribirse en múltiples cursos, y un curso puede tener a varios estudiantes inscritos. Esto es lo que conocemos como una relación de muchos a muchos. En una base de datos relacional, para representar esta relación entre estudiantes y cursos, normalmente utilizamos una **colección** intermedia, como una colección de inscripciones. Esta colección se encarga de registrar qué cursos ha elegido cada estudiante y qué estudiantes se han inscrito en cada curso. Este diseño nos permite representar de manera efectiva la relación de muchos a muchos entre estudiantes y cursos.

A continuación, le mostramos el diagrama ER:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Y la configuración de los campos:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Descripción de los Parámetros

### Colección de Origen (Source collection)

Esta es la **colección** de origen, es decir, la **colección** donde se encuentra el campo actual.

### Colección de Destino (Target collection)

Se refiere a la **colección** de destino, con la que se establecerá la asociación.

### Colección Intermedia (Through collection)

Esta es la **colección** intermedia que utilizamos cuando existe una relación de muchos a muchos entre dos entidades. Esta **colección** intermedia contiene dos claves foráneas que sirven para mantener la asociación entre ambas entidades.

### Clave de Origen (Source key)

Es el campo de la **colección** de origen al que hace referencia la clave foránea. Es fundamental que este campo sea único.

### Clave Foránea 1 (Foreign key 1)

Este es el campo de la **colección** intermedia que se utiliza para establecer la asociación con la **colección** de origen.

### Clave Foránea 2 (Foreign key 2)

Similarmente, este es el campo de la **colección** intermedia que se usa para establecer la asociación con la **colección** de destino.

### Clave de Destino (Target key)

Es el campo de la **colección** de destino al que hace referencia la clave foránea. Al igual que la clave de origen, debe ser único.

### ON DELETE

`ON DELETE` define las reglas que se aplican a las referencias de clave foránea en las **colecciones** hijas relacionadas cuando se eliminan registros de la **colección** padre. Es una opción que se utiliza al definir una restricción de clave foránea. Las opciones más comunes para `ON DELETE` son:

- **CASCADE**: Cuando se elimina un registro de la **colección** padre, todos los registros relacionados en la **colección** hija se eliminan automáticamente.
- **SET NULL**: Cuando se elimina un registro de la **colección** padre, los valores de la clave foránea en los registros relacionados de la **colección** hija se establecen en `NULL`.
- **RESTRICT**: Esta es la opción predeterminada. Impide la eliminación de un registro de la **colección** padre si existen registros relacionados en la **colección** hija.
- **NO ACTION**: Es similar a `RESTRICT`. Impide la eliminación de un registro de la **colección** padre si existen registros relacionados en la **colección** hija.