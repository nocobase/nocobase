:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Avanzado

## Introducción

Los modelos de lenguaje grandes (LLM) más populares tienen la capacidad de utilizar herramientas. El plugin de "AI employee" (empleado de IA) incluye algunas herramientas comunes para que los LLM las utilicen.

Las habilidades que se configuran en la página de ajustes del empleado de IA son las herramientas disponibles para que el modelo de lenguaje grande las use.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Configurar Habilidades

Para configurar las habilidades, diríjase a la página de configuración del plugin de "AI employee". Allí, haga clic en la pestaña `AI employees` para acceder a la página de gestión de empleados de IA.

Seleccione el empleado de IA al que desea asignar habilidades y haga clic en el botón `Edit` para entrar en su página de edición.

Dentro de la pestaña `Skills`, haga clic en el botón `Add Skill` para añadir una habilidad al empleado de IA actual.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Introducción a las Habilidades

### Frontend

El grupo de habilidades `Frontend` permite que el empleado de IA interactúe con los componentes de la interfaz de usuario.

- La habilidad `Form filler` permite al empleado de IA rellenar datos generados en un formulario específico indicado por el usuario.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling (Modelado de datos)

El grupo de habilidades `Data modeling` (Modelado de datos) otorga al empleado de IA la capacidad de invocar las API internas de NocoBase para realizar el modelado de datos.

- `Intent Router`: Este enrutador de intenciones determina si el usuario desea modificar la estructura de una **colección** existente o crear una nueva.
- `Get collection names`: Obtiene los nombres de todas las **colecciones** existentes en el sistema.
- `Get collection metadata`: Obtiene la información de la estructura de una **colección** específica.
- `Define collections`: Permite al empleado de IA crear **colecciones** en el sistema.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller (Invocador de flujos de trabajo)

La habilidad `Workflow caller` (Invocador de **flujos de trabajo**) dota al empleado de IA de la capacidad de ejecutar **flujos de trabajo**. Los **flujos de trabajo** que se configuran en el **plugin** de **flujo de trabajo** con el `Trigger type` (Tipo de disparador) como `AI employee event` (Evento de empleado de IA) estarán disponibles aquí como habilidades para que el empleado de IA las utilice.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor (Editor de código)

Las habilidades dentro del grupo `Code Editor` (Editor de código) permiten principalmente que el empleado de IA interactúe con el editor de código.

- `Get code snippet list`: Obtiene la lista de fragmentos de código preestablecidos.
- `Get code snippet content`: Obtiene el contenido de un fragmento de código específico.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Otros

- `Chart generator`: Esta habilidad permite al empleado de IA generar gráficos y mostrarlos directamente en la conversación.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)