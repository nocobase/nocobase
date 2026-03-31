:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Campos de relación

En NocoBase, los campos de relación no son campos reales, sino que se utilizan para establecer conexiones entre colecciones. Este concepto es equivalente a las relaciones en las bases de datos relacionales.

En las bases de datos relacionales, los tipos de relación más comunes son los siguientes:

- [Uno a Uno](./o2o/index.md): Cada entidad en dos colecciones se corresponde con una única entidad en la otra colección. Este tipo de relación se utiliza generalmente para almacenar diferentes aspectos de una entidad en colecciones separadas, con el fin de reducir la redundancia y mejorar la consistencia de los datos.
- [Uno a Muchos](./o2m/index.md): Cada entidad en una colección puede asociarse con múltiples entidades en otra colección. Este es uno de los tipos de relación más comunes. Por ejemplo, un autor puede escribir varios artículos, pero un artículo solo puede tener un autor.
- [Muchos a Uno](./m2o/index.md): Múltiples entidades en una colección pueden asociarse con una entidad en otra colección. Este tipo de relación también es común en el modelado de datos. Por ejemplo, varios estudiantes pueden pertenecer a la misma clase.
- [Muchos a Muchos](./m2m/index.md): Múltiples entidades en dos colecciones pueden asociarse entre sí. Este tipo de relación generalmente requiere una colección intermedia para registrar las asociaciones entre las entidades. Por ejemplo, la relación entre estudiantes y cursos: un estudiante puede inscribirse en múltiples cursos, y un curso puede tener múltiples estudiantes.

Estos tipos de relación desempeñan un papel importante en el diseño de bases de datos y el modelado de datos, ayudando a describir relaciones y estructuras de datos complejas del mundo real.