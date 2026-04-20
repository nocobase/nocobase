:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/ai-employees/features/task).
:::

# Tareas de acceso rápido

Para que los empleados de IA comiencen a trabajar de manera más eficiente, podemos vincular empleados de IA a bloques de escenario y preestablecer varias tareas comunes.

De esta manera, los usuarios pueden iniciar el procesamiento de tareas con un solo clic, sin tener que **seleccionar el bloque** e **ingresar instrucciones** cada vez.

## Vincular empleado de IA al bloque

Una vez que la página entre en modo de edición de la interfaz de usuario (UI), en los bloques que admitan `Actions`, seleccione el menú `AI employees` bajo `Actions` y elija un empleado de IA. Este empleado de IA quedará vinculado al bloque actual.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Una vez completada la vinculación, cada vez que acceda a la página, el área de `Actions` del bloque mostrará al empleado de IA vinculado al bloque actual.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configurar tareas

Tras entrar en el modo de edición de la interfaz de usuario, pase el cursor sobre el icono del empleado de IA vinculado al bloque. Aparecerá un botón de menú; seleccione `Edit tasks` para acceder a la página de configuración de tareas.

En la página de configuración de tareas, puede añadir múltiples tareas para el empleado de IA actual.

Cada pestaña representa una tarea independiente; haga clic en el signo "+" lateral para añadir una nueva tarea.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Formulario de configuración de tareas:

- Ingrese el título de la tarea en el campo `Title`. Este título, breve y descriptivo, aparecerá en la lista de tareas del empleado de IA.
- Ingrese el contenido principal de la tarea en el campo `Background`. Este contenido se utilizará como el mensaje de sistema (system prompt) al conversar con el empleado de IA.
- Ingrese el mensaje de usuario predeterminado en el campo `Default user message`. Al seleccionar la tarea, este se completará automáticamente en el cuadro de entrada del usuario.
- En `Work context`, seleccione la información de contexto de la aplicación que se enviará de forma predeterminada al empleado de IA. Esta operación es idéntica a la que se realiza en el panel de chat.
- El selector de `Skills` muestra las habilidades disponibles para el empleado de IA actual. Puede desactivar alguna habilidad para que el empleado de IA la ignore al ejecutar dicha tarea.
- La casilla de verificación `Send default user message automatically` configura si el mensaje de usuario predeterminado se envía automáticamente tras hacer clic para ejecutar la tarea.


## Lista de tareas

Una vez configuradas las tareas para el empleado de IA, estas aparecerán en la ventana flotante del perfil del empleado de IA y en el mensaje de saludo antes de iniciar la conversación. Haga clic para ejecutar la tarea.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)