:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Empleados IA · Guía de configuración para administradores

> Este documento le ayudará a comprender rápidamente cómo configurar y gestionar los empleados IA, guiándole paso a paso por todo el proceso, desde los servicios de modelo hasta la asignación de tareas.

## I. Antes de empezar

### 1. Requisitos del sistema

Antes de configurar, asegúrese de que su entorno cumple las siguientes condiciones:

*  Tener instalado **NocoBase 2.0 o una versión superior**
*  Haber activado el **plugin de Empleados IA**
*  Disponer de al menos un **servicio de modelo de lenguaje grande** (LLM) disponible (por ejemplo, OpenAI, Claude, DeepSeek, GLM, etc.)

### 2. Comprender el diseño de doble capa de los empleados IA

Los empleados IA se dividen en dos capas: la **"Definición de rol"** y la **"Personalización de tareas"**.

| Capa | Descripción | Características | Función |
|---|---|---|---|
| **Definición de rol** | La personalidad básica y las habilidades principales del empleado | Estable e inmutable, como un "currículum" | Garantiza la coherencia del rol |
| **Personalización de tareas** | Configuración para diferentes escenarios de negocio | Flexible y adaptable | Se ajusta a tareas específicas |

**En pocas palabras:**

> La "Definición de rol" determina quién es este empleado,
> la "Personalización de tareas" determina qué está haciendo en este momento.

Las ventajas de este diseño son:

*  El rol permanece constante, pero puede desempeñarse en diferentes escenarios.
*  Actualizar o reemplazar tareas no afecta al empleado en sí.
*  El contexto y las tareas son independientes, lo que facilita el mantenimiento.

## II. Proceso de configuración (en 5 pasos)

### Paso 1: Configurar el servicio de modelo

El servicio de modelo es como el cerebro de un empleado IA y debe configurarse primero.

> 💡 Para obtener instrucciones de configuración detalladas, consulte: [Configurar el servicio LLM](/ai-employees/quick-start/llm-service)

**Ruta:**
`Ajustes del sistema → Empleados IA → Servicio de modelo`

![Entrar en la página de configuración](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Haga clic en **Añadir** y rellene la siguiente información:

| Elemento | Descripción | Notas |
|---|---|---|
| Tipo de interfaz | Por ejemplo, OpenAI, Claude, etc. | Compatible con servicios que utilizan la misma especificación |
| Clave API | La clave proporcionada por el proveedor del servicio | Manténgala confidencial y cámbiela regularmente |
| Dirección del servicio | Endpoint de la API | Debe modificarse al usar un proxy |
| Nombre del modelo | Nombre específico del modelo (por ejemplo, gpt-4, claude-opus) | Afecta a las capacidades y al coste |

![Crear un servicio de modelo grande](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Después de la configuración, por favor, **pruebe la conexión**.
Si falla, compruebe su red, clave API o nombre del modelo.

![Probar conexión](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Paso 2: Crear un empleado IA

> 💡 Para obtener instrucciones detalladas, consulte: [Crear un empleado IA](/ai-employees/quick-start/ai-employees)

Ruta: `Gestión de empleados IA → Crear empleado`

Rellene la información básica:

| Campo | Obligatorio | Ejemplo |
|---|---|---|
| Nombre | ✓ | viz, dex, cole |
| Apodo | ✓ | Viz, Dex, Cole |
| Estado activado | ✓ | Activado |
| Biografía | - | "Experto en análisis de datos" |
| Prompt principal | ✓ | Consulte la Guía de ingeniería de prompts |
| Mensaje de bienvenida | - | "Hola, soy Viz…" |

![Configuración de información básica](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Luego, vincule el **servicio de modelo** que acaba de configurar.

![Vincular servicio de modelo grande](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Sugerencias para la redacción de prompts:**

*  Describa claramente el rol, el tono y las responsabilidades del empleado.
*  Utilice palabras como "debe" y "nunca" para enfatizar las reglas.
*  Incluya ejemplos siempre que sea posible para evitar descripciones abstractas.
*  Manténgalo entre 500 y 1000 caracteres.

> Cuanto más claro sea el prompt, más estable será el rendimiento de la IA.
> Puede consultar la [Guía de ingeniería de prompts](./prompt-engineering-guide.md).

### Paso 3: Configurar habilidades

Las habilidades determinan lo que un empleado "puede hacer".

> 💡 Para obtener instrucciones detalladas, consulte: [Habilidades](/ai-employees/advanced/skill)

| Tipo | Alcance de la capacidad | Ejemplo | Nivel de riesgo |
|---|---|---|---|
| Frontend | Interacción con la página | Leer datos de bloques, rellenar formularios | Bajo |
| Modelo de datos | Consulta y análisis de datos | Estadísticas agregadas | Medio |
| Flujo de trabajo | Ejecutar procesos de negocio | Herramientas personalizadas | Depende del flujo de trabajo |
| Otros | Extensiones externas | Búsqueda web, operaciones de archivos | Varía |

**Sugerencias de configuración:**

*  Lo más adecuado es que cada empleado tenga entre 3 y 5 habilidades.
*  No se recomienda seleccionar todas las habilidades, ya que puede causar confusión.
*  Desactive el uso automático (Auto usage) antes de realizar operaciones importantes.

![Configurar habilidades](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Paso 4: Configurar la base de conocimientos (Opcional)

Si su empleado IA necesita recordar o consultar una gran cantidad de material, como manuales de productos, preguntas frecuentes, etc., puede configurar una base de conocimientos.

> 💡 Para obtener instrucciones detalladas, consulte:
> - [Descripción general de la base de conocimientos IA](/ai-employees/knowledge-base/index)
> - [Base de datos vectorial](/ai-employees/knowledge-base/vector-database)
> - [Configuración de la base de conocimientos](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Generación Aumentada por Recuperación)](/ai-employees/knowledge-base/rag)

Esto requiere la instalación adicional del plugin de base de datos vectorial.

![Configurar base de conocimientos](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Escenarios de aplicación:**

*  Para que la IA comprenda el conocimiento empresarial.
*  Para soportar preguntas y respuestas, y recuperación de documentos.
*  Para entrenar asistentes específicos de dominio.

### Paso 5: Verificar el resultado

Una vez completado, verá el avatar del nuevo empleado en la esquina inferior derecha de la página.

![Verificar configuración](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Por favor, compruebe cada elemento:

*  ✅ ¿El icono se muestra correctamente?
*  ✅ ¿Puede mantener una conversación básica?
*  ✅ ¿Las habilidades se pueden invocar correctamente?

Si todo es correcto, la configuración ha sido exitosa 🎉

## III. Configuración de tareas: Poner a trabajar a la IA

Lo que hemos hecho hasta ahora es "crear un empleado".
Lo siguiente es "ponerlos a trabajar".

Las tareas de IA definen el comportamiento del empleado en una página o bloque específico.

> 💡 Para obtener instrucciones detalladas, consulte: [Tareas](/ai-employees/advanced/task)

### 1. Tareas a nivel de página

Aplicable a todo el ámbito de la página, como "Analizar los datos de esta página".

**Punto de entrada de la configuración:**
`Ajustes de página → Empleados IA → Añadir tarea`

| Campo | Descripción | Ejemplo |
|---|---|---|
| Título | Nombre de la tarea | Análisis de conversión por etapas |
| Contexto | El contexto de la página actual | Página de lista de leads |
| Mensaje predeterminado | Inicio de conversación preestablecido | "Por favor, analice las tendencias de este mes" |
| Bloque predeterminado | Asociar automáticamente con una colección | tabla de leads |
| Habilidades | Herramientas disponibles | Consultar datos, generar gráficos |

![Configuración de tareas a nivel de página](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Soporte multitarea:**
Un mismo empleado IA puede configurarse con varias tareas, que se presentan como opciones para que el usuario elija:

![Soporte multitarea](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Sugerencias:

*  Una tarea debe centrarse en un único objetivo.
*  El nombre debe ser claro y fácil de entender.
*  Mantenga el número de tareas entre 5 y 7.

### 2. Tareas a nivel de bloque

Adecuado para operar en un bloque específico, como "Traducir el formulario actual".

**Método de configuración:**

1.  Abra la configuración de acciones del bloque.
2.  Añada "Empleado IA".

![Botón Añadir empleado IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3.  Simplemente vincule el empleado objetivo.

![Seleccionar empleado IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configuración de tareas a nivel de bloque](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Comparación | Nivel de página | Nivel de bloque |
|---|---|---|
| Alcance de los datos | Página completa | Bloque actual |
| Granularidad | Análisis global | Procesamiento detallado |
| Uso típico | Análisis de tendencias | Traducción de formularios, extracción de campos |

## IV. Mejores prácticas

### 1. Sugerencias de configuración

| Elemento | Sugerencia | Razón |
|---|---|---|
| Número de habilidades | 3–5 | Alta precisión, respuesta rápida |
| Uso automático | Habilitar con precaución | Evita operaciones accidentales |
| Longitud del prompt | 500–1000 caracteres | Equilibra velocidad y calidad |
| Objetivo de la tarea | Único y claro | Evita confundir a la IA |
| Flujo de trabajo | Usar después de encapsular tareas complejas | Mayor tasa de éxito |

### 2. Sugerencias prácticas

**Empiece poco a poco, optimice gradualmente:**

1.  Primero, cree empleados básicos (por ejemplo, Viz, Dex).
2.  Active 1 o 2 habilidades principales para probar.
3.  Confirme que las tareas se pueden ejecutar normalmente.
4.  Luego, expanda gradualmente con más habilidades y tareas.

**Proceso de optimización continua:**

1.  Haga que la versión inicial funcione.
2.  Recopile los comentarios de los usuarios.
3.  Optimice los prompts y las configuraciones de las tareas.
4.  Pruebe e itere.

## V. Preguntas frecuentes

### 1. Fase de configuración

**P: ¿Qué hago si falla el guardado?**
R: Compruebe si ha rellenado todos los campos obligatorios, especialmente el servicio de modelo y el prompt.

**P: ¿Qué modelo debo elegir?**

*  Relacionado con código → Claude, GPT-4
*  Relacionado con análisis → Claude, DeepSeek
*  Sensible al coste → Qwen, GLM
*  Texto largo → Gemini, Claude

### 2. Fase de uso

**P: ¿La respuesta de la IA es demasiado lenta?**

*  Reduzca el número de habilidades.
*  Optimice el prompt.
*  Compruebe la latencia del servicio de modelo.
*  Considere cambiar el modelo.

**P: ¿La ejecución de la tarea es imprecisa?**

*  El prompt no es lo suficientemente claro.
*  Demasiadas habilidades causan confusión.
*  Divida la tarea en partes más pequeñas, añada ejemplos.

**P: ¿Cuándo debería habilitarse el uso automático (Auto usage)?**

*  Puede habilitarse para tareas de tipo consulta.
*  Se recomienda deshabilitarlo para tareas de modificación de datos.

**P: ¿Cómo hago para que la IA procese un formulario específico?**

R: Si se trata de una configuración a nivel de página, debe seleccionar el bloque manualmente.

![Seleccionar bloque manualmente](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Si se trata de configuraciones de tareas a nivel de bloque, el contexto de los datos se vincula automáticamente.

## VI. Lectura adicional

Para que sus empleados IA sean más potentes, puede seguir leyendo los siguientes documentos:

**Relacionado con la configuración:**

*  [Guía de ingeniería de prompts](./prompt-engineering-guide.md) - Técnicas y mejores prácticas para escribir prompts de alta calidad.
*  [Configurar el servicio LLM](/ai-employees/quick-start/llm-service) - Instrucciones detalladas de configuración para servicios de modelos grandes.
*  [Crear un empleado IA](/ai-employees/quick-start/ai-employees) - Creación y configuración básica de empleados IA.
*  [Colaborar con empleados IA](/ai-employees/quick-start/collaborate) - Cómo mantener conversaciones efectivas con empleados IA.

**Funciones avanzadas:**

*  [Habilidades](/ai-employees/advanced/skill) - Comprensión profunda de la configuración y el uso de diversas habilidades.
*  [Tareas](/ai-employees/advanced/task) - Técnicas avanzadas para la configuración de tareas.
*  [Seleccionar bloque](/ai-employees/advanced/pick-block) - Cómo especificar bloques de datos para empleados IA.
*  [Fuente de datos](/ai-employees/advanced/datasource) - Configuración y gestión de fuentes de datos.
*  [Búsqueda web](/ai-employees/advanced/web-search) - Configuración de la capacidad de búsqueda web para empleados IA.

**Base de conocimientos y RAG:**

*  [Descripción general de la base de conocimientos IA](/ai-employees/knowledge-base/index) - Introducción a la función de base de conocimientos.
*  [Base de datos vectorial](/ai-employees/knowledge-base/vector-database) - Configuración de la base de datos vectorial.
*  [Base de conocimientos](/ai-employees/knowledge-base/knowledge-base) - Cómo crear y gestionar una base de conocimientos.
*  [RAG (Generación Aumentada por Recuperación)](/ai-employees/knowledge-base/rag) - Aplicación de la tecnología RAG.

**Integración de flujos de trabajo:**

*  [Nodo LLM - Chat de texto](/ai-employees/workflow/nodes/llm/chat) - Uso del chat de texto en flujos de trabajo.
*  [Nodo LLM - Chat multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Manejo de entradas multimodales como imágenes y archivos.
*  [Nodo LLM - Salida estructurada](/ai-employees/workflow/nodes/llm/structured-output) - Obtención de respuestas IA estructuradas.

## Conclusión

Lo más importante al configurar empleados IA es: **primero, hágalo funcionar; luego, optimice**.
Primero, consiga que su primer empleado se ponga en marcha con éxito, y luego expanda y ajuste gradualmente.

Puede solucionar problemas en el siguiente orden:

1.  ¿Está conectado el servicio de modelo?
2.  ¿Hay demasiadas habilidades?
3.  ¿Es claro el prompt?
4.  ¿Está bien definido el objetivo de la tarea?

Siempre que proceda paso a paso, podrá construir un equipo de IA verdaderamente eficiente.