---
title: "Muchos a muchos"
description: "Campo de relación muchos a muchos (M2M), asociación muchos a muchos entre entidades de dos tablas, que normalmente requiere una tabla intermedia, como en el caso de estudiantes y cursos."
keywords: "Muchos a muchos,M2M,BelongsToMany,tabla intermedia,campo de relación,NocoBase"
---

# Muchos a muchos

En un sistema de selección de cursos, existen dos entidades: estudiantes y cursos. Un estudiante puede inscribirse en varios cursos y un curso puede tener varios estudiantes inscritos, lo que constituye una relación muchos a muchos. En una base de datos relacional, para representar la relación muchos a muchos entre estudiantes y cursos, normalmente se utiliza una tabla intermedia, como una tabla de inscripciones. Esta tabla puede registrar qué cursos ha elegido cada estudiante y qué estudiantes están inscritos en cada curso. Este diseño permite representar eficazmente la relación muchos a muchos entre estudiantes y cursos.

La relación ER es la siguiente

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Configuración de campos

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Descripción de los parámetros

### Source collection

Tabla de origen, es decir, la tabla donde se encuentra el campo actual.

### Target collection

Tabla de destino, es decir, la tabla con la que se establece la relación.

### Through collection

Tabla intermedia. Cuando existe una relación muchos a muchos entre dos entidades, es necesario utilizar una tabla intermedia para almacenarla. La tabla intermedia tiene dos claves foráneas que se utilizan para conservar la relación entre las dos entidades.

### Source key

Campo al que hace referencia la restricción de clave foránea; debe ser único.

### Foreign key 1

Campo de la tabla intermedia que se utiliza para establecer la relación con la tabla de origen.

### Foreign key 2

Campo de la tabla intermedia que se utiliza para establecer la relación con la tabla de destino.

### Target key

Campo al que hace referencia la restricción de clave foránea; debe ser único.

### ON DELETE

ON DELETE se refiere a la regla de operación que se aplica a las referencias de claves foráneas de la tabla hija relacionada cuando se elimina un registro de la tabla padre. Es una opción que se utiliza al definir restricciones de clave foránea. Entre las opciones comunes de ON DELETE se incluyen:

- CASCADE: al eliminar un registro de la tabla padre, se eliminan automáticamente todos los registros relacionados de la tabla hija.
- SET NULL: al eliminar un registro de la tabla padre, el valor de la clave foránea relacionada en la tabla hija se establece en NULL.
- RESTRICT: opción predeterminada. Si existen registros relacionados en la tabla hija al intentar eliminar un registro de la tabla padre, se rechaza la eliminación del registro de la tabla padre.
- NO ACTION: similar a RESTRICT; si existen registros relacionados en la tabla hija, se rechaza la eliminación del registro de la tabla padre.