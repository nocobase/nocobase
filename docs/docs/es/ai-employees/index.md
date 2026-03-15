---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/ai-employees/index).
:::

# Descripción general

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Los Empleados de IA (`AI Employees`) son capacidades de agentes inteligentes profundamente integradas en los sistemas de negocio de NocoBase.

No son simplemente robots que "solo saben chatear", sino "colegas digitales" que pueden comprender el contexto directamente en la interfaz de negocio y ejecutar operaciones:

- **Entienden el contexto del negocio**: perciben la página actual, los bloques, la estructura de datos y el contenido seleccionado.
- **Pueden ejecutar acciones directamente**: pueden llamar a habilidades para completar tareas de consulta, análisis, llenado, configuración, generación, etc.
- **Colaboración basada en roles**: configure diferentes empleados según el puesto y cambie de modelo en la sesión para colaborar.

## Ruta de inicio en 5 minutos

Primero consulte el [Inicio rápido](/ai-employees/quick-start) y complete la configuración mínima utilizable en el siguiente orden:

1. Configure al menos un [Servicio LLM](/ai-employees/features/llm-service).
2. Habilite al menos un [Empleado de IA](/ai-employees/features/enable-ai-employee).
3. Abra una sesión y comience a [colaborar con los Empleados de IA](/ai-employees/features/collaborate).
4. Active la [Búsqueda en la web](/ai-employees/features/web-search) y las [Tareas rápidas](/ai-employees/features/task) según sea necesario.

## Mapa de funciones

### A. Configuración básica (Administrador)

- [Configurar Servicio LLM](/ai-employees/features/llm-service): conecte proveedores, configure y gestione los modelos disponibles.
- [Habilitar Empleados de IA](/ai-employees/features/enable-ai-employee): active o desactive empleados integrados y controle el alcance de disponibilidad.
- [Nuevo Empleado de IA](/ai-employees/features/new-ai-employees): defina el rol, la personalidad, el mensaje de bienvenida y los límites de capacidad.
- [Uso de habilidades](/ai-employees/features/tool): configure los permisos de las habilidades (`Ask` / `Allow`) para controlar los riesgos de ejecución.

### B. Colaboración diaria (Usuario de negocio)

- [Colaborar con Empleados de IA](/ai-employees/features/collaborate): cambie de empleado y de modelo dentro de la sesión para una colaboración continua.
- [Añadir contexto - Bloques](/ai-employees/features/pick-block): envíe bloques de la página como contexto a la IA.
- [Tareas rápidas](/ai-employees/features/task): preestablezca tareas comunes en páginas o bloques y ejecútelas con un solo clic.
- [Búsqueda en la web](/ai-employees/features/web-search): habilite la respuesta mejorada por búsqueda cuando necesite información actualizada.

### C. Capacidades avanzadas (Extensiones)

- [Empleados de IA integrados](/ai-employees/features/built-in-employee): conozca el posicionamiento y los escenarios de aplicación de los empleados preestablecidos.
- [Control de permisos](/ai-employees/permission): controle el acceso a empleados, habilidades y datos según el modelo de permisos de la organización.
- [Base de conocimientos de IA](/ai-employees/knowledge-base/index): introduzca el conocimiento de la empresa para mejorar la estabilidad y trazabilidad de las respuestas.
- [Nodo LLM de flujo de trabajo](/ai-employees/workflow/nodes/llm/chat): organice las capacidades de IA en procesos automatizados.

## Conceptos básicos (Se recomienda unificar primero)

Los siguientes términos son coherentes con el glosario; se recomienda utilizarlos de forma unificada en el equipo:

- **Empleado de IA (AI Employee)**: un agente ejecutable compuesto por una configuración de rol (Role setting) y habilidades (Tool / Skill).
- **Servicio LLM (LLM Service)**: unidad de acceso a modelos y configuración de capacidades, utilizada para gestionar proveedores y listas de modelos.
- **Proveedor (Provider)**: el suministrador del modelo detrás del servicio LLM.
- **Modelos habilitados (Enabled Models)**: conjunto de modelos que el servicio LLM actual permite seleccionar en la sesión.
- **Selector de Empleado de IA (AI Employee Switcher)**: permite cambiar el empleado colaborador actual dentro de la sesión.
- **Selector de modelo (Model Switcher)**: permite cambiar de modelo en la sesión y recordar las preferencias por dimensión de empleado.
- **Habilidad (Tool / Skill)**: unidad de capacidad de ejecución que la IA puede llamar.
- **Permiso de habilidad (Permission: Ask / Allow)**: si se requiere confirmación humana antes de llamar a la habilidad.
- **Contexto (Context)**: información del entorno de negocio, como páginas, bloques y estructuras de datos.
- **Sesión (Chat)**: un proceso de interacción continua entre el usuario y el Empleado de IA.
- **Búsqueda en la web (Web Search)**: capacidad de complementar respuestas con información en tiempo real basada en búsquedas externas.
- **Base de conocimientos (Knowledge Base / RAG)**: introduce el conocimiento de la empresa a través de la generación mejorada por recuperación.
- **Almacén de vectores (Vector Store)**: proporciona almacenamiento vectorizado para capacidades de búsqueda semántica en la base de conocimientos.

## Instrucciones de instalación

Los Empleados de IA son un plugin integrado de NocoBase (`@nocobase/plugin-ai`), listo para usar, sin necesidad de instalación por separado.