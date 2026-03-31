:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Avanzado

## Introducción

Generalmente, los modelos de lenguaje grandes (LLM) tienen una actualidad de datos limitada y carecen de la información más reciente. Por esta razón, las plataformas de servicios LLM en línea suelen ofrecer una función de búsqueda web. Esto permite que la IA busque información utilizando herramientas antes de responder, y luego genere su respuesta basándose en los resultados de esa búsqueda.

Los empleados de IA se han adaptado para utilizar la función de búsqueda web de diversas plataformas de servicios LLM en línea. Usted puede activar esta función tanto en la configuración del modelo del empleado de IA como durante las conversaciones.

## Activar la función de búsqueda web

Vaya a la página de configuración del **plugin** de empleados de IA, haga clic en la pestaña `AI employees` para acceder a la página de gestión de empleados de IA.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Seleccione el empleado de IA para el que desea activar la función de búsqueda web, haga clic en el botón `Edit` para entrar en la página de edición del empleado de IA.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

En la pestaña `Model settings`, active el interruptor `Web Search` y haga clic en el botón `Submit` para guardar los cambios.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Usar la función de búsqueda web en las conversaciones

Una vez que un empleado de IA tiene activada la función de búsqueda web, aparecerá un icono de "Web" adicional en el cuadro de entrada de la conversación. La búsqueda web está habilitada por defecto, y usted puede hacer clic en el icono para desactivarla.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Con la búsqueda web activada, la respuesta del empleado de IA mostrará los resultados de la búsqueda web.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Diferencias en las herramientas de búsqueda web entre plataformas

Actualmente, la función de búsqueda web de los empleados de IA depende de la plataforma de servicios LLM en línea que la proporcione, por lo que la experiencia de usuario puede variar. A continuación, se detallan las diferencias específicas:

| Plataforma  | Búsqueda web | tools | Respuesta en tiempo real con términos de búsqueda | Devuelve enlaces externos como referencia en la respuesta |
| ----------- | ------------ | ----- | ------------------------------------------------- | --------------------------------------------------------- |
| OpenAI      | ✅            | ✅     | ✅                                                | ✅                                                        |
| Gemini      | ✅            | ❌     | ❌                                                | ✅                                                        |
| Dashscope   | ✅            | ✅     | ❌                                                | ❌                                                        |
| Deepseek    | ❌            | ❌     | ❌                                                | ❌                                                        |