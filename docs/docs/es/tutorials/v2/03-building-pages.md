# Capítulo 3: Construcción de páginas — del vacío a algo usable

En el capítulo anterior montamos el esqueleto de las tablas, pero los datos solo existen "en el backend": los usuarios no los ven. En este capítulo vamos a poner los datos **en escena**: crearemos un [bloque de tabla](/interface-builder/blocks/data-blocks/table) para mostrar los datos de tickets, configuraremos la visualización de Field, ordenación, [filtrado](/interface-builder/blocks/filter-blocks/form) y paginación, y lo convertiremos en una lista de tickets realmente utilizable.

## 3.1 ¿Qué es un Block?

En NocoBase, los **Block** son las "piezas de construcción" de la página. ¿Quiere mostrar una tabla? Coloque un [bloque de tabla](/interface-builder/blocks/data-blocks/table). ¿Quiere mostrar un formulario? Coloque un bloque de formulario. Una página puede combinar libremente varios Block, y se pueden arrastrar para ajustar el diseño.

Tipos comunes de Block:

| Tipo | Uso |
|------|-----|
| Tabla (Table) | Mostrar varios datos en filas y columnas |
| Formulario (Form) | Permitir al usuario introducir o editar datos |
| Detalles (Details) | Mostrar la información completa de un único registro |
| Formulario de filtrado (Filter Form) | Proporcionar condiciones de filtrado para filtrar datos en otros bloques |
| Gráfico (Chart) | Visualización con gráficos circulares, de líneas, etc. |
| Markdown | Insertar texto personalizado o instrucciones |

Recuerde la metáfora: **Block = piezas de construcción**, y vamos a construir la página de gestión de tickets con ellas.

## 3.2 Añadir menús y páginas

Primero, necesitamos crear la entrada de "Gestión de tickets" en el sistema.

1. Haga clic en el interruptor **UI Editor** de la esquina superior derecha para entrar en el [modo de configuración](/get-started/how-nocobase-works) (toda la página mostrará bordes naranjas editables).
2. Sitúe el ratón sobre el botón **«Añadir elemento de menú (Add menu item)»** de la barra de navegación superior, seleccione **«Añadir grupo (Add group)»** y póngale el nombre **«Gestión de tickets»**.

![03-building-pages-2026-03-12-09-38-36](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-38-36.png)


3. La barra de navegación superior mostrará inmediatamente el menú «Gestión de tickets». **Haga clic en él** y se desplegará el menú lateral del grupo.
4. En el menú lateral, haga clic en el botón naranja **«Añadir elemento de menú (Add menu item)»**, seleccione **«Página nueva versión (v2) (Modern page (v2))»** y añada dos subpáginas:
   - **Lista de tickets**: muestra todos los tickets
   - **Categorías de tickets**: gestiona los datos de categorías

![03-building-pages-2026-03-12-09-41-26](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-41-26.png)

> **Atención**: al añadir páginas verá las opciones «Página versión antigua (v1)» y «Página versión nueva (v2)»; este tutorial usa **v2** uniformemente.

## 3.3 Añadir el bloque de tabla

Ahora entre en la página «Lista de tickets» y añádale un bloque de tabla:

1. En la página vacía, haga clic en **«Crear bloque (Add block)»**.
2. Seleccione **bloque de datos → Tabla**.
3. En la lista de tablas que aparece, seleccione **«Tickets»** (la tabla `tickets` que creamos en el capítulo anterior).

![03-building-pages-2026-03-13-08-44-07](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-07.png)

Tras añadir el bloque de tabla, aparecerá una tabla vacía en la página.

![03-building-pages-2026-03-13-08-44-29](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-29.png)

Una tabla vacía no es útil para depurar; primero añadamos rápidamente un botón para crear y registremos algunos datos de prueba:

1. Haga clic en **«Configurar acciones (Configure actions)»** en la esquina superior derecha de la tabla y marque **«Crear (Add new)»**.

![03-building-pages-2026-03-17-14-58-39](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-58-39.png)

2. Haga clic en el nuevo botón **«Crear»** que aparece y, en el popup, seleccione **Añadir bloque (Add block) → Formulario (Crear) (Form (Add New)) → Tabla actual (Current collection)**.

![03-building-pages-2026-03-17-14-59-42](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-59-42.png)

3. En el popup, haga clic en **«Configurar campos (Configure fields)»** y marque los campos título, estado, prioridad, etc.; haga clic en **«Configurar acciones (Configure actions)»** y active el botón **«Enviar (Submit)»**.

![03-building-pages-2026-03-17-15-00-54](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-00-54.png)

![03-building-pages-2026-03-17-15-01-49](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-01-49.png)

4. Rellene unos cuantos tickets y envíelos; el contenido se mostrará en la tabla.

![03-building-pages-2026-03-17-15-03-04](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-03-04.png)

> La configuración detallada del formulario (reglas de campo, formulario de edición, popup de detalles, etc.) la veremos en profundidad en el [Capítulo 4](/tutorials/v2/04-forms-and-details); aquí basta con poder introducir datos.

## 3.4 Configurar las columnas a mostrar

Por defecto la tabla no muestra automáticamente todos los Field; debemos seleccionar manualmente qué columnas mostrar:

1. A la derecha del encabezado de la tabla, haga clic en **«[Field](/data-sources/data-modeling/collection-fields) (Fields)»**.
2. Marque los Field a mostrar:
   - **Título**: tema del ticket, visible al instante
   - **Estado**: progreso actual del procesamiento
   - **Prioridad**: nivel de urgencia
   - **Categoría**: Field de relación, mostrará el nombre de la categoría
   - **Remitente**: quién envió el ticket
   - **Responsable**: quién está a cargo
3. Los Field que no necesite (como ID, fecha de creación) no los marque, para mantener la tabla limpia.

![03-building-pages-2026-03-13-08-47-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-47-18.png)

> **Sugerencia**: el orden de los Field puede ajustarse arrastrándolos. Coloque "Título" y "Estado", lo más importante, al principio para localizar la información clave de un vistazo.

### Problema con el Field de relación mostrando el ID

Tras marcar «Categoría», verá que la tabla muestra el ID de la categoría (un número) en lugar del nombre. Esto sucede porque los Field de relación usan el ID como Field título por defecto. Hay dos formas de corregirlo:

**Forma 1: Modificar en la configuración de la columna (solo afecta a esta tabla)**

Haga clic en la configuración de la columna «Categoría», busque **«Field título (Title field)»** y cámbielo de ID a **Nombre**. Esta forma solo afecta a este bloque de tabla.

![03-building-pages-2026-03-13-09-23-03](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-03.png)

![03-building-pages-2026-03-13-09-57-40](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-57-40.gif)

**Forma 2: Modificar en la fuente de datos (afecta globalmente, recomendada)**

Vaya a **Configuración → [Fuente de datos](/data-sources) → [Tabla de datos](/data-sources/data-modeling/collection) → Tabla de categorías** y cambie el **«Field título»** a **Nombre**. Así, donde se referencie la tabla de categorías se mostrará por defecto el nombre, una solución definitiva. Tras la modificación, debe volver a la página y añadir el Field de nuevo para que tenga efecto.
![03-building-pages-2026-03-13-09-23-41](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-41.png)

## 3.5 Añadir filtrado y ordenación

Cuando los tickets crecen, necesitamos encontrar rápidamente uno concreto. NocoBase ofrece varias formas; primero presentamos la más común: el **bloque de formulario de filtrado**.

### Añadir formulario de filtrado

1. En la página de lista de tickets, haga clic en **«Crear bloque»** y seleccione **bloque de filtrado → Formulario de filtrado**.
2. En las páginas v2 no es necesario seleccionar tabla — el formulario de filtrado se añade directamente a la página.
3. En el formulario de filtrado, haga clic en **«Field (Fields)»** y se mostrará la lista de bloques de datos filtrables presentes en la página, por ejemplo `Table: Tickets #c48b` (el código posterior es el UID del bloque, sirve para distinguir múltiples bloques de la misma tabla).

![03-building-pages-2026-03-13-08-48-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-48-37.png)

4. Coloque el ratón sobre el nombre del bloque y se desplegará la lista de Field filtrables. Haga clic en un Field para añadirlo como filtro: **Estado**, **Prioridad**, **Categoría**.

![03-building-pages-2026-03-13-09-25-44](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-25-44.png)

5. Tras añadirlos, cuando el usuario introduzca condiciones en el formulario de filtrado, los datos de la tabla se **filtrarán automáticamente en tiempo real**.

![03-building-pages-2026-03-13-10-00-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-10-00-25.gif)

### Búsqueda difusa multicampo

Si queremos un cuadro de búsqueda que busque varios Field a la vez, ¿cómo lo hacemos?

Haga clic en la configuración del campo de búsqueda en su esquina superior derecha; verá la opción **«Field conectados (Connect fields)»**. Al expandirla, se listan los Field relacionables de cada bloque — observará que por defecto solo está conectado «Título».
![03-building-pages-2026-03-13-09-30-06](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-30-06.png)

Podemos seleccionar más Field, por ejemplo **Descripción**, para que la búsqueda actúe sobre ambos.

Incluso podemos filtrar por Field de objetos relacionados — haga clic en «Categoría» y, en las opciones del siguiente nivel, marque «Nombre de la categoría»; al buscar también coincidirá con el nombre de la categoría.

![03-building-pages-2026-03-13-09-31-35](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-31-35.png)
![03-building-pages-2026-03-13-09-32-20](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-32-20.png)

> **Los Field conectados son muy potentes**: pueden actuar entre múltiples bloques y múltiples Field. Si la página tiene varios bloques de datos, ¡pruebe a crear bloques nuevos y vea el efecto!

### ¿No quiere filtrado automático?

Si prefiere que el filtrado se ejecute solo cuando el usuario haga clic en un botón, en la esquina inferior derecha del formulario de filtrado pulse **«[Acciones](/interface-builder/actions) (Actions)»** y marque los botones **«Filtrar (Filter)»** y **«Restablecer (Reset)»**. Así, tras rellenar las condiciones, el usuario debe pulsar manualmente para ejecutar el filtrado.
![03-building-pages-2026-03-13-09-33-15](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-33-15.png)

### Otra forma de filtrar: la acción de filtrado integrada en la tabla

Además del bloque de formulario de filtrado independiente, el bloque de tabla incluye su propia acción **«Filtrar (Filter)»**. En la parte superior del bloque de tabla, haga clic en **«Acciones (Actions)»**, marque **«Filtrar»** y aparecerá un botón de filtrado en la barra de herramientas. Al pulsarlo se abre un panel de condiciones donde el usuario puede filtrar por Field directamente.
![03-building-pages-2026-03-13-09-34-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-34-25.png)
![03-building-pages-2026-03-13-09-36-09](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-36-09.png)

Si no quiere tener que buscar Field manualmente cada vez que abra el filtrado, puede preconfigurar Field de filtrado por defecto en las opciones del botón, así el usuario verá las condiciones habituales al abrirlo.
![03-building-pages-2026-03-13-09-38-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-38-37.png)

> **Atención**: la acción de filtrado integrada en la tabla **no admite búsqueda difusa multicampo** por ahora. Si necesita búsqueda en varios Field, use el bloque de formulario de filtrado anterior con la función «Field conectados».

### Configurar la ordenación predeterminada

Queremos que los tickets más recientes aparezcan primero:

1. Haga clic en la configuración del bloque de tabla (icono de tres líneas) en la esquina superior derecha.
2. Busque **«Configurar regla de [ordenación](/interface-builder/blocks/data-blocks/table)»**.
3. Añada un Field de ordenación: seleccione **Fecha de creación** y método de ordenación **descendente**.

![03-building-pages-2026-03-13-09-40-54](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-40-54.png)

Así, los tickets recién enviados quedarán siempre arriba, y será más cómodo procesarlos.

## 3.6 Configurar acciones de fila

No basta con ver la lista; también necesitamos poder entrar a ver los detalles del ticket y editarlo.

1. Sobre la columna de acciones, haga clic en el segundo signo "+".
2. Haga clic en las acciones: **Ver**, **[Editar](/interface-builder/actions/edit)**, **[Eliminar](/interface-builder/actions/delete)**.
3. En cada fila aparecerán los botones «Ver», «Editar» y «Eliminar».

![03-building-pages-2026-03-13-09-42-42](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-42-42.png)

Al hacer clic en «Ver» se abre un cajón (Drawer) en el que se puede colocar un bloque de detalles para mostrar la información completa. Lo configuraremos en detalle en el siguiente capítulo.
Al hacer clic en «Eliminar», la fila será eliminada.

## 3.7 Ajustar el diseño de la página

Hasta ahora la página tiene dos bloques (formulario de filtrado y tabla), pero por defecto están apilados verticalmente y puede no resultar estético. NocoBase admite ajustar la posición y el diseño de los bloques mediante **arrastrar y soltar**.

En modo de configuración, lleve el ratón al asa de arrastre en la esquina superior izquierda del bloque (el cursor cambiará a una flecha de cuatro puntas), mantenga pulsado y arrastre.

**Mover el formulario de filtrado encima de la tabla**: arrastre el bloque del formulario de filtrado, llévelo al borde superior del bloque de tabla, suéltelo cuando aparezca la línea azul de guía y el formulario quedará encima.

![03-building-pages-2026-03-13-11-50-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-18.gif)

**Mover Field de filtrado a la misma fila**: dentro del formulario de filtrado, los Field están dispuestos en vertical por defecto. Arrastre «Prioridad» a la derecha de «Estado»; al aparecer la línea vertical de guía, suéltelo y los dos Field quedarán juntos en la misma fila, ahorrando espacio vertical.

![03-building-pages-2026-03-13-11-50-58](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-58.gif)

> En NocoBase casi todos los elementos admiten arrastrar y soltar — botones de acción, columnas de tabla, elementos de menú, etc. ¡Explore!

## 3.8 Configurar la página de Categorías de tickets

No olvidemos que en la sección 3.2 creamos la subpágina «Categorías de tickets»; añadámosle ahora contenido. El proceso es similar al de la lista de tickets — añadir bloque de tabla, marcar Field, configurar acciones — no se repite aquí, solo destacamos una diferencia clave.

¿Recuerda la tabla «Categorías de tickets» que creamos en el Capítulo 2? Es una **tabla en árbol** (admite jerarquía padre-hijo). Para que la tabla muestre correctamente la estructura en árbol, debemos activar una opción:

1. Entre en la página «Categorías de tickets», añada un bloque de tabla y seleccione la tabla «Categorías de tickets».
2. Haga clic en la configuración del bloque (icono de tres líneas), busque **«Habilitar tabla en árbol (Tree table)»** y actívela.


Una vez activada, la tabla mostrará las categorías padre-hijo con sangrías jerárquicas en lugar de listarlas planas.

3. Marque los Field a mostrar (nombre, descripción, etc.) y configure las acciones de fila (añadir, editar, eliminar).
4. **Sugerencia de diseño**: coloque «Nombre» en la primera columna y «Acciones» en la segunda. La tabla de categorías tiene pocos Field; este diseño de dos columnas es más compacto y amigable.

![03-building-pages-2026-03-13-18-51-36](https://static-docs.nocobase.com/03-building-pages-2026-03-13-18-51-36.png)

## Resumen

¡Felicidades! Nuestro sistema de tickets ya cuenta con una **interfaz de gestión** decente:

- Una estructura de menús clara (Gestión de tickets → Lista de tickets / Categorías de tickets)
- Un **bloque de tabla** que muestra los datos de los tickets
- Un **formulario de filtrado** para filtrar rápidamente por estado, prioridad y categoría
- Una **regla de ordenación** descendente por fecha de creación
- Botones de acción de fila para ver y editar cómodamente
- Una **tabla en árbol** que muestra la jerarquía de categorías

¿Más fácil de lo que imaginaba? En todo el proceso no hemos escrito ni una línea de código, todo se ha hecho mediante arrastrar y configurar.

## Avance del próximo capítulo

Solo "ver" no es suficiente — los usuarios también deben poder **enviar tickets nuevos**. En el próximo capítulo vamos a montar el bloque de formulario, configurar reglas de campo y habilitar el historial de registros para seguir cada cambio del ticket.

## Recursos relacionados

- [Resumen de Block](/interface-builder/blocks) — Descripción de todos los tipos de Block
- [Bloque de tabla](/interface-builder/blocks/data-blocks/table) — Configuración detallada del bloque de tabla
- [Bloque de filtrado](/interface-builder/blocks/filter-blocks/form) — Configuración del formulario de filtrado
