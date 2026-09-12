# Capítulo 7: Dashboard — visión global de un vistazo

En el capítulo anterior usamos Workflow para que el sistema notifique automáticamente y registre fechas. El sistema es cada vez más inteligente, pero falta algo: **una visión global**.

¿Cuántos tickets hay? ¿Cuántos se han procesado? ¿Qué tipo de problemas predomina? ¿Cuántos se crean al día? Estas preguntas no se responden hojeando una lista. En este capítulo usaremos los [bloques de gráfico](/data-visualization) (circular, de líneas, de barras) y el [bloque Markdown](/interface-builder/blocks/other-blocks/markdown) para construir un **panel de datos** que convierta los datos en imágenes comprensibles a primera vista.

## 7.1 Añadir la página del dashboard

Primero, añadimos un nuevo elemento de menú en la barra de navegación superior.

Entre en el [modo de configuración](/get-started/how-nocobase-works); en el menú superior, pulse **«Añadir elemento de menú»** (icono `+`), seleccione **«Página versión nueva (v2)»** y póngale el nombre «Panel de datos».

![07-dashboard-2026-03-15-21-39-35](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-39-35.png)

Esta página se dedica a alojar gráficos: es la sede principal de nuestro dashboard.

## 7.2 Gráfico circular: distribución de estados de los tickets

Para el primer gráfico, usaremos un circular para mostrar cuántos tickets hay de cada tipo: «Pendiente, En proceso, Completado».

En la página del panel de datos, pulse **Crear [Block](/interface-builder/blocks) (Add block) → [Gráfico](/data-visualization)**.

Una vez añadido, pulse el botón **Configurar** de la esquina superior derecha y se abrirá el panel de configuración del gráfico a la derecha.

### Configurar la consulta de datos

- **[Tabla de datos](/data-sources/data-modeling/collection)**: seleccione «Tickets»
- **Medidas (Measures)**: seleccione cualquier [Field](/data-sources/data-modeling/collection-fields) único (p. ej., ID); método de agregación: **Recuento (Count)**
- **Dimensiones (Dimensions)**: seleccione el Field «Estado»

![07-dashboard-2026-03-15-21-44-32](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-44-32.png)

Pulse **Ejecutar consulta** y podrá previsualizar los datos devueltos abajo.

### Configurar opciones del gráfico

- **Tipo de gráfico**: seleccione **Gráfico circular**
- **Asignación de Field**: Category con «Estado», Value con el valor del recuento
- **Etiquetas**: active el interruptor

En la página de la izquierda debería aparecer ya un bonito gráfico circular. Cada porción representa un estado, y por defecto se muestran la cantidad concreta y el porcentaje.

![07-dashboard-2026-03-15-21-45-40](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-45-40.png)

Pulse **Guardar** y el primer gráfico está terminado.

## 7.3 Gráfico de líneas: tendencia diaria de tickets nuevos

El gráfico circular muestra "la distribución actual"; el gráfico de líneas muestra "la tendencia de cambio".

En la página, añada otro bloque de gráfico con la configuración:

### Consulta de datos

- **Tabla de datos**: seleccione «Tickets»
- **Medidas**: ID, Recuento
- **Dimensiones**: seleccione el Field «Fecha de creación»; formato: **YYYY-MM-DD** (agrupación por día)

> **Sugerencia**: el formato de la dimensión de fecha es importante. `YYYY-MM-DD` agrupa por día; `YYYY-MM` agrupa por mes. Elija la granularidad adecuada al volumen de datos.

### Opciones del gráfico

- **Tipo de gráfico**: seleccione **Gráfico de líneas**
- **Asignación de Field**: xField con «Fecha de creación», yField con el valor del recuento

![07-dashboard-2026-03-15-21-48-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-48-33.png)

Tras guardar, verá la curva del volumen de tickets a lo largo del tiempo. Si un día se dispara, indica que ese día algo pasó y merece atención.

## 7.4 Gráfico de barras: número de tickets por categoría

Para el tercer gráfico, vemos qué categoría tiene más tickets. Aquí usamos **gráfico de barras horizontales** en lugar de columnas verticales — cuando hay muchas categorías, las etiquetas del eje X de las columnas verticales se solapan; horizontal queda más claro.

Añada el tercer bloque de gráfico:

### Consulta de datos

- **Tabla de datos**: seleccione «Tickets»
- **Medidas**: Recuento de ID
- **Dimensiones**: seleccione el Field de relación «Categoría» (elija el Field nombre de la categoría)

### Opciones del gráfico

- **Tipo de gráfico**: seleccione **Gráfico de barras (Bar)**
- **Asignación de Field**: xField con el valor de recuento (recuento de ID), yField con «Nombre de la categoría»

![07-dashboard-2026-03-15-22-05-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-05-11.png)

Tras guardar, verá de un vistazo qué tipo de problema predomina. Si "Fallos de red" es mucho más larga que las demás, quizá toque actualizar el equipamiento de red.

## 7.5 Bloque de tabla: tickets sin completar

Los gráficos dan la visión agregada, pero el administrador también necesita el detalle. Añadimos una tabla de **tickets sin completar** que muestre directamente todos los tickets aún en proceso.

En la página, añada un **bloque de tabla** y seleccione la tabla «Tickets».

### Configurar condiciones de filtrado

Pulse la configuración del bloque de tabla en la esquina superior derecha y busque **Configurar rango de datos**, añada un [filtro](/interface-builder/blocks/filter-blocks/form):

- **Estado** distinto de **Completado**

Así la tabla solo muestra tickets pendientes; al completar uno, desaparece automáticamente de la lista.

### Configurar Field

Seleccione las columnas a mostrar: Título, Estado, Prioridad, Responsable, Fecha de creación.

![07-dashboard-2026-03-15-22-20-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-20-11.png)

> **Sugerencia**: puede añadir además una **ordenación predeterminada** (descendente por fecha de creación) para que los más recientes aparezcan primero.

## 7.6 Bloque Markdown: anuncio del sistema

Aparte de los gráficos, también podemos colocar texto en el dashboard.

Añada un **[bloque Markdown](/interface-builder/blocks/other-blocks/markdown)** y escriba un anuncio del sistema o instrucciones de uso:

```markdown
## Sistema de tickets de TI

¡Bienvenido! Si tiene algún problema, envíe un ticket y el equipo técnico lo atenderá lo antes posible.

Para **incidencias urgentes**, llame directamente a la línea de TI: 8888
```

![07-dashboard-2026-03-15-21-53-54](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-53-54.png)

Coloque el bloque Markdown en la parte superior del dashboard; sirve como bienvenida y como tablón de anuncios. El contenido es modificable en cualquier momento, muy flexible.

![07-dashboard-2026-03-15-22-30-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-30-57.png)

## 7.7 Bloque JS: banner de bienvenida personalizado

El formato Markdown es bastante fijo; ¿y si queremos efectos más ricos? NocoBase ofrece el **bloque JS (JavaScript Block)**, que permite personalizar libremente la presentación con código.

Lo usaremos para crear un banner de bienvenida con estilo profesional: muestra un saludo personalizado según el usuario actual y la hora.

En la página, añada un **bloque JS** (Crear bloque → Otros bloques → Bloque JS).

![07-dashboard-2026-03-15-22-33-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-33-24.png)

En el bloque JS puede obtener el nombre del usuario actual con `ctx.getVar("ctx.user.username")`. A continuación un banner de bienvenida con estilo minimalista y profesional:

```js
const uname = await ctx.getVar("ctx.user.username")
const name = uname || 'Usuario';
const hour = new Date().getHours();
const hi = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const week = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][d.getDay()];

ctx.render(`
<div style="padding: 24px 32px; background: #f7f8fa; border-radius: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div style="font-size: 22px; font-weight: 600; color: #1d2129;">${hi}, ${name}</div>
      <div style="font-size: 14px; color: #86909c; margin-top: 4px;">Bienvenido de nuevo al Sistema de tickets de TI</div>
    </div>
    <div style="font-size: 14px; color: #86909c;">${date}　${week}</div>
  </div>
</div>`);
```

![07-dashboard-2026-03-15-22-51-27](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-51-27.png)

El resultado es una tarjeta con fondo gris claro: a la izquierda el saludo, a la derecha la fecha. Limpio, útil y discreto.

> **Sugerencia**: `ctx.getVar("ctx.user.xxx")` es la forma de obtener información del usuario actual en el bloque JS; los Field comunes son `nickname` (alias), `username` (nombre de usuario), `email` (correo), etc. El bloque JS también puede llamar a la API para consultar datos; con él podrá hacer contenidos personalizados más adelante.

## 7.8 Panel de operaciones: accesos rápidos + reutilización de popups

El dashboard no es solo para ver datos; también debe ser un punto de partida para acciones. Añadiremos un **Panel de operaciones (Action Panel)** para que los usuarios puedan enviar tickets y saltar a la lista directamente desde la página principal.

En la página, añada un bloque **Panel de operaciones** (Crear bloque → Otros bloques → Panel de operaciones) y luego añada dos [acciones](/interface-builder/actions) en el panel:

![07-dashboard-2026-03-15-22-54-06](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-54-06.png)

1. **Enlace: Saltar a la lista de tickets** — añada una acción «Enlace», con la URL apuntando a la página de la lista de tickets (p. ej., `/admin/camcwbox2uc`)

![07-dashboard-2026-03-15-22-57-49](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-57-49.png)

2. **Botón: Añadir ticket** — añada una acción «Popup», con título «Añadir ticket»

![07-dashboard-2026-03-15-23-00-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-00-36.png)

Pero al pulsar "Añadir ticket" el popup está vacío; hay que configurar su contenido. Volver a montar el formulario es engorroso; aquí es donde brilla una función muy útil: **reutilización de popups**.

### Guardar la plantilla del popup

> Atención: la plantilla de popup no es lo mismo que la "plantilla de bloque" del Capítulo 4. La plantilla de bloque guarda los Field y el diseño de un único bloque de formulario; la plantilla de popup guarda **todo el popup**, incluidos todos sus bloques, Field y botones de acción.

1. Vaya a la **página de Lista de tickets** y busque el botón «Añadir ticket»
2. En la configuración del botón, busque **«Guardar como plantilla»** y guarde el popup actual
3. Póngale un nombre a la plantilla (p. ej., «Popup de añadir ticket»)

![07-dashboard-2026-03-15-23-05-17](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-05-17.png)

### Reutilizar el popup en la página principal

1. Vuelva a la página del panel de datos y, en el panel de operaciones, abra la configuración del botón «Añadir ticket»
2. Busque **«Configuración del popup»** y seleccione la plantilla «Popup de añadir ticket» que acaba de guardar
3. Tras guardar, al pulsar el botón se abrirá exactamente el mismo popup de creación de ticket que en la lista

![07-dashboard-2026-03-15-23-06-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-06-33.png)

![07-dashboard-2026-03-15-23-07-20](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-07-20.gif)

### Hacer clic en el título para abrir el popup de detalles

De la misma forma, podemos hacer que el título de la tabla de tickets sin completar sea clicable y abra los detalles directamente:

1. Vaya a la **página de Lista de tickets**, busque la configuración del botón «Ver» y guárdelo igualmente como plantilla (p. ej., «Popup de detalles del ticket»)

![07-dashboard-2026-03-15-23-08-02](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-08-02.png)

2. Vuelva a la página del panel de datos y, en la tabla de tickets sin completar, abra la configuración del Field «Título»
3. Active el interruptor **«Activar clic para abrir»** — aparecerá la opción «Configuración del popup»
4. En la configuración, seleccione la plantilla «Popup de detalles del ticket» que acaba de guardar

![07-dashboard-2026-03-15-23-11-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-11-24.png)

Ahora, los usuarios pueden ver los detalles del ticket pulsando el título en el dashboard, sin tener que ir a la página de la lista. El dashboard se vuelve más compacto y eficiente.

![07-dashboard-2026-03-15-23-12-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-12-36.png)

> **Ventajas de la reutilización de popups**: la misma plantilla puede usarse en múltiples páginas; al modificar la plantilla, todos los lugares que la referencien se actualizan a la vez. Es la misma idea que el modo "Referencia" del Capítulo 4: mantenimiento en un solo sitio, efecto en todos.

## 7.9 Ajustar el diseño

La página tiene ya 6 bloques (banner JS de bienvenida + panel de operaciones + 3 gráficos + tabla de tickets). Ajustemos el diseño para que quede más estético.

En modo de configuración, puede ajustar la posición y el tamaño de cada bloque mediante **arrastrar y soltar**:

Sugerencia de disposición:

- **Primera fila**: banner JS de bienvenida (izquierda) + panel de operaciones (derecha)
- **Segunda fila**: gráfico circular (izquierda) + tabla de tickets (derecha)
- **Tercera fila**: gráfico de líneas (izquierda) + gráfico de barras (derecha)

![07-dashboard-2026-03-15-23-14-19](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-14-19.png)

Tenga en cuenta que las alturas de los bloques pueden no estar alineadas; en ese caso ajústelas manualmente en Configuración del bloque > Altura del bloque. Por ejemplo, yo dejé los dos bloques de la segunda fila a 500 px.

Arrastrando los bordes puede ajustar el ancho de los bloques para que dos gráficos ocupen la mitad cada uno. Pruebe varias veces hasta encontrar la disposición más cómoda.

![07-dashboard-2026-03-15-23-18-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-18-57.png)

## Resumen

En este capítulo construimos un dashboard de datos rico y útil con 6 bloques:

- **Banner JS de bienvenida**: saludo personalizado según el usuario actual y la hora
- **Panel de operaciones**: acceso rápido a la lista de tickets y a añadir un ticket con un clic (reutilización de popup)
- **Gráfico circular**: ver de un vistazo la proporción de estados
- **Gráfico de líneas**: seguir la tendencia del volumen de tickets en el tiempo
- **Gráfico de barras**: comparar horizontalmente los tickets por categoría sin que las etiquetas se solapen
- **Tabla de tickets sin completar**: lista de todos los pendientes, con clic en el título para ver los detalles (reutilización de popup)

Además, hemos aprendido la importante técnica de la **reutilización de popups** — guardar el popup de una página como plantilla y referenciarlo desde otras páginas para evitar configuraciones repetidas.

La visualización de datos es un Plugin integrado en NocoBase, no requiere instalación adicional. Configurar es tan sencillo como construir páginas: elija datos, elija tipo de gráfico, asigne Field; tres pasos y listo.

## Avance posterior

A estas alturas, las funciones de nuestro sistema de tickets están bastante completas: modelado de datos, construcción de páginas, formularios, control de permisos, Workflow automatizados y dashboard de datos, todo en su sitio. Más adelante planeamos publicar un **tutorial de construcción con Agente de IA**: usar un Agente de IA en local para completar la construcción del sistema automáticamente. ¡No se lo pierda!

## Recursos relacionados

- [Visualización de datos](/data-visualization) — Configuración detallada de gráficos
- [Bloque Markdown](/interface-builder/blocks/other-blocks/markdown) — Uso del bloque Markdown
- [Diseño de Block](/interface-builder/blocks) — Disposición de la página y configuración de bloques
