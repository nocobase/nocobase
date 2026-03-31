---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# CC <Badge>v1.8.2+</Badge>

## Introducción

El nodo CC (Copia de Carbón) se utiliza para enviar cierto contenido contextual del proceso de ejecución del flujo de trabajo a usuarios específicos para su información y consulta. Por ejemplo, en un proceso de aprobación u otro flujo, se puede enviar la información relevante a otros participantes para que estén al tanto del progreso.

Usted puede configurar varios nodos CC en un flujo de trabajo. Cuando el flujo de trabajo llega a uno de estos nodos, la información relevante se enviará a los destinatarios especificados.

El contenido enviado por CC se mostrará en el menú "CC para mí" del Centro de Tareas Pendientes, donde los usuarios pueden ver todo el contenido enviado por CC a ellos. También se les notificará sobre los elementos no leídos y, después de verlos, pueden marcarlos manualmente como leídos.

## Crear un nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ('+') en el flujo para añadir un nodo 'CC'.

![Añadir CC](https://static-docs.nocobase.com/20250710222842.png)

## Configuración del nodo

![Configuración del nodo](https://static-docs.nocobase.com/20250710224041.png)

En la interfaz de configuración del nodo, usted puede configurar los siguientes parámetros:

### Destinatarios

Los destinatarios son la colección de usuarios a los que se enviará el CC, y pueden ser uno o varios usuarios. La fuente de selección puede ser un valor estático elegido de la lista de usuarios, un valor dinámico especificado por una variable, o el resultado de una consulta en la colección de usuarios.

![Configuración de destinatarios](https://static-docs.nocobase.com/20250710224421.png)

### Interfaz de usuario

Los destinatarios necesitan ver el contenido enviado por CC en el menú "CC para mí" del Centro de Tareas Pendientes. Usted puede configurar los resultados del disparador y de cualquier nodo en el contexto del flujo de trabajo como bloques de contenido.

![Interfaz de usuario](https://static-docs.nocobase.com/20250710225400.png)

### Título de la tarea

El título de la tarea es el título que se muestra en el Centro de Tareas Pendientes. Usted puede usar variables del contexto del flujo de trabajo para generar el título dinámicamente.

![Título de la tarea](https://static-docs.nocobase.com/20250710225603.png)

## Centro de Tareas Pendientes

Los usuarios pueden ver y gestionar todo el contenido enviado por CC a ellos en el Centro de Tareas Pendientes, y filtrar y ver según el estado de lectura.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Después de ver un elemento, usted puede marcarlo como leído, y el recuento de no leídos disminuirá en consecuencia.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)