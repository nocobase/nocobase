:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/ai-employees/configuration/admin-configuration).
:::

# Empleado IA · Guía de configuración para administradores

> Esta documentación le ayuda a entender rápidamente cómo configurar y gestionar empleados IA, guiándole paso a paso por todo el proceso, desde los servicios de modelo hasta la puesta en marcha de tareas.


## I. Antes de comenzar

### 1. Requisitos del sistema

Antes de configurar, asegúrese de que su entorno cumple las siguientes condiciones:

* Tener instalado **NocoBase 2.0 o una versión superior**
* Haber activado el **plugin de Empleado IA**
* Disponer de al menos un **servicio de modelo de lenguaje grande** (como OpenAI, Claude, DeepSeek, GLM, etc.)


### 2. Comprender el diseño de dos capas del empleado IA

Los empleados IA se dividen en dos capas: **"Definición de rol"** y **"Personalización de tareas"**.

| Capa | Descripción | Características | Función |
| -------- | ------------ | ---------- | ------- |
| **Definición de rol** | Personalidad básica y capacidades principales del empleado | Estable e inmutable, como un "currículum" | Garantiza la coherencia del rol |
| **Personalización de tareas** | Configuración para diferentes escenarios de negocio | Ajuste flexible | Se adapta a tareas específicas |

**Comprensión sencilla:**

> La "Definición de rol" determina quién es este empleado,
> la "Personalización de tareas" determina qué debe hacer en el momento actual.

Las ventajas de este diseño son:

* El rol no cambia, pero puede desempeñar diferentes escenarios.
* Actualizar o reemplazar tareas no afecta al empleado en sí.
* El contexto y las tareas son independientes, lo que facilita el mantenimiento.


## II. Proceso de configuración (5 pasos)

### Paso 1: Configurar el servicio de modelo

El servicio de modelo equivale al cerebro del empleado IA y debe configurarse primero.

> 💡 Para obtener instrucciones detalladas, consulte: [Configurar el servicio LLM](/ai-employees/features/llm-service)

**Ruta:**
`Ajustes del sistema → Empleado IA → LLM service`

![Entrar en la página de configuración](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Haga clic en **Añadir** y complete la siguiente información:

| Elemento | Descripción | Notas |
| ------ | -------------------------- | --------- |
| Provider | Como OpenAI, Claude, Gemini, Kimi, etc. | Compatible con servicios bajo la misma especificación |
| API Key | Clave proporcionada por el proveedor del servicio | Manténgala en secreto y cámbiela periódicamente |
| Base URL | API Endpoint (opcional) | Debe modificarse al usar un proxy |
| Enabled Models | Modelos recomendados / Seleccionar modelos / Entrada manual | Determina el rango de modelos intercambiables en la sesión |

![Crear servicio de modelo grande](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Tras la configuración, utilice `Test flight` para **probar la conexión**.
Si falla, compruebe la red, la clave o el nombre del modelo.

![Probar conexión](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Paso 2: Crear un empleado IA

> 💡 Para obtener instrucciones detalladas, consulte: [Crear empleado IA](/ai-employees/features/new-ai-employees)

Ruta: `Gestión de empleados IA → Crear empleado`

Complete la información básica:

| Campo | Obligatorio | Ejemplo |
| ----- | -- | -------------- |
| Nombre | ✓ | viz, dex, cole |
| Apodo | ✓ | Viz, Dex, Cole |
| Estado activado | ✓ | Activado |
| Biografía | - | "Experto en análisis de datos" |
| Prompt principal | ✓ | Ver guía de ingeniería de prompts |
| Mensaje de bienvenida | - | "Hola, soy Viz…" |

![Configuración de información básica](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

En la etapa de creación del empleado se completa principalmente la configuración de roles y habilidades. El modelo real utilizado puede seleccionarse en la sesión mediante el `Model Switcher`.

**Sugerencias para la redacción de prompts:**

* Explique claramente el rol, el tono y las responsabilidades del empleado.
* Utilice palabras como "debe" o "nunca" para enfatizar las reglas.
* Intente incluir ejemplos para evitar instrucciones abstractas.
* Manténgalo entre 500 y 1000 caracteres.

> Cuanto más claro sea el prompt, más estable será el rendimiento de la IA.
> Puede consultar la [Guía de ingeniería de prompts](./prompt-engineering-guide.md).


### Paso 3: Configurar habilidades

Las habilidades determinan qué "puede hacer" el empleado.

> 💡 Para obtener instrucciones detalladas, consulte: [Habilidades](/ai-employees/features/tool)

| Tipo | Alcance de capacidad | Ejemplo | Nivel de riesgo |
| ---- | ------- | --------- | ------ |
| Frontend | Interacción con la página | Leer datos de bloques, completar formularios | Bajo |
| Modelo de datos | Consulta y análisis de datos | Estadísticas agregadas | Medio |
| Flujo de trabajo | Ejecutar procesos de negocio | Herramientas personalizadas | Depende del flujo de trabajo |
| Otros | Extensiones externas | Búsqueda en red, operaciones de archivos | Según el caso |

**Sugerencias de configuración:**

* Lo más adecuado es asignar de 3 a 5 habilidades por empleado.
* No se recomienda seleccionarlas todas, ya que facilita la confusión.
* Para operaciones importantes, se sugiere usar el permiso `Ask` en lugar de `Allow`.

![Configurar habilidades](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Paso 4: Configurar base de conocimientos (opcional)

Si su empleado IA necesita memorizar o citar una gran cantidad de material, como manuales de productos o FAQ, puede configurar una base de conocimientos.

> 💡 Para obtener instrucciones detalladas, consulte:
> - [Descripción general de la base de conocimientos IA](/ai-employees/knowledge-base/index)
> - [Base de datos vectorial](/ai-employees/knowledge-base/vector-database)
> - [Configuración de la base de conocimientos](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Generación Aumentada por Recuperación)](/ai-employees/knowledge-base/rag)

Esto requiere la instalación adicional del plugin de base de datos vectorial.

![Configurar base de conocimientos](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Escenarios de aplicación:**

* Hacer que la IA comprenda el conocimiento empresarial.
* Soportar preguntas, respuestas y recuperación de documentos.
* Entrenar asistentes exclusivos de un dominio.


### Paso 5: Verificar el efecto

Al finalizar, verá el avatar del nuevo empleado en la esquina inferior derecha de la página.

![Verificar configuración](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Por favor, compruebe cada punto:

* ✅ ¿El icono se muestra correctamente?
* ✅ ¿Puede mantener una conversación básica?
* ✅ ¿Se pueden invocar las habilidades correctamente?

Si todo se cumple, la configuración ha sido exitosa 🎉


## III. Configuración de tareas: Poner al empleado IA a trabajar

Lo anterior completó la "creación del empleado",
ahora debe "ponerlos a trabajar".

Las tareas de IA definen el comportamiento del empleado en una página o bloque específico.

> 💡 Para obtener instrucciones detalladas, consulte: [Tareas](/ai-employees/features/task)


### 1. Tareas a nivel de página

Se aplican a todo el ámbito de la página, como "Analizar los datos de esta página".

**Entrada de configuración:**
`Ajustes de página → Empleado IA → Añadir tarea`

| Campo | Descripción | Ejemplo |
| ---- | -------- | --------- |
| Título | Nombre de la tarea | Análisis de conversión de etapas |
| Contexto | Contexto de la página actual | Página de lista de Leads |
| Mensaje predeterminado | Conversación preestablecida | "Por favor, analice la tendencia de este mes" |
| Bloque predeterminado | Asociar automáticamente una colección | Tabla de leads |
| Habilidades | Herramientas disponibles | Consultar datos, generar gráficos |

![Configuración de tareas a nivel de página](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Soporte multitarea:**
Un mismo empleado IA puede tener configuradas varias tareas, que se presentan como opciones para el usuario:

![Soporte multitarea](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Sugerencias:

* Una tarea debe enfocarse en un solo objetivo.
* El nombre debe ser claro y fácil de entender.
* Controle el número de tareas entre 5 y 7.


### 2. Tareas a nivel de bloque

Adecuadas para operar en un bloque específico, como "Traducir el formulario actual".

**Método de configuración:**

1. Abra la configuración de operaciones del bloque.
2. Añada "Empleado IA".

![Botón Añadir empleado IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Vincule al empleado objetivo.

![Seleccionar empleado IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configuración de tareas a nivel de bloque](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Ítem de comparación | Nivel de página | Nivel de bloque |
| ---- | ---- | --------- |
| Alcance de datos | Toda la página | Bloque actual |
| Granularidad | Análisis global | Procesamiento de detalles |
| Uso típico | Análisis de tendencias | Traducción de formularios, extracción de campos |


## IV. Mejores prácticas

### 1. Sugerencias de configuración

| Elemento | Sugerencia | Razón |
| ---------- | ----------- | -------- |
| Número de habilidades | 3–5 | Alta precisión, respuesta rápida |
| Modo de permiso (Ask / Allow) | Sugerir Ask para modificar datos | Evita operaciones erróneas |
| Longitud del prompt | 500–1000 caracteres | Equilibra velocidad y calidad |
| Objetivo de la tarea | Único y claro | Evita que la IA se confunda |
| Flujo de trabajo | Usar tras encapsular tareas complejas | Mayor tasa de éxito |


### 2. Sugerencias prácticas

**De lo pequeño a lo grande, optimización gradual:**

1. Primero cree empleados básicos (como Viz, Dex).
2. Active 1 o 2 habilidades principales para probar.
3. Confirme que las tareas se ejecutan normalmente.
4. Luego expanda gradualmente a más habilidades y tareas.

**Optimización continua del proceso:**

1. Que la versión inicial funcione.
2. Recopile comentarios de uso.
3. Optimice prompts y configuración de tareas.
4. Pruebe y mejore en ciclos.


## V. Preguntas frecuentes

### 1. Etapa de configuración

**P: ¿Qué hacer si falla el guardado?**
R: Compruebe si ha completado todos los campos obligatorios, especialmente el servicio de modelo y el prompt.

**P: ¿Qué modelo elegir?**

* Tipo código → Claude, GPT-4
* Tipo análisis → Claude, DeepSeek
* Sensible al coste → Qwen, GLM
* Texto largo → Gemini, Claude


### 2. Etapa de uso

**P: ¿La respuesta de la IA es muy lenta?**

* Reduzca el número de habilidades.
* Optimice el prompt.
* Compruebe la latencia del servicio de modelo.
* Considere cambiar de modelo.

**P: ¿La ejecución de la tarea no es precisa?**

* El prompt no es suficientemente claro.
* Demasiadas habilidades causan confusión.
* Divida en tareas pequeñas, añada ejemplos.

**P: ¿Cuándo elegir Ask / Allow?**

* Para tareas de consulta puede usar `Allow`.
* Para tareas de modificación de datos se recomienda usar `Ask`.

**P: ¿Cómo hacer que la IA procese un formulario específico?**

R: Si es una configuración a nivel de página, debe seleccionar el bloque manualmente.

![Seleccionar bloque manualmente](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Si es una configuración de tarea a nivel de bloque, el contexto de datos se vincula automáticamente.


## VI. Lectura adicional

Para potenciar a su empleado IA, puede continuar leyendo los siguientes documentos:

**Relacionado con la configuración:**

* [Guía de ingeniería de prompts](./prompt-engineering-guide.md) - Técnicas y mejores prácticas para escribir prompts de alta calidad.
* [Configurar el servicio LLM](/ai-employees/features/llm-service) - Instrucciones detalladas para configurar servicios de modelos grandes.
* [Crear empleado IA](/ai-employees/features/new-ai-employees) - Creación y configuración básica de empleados IA.
* [Colaborar con empleados IA](/ai-employees/features/collaborate) - Cómo mantener diálogos efectivos con empleados IA.

**Funciones avanzadas:**

* [Habilidades](/ai-employees/features/tool) - Conocimiento profundo sobre la configuración y uso de diversas habilidades.
* [Tareas](/ai-employees/features/task) - Técnicas avanzadas para la configuración de tareas.
* [Seleccionar bloque](/ai-employees/features/pick-block) - Cómo especificar bloques de datos para el empleado IA.
* Fuente de datos - Consulte el documento de configuración de fuente de datos del plugin correspondiente.
* [Búsqueda en red](/ai-employees/features/web-search) - Configurar la capacidad de búsqueda en red del empleado IA.

**Base de conocimientos y RAG:**

* [Descripción general de la base de conocimientos IA](/ai-employees/knowledge-base/index) - Introducción a las funciones de la base de conocimientos.
* [Base de datos vectorial](/ai-employees/knowledge-base/vector-database) - Configuración de la base de datos vectorial.
* [Base de conocimientos](/ai-employees/knowledge-base/knowledge-base) - Cómo crear y gestionar bases de conocimientos.
* [RAG (Generación Aumentada por Recuperación)](/ai-employees/knowledge-base/rag) - Aplicación de la tecnología RAG.

**Integración de flujos de trabajo:**

* [Nodo LLM - Chat de texto](/ai-employees/workflow/nodes/llm/chat) - Uso del chat de texto en el flujo de trabajo.
* [Nodo LLM - Chat multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Procesamiento de entradas multimodales como imágenes y archivos.
* [Nodo LLM - Salida estructurada](/ai-employees/workflow/nodes/llm/structured-output) - Obtención de respuestas de IA estructuradas.


## Conclusión

Lo más importante al configurar empleados IA es: **primero hacerlo funcionar, luego optimizar**.
Logre que el primer empleado se ponga en marcha con éxito y luego expanda y ajuste gradualmente.

El orden de resolución de problemas puede ser:

1. ¿Está conectado el servicio de modelo?
2. ¿Hay demasiadas habilidades?
3. ¿Es claro el prompt?
4. ¿Es nítido el objetivo de la tarea?

Si avanza paso a paso, podrá construir un equipo de IA verdaderamente eficiente.