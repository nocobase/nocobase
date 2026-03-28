:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/blocks/filter-blocks/form).
:::

# Formulario de filtro

## Introducción

El formulario de filtro permite a los usuarios filtrar datos completando los campos del formulario. Puede utilizarse para filtrar bloques de tabla, bloques de gráfico, bloques de lista, etc.

## Cómo utilizarlo

Comencemos con un ejemplo sencillo para conocer rápidamente el uso del formulario de filtro. Supongamos que tenemos un bloque de tabla que contiene información de usuarios y deseamos filtrar los datos a través de un formulario de filtro. Como se muestra a continuación:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Los pasos de configuración son los siguientes:

1. Active el modo de configuración, añada un bloque de "Formulario de filtro" y un "Bloque de tabla" en la página.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Añada el campo "Apodo" tanto en el bloque de tabla como en el bloque de formulario de filtro.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Ahora ya puede empezar a utilizarlo.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Uso avanzado

El bloque de formulario de filtro admite configuraciones más avanzadas. A continuación se presentan algunos usos comunes.

### Conectar múltiples bloques

Un solo campo de formulario puede filtrar datos de múltiples bloques al mismo tiempo. Los pasos específicos son los siguientes:

1. Haga clic en la opción de configuración "Connect fields" del campo.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Añada el bloque de destino que desea asociar; aquí seleccionamos el bloque de lista en la página.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Seleccione uno o más campos en el bloque de lista para asociarlos. Aquí seleccionamos el campo "Apodo".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Haga clic en el botón de guardar para completar la configuración. El efecto es el siguiente:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Conectar bloques de gráfico

Referencia: [Filtros de página y vinculación](../../../data-visualization/guide/filters-and-linkage.md)

### Campos personalizados

Además de seleccionar campos de la **colección**, también puede crear campos de formulario a través de "Campos personalizados". Por ejemplo, puede crear un campo de selección desplegable y personalizar las opciones. Los pasos específicos son los siguientes:

1. Haga clic en la opción "Campos personalizados" para abrir la interfaz de configuración.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Complete el título del campo, seleccione "Selección" en "Tipo de campo" y configure las opciones.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Los campos personalizados recién añadidos deben asociarse manualmente con los campos del bloque de destino. El método de operación es el siguiente:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Configuración completada, el efecto es el siguiente:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Los tipos de campos admitidos actualmente son:

- Cuadro de texto
- Número
- Fecha
- Selección
- Botón de radio
- Casilla de verificación
- Asociación

#### Asociación (Campo de relación personalizado)

La "Asociación" es adecuada para escenarios de "filtrado por registros de tablas asociadas". Por ejemplo, en una lista de pedidos, filtrar pedidos por "Cliente", o en una lista de tareas, filtrar tareas por "Responsable".

Descripción de los elementos de configuración:

- **Colección de destino**: Indica de qué colección se cargarán los registros seleccionables.
- **Campo de título**: Se utiliza como texto de visualización para las opciones desplegables y las etiquetas seleccionadas (como nombre o título).
- **Campo de valor**: Se utiliza como el valor enviado durante el filtrado real, generalmente se elige el campo de clave primaria (como `id`).
- **Permitir selección múltiple**: Al activarlo, se pueden seleccionar varios registros a la vez.
- **Operador**: Define cómo coinciden las condiciones de filtrado (ver la explicación de "Operador" más abajo).

Configuración recomendada:

1. En `Campo de título`, seleccione un campo con alta legibilidad (como "Nombre") para evitar que el uso de IDs puros afecte la usabilidad.
2. En `Campo de valor`, priorice el campo de clave primaria para garantizar un filtrado estable y único.
3. En escenarios de selección única, generalmente desactive `Permitir selección múltiple`; en escenarios de selección múltiple, actívelo y utilice el `Operador` adecuado.

#### Operador

El `Operador` se utiliza para definir la relación de coincidencia entre el "valor del campo del formulario de filtro" y el "valor del campo del bloque de destino".

### Plegado

Añada un botón de plegado para contraer y expandir el contenido del formulario de filtro, ahorrando espacio en la página.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Admite las siguientes configuraciones:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Filas a mostrar al plegar**: Establece el número de filas de campos del formulario que se muestran en estado contraído.
- **Plegado por defecto**: Al activarlo, el formulario de filtro se muestra en estado contraído por defecto.