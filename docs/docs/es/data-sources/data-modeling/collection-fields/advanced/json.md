---
title: "JSON"
description: "El campo JSON se utiliza para guardar objetos estructurados, matrices, fragmentos de respuestas de API y otros datos semiestructurados."
keywords: "JSON,json,datos estructurados,NocoBase"
---

# JSON

## Introducción

En NocoBase, **JSON (JSON)** se utiliza para guardar datos estructurados o semiestructurados.

Los campos JSON son adecuados para guardar fragmentos de respuestas de interfaces externas, configuraciones ampliadas, propiedades dinámicas y otros datos cuya estructura no es fija. Son flexibles, pero más difíciles de filtrar, validar y mostrar que los campos comunes.

Si la estructura del campo es estable, es preferible dividirla en campos específicos para facilitar la configuración de páginas, los permisos, los filtros y el uso en flujos de trabajo.

## Casos de uso

JSON es adecuado para estos escenarios empresariales:

- Respuestas sin procesar de interfaces externas
- Propiedades de extensión dinámicas
- Objetos de configuración complejos
- Guardar temporalmente datos que no se pueden dividir de forma estructurada

## Crear configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «JSON» para crear un campo JSON.

![20240512173905](https://static-docs.nocobase.com/20240512173905.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. JSON corresponde a `json` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre que se muestra para el campo en la interfaz, por ejemplo, «Información adicional», «Respuesta de la interfaz» o «Configuración». Se recomienda utilizar un nombre que los usuarios empresariales puedan entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, los campos de relación, los permisos, los flujos de trabajo, etc. Normalmente no se modifica después de su creación; solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. Los campos JSON suelen utilizar `json` o `jsonb`. |
| Default value | Valor predeterminado. Al crear un registro nuevo, si el usuario no introduce ningún valor, se puede completar automáticamente con este valor. |
| Validation rules | Reglas de validación. Normalmente comprueban si se trata de un JSON válido o si el campo es obligatorio. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de configuración posteriores por tener que modificarlo.

:::

## Características del campo

El comportamiento predeterminado de los campos JSON es el siguiente:

| Característica | Descripción |
| --- | --- |
| Field interface predeterminada | `json`. |
| Field type predeterminado | `json`. |
| Field type opcional | `json`, `jsonb`, según las capacidades de la base de datos. |
| Componente de página | En el modo de edición, utiliza un componente de edición JSON o un componente de entrada de texto. |
| Filtrado | La capacidad de filtrado depende de la base de datos y de la asignación del campo; normalmente no se utiliza como campo de filtrado principal. |
| Ordenación | Normalmente no se utiliza para ordenar. |
| Validación | Admite validaciones como JSON válido y campo obligatorio. |

## Editar configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo JSON. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, el valor predeterminado, las reglas de validación o la configuración específica del campo.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, la edición normalmente consiste en realizar una asignación de campos: asignar el campo de la base de datos al Field type y al Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz, sin cambiar el nombre identificador del campo. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. El cambio afectará a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Condicionalmente | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante la asignación de campos. Antes de realizar el cambio, es necesario confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Default value | Sí | Ajusta el valor predeterminado para los nuevos registros. |
| Validation rules | Sí | Ajusta las reglas de validación del campo. |
| Description | Sí | Añade información sobre el significado del campo, los requisitos de cumplimentación, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Atención

Cambiar el Field type o el Field interface no equivale simplemente a modificar un nombre mostrado. Esto afecta a la forma de almacenamiento del campo, al componente de entrada, a las reglas de validación, a las condiciones de filtrado y a la forma de utilizar las variables en los flujos de trabajo. Cuando ya existen muchos datos, confirma primero que el formato de los datos sea compatible.

:::

## Eliminar campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo JSON. En la base de datos principal también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo JSON creado en la base de datos principal, normalmente también se eliminan la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde la base de datos o asignado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondientes.

:::danger Advertencia

Eliminar un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma que el campo ya no sea utilizado por ninguna configuración empresarial.

:::

## Uso en la configuración de páginas

Los campos JSON son adecuados para escenarios de integración y configuración ampliada.
![20260710151854](https://static-docs.nocobase.com/20260710151854.png)

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Introducir o editar datos JSON. |
| Bloque de detalles | Mostrar contenido estructurado. |
| Flujo de trabajo | Guardar o leer fragmentos devueltos por interfaces externas. |
| API | Transmitir o devolver el campo como un objeto ampliado. |

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, las categorías y la lógica de asignación de los campos
- [Tablas comunes](../../../data-source-main/general-collection.md) — Crear y administrar campos en tablas comunes
- [Texto multilínea](../basic/textarea.md) — Guardar contenido de texto sin formato de gran extensión
- [Fórmula](../../../field-formula/index.md) — Calcular resultados a partir de campos