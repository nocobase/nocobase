# Capítulo 2: Diseño del sistema de gestión de tareas

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113593597037138&bvid=BV1oCi2YdEAU&cid=27174896249&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Diseñar un sistema de gestión de tareas puede parecer complicado, pero con NocoBase el proceso resulta sencillo y entretenido. Repasaremos juntos los requisitos, diseñaremos la estructura de datos y planificaremos las funcionalidades futuras. No se preocupe: no nos perderemos en montañas de código, sino que construiremos su sistema de gestión de tareas del modo más intuitivo y simple posible.

### 2.1 Análisis de requisitos del sistema

Antes de empezar, definamos qué funcionalidades debe tener el sistema. Piense en cómo gestiona usted las tareas habitualmente, o en qué debería poder hacer su sistema de gestión de tareas ideal:

- **Gestión de tareas**: los usuarios pueden crear, editar y eliminar tareas, asignarlas a distintas personas y hacer seguimiento de su progreso en cualquier momento.
- **Múltiples vistas**: las tareas no solo se muestran en forma de lista, sino también en tablero kanban, diagrama de Gantt o vista de calendario.
- **Documentación en línea**: debe ser posible editar la documentación de las tareas en línea para que los miembros del equipo conozcan los detalles.
- **Gestión de adjuntos**: posibilidad de añadir archivos adjuntos a las tareas, subiendo imágenes, vídeos o registros importantes.
- **Comentarios**: los participantes en una tarea pueden comentarla, compartir opiniones y dejar constancia del proceso de discusión.

A continuación, organicemos las relaciones entre estos módulos con un diagrama sencillo:
![](https://static-docs.nocobase.com/20241219-0-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER.drawio.svg)

¿Verdad que se ve mucho más claro?

---

> **Introducción a las tablas:** NocoBase utiliza una definición llamada "Collection" para describir la estructura de datos. Esto permite unificar datos provenientes de distintas fuentes y aporta una base sólida para la gestión y el análisis de datos.
>
> Soporta varios tipos de tablas: tablas normales, tablas heredadas, tablas de árbol, tablas de calendario, tablas de archivos, tablas de expresión, tablas SQL, vistas y tablas externas, cubriendo así todas las necesidades de tratamiento de datos. Este diseño hace que las operaciones con datos sean más flexibles y eficientes.

### 2.2 Diseño de las tablas

Llega el momento de pensar un poco. Para soportar las funcionalidades anteriores hay que planificar las tablas del sistema. Tranquilo: no necesitamos una estructura de base de datos compleja, basta con unas pocas tablas sencillas.

Según los requisitos analizados, normalmente diseñaremos las siguientes tablas:

1. **Tabla de usuarios (Users)**: registra los usuarios del sistema. ¿Quién está realizando las tareas? ¿Quién las gestiona?
2. **Tabla de tareas (Tasks)**: registra los detalles de cada tarea, incluyendo su nombre, documentación, responsables y estado.
3. **Tabla de adjuntos (Attachments)**: registra todos los adjuntos relacionados con las tareas, como imágenes, archivos, etc.
4. **Tabla de comentarios (Comments)**: registra los comentarios de los usuarios sobre las tareas para facilitar la interacción del equipo.

La relación entre estas tablas es sencilla: cada tarea puede tener múltiples adjuntos y comentarios, y todos los adjuntos y comentarios son creados o subidos por algún usuario. Esta es la estructura central de nuestro sistema de gestión de tareas.

Vea el siguiente diagrama, que muestra la relación básica entre estas tablas:
![](https://static-docs.nocobase.com/%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER241219-0.drawio.svg)

### 2.3 Diseño de las tablas en NocoBase

Entonces, ¿qué tablas necesitamos crear realmente para implementar este sistema con NocoBase? Más sencillo de lo que cree:

- **Tabla de tareas**: el núcleo del sistema, almacena los detalles de cada tarea.
- **Tabla de comentarios**: almacena los comentarios sobre las tareas para que el equipo pueda dar feedback.

Otras funcionalidades, como la gestión de adjuntos o la información de usuarios, ya las tiene NocoBase resueltas, así que no es necesario crearlas manualmente. ¿Verdad que se simplifica todo mucho?

Empezaremos con un sistema sencillo de gestión de datos de tareas y lo iremos ampliando. Por ejemplo, primero diseñamos los campos básicos de la tarea y, después, añadimos la función de comentarios. Todo el proceso es flexible y controlable.

La estructura general de la tabla, con los campos necesarios, será aproximadamente la siguiente:
![](https://static-docs.nocobase.com/241219-1.svg)

### Resumen

Con esta sección ha visto cómo diseñar un sistema de gestión de tareas básico. En NocoBase partimos del análisis de requisitos para planificar las tablas y los campos. A partir de aquí descubrirá que implementar las funcionalidades es incluso más sencillo que diseñarlas.

Por ejemplo, la tabla de tareas comenzará siendo así de sencilla:

```text
Tabla de tareas (Tasks):
        Nombre de la tarea (task_name) Texto de una línea
        Descripción de la tarea (task_description) Texto multilínea
```

Muy intuitivo, ¿verdad? ¿Listo para el [siguiente capítulo (Capítulo 3: Gestión de datos de tareas)](https://www.nocobase.com/cn/tutorials/task-tutorial-data-management-guide)?

---

Siga explorando y dando rienda suelta a su creatividad. Si tiene problemas durante el proceso, recuerde que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/). ¡Hasta el próximo capítulo!
