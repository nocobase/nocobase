:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/flow-engine/flow-context).
:::

# Información general del sistema de contexto

El sistema de contexto del motor de flujo de NocoBase se divide en tres capas, que corresponden a diferentes ámbitos. El uso adecuado permite lograr un intercambio y aislamiento flexible de servicios, configuraciones y datos, mejorando la mantenibilidad y escalabilidad del negocio.

- **FlowEngineContext (Contexto global)**: Único a nivel global, accesible por todos los modelos y flujos, adecuado para registrar servicios globales, configuraciones, etc.
- **FlowModelContext (Contexto del modelo)**: Se utiliza para compartir el contexto dentro del árbol de modelos. Los submodelos delegan automáticamente en el contexto del modelo padre, admitiendo la sobrescritura por nombre; adecuado para el aislamiento de lógica y datos a nivel de modelo.
- **FlowRuntimeContext (Contexto de ejecución del flujo)**: Se crea en cada ejecución del flujo y abarca todo el ciclo de ejecución. Adecuado para la transferencia de datos, almacenamiento de variables y registro del estado de ejecución dentro del flujo. Admite dos modos: `mode: 'runtime' | 'settings'`, que corresponden al estado de ejecución y al estado de configuración respectivamente.

Todos los `FlowEngineContext` (contexto global), `FlowModelContext` (contexto del modelo), `FlowRuntimeContext` (contexto de ejecución del flujo), etc., son subclases o instancias de `FlowContext`.

---

## 🗂️ Diagrama de jerarquía

```text
FlowEngineContext (Contexto global)
│
├── FlowModelContext (Contexto del modelo)
│     ├── Sub FlowModelContext (Submodelo)
│     │     ├── FlowRuntimeContext (Contexto de ejecución del flujo)
│     │     └── FlowRuntimeContext (Contexto de ejecución del flujo)
│     └── FlowRuntimeContext (Contexto de ejecución del flujo)
│
├── FlowModelContext (Contexto del modelo)
│     └── FlowRuntimeContext (Contexto de ejecución del flujo)
│
└── FlowModelContext (Contexto del modelo)
      ├── Sub FlowModelContext (Submodelo)
      │     └── FlowRuntimeContext (Contexto de ejecución del flujo)
      └── FlowRuntimeContext (Contexto de ejecución del flujo)
```

- `FlowModelContext` puede acceder a las propiedades y métodos de `FlowEngineContext` a través del mecanismo de delegación (delegate), logrando el intercambio de capacidades globales.
- El `FlowModelContext` de los submodelos puede acceder al contexto del modelo padre (relación síncrona) a través del mecanismo de delegación (delegate), admitiendo la sobrescritura por nombre.
- Los modelos padre-hijo asíncronos no establecen una relación de delegación (delegate) para evitar la contaminación del estado.
- `FlowRuntimeContext` siempre accede a su `FlowModelContext` correspondiente a través del mecanismo de delegación (delegate), pero no se transmite hacia arriba.

---

## 🧭 Estado de ejecución y estado de configuración (mode)

`FlowRuntimeContext` admite dos modos, diferenciados por el parámetro `mode`:

- `mode: 'runtime'` (Estado de ejecución): Se utiliza en la fase de ejecución real del flujo; las propiedades y métodos devuelven datos reales. Por ejemplo:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Estado de configuración): Se utiliza en la fase de diseño y configuración del flujo; el acceso a las propiedades devuelve cadenas de plantilla de variables, facilitando la selección de expresiones y variables. Por ejemplo:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Este diseño de modo dual garantiza la disponibilidad de los datos en tiempo de ejecución y facilita la referencia de variables y la generación de expresiones durante la configuración, mejorando la flexibilidad y facilidad de uso del motor de flujo.

---

## 🤖 Información de contexto orientada a herramientas/LLM

En ciertos escenarios (como la edición de código RunJS en JS*Model o AI coding), es necesario que el "llamador" comprenda lo siguiente sin ejecutar el código:

- Qué **capacidades estáticas** existen bajo el `ctx` actual (documentación de API, parámetros, ejemplos, enlaces de documentación, etc.).
- Qué **variables opcionales** existen en la interfaz/estado de ejecución actual (por ejemplo, estructuras dinámicas como "registro actual", "registro de ventana emergente actual", etc.).
- Una **instantánea de pequeño volumen** del entorno de ejecución actual (utilizada para prompts).

### 1) `await ctx.getApiInfos(options?)` (Información estática de la API)

### 2) `await ctx.getVarInfos(options?)` (Información de la estructura de variables)

- Construido basado en `defineProperty(...).meta` (incluyendo meta factory).
- Admite el recorte por `path` y el control de profundidad con `maxDepth`.
- Solo se expande hacia abajo cuando es necesario.

Parámetros comunes:

- `maxDepth`: Nivel máximo de expansión (por defecto 3).
- `path: string | string[]`: Recorte, solo genera el subárbol de la ruta especificada.

### 3) `await ctx.getEnvInfos()` (Instantánea del entorno de ejecución)

Estructura del nodo (simplificada):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Puede usarse directamente para await ctx.getVar(getVar), comenzando con "ctx."
  value?: any; // Valor estático resuelto/serializable
  properties?: Record<string, EnvNode>;
};
```