---
title: "Definir una Skill"
description: "Presenta el frontmatter, el cuerpo del prompt, la vinculación de Tools y el descubrimiento automático de directorios de SKILLS.md para empleados de IA de NocoBase."
keywords: "NocoBase,Skill de empleado de IA,SKILLS.md,vinculación de Skill y Tool,business-analysis-report"
---

# Definir una Skill

Una Skill no ejecuta código. Es una guía operativa proporcionada al modelo que define el flujo de procesamiento, las herramientas disponibles, los pasos de comprobación y los requisitos de salida.

## Directorio de una Skill

Cada Skill utiliza un directorio independiente:

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

Donde:

- `SKILLS.md` define los metadatos y el cuerpo del prompt
- `tools/` contiene las Tools que solo se utilizan junto con esta Skill
- Las Tools detectadas en `tools/` se añaden automáticamente a la lista de herramientas de la Skill

## Frontmatter de `SKILLS.md`

Una Skill mínima tiene este aspecto:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

Los campos habituales del frontmatter son:

| Campo | Función |
| --- | --- |
| `scope` | Ámbito de disponibilidad de la Skill; si se omite, es `SPECIFIED` |
| `name` | Nombre único de la Skill |
| `description` | Ayuda al modelo a decidir cuándo cargar esta Skill |
| `introduction.title` | Título mostrado en la interfaz de administración |
| `introduction.about` | Descripción mostrada en la interfaz de administración |
| `tools` | Lista de nombres de Tools adicionales que deben vincularse |

El cuerpo de la Skill se guarda sin cambios y se añade al contexto del modelo cuando se carga la Skill. Debe centrarse en el flujo de trabajo y las restricciones, sin copiar los detalles de implementación de las Tools.

## Vincular una Tool a una Skill

Hay dos métodos.

El primero consiste en declararlas explícitamente en el frontmatter:

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

El segundo consiste en colocar la Tool en el directorio `tools/` de la Skill actual:

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

El cargador detecta automáticamente `greetDeveloper` y la combina con la lista de herramientas de la Skill. De forma predeterminada, se recomienda colocar las Tools exclusivas de una Skill dentro de su directorio, para que la ubicación del archivo exprese la relación de vinculación.

## Cómo escribir una buena Skill

Una Skill útil suele incluir lo siguiente:

1. El rol y los límites de la tarea
2. El orden de procesamiento obligatorio
3. Qué Tool debe llamarse en cada paso
4. En qué casos debe pedirse confirmación al usuario
5. Cómo actuar si falla una Tool
6. La estructura de la salida final y sus condiciones de validación

Si una Tool modifica datos, la Skill debe exigir explícitamente que el modelo espere a que la Tool devuelva un resultado satisfactorio. No debe afirmar que la operación ha terminado antes de la llamada.

## Ejemplo de Skill integrada: `business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` divide el análisis de negocio en un flujo de trabajo claro:

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

El cuerpo no se limita a indicar «genera un informe de negocio», sino que también establece estas reglas:

- Comprender primero el objetivo de la decisión, el público, el intervalo de tiempo y las métricas
- Cuando haya datos de negocio implicados, el primer ToolCall debe cargar la Skill `data-query`
- No adivinar tablas de datos, rutas de asociación ni resultados de consultas
- Llamar a `businessReportGenerator` solo cuando los datos estén preparados
- Generar los gráficos y el informe Markdown en el mismo ToolCall
- Determinar si se ha completado correctamente según los valores `status`, `chartCount`, `errors` y `warnings` devueltos por la Tool
- Si falla un gráfico, reintentarlo una sola vez y después recurrir a un informe solo en Markdown

Estas reglas son el principal valor de una Skill: convierten «lo que puede hacer el modelo» en un proceso repetible y verificable.

## Enlaces relacionados

- [Desarrollo de plugins para empleados de IA](./index.md) — Conocer el lugar de las Skills en las extensiones de empleados de IA
- [Definir una Tool del servidor](./define-tool.md) — Definir las Tools que puede llamar una Skill
- [Definir un empleado de IA integrado](./define-ai-employee.md) — Vincular una Skill con un empleado fijo
- [Ejemplo completo: crear un empleado de IA integrado](./complete-example.md) — Consultar un ejemplo completo de vinculación entre Skill y Tool
