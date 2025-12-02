:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Flujo de eventos

## Introducción

Si desea activar acciones personalizadas cuando un formulario cambia, puede usar un flujo de eventos. Además de los formularios, las páginas, los bloques, los botones y los campos también pueden utilizar flujos de eventos para configurar operaciones personalizadas.

## Cómo usarlo

A continuación, le mostraremos cómo configurar un flujo de eventos con un ejemplo sencillo. Crearemos una vinculación entre dos tablas: al hacer clic en una fila de la tabla izquierda, los datos de la tabla derecha se filtrarán automáticamente.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Los pasos de configuración son los siguientes:

1. Haga clic en el icono de "rayo" en la esquina superior derecha del bloque de la tabla izquierda para abrir la interfaz de configuración del flujo de eventos.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Haga clic en "Agregar flujo de eventos" y, en "Evento desencadenante", seleccione "Clic en fila". Esto indica que el flujo se activará al hacer clic en una fila de la tabla.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. La "Condición desencadenante" se utiliza para configurar las condiciones. El flujo de eventos solo se activará cuando se cumplan estas condiciones. En este caso, no necesitamos configurar ninguna, por lo que el flujo se activará con cualquier clic en una fila.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Pase el ratón sobre "Agregar paso" para añadir pasos de operación. Seleccionaremos "Establecer alcance de datos" para configurar el alcance de datos de la tabla derecha.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Copie el UID de la tabla derecha y péguelo en el campo de entrada "UID del bloque de destino". Inmediatamente aparecerá una interfaz de configuración de condiciones donde podrá definir el alcance de datos para la tabla derecha.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Configuremos una condición, como se muestra a continuación:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Después de configurar el alcance de datos, deberá actualizar el bloque para que se muestren los resultados filtrados. A continuación, configuraremos la actualización del bloque de la tabla derecha. Agregue un paso de "Actualizar bloques de destino" y luego ingrese el UID de la tabla derecha.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Finalmente, haga clic en el botón de guardar en la esquina inferior derecha para completar la configuración.

## Eventos

### Antes de renderizar

Este es un evento universal que se puede utilizar en páginas, bloques, botones o campos. En este evento, puede realizar tareas de inicialización, como configurar diferentes alcances de datos según distintas condiciones.

### Clic en fila

Evento exclusivo para bloques de tabla. Se activa al hacer clic en una fila de la tabla. Cuando se activa, añade un "Registro de fila clicada" (Clicked row record) al contexto, que puede utilizarse como variable en condiciones y pasos.

### Cambio de valores del formulario

Evento exclusivo para bloques de formulario. Se activa cuando cambian los valores de los campos del formulario. Puede obtener los valores del formulario a través de la variable "Formulario actual" (Current form) en las condiciones y pasos.

### Clic

Evento exclusivo para botones. Se activa al hacer clic en el botón.

## Pasos

### Variable personalizada

Se utiliza para definir una variable personalizada y luego usarla en el contexto.

#### Alcance

Las variables personalizadas tienen un alcance. Por ejemplo, una variable definida en el flujo de eventos de un bloque solo puede usarse dentro de ese bloque. Si desea que una variable esté disponible en todos los bloques de la página actual, deberá configurarla en el flujo de eventos de la página.

#### Variable de formulario

Utiliza los valores de un bloque de formulario específico como variable. La configuración es la siguiente:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Título de la variable: Título de la variable
- Identificador de la variable: Identificador de la variable
- UID del formulario: UID del formulario

#### Otras variables

Próximamente se añadirán más tipos de variables. ¡Esté atento!

### Establecer alcance de datos

Establece el alcance de datos para un bloque de destino. La configuración es la siguiente:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- UID del bloque de destino: UID del bloque de destino
- Condición: Condición de filtro

### Actualizar bloques de destino

Actualiza los bloques de destino. Permite configurar varios bloques. La configuración es la siguiente:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- UID del bloque de destino: UID del bloque de destino

### Navegar a URL

Navega a una URL específica. La configuración es la siguiente:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL de destino, admite el uso de variables
- Parámetros de búsqueda: Parámetros de consulta en la URL
- Abrir en nueva ventana: Si está marcado, abrirá la URL en una nueva pestaña del navegador.

### Mostrar mensaje

Muestra mensajes de retroalimentación de operaciones a nivel global.

#### Cuándo usarlo

- Puede proporcionar mensajes de retroalimentación de éxito, advertencia y error.
- Se muestra centrado en la parte superior y desaparece automáticamente, ofreciendo una forma ligera de notificación que no interrumpe las operaciones del usuario.

#### Configuración

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Tipo de mensaje: Tipo de mensaje
- Contenido del mensaje: Contenido del mensaje
- Duración: Tiempo de visualización (en segundos)

### Mostrar notificación

Muestra alertas de notificación a nivel global.

#### Cuándo usarlo

Muestra alertas de notificación en las cuatro esquinas del sistema. Se utiliza comúnmente en los siguientes casos:

- Contenido de notificación más complejo.
- Notificaciones interactivas que ofrecen al usuario los siguientes pasos a seguir.
- Notificaciones iniciadas por el sistema.

#### Configuración

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Tipo de notificación: Tipo de notificación
- Título de la notificación: Título de la notificación
- Descripción de la notificación: Descripción de la notificación
- Posición: Ubicación, opciones disponibles: superior izquierda, superior derecha, inferior izquierda, inferior derecha.

### Ejecutar JavaScript

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Ejecuta código JavaScript.