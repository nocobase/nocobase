---
title: "Contraseña"
description: "El campo de contraseña se utiliza para guardar entradas de tipo contraseña y se muestra enmascarado al introducirlo en la página."
keywords: "contraseña,password,entrada sensible,NocoBase"
---

# Contraseña

## Introducción

En NocoBase, **Contraseña (Password)** se utiliza para introducir contenido de tipo contraseña.

El campo de contraseña es adecuado para guardar contenido cuyo proceso de introducción deba ocultarse, como contraseñas de servicios externos o credenciales de acceso temporales. Su función principal es controlar la forma de introducción y visualización, por lo que no equivale a una solución completa de gestión de claves.

Para guardar claves altamente sensibles o credenciales de larga duración, se recomienda evaluar primero soluciones específicas de cifrado, gestión de claves o variables de entorno.

## Casos de uso

El campo de contraseña es adecuado para estos escenarios empresariales:

- Contraseñas temporales de sistemas externos
- Credenciales de acceso en configuraciones de conexión
- Texto sensible que solo necesita introducirse de forma enmascarada
- Códigos de verificación o contraseñas temporales en procesos internos

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Contraseña» para crear un campo de contraseña.

![20240512175917](https://static-docs.nocobase.com/20240512175917.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Contraseña corresponde a `password` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Contraseña de acceso», «Credencial de conexión» o «Contraseña temporal». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos de contraseña suelen utilizar `password` o `string`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Se pueden configurar la longitud, expresiones regulares o la obligatoriedad. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Después de crear el nombre del campo, este será utilizado por bloques de página, permisos, flujos de trabajo y la API. Confirma la nomenclatura antes de crear el campo para evitar costes posteriores de ajuste de la configuración.

:::

## Características del campo

El comportamiento predeterminado del campo de contraseña es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `password`. |
| Field type predeterminado | `password`. |
| Field type opcionales | `password`, `string`. |
| Componente de página | En el modo de edición se utiliza un cuadro de entrada de contraseña. |
| Filtrado | Normalmente no se recomienda utilizarlo como condición de filtrado. |
| Ordenación | Normalmente no se recomienda utilizarlo para ordenar. |
| Validación | Admite validaciones de longitud, expresiones regulares, obligatoriedad, etc. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campo: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Esto afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de hacerlo, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable de su mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando haya muchos datos existentes, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de contraseña. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de contraseña creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

Eliminar un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, la API, la importación y exportación, y los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de contraseña es adecuado para introducir texto sensible en formularios de configuración.
![20260709225244](https://static-docs.nocobase.com/20260709225244.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir la contraseña mediante un cuadro de entrada de contraseña. |
| Bloque de detalles | Mostrarla de forma enmascarada o restringida. |
| Permisos | Limitar quién puede ver o editar el campo de contraseña. |
| Flujos de trabajo | Utilizarlo como parámetro de solicitudes externas con precaución. |

## Enlaces relacionados

- [Campo](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla normal
- [Texto de una sola línea](./input.md) — Guarda texto corto común
