:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Inicio Rápido

## Introducción

Antes de usar el Empleado IA, necesita conectar un servicio LLM en línea. NocoBase actualmente soporta los servicios LLM en línea más populares, como OpenAI, Gemini, Claude, DepSeek, Qwen, entre otros.
Además de los servicios LLM en línea, NocoBase también permite conectar modelos locales de Ollama.

## Configurar el Servicio LLM

Vaya a la página de configuración del **plugin** de Empleado IA, haga clic en la pestaña `LLM service` para acceder a la página de gestión de servicios LLM.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

Pase el cursor sobre el botón `Add New` en la esquina superior derecha de la lista de servicios LLM y seleccione el servicio LLM que desea utilizar.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

Tomando OpenAI como ejemplo, en la ventana emergente, introduzca un `title` fácil de recordar y luego la `API key` obtenida de OpenAI. Haga clic en `Submit` para guardar y así completará la configuración del servicio LLM.

Normalmente, puede dejar el campo `Base URL` en blanco. Si está utilizando un servicio LLM de terceros compatible con la API de OpenAI, por favor, rellene la Base URL correspondiente.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Prueba de Disponibilidad

En la página de configuración del servicio LLM, haga clic en el botón `Test flight`, introduzca el nombre del modelo que desea usar y luego haga clic en el botón `Run` para verificar si el servicio LLM y el modelo están disponibles.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)