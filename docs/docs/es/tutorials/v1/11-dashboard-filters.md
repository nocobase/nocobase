# Capítulo 10: Filtros y condiciones del tablero

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

En este capítulo continuaremos paso a paso con la siguiente parte del tablero de tareas. Si tiene cualquier duda, no olvide acudir al foro.

¡Empecemos repasando el capítulo anterior y emprendamos esta nueva exploración!

### 10.1 Solución del capítulo anterior

#### 10.1.1 Estado y enlaces

Primero, añadimos los enlaces de salto para los distintos estados, lo que facilita la navegación. Esta es la estructura de los enlaces:

(Suponiendo que nuestro enlace es `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x`)

##### Solución del reto


| Estado<br/>                | Enlace<br/>                                          |
| -------------------------- | ---------------------------------------------------- |
| No iniciada<br/>           | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>  |
| En progreso<br/>           | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>  |
| Pendiente de revisión<br/> | hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br> |
| Completada<br/>            | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>    |
| Cancelada<br/>             | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>    |
| Archivada<br/>             | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>     |

#### 10.1.2 Añadir multiselección de Responsable

1. **Crear [campo personalizado](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)**: cree un campo "Responsable" de tipo multiselección y rellene los apodos (o nombres de usuario) de los miembros, para seleccionar rápidamente al asignar tareas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **En la configuración del informe**: defina la condición de filtrado "Responsable/Apodo contiene Filtro actual/Responsable". Así podrá localizar rápidamente las tareas relacionadas con un responsable concreto.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

Pruebe a filtrar varias veces para confirmar que la función funciona correctamente.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 Vincular el tablero al usuario

Podemos mostrar contenido distinto según el usuario:

1. **Configurar el valor por defecto del campo "Responsable" como "Usuario actual/Apodo"**: así el sistema mostrará automáticamente las tareas relacionadas con el usuario actual y mejorará la eficiencia.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **Tras refrescar la página**: el tablero cargará automáticamente los datos asociados al usuario que ha iniciado sesión. (Recuerde añadir la condición de filtrado por usuario en los gráficos que lo necesiten).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 Reorganizar el filtrado de tareas

Quizá detecte un problema de diseño:

Si configuramos el "rango de datos" del bloque de tabla directamente desde el salto, las tareas quedan limitadas al estado correspondiente; al filtrar otros estados, ¡los datos están vacíos!

¿Cómo solucionarlo? Eliminemos el filtrado de datos y cambiemos a otro tipo de filtrado.

1. **Quitar el filtrado por rango de datos**: evita que el estado quede bloqueado, permitiendo cambios flexibles.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **Configurar valores por defecto en el bloque de filtro de formulario.**

¿Recuerda nuestro [bloque de filtro](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)?

Cree un nuevo bloque de filtro para la tabla de tareas, configure los campos **Estado** y los demás que necesite y úselos para inyectar las variables de la URL. (Recuerde conectar el bloque de la tabla de tareas que se va a filtrar).

- Configure el valor por defecto del campo Estado como `URL search params/task_status`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **Probar el nuevo filtrado**: ahora puede cambiar libremente el estado en cualquier momento.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **Opcional**: si quiere que cada usuario se centre en sus tareas, también puede configurar el valor por defecto del campo "Responsable" como "Usuario actual".

---

### 10.4 Noticias, avisos y enfoque informativo

¡Mejoremos la base documental! Mostremos en el tablero la información que necesitamos.

A medida que la documentación crece, irán surgiendo varias necesidades:

- Noticias: enfoque en las novedades, logros e hitos del proyecto.
- Avisos o recordatorios temporales.

#### 10.4.1 Información destacada (News)

1. **Añadir el campo "Información destacada"**: en la tabla de documentos añada un campo de tipo casilla "Información destacada" que indique si el documento es noticia importante.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **Marcar documentos**: elija un artículo cualquiera, añada el campo "Información destacada" en el formulario de edición y márquelo.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **Crear un [bloque de "Lista"](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list)**: en el tablero, cree un bloque de lista y seleccione la tabla de documentos.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

Arrástrelo a la derecha, muestre "Fecha de creación" y "Título", ajuste el ancho de los campos y desactive "Mostrar título".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **Mostrar la información destacada**:

Para reflejar la actualidad podemos mostrar también la fecha.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

Ordene de forma descendente por fecha de creación para mostrar primero las noticias más recientes.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

¡Listo! Una sección sencilla de información destacada para que los miembros se mantengan al día del avance del proyecto.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 Avisos públicos

A continuación, una función sencilla de avisos públicos que probablemente ya ha visto en nuestro Demo en línea. Para avisos temporales no queremos mantenerlos visibles permanentemente ni registrar el avance del proyecto, simplemente recordar o notificar algo puntual.

1. **Crear un [bloque Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)**: elija cualquier zona del tablero y añada el contenido del aviso usando sintaxis Markdown.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

Para el uso real de Markdown puede consultar nuestro Demo oficial, la documentación oficial o el tutorial ["Documentos ligeros"](https://www.nocobase.com/cn/tutorials).

Como ejemplo, mostraremos la potencia del [bloque Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) con un "vistoso aviso" hecho con HTML.

- Código de ejemplo:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Aviso importante</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Estimados compañeros:</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Para mejorar la eficiencia del trabajo, el <span style="color: red; font-weight: bold; font-size: 1.5em;">10 de noviembre</span> realizaremos una formación general.</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">¡Gracias por su colaboración!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Saludos,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">El equipo de gestión</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 Resumen

Con estos pasos hemos creado un tablero personalizado que permite a los miembros del equipo gestionar sus tareas con eficacia, seguir el avance del proyecto y recibir avisos a tiempo.

Desde el filtrado por estado, la configuración del responsable hasta la presentación de información destacada, hemos optimizado la experiencia de usuario y aumentado la comodidad y flexibilidad del sistema.

El tablero personalizado está listo. Anímese a experimentarlo, adáptelo a sus necesidades reales y entremos en el [siguiente capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation).

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
