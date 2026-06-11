# Capítulo 9: Tablero de tareas y gráficos

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

¡Por fin entramos en el capítulo de visualización tan esperado! Aquí veremos cómo, entre tanta información, podemos centrarnos rápidamente en lo que realmente nos importa. Como gestores no podemos perdernos entre tareas complejas. Vamos a resolver con facilidad las estadísticas y la presentación de información.

### 9.1 Centrarse en la información clave

Queremos consultar de un vistazo la situación de las tareas del equipo, encontrar las que nos competen o nos interesan y no perdernos entre datos farragosos.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

Empecemos creando un [gráfico](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) con estadísticas de las tareas del equipo.

#### 9.1.1 Crear un [bloque de datos de gráfico](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

Cree una página nueva (por ejemplo, "Panel personal"):

1. Cree un bloque de datos de gráfico. (Dentro de este gran bloque podemos montar muchos gráficos).
2. En el bloque de gráfico, seleccione el objetivo: la tabla de tareas. Entremos en la configuración del gráfico.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 Configurar las estadísticas de estado

Para contar el número de tareas por estado, primero hay que preparar los datos:

- Métrica: seleccione un campo único, por ejemplo, "ID", para contar.
- Dimensión: agrupar por estado.

A continuación, configure el gráfico:

1. Elija un [gráfico de columnas](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column) o [de barras](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar).
2. En el eje X, seleccione "Estado"; en el eje Y, "ID". No olvide elegir el campo de categoría "Estado" (de lo contrario los colores no diferenciarán bien las series).

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 Estadísticas multidimensión: tareas por persona

Si queremos saber cuántas tareas tiene cada persona en cada estado, añadiremos una dimensión adicional. Por ejemplo, "Responsable/Apodo".

1. Haga clic en "Ejecutar consulta" en la parte superior izquierda.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. Quizá el gráfico no se vea como esperaba. No pasa nada: seleccione "Agrupar" para desplegar la comparativa por responsables.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. Si quiere mostrar también el total apilando los valores, seleccione "Apilar". Así verá la proporción de tareas por persona y el total.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 Filtrado de datos y visualización dinámica

#### 9.2.1 Configuración de filtrado

Podemos quitar los datos de "Cancelada" y "Archivada" eliminándolos de las condiciones de filtrado de la izquierda. Estoy seguro de que ya domina este tipo de condiciones.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

Tras el filtrado, confirme y salga de la configuración: el primer gráfico de la página ya está listo.

#### 9.2.2 [Copiar gráfico](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

¿Y si quiere mostrar a la vez el modo "Agrupar" y "Apilar" sin volver a configurarlo?

- En la esquina superior derecha del primer bloque de gráfico, haga clic en copiar.
- Desplácese hacia abajo: el segundo gráfico ya aparece. Arrástrelo a la derecha, quite el "Apilar" y cámbielo a "Agrupar".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 [Filtrado](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) dinámico

¿Se puede [filtrar](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) dinámicamente las tareas según diferentes condiciones?

¡Por supuesto! Active "Filtrado" en la parte inferior del bloque de datos de gráfico. Aparecerá una caja de filtrado en la parte superior; muestre los campos deseados y configure las condiciones (por ejemplo, cambie el campo de fecha a "Entre").

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 Crear campos de filtrado personalizados

¿Y si en algunos casos queremos incluir "Cancelada" y "Archivada" en los datos, con filtrado dinámico y valores por defecto?

¡Vamos a crear un [campo de filtrado personalizado](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)!

> Campo de filtrado personalizado: puede elegir campos relacionados de tablas o crear campos personalizados (solo disponible en gráficos).
>
> Soporta editar título, descripción y operador de filtrado, así como definir valores por defecto (por ejemplo, usuario o fecha actuales) para que el filtrado se ajuste a sus necesidades reales.

1. Título: "Estado".
2. Campo origen: dejar en blanco.
3. Componente: "Casillas de verificación".
4. Las opciones siguen los valores de los estados de la base de datos (atención: aquí el orden de los atributos es etiqueta de opción - valor de opción).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

Una vez creado, haga clic en "Definir valor por defecto" y elija las opciones que necesita.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

Tras configurar el valor por defecto, vuelva a la configuración del gráfico y cambie la condición de filtrado a "Estado - contiene cualquiera - Filtro actual/Estado", y confirme. (Hay que cambiarlo en ambos gráficos).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

¡Hecho! Ahora pruebe el filtrado y los datos se mostrarán perfectamente.

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 Enlaces dinámicos y filtrado de tareas

A continuación implementaremos algo muy práctico: pulsar sobre un número estadístico para saltar al filtrado de las tareas correspondientes. Para ello, añadimos primero gráficos con la cantidad de tareas en cada estado y los situamos arriba.

#### 9.3.1 Tomemos como ejemplo "No iniciada" para crear un [gráfico de estadística](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)

1. Configure la métrica: contar por ID.
2. Configure la condición de filtrado: Estado igual a "No iniciada".
3. Nombre del contenedor: "No iniciada"; tipo: "Estadística"; deje el nombre del gráfico vacío.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

La estadística "No iniciada" ya está. Copie cinco veces más siguiendo los estados y arrastre todas a la parte superior.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 Configurar el enlace de filtrado

1. Vuelva a la página donde está el bloque de tabla de gestión de tareas y observe el formato de la URL en el navegador (algo como `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   Aquí `xxxxxxxxx` es el dominio y `/admin/0z9e0um1vcn` la ruta. (Buscamos la última `/admin`).
2. Copie una parte del enlace.

   - Vamos a hacer un salto de enlace, así que necesitamos extraer una parte de la URL.
   - Copie desde después de `admin/` (sin incluir `admin/`) hasta el final. En este ejemplo: `0z9e0um1vcn`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

Pase el ratón sobre "No iniciada" y verá que se convierte en un cursor de mano; haga clic y se realizará el salto.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. Configure el enlace del gráfico
   Añadamos un parámetro de filtrado al enlace. ¿Recuerda el identificador del campo Estado en la base de datos? Hay que añadirlo al final del enlace para filtrar las tareas.
   - Añada al final `?task_status=Not started`, de modo que su enlace quede: `0z9e0um1vcn?task_status=Not started`.
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> Formato de paso de parámetros por URL:
> Al añadir parámetros a un enlace hay reglas de formato:
>
> - **Signo de interrogación (?)**: marca el inicio de los parámetros.
> - **Nombre y valor**: en formato `nombre=valor`.
> - **Múltiples parámetros**: si hay varios, se concatenan con `&`. Por ejemplo:
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   Aquí `user` es otro parámetro y `123` su valor.

4. Vuelva a la página, haga clic en el enlace y compruebe que la URL ya incluye los parámetros que necesitamos.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [Asociar la condición de filtrado a la URL](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

¿Por qué la tabla aún no cambia? Falta un último paso.

- Vuelva a la configuración del bloque de tabla y haga clic en "Configurar rango de datos".
- Elija "Estado" igual a "Parámetro de URL/status".

Confirme: ¡filtrado realizado con éxito!

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [Visualización de datos](https://docs-cn.nocobase.com/handbook/data-visualization): gráficos espectaculares

> Visualización de datos: [ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts) (plugin comercial, de pago).
> ECharts ofrece más opciones de configuración: [gráfico de líneas](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line) (multidimensión), [gráfico de radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar), [nube de palabras](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)...

Si quiere más posibilidades, active el bloque "Visualización de datos: ECharts".

#### 9.4.1 Configurar rápidamente un [gráfico de radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar) espectacular

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

Si los datos se solapan, ajuste el tamaño o el radio para que toda la información se vea con claridad.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

Tras configurarlo, ajuste la disposición arrastrando el bloque. ¡Listo!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 Más contenedores de gráficos

Hay muchos más gráficos por descubrir.

##### [Nube de palabras](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [Gráfico de embudo](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [Múltiples métricas (gráfico de doble eje, gráfico de líneas ECharts)](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

En el gráfico de doble eje puede añadir más métricas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [Gráfico de barras divergentes](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 Pequeño reto

Antes de cerrar este capítulo, un pequeño reto:

1. Añada los parámetros de URL para los estados restantes (**En progreso, Pendiente de revisión, Completada, Cancelada, Archivada**) para que los enlaces salten correctamente al filtro.
2. Configure el campo multiselección "Responsable" como hicimos con "Estado", con valor por defecto el apodo del usuario actual.

En el [siguiente capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2) seguiremos desarrollando el tablero. ¡Hasta pronto!

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
