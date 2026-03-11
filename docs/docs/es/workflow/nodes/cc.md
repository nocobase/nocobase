---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/workflow/nodes/cc).
:::

# Copia de carbón (CC) <Badge>v1.8.2+</Badge>

## Introducción

El nodo de copia de carbón se utiliza para enviar ciertos contenidos contextuales del proceso de ejecución del flujo de trabajo a usuarios específicos para su información y consulta. Por ejemplo, en una aprobación u otros procesos, se puede enviar la información relevante a otros participantes para que puedan mantenerse informados sobre el progreso del trabajo de manera oportuna.

Usted puede configurar múltiples nodos de copia de carbón en un flujo de trabajo para que, cuando la ejecución del flujo de trabajo llegue a dicho nodo, se envíe la información relevante a los destinatarios especificados.

El contenido de la copia de carbón se mostrará en el menú "CC para mí" del Centro de tareas pendientes, donde los usuarios pueden ver todo el contenido que se les ha enviado. Además, se notificará a los usuarios sobre el contenido de la copia de carbón que aún no han visto según el estado de no leído, y los usuarios pueden marcarlo activamente como leído después de verlo.

## Crear nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ("+") en el flujo para añadir un nodo de "Copia de carbón":

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Configuración del nodo

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

En la interfaz de configuración del nodo, usted puede establecer los siguientes parámetros:

### Destinatarios

Los destinatarios son la colección de usuarios objeto de la copia de carbón, que pueden ser uno o más usuarios. La fuente de selección puede ser un valor estático seleccionado de la lista de usuarios, un valor dinámico especificado por una variable o el resultado de una consulta en la colección de usuarios.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Interfaz de usuario

Los destinatarios deben ver el contenido de la copia de carbón en el menú "CC para mí" del Centro de tareas pendientes. Usted puede configurar los resultados del disparador y de cualquier nodo en el contexto del flujo de trabajo como bloques de contenido.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Tarjeta de tarea <Badge>2.0+</Badge>

Se puede utilizar para configurar la tarjeta de tarea en la lista "CC para mí" del Centro de tareas pendientes.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

En la tarjeta se pueden configurar libremente los campos de negocio que se deseen mostrar (excepto los campos de relación).

Una vez creada la tarea de copia de carbón del flujo de trabajo, la tarjeta de tarea personalizada se podrá ver en la lista del Centro de tareas pendientes:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Título de la tarea

El título de la tarea es el título que se muestra en el Centro de tareas pendientes. Usted puede utilizar variables del contexto del flujo de trabajo para generar el título de forma dinámica.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Centro de tareas pendientes

Los usuarios pueden ver y gestionar todo el contenido que se les ha enviado por copia de carbón en el Centro de tareas pendientes, y filtrar y ver según el estado de lectura.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Después de verlo, usted puede marcarlo como leído y la cantidad de no leídos disminuirá en consecuencia.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)