---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Salida Estructurada

## Introducción

En algunos escenarios de aplicación, es posible que los usuarios deseen que el modelo LLM responda con contenido estructurado en formato JSON. Esto se puede lograr configurando la «Salida Estructurada».

![](https://static-docs.nocobase.com/202503041306405.png)

## Configuración

- **JSON Schema** - Usted puede especificar la estructura esperada de la respuesta del modelo configurando un [JSON Schema](https://json-schema.org/).
- **Nombre (Name)** - _Opcional_, se utiliza para ayudar al modelo a comprender mejor el objeto que representa el JSON Schema.
- **Descripción (Description)** - _Opcional_, se utiliza para ayudar al modelo a comprender mejor el propósito del JSON Schema.
- **Strict** - Requiere que el modelo genere una respuesta estrictamente de acuerdo con la estructura del JSON Schema. Actualmente, solo algunos modelos nuevos de OpenAI son compatibles con este parámetro. Por favor, confirme si su modelo es compatible antes de habilitarlo.

## Método de Generación de Contenido Estructurado

La forma en que un modelo genera contenido estructurado depende del **modelo** utilizado y de su configuración de **Response format**:

1. Modelos donde el Response format solo admite `text`

   - Al ser invocado, el nodo vinculará una herramienta (Tool) que genera contenido en formato JSON basándose en el JSON Schema, guiando al modelo para que genere una respuesta estructurada al invocar esta herramienta.

2. Modelos donde el Response format admite el modo JSON (`json_object`)

   - Si se selecciona el modo JSON al invocarlo, usted debe indicar explícitamente al modelo en el Prompt que devuelva la información en formato JSON y que proporcione descripciones para los campos de respuesta.
   - En este modo, el JSON Schema solo se utiliza para analizar la cadena JSON devuelta por el modelo y convertirla en el objeto JSON de destino.

3. Modelos donde el Response format admite JSON Schema (`json_schema`)

   - El JSON Schema se utiliza directamente para especificar la estructura de respuesta objetivo para el modelo.
   - El parámetro opcional **Strict** requiere que el modelo siga estrictamente el JSON Schema al generar la respuesta.

4. Modelos locales de Ollama
   - Si se configura un JSON Schema, el nodo lo pasará como parámetro `format` al modelo al ser invocado.

## Uso del Resultado de Salida Estructurada

El contenido estructurado de la respuesta del modelo se guarda como un objeto JSON en el campo Structured content del nodo y puede ser utilizado por nodos posteriores.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)