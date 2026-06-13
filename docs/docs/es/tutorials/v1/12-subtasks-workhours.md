# Capítulo 11: Subtareas y cálculo de horas de trabajo

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

¡Por fin un capítulo nuevo! Con la expansión del negocio las tareas crecen y se vuelven más complejas; la gestión sencilla deja de ser suficiente. Ahora necesitamos una gestión más fina, dividiendo las tareas en niveles para que el equipo pueda completarlas con mayor eficiencia.

### 11.1 Planificación de tareas: del global al detalle

Vamos a descomponer tareas complejas en pequeñas tareas manejables, hacer seguimiento del progreso para conocer claramente el avance y aprovechar la gestión multinivel para soportar varios niveles de subtareas. ¡Empecemos a planificar!

---

### 11.2 Crear la tabla de subtareas

#### 11.2.1 Diseñar la estructura de subtareas

Primero, creamos una "tabla de subtareas" (Sub Tasks, [**tabla de árbol**](https://docs-cn.nocobase.com/handbook/collection-tree)) y la diseñamos con estructura de árbol. Sus atributos son similares a los de la tarea principal: "nombre", "estado", "responsable", "progreso", etc. Según las necesidades, también podemos añadir comentarios, documentos, etc.

Para asociar las subtareas con la tarea principal, establecemos una relación muchos a uno, de modo que cada subtarea pertenezca a una tarea. Configuramos también una relación inversa para poder consultar y gestionar las subtareas directamente desde la tarea principal.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> 💡 Consejo: se recomienda crearlas desde la página de la tarea principal mediante un bloque asociado, resulta más cómodo.

#### 11.2.2 Mostrar las subtareas en la pantalla de gestión

En la pantalla de gestión de tareas configuramos la "tabla de tareas" para que se muestre en [modo página](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

En la página, creamos una nueva pestaña "Gestión de subtareas" y añadimos la tabla de subtareas con visualización en árbol. Así podemos gestionar y ver las subtareas en la misma página.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3. Gráfico comparativo de horas: estimar horas y progreso (opcional)

Aprovechemos para crear los detalles de horas y un gráfico comparativo, lo que nos permitirá estimar el tiempo total y el avance de la tarea.

#### 11.3.1 Añadir información de tiempo y horas a las subtareas

En la tabla de subtareas añadimos los siguientes campos:

- **Fecha de inicio**
- **Fecha de fin**
- **Total de horas**
- **Horas restantes**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

Estos campos permitirán calcular dinámicamente la duración y las horas de la tarea.

#### 11.3.2 Calcular la duración en días

Creamos en la tabla de subtareas un nuevo [campo de fórmula](https://docs-cn.nocobase.com/handbook/field-formula) "Días" para calcular la duración.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

Las opciones de fórmula incluyen:

- Math.js

  > Utiliza la librería [math.js](https://mathjs.org/) y permite calcular fórmulas numéricas complejas.
  >
- Formula.js

  > Utiliza la librería [Formula.js](https://formulajs.info/functions/) para fórmulas habituales; si conoce las fórmulas de Excel le resultará muy fácil.
  >
- Plantilla de cadena

  > Como su nombre indica, sirve para concatenar cadenas; es útil cuando necesitamos descripciones o numeraciones dinámicas.
  >

En este caso usamos `Formula.js`, similar a las fórmulas de Excel y cómodo para fórmulas habituales.

La fórmula del campo Días es:

```html
DAYS(Fecha de fin, Fecha de inicio)
```

Asegúrese de usar formato en inglés y minúsculas para evitar errores.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

Vuelva a la página y compruébelo: el número de días cambia dinámicamente según las fechas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 Registro diario de horas: seguir el progreso real (opcional)

#### 11.4.1 Crear la tabla de registro diario de horas

Creamos una tabla "Registro diario de horas" para registrar el avance diario. Añadimos los siguientes campos:

- **Horas del día** (hours, recomendado entero).
- **Fecha**.
- **Horas ideales** (ideal_hours, recomendado entero).
- **Subtarea asociada**: relación [muchos a uno](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) con la subtarea.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 Mostrar el registro diario en la página de subtareas

Vuelva a la pantalla de edición de subtareas y muestre la tabla de registro diario en formato [subtabla](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table); reorganice el resto de campos. Así podrá rellenar y consultar los datos diarios directamente desde la página de la subtarea.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 Reglas de cálculo y de [linkage](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule) clave (opcional)

Para estimar con precisión el avance y las horas restantes vamos a configurar algunas piezas clave.

#### 11.5.1 Marcar campos de la subtarea como [obligatorios](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required)

Marque **Fecha de inicio**, **Fecha de fin** y **Horas estimadas** como [obligatorios](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required) para asegurar que disponemos de todos los datos necesarios para los cálculos posteriores.

#### 11.5.2 Configurar [reglas de linkage](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule) para porcentaje completado y horas restantes

En la tabla de subtareas añadimos las siguientes reglas:

- **Porcentaje completado**: suma de horas diarias / horas estimadas.

```html
SUM(【Formulario actual / Registro diario / Horas del día】)  /  【Formulario actual / Horas estimadas】
```

- **Horas restantes**: horas estimadas - suma de horas diarias.

```html
【Formulario actual / Horas estimadas】 - SUM(【Formulario actual / Registro diario / Horas del día】)
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- De la misma manera, configuramos las horas ideales en las reglas de linkage del registro diario:

```html
  【Formulario actual / Horas estimadas】 / 【Formulario actual / Días de duración】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

Así podemos calcular en tiempo real el avance y las horas restantes.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 Crear un gráfico de progreso de tareas (opcional)

#### 11.6.1 Crear el [gráfico](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) de progreso

Cree un nuevo bloque de gráfico que sume las **horas diarias** y las **horas ideales**, mostrando el progreso por dimensión de fecha.

Limite con 【Tarea relacionada/Id】 igual a 【Registro del cuadro emergente actual/ID】 para que el gráfico refleje la situación real de la tarea actual.

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 Mostrar la información básica y la evolución del progreso

¿Recuerda el [bloque Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)? Lo usamos para mostrar la información básica de la tarea y la evolución del progreso.

Renderizamos el porcentaje de progreso usando la plantilla de [`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars):

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

La sintaxis dinámica utiliza [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars); puede consultar la documentación oficial para conocer todos los detalles.

---

### 11.7 Resumen

¡Enhorabuena! Hemos completado la descomposición en subtareas. Con la gestión multinivel, el registro diario de horas y la visualización mediante gráficos podemos ver con claridad el avance de las tareas y ayudar al equipo a trabajar de forma más eficaz. Gracias por su atención y, a por el [siguiente capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking).

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
