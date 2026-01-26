:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Avanzado

## Introducción

Los Empleados de IA se pueden vincular a páginas o bloques. Una vez vinculados, usted puede configurar tareas específicas para la operación actual, permitiendo a los usuarios utilizar rápidamente el Empleado de IA para procesar tareas directamente en la página o el bloque.

## Vincular un Empleado de IA a una página

Una vez que la página entra en modo de edición de UI, verá un signo '+' junto al botón de acceso rápido del Empleado de IA en la esquina inferior derecha. Al pasar el ratón sobre el signo '+', aparecerá una lista de Empleados de IA. Seleccione un Empleado de IA para vincularlo a la página actual.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

Una vez completada la vinculación, cada vez que acceda a la página, el Empleado de IA vinculado a ella se mostrará en la esquina inferior derecha.

![20251022134903](https://static-docs.nocobase.com/20251022134903.png)

## Vincular un Empleado de IA a un bloque

Una vez que la página entra en modo de edición de UI, en un bloque que admita la configuración de `Actions`, seleccione el menú `AI employees` dentro de `Actions` y luego elija un Empleado de IA para vincularlo al bloque actual.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Una vez completada la vinculación, cada vez que acceda a la página, el Empleado de IA vinculado al bloque actual se mostrará en el área de `Actions` del bloque.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configurar tareas

Una vez que la página entra en modo de edición de UI, pase el ratón sobre el icono del Empleado de IA vinculado a la página o al bloque. Aparecerá un botón de menú. Seleccione `Edit tasks` para acceder a la página de configuración de tareas.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

Una vez en la página de configuración de tareas, usted puede añadir múltiples tareas para el Empleado de IA actual.

Cada pestaña representa una tarea independiente. Haga clic en el signo '+' que se encuentra al lado para añadir una nueva tarea.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Formulario de configuración de tareas:

- En el campo de entrada `Title`, introduzca el título de la tarea. Describa brevemente el contenido de la tarea. Este título aparecerá en la lista de tareas del Empleado de IA.
- En el campo de entrada `Background`, introduzca el contenido principal de la tarea. Este contenido se utilizará como el *prompt* del sistema al conversar con el Empleado de IA.
- En el campo de entrada `Default user message`, introduzca el mensaje de usuario predeterminado que se enviará. Este se rellenará automáticamente en el campo de entrada del usuario después de seleccionar la tarea.
- En `Work context`, seleccione la información de contexto de la aplicación predeterminada que se enviará al Empleado de IA. Esta operación es la misma que la que se realiza en el cuadro de diálogo.
- El cuadro de selección `Skills` muestra las habilidades disponibles para el Empleado de IA actual. Usted puede deseleccionar una habilidad para que el Empleado de IA la ignore y no la utilice al realizar esta tarea.
- La casilla de verificación `Send default user message automatically` configura si se debe enviar automáticamente el mensaje de usuario predeterminado después de hacer clic para ejecutar la tarea.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Lista de tareas

Después de configurar las tareas para un Empleado de IA, estas se mostrarán en la ventana emergente de su perfil y en el mensaje de saludo antes de iniciar una conversación. Haga clic en una tarea para ejecutarla.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)