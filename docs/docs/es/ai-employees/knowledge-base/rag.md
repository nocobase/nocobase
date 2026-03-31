:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Recuperación RAG

## Introducción

Una vez que haya configurado la base de conocimientos, podrá habilitar la función RAG en la configuración de los empleados de IA.

Cuando RAG está habilitado, al conversar con un empleado de IA, este utilizará la recuperación RAG para obtener documentos de la base de conocimientos basándose en el mensaje del usuario y responderá utilizando los documentos recuperados.

## Habilitar RAG

Vaya a la página de configuración del plugin de empleados de IA, haga clic en la pestaña `AI employees` para acceder a la página de gestión de empleados de IA.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Seleccione el empleado de IA para el que desea habilitar RAG, haga clic en el botón `Edit` para acceder a la página de edición del empleado de IA.

En la pestaña `Knowledge base`, active el interruptor `Enable`.

- En `Knowledge Base Prompt`, introduzca el mensaje (prompt) para referenciar la base de conocimientos. `{knowledgeBaseData}` es un marcador de posición fijo y no debe modificarse.
- En `Knowledge Base`, seleccione la base de conocimientos configurada. Consulte: [Base de conocimientos](/ai-employees/knowledge-base/knowledge-base).
- En el campo `Top K`, introduzca el número de documentos a recuperar; el valor predeterminado es 3.
- En el campo `Score`, introduzca el umbral de relevancia de los documentos para la recuperación.

Haga clic en el botón `Submit` para guardar la configuración del empleado de IA.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)