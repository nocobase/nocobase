---
title: "Campo de relación"
description: "Los campos de relación se utilizan para establecer asociaciones entre tablas de datos y admiten relaciones uno a uno, uno a muchos, muchos a uno, muchos a muchos y muchos a muchos mediante arrays."
keywords: "campo de relación,BelongsTo,HasMany,O2O,O2M,M2O,M2M,campo asociado,NocoBase"
---

# Campo de relación

En NocoBase, los **campos de relación** se utilizan para establecer asociaciones entre distintas tablas de datos. Permiten que un registro haga referencia a un registro de otra tabla o a varios registros, por ejemplo, para asociar un pedido con un cliente, una tarea con su responsable o un estudiante con sus cursos.

Los campos de relación no funcionan exactamente igual que los campos comunes. Normalmente, los campos comunes corresponden a columnas reales de la base de datos y se utilizan para almacenar valores de texto, números, fechas, etc.; los campos de relación almacenan la configuración de conexión entre tablas y las claves utilizadas para localizar los registros relacionados. En la base de datos principal, los campos de relación pueden generar la configuración de relación necesaria al crear el campo; en bases de datos externas, normalmente se establecen a partir de claves primarias, claves foráneas o campos únicos existentes, sin modificar automáticamente la estructura de las tablas externas.

## Elegir el tipo de relación

Los tipos de relación más comunes son los siguientes:

| Tipo de relación | Caso de uso |
| --- | --- |
| [Uno a uno](./o2o/index.md) | Un registro solo se relaciona con un registro de otra tabla. Por ejemplo, un empleado se relaciona con un expediente de incorporación. |
| [Uno a muchos](./o2m/index.md) | Un registro se relaciona con varios registros de otra tabla. Por ejemplo, un cliente se relaciona con varios pedidos. |
| [Muchos a uno](./m2o/index.md) | Varios registros se relacionan con un mismo registro de destino. Por ejemplo, varios pedidos se relacionan con el mismo cliente. |
| [Muchos a muchos](./m2m/index.md) | Dos tablas pueden relacionarse mutuamente con varios registros. Por ejemplo, los estudiantes y los cursos pueden relacionarse entre sí. |
| [Muchos a muchos (array)](../../../field-m2m-array/index.md) | Utiliza un campo de tipo array para guardar los identificadores de varios registros de destino. Es adecuado para estructuras de tablas existentes que ya almacenan los valores de relación mediante arrays. |

Como regla general, primero hay que tener en cuenta el significado del negocio: si el registro actual solo pertenece a un registro de destino, normalmente se utiliza una relación muchos a uno; si el registro actual necesita mostrar varios registros de la tabla de destino, normalmente se utiliza una relación uno a muchos; si ambos lados pueden relacionarse con varios registros, normalmente se utiliza una relación muchos a muchos.

## Aspectos clave de la configuración

Al configurar un campo de relación, es importante confirmar lo siguiente:

- Tabla de datos de destino: la tabla con la que se establecerá la relación
- Tipo de relación: uno a uno, uno a muchos, muchos a uno, muchos a muchos o muchos a muchos mediante arrays
- Claves de relación: los campos utilizados para identificar los registros de ambos lados, normalmente una clave primaria, una clave foránea o un campo único
- Campo de título: el campo que se mostrará de forma predeterminada para los registros relacionados en los selectores y bloques

:::warning Atención

En las bases de datos externas, los campos de relación son principalmente metadatos de relación guardados por NocoBase. Añadir un campo de relación no crea automáticamente claves foráneas, índices ni tablas intermedias reales en la base de datos externa. Si necesitas restricciones de clave foránea a nivel de base de datos, configúralas primero en la base de datos y, después, vuelve a NocoBase para sincronizar y configurar el campo.

:::

## Enlaces relacionados

- [Uno a uno](./o2o/index.md) — Consulta la configuración de los campos de relación uno a uno
- [Uno a muchos](./o2m/index.md) — Consulta la configuración de los campos de relación uno a muchos
- [Muchos a uno](./m2o/index.md) — Consulta la configuración de los campos de relación muchos a uno
- [Muchos a muchos](./m2m/index.md) — Consulta la configuración de los campos de relación muchos a muchos
- [Muchos a muchos (array)](../../../field-m2m-array/index.md) — Consulta la relación muchos a muchos basada en arrays
