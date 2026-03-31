
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Descripción general del sistema de contexto

El sistema de contexto del motor de flujo de NocoBase se divide en tres capas, cada una con un ámbito diferente. Su uso adecuado permite compartir y aislar de forma flexible servicios, configuraciones y datos, lo que mejora la mantenibilidad y escalabilidad del negocio.

- **FlowEngineContext (Contexto Global)**: Es único a nivel global y accesible por todos los modelos y **flujos de trabajo**. Es ideal para registrar servicios globales, configuraciones, etc.
- **FlowModelContext (Contexto del Modelo)**: Se utiliza para compartir contexto dentro de un árbol de modelos. Los submodelos delegan automáticamente en el contexto del modelo padre, lo que permite sobrescribir elementos con el mismo nombre. Es adecuado para el aislamiento de lógica y datos a nivel de modelo.
- **FlowRuntimeContext (Contexto de Ejecución del Flujo de Trabajo)**: Se crea cada vez que se ejecuta un **flujo de trabajo** y persiste durante todo su ciclo de ejecución. Es útil para la transferencia de datos, el almacenamiento de variables y el registro del estado de ejecución dentro del **flujo de trabajo**. Admite dos modos: `mode: 'runtime' | 'settings'`, que corresponden al modo de ejecución y al modo de configuración, respectivamente.

Todos los `FlowEngineContext` (Contexto Global), `FlowModelContext` (Contexto del Modelo), `FlowRuntimeContext` (Contexto de Ejecución del Flujo de Trabajo), etc., son subclases o instancias de `FlowContext`.

---

## 🗂️ Diagrama de jerarquía

```text
FlowEngineContext (Contexto Global)
│
├── FlowModelContext (Contexto del Modelo)
│     ├── Sub FlowModelContext (Submodelo)
│     │     ├── FlowRuntimeContext (Contexto de Ejecución del Flujo de Trabajo)
│     │     └── FlowRuntimeContext (Contexto de Ejecución del Flujo de Trabajo)
│     └── FlowRuntimeContext (Contexto de Ejecución del Flujo de Trabajo)
│
├── FlowModelContext (Contexto del Modelo)
│     └── FlowRuntimeContext (Contexto de Ejecución del Flujo de Trabajo)
│
└── FlowModelContext (Contexto del Modelo)
      ├── Sub FlowModelContext (Submodelo)
      │     └── FlowRuntimeContext (Contexto de Ejecución del Flujo de Trabajo)
      └── FlowRuntimeContext (Contexto de Ejecución del Flujo de Trabajo)
```

- `FlowModelContext` puede acceder a las propiedades y métodos de `FlowEngineContext` mediante un mecanismo de delegación, lo que permite compartir capacidades globales.
- El `FlowModelContext` de un submodelo puede acceder al contexto del modelo padre (relación síncrona) a través de un mecanismo de delegación, lo que permite sobrescribir elementos con el mismo nombre.
- Los modelos padre-hijo asíncronos no establecen una relación de delegación para evitar la contaminación del estado.
- `FlowRuntimeContext` siempre accede a su `FlowModelContext` correspondiente mediante un mecanismo de delegación, pero no propaga los cambios hacia arriba.

## 🧭 Modo de ejecución y modo de configuración (mode)

`FlowRuntimeContext` admite dos modos, que se distinguen por el parámetro `mode`:

- `mode: 'runtime'` (Modo de ejecución): Se utiliza durante la fase de ejecución real del **flujo de trabajo**. Las propiedades y los métodos devuelven datos reales. Por ejemplo:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Modo de configuración): Se utiliza durante la fase de diseño y configuración del **flujo de trabajo**. El acceso a las propiedades devuelve una cadena de plantilla de variable, lo que facilita la selección de expresiones y variables. Por ejemplo:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Este diseño de doble modo garantiza la disponibilidad de los datos en tiempo de ejecución y facilita la referencia de variables y la generación de expresiones durante la configuración, lo que mejora la flexibilidad y la usabilidad del motor de flujo.