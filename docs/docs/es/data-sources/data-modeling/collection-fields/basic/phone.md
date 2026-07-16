---
title: "Número de teléfono"
description: "El campo de número de teléfono se utiliza para guardar números de teléfono, teléfonos de contacto y otros textos de tipo telefónico, y proporciona validación de formato."
keywords: "número de teléfono,phone,teléfono,información de contacto,NocoBase"
---

# Número de teléfono

## Introducción

En NocoBase, **Número de teléfono (Phone)** se utiliza para guardar números de teléfono o teléfonos de contacto.

El campo de número de teléfono es adecuado para teléfonos de clientes, contactos y empleados, entre otros datos de contacto. Es más apropiado que el texto normal para representar datos de tipo telefónico.

Si necesitas guardar varios números de teléfono o información de contacto compleja, puedes utilizar [Texto multilínea](./textarea.md) o crear una tabla de contactos independiente.

## Casos de uso

El campo de número de teléfono es adecuado para estos escenarios empresariales:

- Números de teléfono de clientes y teléfonos de contacto
- Números de teléfono de empleados y teléfonos alternativos
- Teléfonos de contacto de tiendas y líneas de atención
- Números para notificaciones por SMS

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Número de teléfono» para crear un campo de número de teléfono.

![20240512175526](https://static-docs.nocobase.com/20240512175526.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El número de teléfono corresponde a `phone`, que determina cómo se introduce y se muestra en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, como «Número de teléfono», «Teléfono de contacto» o «Línea de atención». Se recomienda utilizar un nombre que el personal empresarial pueda comprender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. El tipo predeterminado del campo de número de teléfono es `string`. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente con el valor predeterminado. |
| Validation rules | Reglas de validación. Se pueden configurar la longitud, las expresiones regulares o la obligatoriedad. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, la fuente de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Después de crear el nombre del campo, este será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar los costes de ajuste de configuración que puedan surgir posteriormente.

:::

## Características del campo

El comportamiento predeterminado del campo de número de teléfono es el siguiente:

| Característica | Descripción |
| --- | --- |
| Default Field interface | `phone`. |
| Default Field type | `string`. |
| Field type opcional | `string`. |
| Componente de página | En el modo de edición se utiliza un cuadro de entrada y se puede configurar la validación del formato telefónico. |
| Filtrado | Admite filtros de texto, como contiene, es igual a, está vacío y no está vacío. |
| Ordenación | Admite la ordenación en los bloques de tabla. |
| Validación | Admite validaciones de longitud, expresiones regulares, obligatoriedad, etc. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar su configuración. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla de la base de datos principal que ya se ha sincronizado, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Admite edición según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El ajuste afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Admite edición según las condiciones | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el ajuste, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado de los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, la fuente de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale a modificar simplemente un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y la forma de utilizar las variables en los flujos de trabajo. Cuando ya hay muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de número de teléfono. En la base de datos principal también puedes seleccionar varios campos y eliminarlos en bloque.

Al eliminar un campo de número de teléfono creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de número de teléfono es adecuado para utilizarlo en formularios, detalles, filtros y notificaciones.
![20260709224555](https://static-docs.nocobase.com/20260709224555.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir un número de teléfono o un teléfono de contacto. |
| Bloque de detalles | Mostrar información de contacto. |
| Bloque de filtrado | Filtrar registros por número de teléfono o por un fragmento del número. |
| Flujos de trabajo y notificaciones | Servir como fuente de números para notificaciones por SMS o llamadas telefónicas. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de asignación de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y administra campos en una tabla normal
- [Texto de una sola línea](./input.md) — Guarda textos cortos normales
- [Correo electrónico](./email.md) — Guarda direcciones de correo electrónico
