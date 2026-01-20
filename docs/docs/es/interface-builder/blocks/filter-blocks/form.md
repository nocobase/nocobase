:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Formulario de filtro

## Introducción

El formulario de filtro permite a los usuarios filtrar datos rellenando los campos del formulario. Puede utilizarse para filtrar bloques de tabla, bloques de gráfico, bloques de lista y más.

## Cómo utilizarlo

Comencemos con un ejemplo sencillo para comprender rápidamente cómo utilizar el formulario de filtro. Supongamos que tenemos un bloque de tabla con información de usuario y queremos filtrar los datos utilizando un formulario de filtro, como se muestra a continuación:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Los pasos de configuración son los siguientes:

1. Active el modo de edición y añada un bloque de "Formulario de filtro" y un "Bloque de tabla" a la página.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Añada el campo "Apodo" tanto al bloque de tabla como al bloque de formulario de filtro.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Ahora ya puede empezar a utilizarlo.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Uso avanzado

El bloque de formulario de filtro admite configuraciones más avanzadas. A continuación, le mostramos algunos casos de uso comunes.

### Conectar varios bloques

Un único campo de formulario puede filtrar datos en varios bloques simultáneamente. Así es como se hace:

1. Haga clic en la opción de configuración "Connect fields" del campo.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Añada los bloques de destino que desea conectar. En este ejemplo, seleccionaremos el bloque de lista de la página.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Seleccione uno o más campos del bloque de lista para conectar. Aquí seleccionamos el campo "Apodo".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Haga clic en el botón de guardar para completar la configuración. El resultado se muestra a continuación:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Conectar bloques de gráfico

Referencia: [Filtros de página y vinculación](../../../data-visualization/guide/filters-and-linkage.md)

### Campos personalizados

Además de seleccionar campos de las **colecciones**, también puede crear campos de formulario utilizando "Campos personalizados". Por ejemplo, puede crear un campo de selección desplegable con opciones personalizadas. Así es como se hace:

1. Haga clic en la opción "Campos personalizados" para abrir el panel de configuración.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Rellene el título del campo, seleccione "Select" como modelo de campo y configure las opciones.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Los campos personalizados recién añadidos deben conectarse manualmente a los campos de los bloques de destino. Así es como se hace:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Configuración completada. El resultado se muestra a continuación:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Los modelos de campo actualmente compatibles son:

- `Input`: Campo de texto de una sola línea
- `Number`: Campo de entrada numérica
- `Date`: Selector de fecha
- `Select`: Desplegable (puede configurarse para selección única o múltiple)
- `Radio group`: Botones de radio
- `Checkbox group`: Casillas de verificación

### Plegado

Añada un botón de plegado para contraer y expandir el contenido del formulario de filtro, ahorrando espacio en la página.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Se admiten las siguientes configuraciones:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Filas plegadas**: Establece cuántas filas de campos de formulario se muestran en el estado plegado.
- **Plegado por defecto**: Cuando está activado, el formulario de filtro se muestra plegado por defecto.