---
title: "Región administrativa de China"
description: "El campo de región administrativa de China se utiliza para guardar información sobre provincias, ciudades, distritos y condados de China. Admite la selección en cascada de tres niveles y la visualización por niveles."
keywords: "región administrativa de China, provincia-ciudad-distrito, campo de división administrativa, vinculación de tres niveles,NocoBase"
---

# Región administrativa de China

<PluginInfo name="field-china-region"></PluginInfo>

## Introducción

En NocoBase, **China region** se utiliza para guardar información sobre las divisiones administrativas de China, como provincias, ciudades, distritos y condados.

El campo de región administrativa de China se basa en la tabla de datos de divisiones administrativas integrada `chinaRegions` y utiliza un selector en cascada para introducir los datos en la página. Los usuarios pueden seleccionar sucesivamente la provincia, la ciudad y el distrito según la jerarquía. Al visualizarse, se combinan por nivel para formar la ruta completa.

Si necesitas guardar información detallada como la calle o el número de la dirección, puedes utilizarlo junto con los campos de [texto de una sola línea](../basic/input.md) o [texto multilínea](../basic/textarea.md).

## Casos de uso

El campo de región administrativa de China es adecuado para estos escenarios empresariales:

- Ubicación de clientes, contactos, tiendas y proyectos
- Lugar de registro del domicilio, lugar de origen, región de recepción y otra información básica de direcciones
- Áreas de servicio, regiones de ventas y zonas de implementación de proyectos
- Datos que deben filtrarse o agruparse por provincia, ciudad y distrito

## Creación y configuración

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Región administrativa de China» para crear un campo de región administrativa de China.

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

| Configuración | Descripción |
| --- | --- |
| Field interface | Tipo de interfaz del campo. Para la región administrativa de China corresponde a `chinaRegion` y determina cómo se introducen y muestran los datos en la página. |
| Field display name | Nombre con el que se muestra el campo en la interfaz, por ejemplo, «Ubicación», «Área de servicio» o «Región de recepción». Se recomienda utilizar un nombre que el personal empresarial pueda entender directamente. |
| Field name | Nombre identificador del campo, utilizado para referencias internas en la API, campos de relación, permisos, flujos de trabajo, etc. Normalmente no se modifica después de su creación. Solo admite letras, números y guiones bajos, y debe comenzar por una letra. |
| Field type | Tipo del campo en la capa de datos. La región administrativa de China normalmente se guarda como un registro relacionado o un valor estructurado, según la configuración del campo. |
| Nivel de selección | Controla el nivel más profundo que se puede seleccionar. Actualmente admite «Provincia», «Ciudad» y «Distrito», y el valor predeterminado es «Distrito». |
| Selección obligatoria hasta el último nivel | Cuando está activada, el usuario debe seleccionar hasta el nivel más profundo configurado para poder enviar el formulario; cuando está desactivada, puede completar la selección en un nivel intermedio. |
| Validation rules | Reglas de validación. Normalmente se configuran como obligatorias y se establece el nivel de selección. |
| Description | Descripción del campo. Es adecuada para indicar el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Nota

El nombre del campo será utilizado por los bloques de página, los permisos, los flujos de trabajo y la API. Confirma el nombre antes de crearlo para evitar costes de ajuste de configuración posteriores.

:::

## Características del campo

El comportamiento predeterminado del campo de región administrativa de China es el siguiente:

| Característica | Descripción |
| --- | --- |
| Default Field interface | `chinaRegion`. |
| Fuente de datos | Tabla de datos de divisiones administrativas integrada `chinaRegions`. |
| Componente de página | En el modo de edición se utiliza un selector en cascada. |
| Nivel de selección | Actualmente admite tres niveles: provincia, ciudad y distrito. |
| Forma de visualización | En el modo de lectura se muestra por niveles como `省 / 市 / 区`. |
| Filtrado | Admite el filtrado por los valores de región guardados. Las capacidades concretas dependen de la configuración del campo y del bloque de página. |
| Selección múltiple | No se admite la selección múltiple. |

## Edición de la configuración

Después de crear el campo, haz clic en «Edit» a la derecha del campo para editar la configuración del campo de región administrativa de China. La edición del campo se utiliza principalmente para ajustar cómo se muestra y se utiliza el campo en NocoBase, por ejemplo, para modificar el nombre mostrado, la descripción, las reglas de validación, el nivel de selección o si es obligatorio seleccionar hasta el último nivel.

Si el campo procede de una tabla ya sincronizada en la base de datos principal, normalmente la edición consiste en realizar un mapeo de campos: asignar el campo de la base de datos a los valores Field type y Field interface de NocoBase.

| Configuración | Se puede editar | Descripción |
| --- | --- | --- |
| Field display name | Sí | Modifica el nombre mostrado del campo en la interfaz sin cambiar su nombre identificador. |
| Field name | No | Normalmente, el nombre identificador del campo no se puede modificar en el formulario de edición después de su creación. |
| Field interface | Depende de la configuración | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. El cambio afecta a la forma de introducir, mostrar y validar los datos en la página. |
| Field type | Depende de la configuración | Los campos de la base de datos principal o los campos sincronizados se pueden ajustar durante el mapeo de campos. Antes de hacerlo, debes confirmar que los datos existentes se puedan utilizar con el nuevo tipo. |
| Nivel de selección | Sí | Ajusta si el campo permite seleccionar hasta la provincia, la ciudad o el distrito. |
| Selección obligatoria hasta el último nivel | Sí | Controla si, al enviar el formulario, es obligatorio seleccionar hasta el nivel más profundo configurado. |
| Validation rules | Sí | Ajusta las reglas de validación, como la obligatoriedad del campo. |
| Description | Sí | Añade el significado del campo, los requisitos de introducción, el origen de los datos o la persona responsable del mantenimiento. |

:::warning Nota

El campo de región administrativa de China depende de la tabla de datos `chinaRegions` proporcionada por el complemento. Antes de utilizarlo, asegúrate de que el complemento de campo «Divisiones administrativas de China» esté habilitado.

:::

## Eliminación del campo

Haz clic en «Delete» a la derecha del campo para eliminar el campo de región administrativa de China. En la base de datos principal, también puedes seleccionar varios campos y eliminarlos por lotes.

Al eliminar un campo de región administrativa de China creado en la base de datos principal, normalmente también se elimina la columna real correspondiente de la base de datos y los datos que ya contiene. Al eliminar un campo sincronizado desde la base de datos o mapeado desde una fuente de datos externa, el alcance del impacto depende de la fuente de datos y del origen del campo correspondiente.

:::danger Advertencia

La eliminación de un campo puede afectar a los bloques de página, formularios, filtros, permisos, flujos de trabajo, API, importaciones y exportaciones, así como a los datos existentes. Antes de eliminarlo, confirma si el campo sigue siendo utilizado por alguna configuración empresarial.

:::

## Uso en la configuración de páginas

El campo de región administrativa de China es adecuado para escenarios de direcciones, regiones y estadísticas.

| Escenario | Uso |
| --- | --- |
| Bloque de formulario | Utilizar un selector en cascada para seleccionar la provincia, la ciudad y el distrito o condado. |
| Bloque de detalles | Mostrar la ruta de la división administrativa. |
| Bloque de tabla | Mostrar la región a la que pertenece el registro. |
| Bloque de filtros | Filtrar registros por región. |
| Bloque de gráficos | Agrupar los datos empresariales por provincia, ciudad y distrito. |

### Modo de edición

En el modo de edición, el campo de región administrativa de China se muestra como un selector en cascada.

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

### Modo de lectura

En el modo de lectura, el campo de región administrativa de China se muestra como una ruta de texto, por ejemplo:

```text
北京市 / 市辖区 / 东城区
```

## Enlaces relacionados

- [Campos](../index.md) — Conoce la función, clasificación y lógica de mapeo de los campos
- [Tabla normal](../../../data-source-main/general-collection.md) — Crea y gestiona campos en una tabla normal
- [Texto de una sola línea](../basic/input.md) — Guarda direcciones detalladas
- [Texto multilínea](../basic/textarea.md) — Guarda descripciones de direcciones más extensas