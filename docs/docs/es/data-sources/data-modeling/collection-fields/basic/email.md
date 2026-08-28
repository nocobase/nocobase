---
title: "Correo electrónico"
description: "El campo de correo electrónico se utiliza para guardar direcciones de correo y proporciona validación del formato."
keywords: "correo electrónico,email,información de contacto,NocoBase"
---

# Correo electrónico

## Introducción

En NocoBase, **Correo electrónico (Email)** se utiliza para guardar direcciones de correo electrónico.

El campo de correo electrónico es adecuado para direcciones de clientes, empleados, proveedores y otros datos de contacto. En comparación con el texto de una sola línea común, proporciona una semántica más clara para las direcciones de correo y validación de formato.

Si el contenido no es una dirección de correo electrónico, sino información de contacto común, es más adecuado elegir [Texto de una sola línea](./input.md).

## Casos de uso

El campo de correo electrónico es adecuado para estos escenarios empresariales:

- Direcciones de correo de clientes y contactos
- Direcciones de correo de empleados y de contacto para el inicio de sesión
- Direcciones de correo de proveedores y de servicios
- Direcciones de correo para recibir notificaciones

## Configuración de la creación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Correo electrónico» para crear un campo de correo electrónico.

![20240512175609](https://static-docs.nocobase.com/20240512175609.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para el correo electrónico corresponde a `email` y determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Correo del cliente», «Correo del contacto» o «Correo del destinatario». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de la creación. Solo admite letras, números y guiones bajos, y debe comenzar con una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el campo de correo electrónico es `string`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Normalmente se debe habilitar la validación del formato de correo electrónico; también se puede configurar como obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado como referencia por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar el trabajo adicional de ajustar la configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado del campo de correo electrónico es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminado | `email`. |
| Field type predeterminado | `string`. |
| Field type opcional | `string`. |
| Componente de página | En el modo de edición se utiliza un campo de entrada y se valida el formato del correo electrónico. |
| Filtrado | Admite filtros de texto, como contiene, es igual a, está vacío y no está vacío. |
| Ordenación | Admite la ordenación en los bloques de tabla. |
| Validación | Admite validaciones como el formato de correo electrónico y el carácter obligatorio. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre con el que se muestra el campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Depende de las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, confirma que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Complementa el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando ya hay muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de correo electrónico. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de correo electrónico creado en la base de datos principal, normalmente también se elimina la columna correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de correo electrónico es adecuado para utilizarlo en formularios, páginas de detalles y procesos de notificación.
![20260709224700](https://static-docs.nocobase.com/20260709224700.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir una dirección de correo electrónico. |
| Bloque de detalles | Mostrar una dirección de correo electrónico. |
| Bloque de filtrado | Filtrar registros por dirección de correo electrónico. |
| Flujos de trabajo y notificaciones | Utilizarlo como fuente de destinatarios para las notificaciones por correo electrónico. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, las categorías y la lógica de asignación de los campos
- [Tabla común](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla común
- [Texto de una sola línea](./input.md) — Guarda textos cortos comunes
- [Número de teléfono](./phone.md) — Guarda números de contacto
