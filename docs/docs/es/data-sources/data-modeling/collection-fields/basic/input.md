---
title: "Texto de una sola línea"
description: "El campo de texto de una sola línea se utiliza para guardar nombres, números, títulos, contactos y otros textos breves. De forma predeterminada, utiliza el tipo string y el campo de entrada Input."
keywords: "texto de una sola línea,input,campo de texto,string,Field interface,NocoBase"
---

# Texto de una sola línea

## Introducción

En NocoBase, **el texto de una sola línea (Single line text)** es el campo de texto más utilizado. Es adecuado para guardar textos breves de no más de una línea, como nombres de clientes, números de pedido, contactos, resúmenes de direcciones y números de sistemas externos.

El campo de texto de una sola línea utiliza de forma predeterminada el campo de entrada `Input`, y su Field type predeterminado es `string`. Puede utilizarse como campo de título y también participar en filtros, ordenación, permisos, condiciones de flujos de trabajo y consultas de API.

Si el contenido puede necesitar saltos de línea o ser más extenso, se recomienda elegir [texto de varias líneas](./textarea.md). Si el contenido tiene un formato fijo, como un correo electrónico, un número de teléfono o una URL, es preferible elegir el campo especializado correspondiente.

## Casos de uso

El texto de una sola línea es adecuado para estos escenarios empresariales:

- Nombres de clientes, nombres de empresas y nombres de contactos
- Números de pedido, números de contrato y números de proyecto
- Títulos de tareas, títulos de tickets y títulos de artículos
- ID de sistemas externos, números de sincronización y códigos empresariales
- Ciudades, resúmenes de direcciones, nombres de tiendas y otra información breve

## Crear y configurar

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Single line text» para crear un campo de texto de una sola línea.

![20240512163555](https://static-docs.nocobase.com/20240512163555.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. El texto de una sola línea corresponde a `input` y, de forma predeterminada, la página utiliza un campo de entrada para introducir y mostrar el contenido. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, como «Nombre del cliente», «Número de pedido» o «Título de la tarea». Se recomienda utilizar un nombre que los usuarios empresariales puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en API, campos de relación, permisos, flujos de trabajo, etc. Por lo general, no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. De forma predeterminada, el texto de una sola línea es `string`, aunque también se puede seleccionar `uid`. Para textos breves comunes, `string` suele ser suficiente. |
| Automatically remove heading and tailing spaces | Elimina automáticamente los espacios iniciales y finales. Es adecuado para contenidos como nombres de clientes, números y títulos en los que no se desea conservar dichos espacios. |
| Default value | Valor predeterminado. Al crear un registro, si el usuario no introduce ningún valor, se puede completar automáticamente este texto predeterminado. |
| Primary | Utiliza el campo como clave principal. Solo está disponible al crear campos en la base de datos principal; no se recomienda utilizar textos empresariales comunes como clave principal. |
| Unique | Restricción de unicidad. Es adecuada para textos que no pueden repetirse, como números de pedido, números de contrato e ID de sistemas externos. |
| Validation rules | Reglas de validación. Permiten limitar la longitud mínima, la longitud máxima, una longitud fija o una expresión regular. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Una vez creado, el nombre del campo será utilizado como referencia por los bloques de página, los permisos, los flujos de trabajo y las API. Confirma el nombre antes de crear el campo para evitar el coste de ajustar la configuración posteriormente.

:::

## Características del campo

El comportamiento predeterminado del campo de texto de una sola línea es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminado | `input`. |
| Field type predeterminado | `string`. |
| Field type disponibles | `string` y `uid`. |
| Componente de página | En el modo de edición, utiliza el campo de entrada `Input`. |
| Campo de título | Admite su uso como campo de título de la tabla de datos. Es adecuado establecer «Nombre del cliente», «Número de pedido» o «Título de la tarea» como campo de título. |
| Ordenación | Admite la ordenación en los bloques de tabla. |
| Filtrado | Admite filtros de texto, como contiene, no contiene, es igual a, no es igual a, está vacío y no está vacío. |
| Validación | Admite validaciones de longitud mínima, longitud máxima, longitud fija y expresión regular, entre otras. |

## Editar la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del texto de una sola línea. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o si se eliminan automáticamente los espacios iniciales y finales.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos a un Field type y un Field interface de NocoBase. Por ejemplo, las columnas de texto breve `varchar`, `char`, etc. de la base de datos se pueden asignar a un campo de texto de una sola línea.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar su nombre identificador. |
| Field name | No | Por lo general, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afecta a la introducción, la visualización y la validación en la página. |
| Field type | Condicional | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Automatically remove heading and tailing spaces | Sí | Controla si se eliminan los espacios iniciales y finales al guardar. |
| Default value | Sí | Ajusta el texto predeterminado de los registros nuevos. |
| Unique | Condicional | Se puede configurar al crear campos en la base de datos principal. Si ya existen valores duplicados en los datos, la adición de una restricción de unicidad puede fallar. |
| Validation rules | Sí | Ajusta las validaciones de longitud, formato o expresión regular. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, el componente de entrada, las reglas de validación, las condiciones de filtrado y el modo de uso de las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que su formato sea compatible.

:::

## Eliminar el campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de texto de una sola línea. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos en lote.

Al eliminar un campo de texto de una sola línea creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos existentes en ella. Al eliminar un campo sincronizado desde una base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos de texto de una sola línea se pueden utilizar en la mayoría de los bloques de datos y formularios.

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir o editar textos breves, como nombres de clientes, números de pedido y títulos de tareas. |
| Bloque de tabla | Mostrar, ordenar y filtrar textos breves. Cuando el contenido es más largo, la tabla lo muestra truncado según la configuración de la interfaz. |
| Bloque de detalles | Mostrar la información de texto de un registro individual. |
| Bloque de filtrado | Utilizarlo como condición de consulta para filtrar registros, por ejemplo, por nombre de cliente, número o título. |
| Visualización de campos de relación | Cuando el campo de texto de una sola línea se establece como campo de título, esta cadena de texto se muestra de forma prioritaria al seleccionar registros en un campo de relación. |
| Flujos de trabajo y permisos | Utilizarlo como campo de condición para realizar comprobaciones, por ejemplo, si el número de pedido está vacío o si el nombre del cliente contiene una palabra clave determinada. |

### Modo editable

En el modo editable, el campo de texto de una sola línea utiliza un campo de entrada para introducir el contenido.

![20240512164001](https://static-docs.nocobase.com/20240512164001.png)

### Modo de lectura

En el modo de lectura, el campo de texto de una sola línea se muestra como texto normal.

![20240512164138](https://static-docs.nocobase.com/20240512164138.png)