:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/event-flow).
:::

# Flujo de eventos

## Introducción

Si desea activar algunas acciones personalizadas cuando cambia un formulario, puede utilizar el flujo de eventos para lograrlo. Además de los formularios, las páginas, los bloques, los botones y los campos también pueden utilizar flujos de eventos para configurar algunas operaciones personalizadas.

## Cómo usarlo

A continuación, se utilizará un ejemplo sencillo para explicar cómo configurar un flujo de eventos. Implementemos una vinculación entre dos tablas: al hacer clic en una fila de la tabla izquierda, se filtrarán automáticamente los datos de la tabla derecha.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Los pasos de configuración son los siguientes:

1. Haga clic en el icono de «rayo» en la esquina superior derecha del bloque de tabla izquierdo para abrir la interfaz de configuración del flujo de eventos.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Haga clic en «Agregar flujo de eventos (Add event flow)», seleccione «Clic en fila» como «Evento desencadenante», lo que indica que se activará al hacer clic en una fila de la tabla.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Configure el «Momento de ejecución», que se utiliza para controlar el orden de este flujo de eventos en relación con los procesos integrados del sistema. Generalmente, mantenga el valor predeterminado; si desea mostrar un aviso o redirigir después de que se ejecute la lógica integrada, puede elegir «Después de todos los flujos». Consulte más detalles a continuación en [Momento de ejecución](#momento-de-ejecución).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. La «Condición desencadenante (Trigger condition)» se utiliza para configurar condiciones; el flujo de eventos solo se activará cuando se cumplan las condiciones. Aquí no necesitamos configurarla, ya que cualquier clic en la fila activará el flujo de eventos.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Pase el ratón sobre «Agregar paso (Add step)» para añadir algunos pasos de operación. Seleccionamos «Establecer alcance de datos (Set data scope)» para configurar el alcance de datos de la tabla derecha.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Copie el UID de la tabla derecha y péguelo en el cuadro de entrada «UID del bloque de destino (Target block UID)». Inmediatamente se mostrará una interfaz de configuración de condiciones, donde podrá configurar el alcance de datos de la tabla derecha.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Configuremos una condición, como se muestra en la siguiente imagen:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Después de configurar el alcance de datos, es necesario actualizar el bloque para que se muestren los resultados del filtrado. A continuación, configuremos la actualización del bloque de la tabla derecha. Agregue un paso de «Actualizar bloques de destino (Refresh target blocks)» y luego ingrese el UID de la tabla derecha.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Finalmente, haga clic en el botón de guardar en la esquina inferior derecha y la configuración estará completa.

## Eventos详解

### Antes de renderizar

Evento universal que se puede utilizar en páginas, bloques, botones o campos. En este evento, se pueden realizar tareas de inicialización. Por ejemplo, configurar diferentes alcances de datos bajo diferentes condiciones.

### Clic en fila (Row click)

Evento exclusivo para bloques de tabla. Se activa al hacer clic en una fila de la tabla. Al activarse, se añade un «Clicked row record» al contexto, que puede utilizarse como variable en condiciones y pasos.

### Cambio de valores del formulario (Form values change)

Evento exclusivo para bloques de formulario. Se activa cuando cambia el valor de un campo del formulario. Puede obtener los valores del formulario a través de la variable «Current form» en las condiciones y pasos.

### Clic (Click)

Evento exclusivo para botones. Se activa al hacer clic en el botón.

## Momento de ejecución

En la configuración del flujo de eventos, hay dos conceptos que se confunden fácilmente:

- **Evento desencadenante:** Cuándo comenzar la ejecución (por ejemplo: Antes de renderizar, Clic en fila, Clic, Cambio de valores del formulario, etc.).
- **Momento de ejecución:** Después de que ocurra el mismo evento desencadenante, en qué posición del **proceso integrado** se debe insertar su **flujo de eventos personalizado** para ejecutarse.

### ¿Qué son los «procesos integrados / pasos integrados»?

Muchas páginas, bloques u operaciones incluyen por sí mismos un conjunto de procesos de procesamiento integrados en el sistema (por ejemplo: enviar, abrir ventana emergente, solicitar datos, etc.). Cuando agrega un nuevo flujo de eventos personalizado para el mismo evento (por ejemplo, «Clic»), el «Momento de ejecución» se utiliza para decidir:

- Si se ejecuta primero su flujo de eventos o primero la lógica integrada;
- O si se inserta su flujo de eventos antes o después de un paso específico del proceso integrado.

### ¿Cómo entender las opciones de momento de ejecución en la interfaz de usuario?

- **Antes de todos los flujos (predeterminado):** Se ejecuta primero. Adecuado para realizar «intercepción/preparación» (por ejemplo, validación, confirmación secundaria, inicialización de variables, etc.).
- **Después de todos los flujos:** Se ejecuta después de que se completa la lógica integrada. Adecuado para realizar «finalización/retroalimentación» (por ejemplo, mensajes de aviso, actualizar otros bloques, saltar de página, etc.).
- **Antes de un flujo específico / Después de un flujo específico:** Un punto de inserción más preciso. Tras seleccionarlo, debe elegir el «proceso integrado» específico.
- **Antes de un paso de flujo específico / Después de un paso de flujo específico:** El punto de inserción más preciso. Tras seleccionarlo, debe elegir tanto el «proceso integrado» como el «paso del proceso integrado».

> Sugerencia: Si no está seguro de qué proceso/paso integrado elegir, utilice prioritariamente las dos primeras opciones («Antes / Después»).

## Pasos详解

### Variable personalizada (Custom variable)

Se utiliza para definir una variable personalizada y luego usarla en el contexto.

#### Alcance

Las variables personalizadas tienen un alcance; por ejemplo, una variable definida en el flujo de eventos de un bloque solo puede usarse en ese bloque. Si desea que esté disponible en todos los bloques de la página actual, debe configurarla en el flujo de eventos de la página.

#### Variable de formulario (Form variable)

Utiliza el valor de un bloque de formulario específico como variable. La configuración específica es la siguiente:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Título de la variable
- Variable identifier: Identificador de la variable
- Form UID: UID del formulario

#### Otras variables

Próximamente se admitirán otras variables, por favor espérelo.

### Establecer alcance de datos (Set data scope)

Establece el alcance de datos del bloque de destino. La configuración específica es la siguiente:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID del bloque de destino
- Condition: Condiciones de filtrado

### Actualizar bloques de destino (Refresh target blocks)

Actualiza los bloques de destino, permitiendo configurar múltiples bloques. La configuración específica es la siguiente:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID del bloque de destino

### Navegar a URL (Navigate to URL)

Salta a una URL específica. La configuración específica es la siguiente:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: URL de destino, admite el uso de variables
- Search parameters: Parámetros de consulta en la URL
- Open in new window: Si se marca, se abrirá una nueva página del navegador al saltar

### Mostrar mensaje (Show message)

Muestra información de retroalimentación de la operación a nivel global.

#### Cuándo usarlo

- Puede proporcionar información de retroalimentación como éxito, advertencia y error.
- Se muestra centrado en la parte superior y desaparece automáticamente; es una forma ligera de aviso que no interrumpe las operaciones del usuario.

#### Configuración específica

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Tipo de aviso
- Message content: Contenido del aviso
- Duration: Cuánto tiempo dura, en segundos

### Mostrar notificación (Show notification)

Muestra información de alerta de notificación a nivel global.

#### Cuándo usarlo

Muestra información de alerta de notificación en las cuatro esquinas del sistema. Se utiliza frecuentemente en los siguientes casos:

- Contenido de notificación relativamente complejo.
- Notificaciones con interacción, que ofrecen al usuario puntos de acción para el siguiente paso.
- Envío activo por parte del sistema.

#### Configuración específica

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Tipo de notificación
- Notification title: Título de la notificación
- Notification description: Descripción de la notificación
- Placement: Posición, las opciones incluyen: superior izquierda, superior derecha, inferior izquierda, inferior derecha

### Ejecutar JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Ejecuta código JavaScript.

## Ejemplo

### Formulario: llamar a una API de terceros para completar campos

Escenario: activar un flujo de eventos en un formulario, solicitar una API de terceros y, tras obtener los datos, completarlos automáticamente en los campos del formulario.

Pasos de configuración:

1. Abra la configuración del flujo de eventos en el bloque de formulario y añada un nuevo flujo de eventos;
2. Seleccione «Antes de renderizar» como evento desencadenante;
3. Seleccione «Después de todos los flujos» como momento de ejecución;
4. Añada el paso «Ejecutar JavaScript (Execute JavaScript)», pegue y modifique el siguiente código según sea necesario:

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// reemplace con el nombre real del campo
ctx.form.setFieldsValue({ username });
```