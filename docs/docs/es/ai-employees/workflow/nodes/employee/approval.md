# Aprobación del nodo

## Notificación

Cuando se activa un nodo de AI Employee dentro de un workflow, el aprobador configurado en el nodo verá un punto rojo de aviso en la entrada de AI Employee de la página principal.

![20260420171416](https://static-docs.nocobase.com/20260420171416.png)

Al acceder a la lista de conversaciones del AI Employee podrá ver las tareas del workflow pendientes de aprobación.

![20260420171642](https://static-docs.nocobase.com/20260420171642.png)

## Aprobación

Haga clic en la tarea del workflow para abrir la ventana de conversación, donde se mostrará el historial de mensajes del AI Employee. La última tarjeta enviada por el AI Employee es el contenido que requiere aprobación en el nodo actual.

![20260420180710](https://static-docs.nocobase.com/20260420180710.png)

Para el contenido pendiente de aprobación existen tres acciones posibles: Approve (aprobar), Revise (modificar) y Reject (rechazar).

Al hacer clic en Approve se aprueba el uso del contenido generado por la IA y el workflow continúa su ejecución. La conversación pasa a estado de solo lectura, por lo que no podrá seguir conversando con el AI Employee.

![20260420180632](https://static-docs.nocobase.com/20260420180632.png)

Al hacer clic en Revise se proponen cambios a la IA. Tras enviar la propuesta, la IA responderá con una nueva tarjeta de aprobación.

![20260420180908](https://static-docs.nocobase.com/20260420180908.png)

Al hacer clic en Reject se rechaza la ejecución y el workflow se detiene. La conversación pasa a estado de solo lectura, por lo que no podrá seguir conversando con el AI Employee.

![20260420181003](https://static-docs.nocobase.com/20260420181003.png)
