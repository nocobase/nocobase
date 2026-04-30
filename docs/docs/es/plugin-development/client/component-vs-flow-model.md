---
title: "Component vs FlowModel"
description: "Guía de selección para el desarrollo en NocoBase: cuándo usar un componente React común y cuándo usar FlowModel, comparación de capacidades, ciclo de vida y elección de escenarios."
keywords: "Component,FlowModel,guía de selección,componente React,configuración visual,árbol de modelos,NocoBase"
---

# Component vs FlowModel

En el desarrollo de plugins de NocoBase existen dos formas de escribir la UI del frontend: **componentes React comunes** y **[FlowModel](../../flow-engine/index.md)**. No son alternativas excluyentes: FlowModel es una capa de envoltura sobre los componentes React que añade capacidad de configuración visual.

Por lo general no necesita pensarlo demasiado. Hágase esta pregunta:

> **¿Este componente debe aparecer en el menú "Añadir bloque / campo / acción" de NocoBase para que el usuario lo configure visualmente desde la interfaz?**

- **No** → Use un componente React común; es desarrollo React estándar.
- **Sí** → Envuélvalo con FlowModel.

## Opción por defecto: componente React

En la mayoría de los escenarios de un plugin basta con un componente React común. Por ejemplo:

- Registrar una página independiente (página de configuración del plugin, página de ruta personalizada).
- Escribir un diálogo, formulario, lista u otro componente interno.
- Encapsular un componente de UI utilitario.

En estos escenarios usted escribe componentes con React + Antd y obtiene las capacidades del contexto de NocoBase (peticiones, internacionalización, etc.) mediante `useFlowContext()`. No hay diferencia con el desarrollo frontend habitual.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* Componente React común, no requiere FlowModel */}
    </div>
  );
}
```

Para más detalles, consulte [Desarrollo de Component](./component/index.md).

## Cuándo usar FlowModel

Use FlowModel cuando su componente cumpla las siguientes condiciones:

1. **Aparece en el menú**: debe poder añadirse desde "Añadir bloque", "Añadir campo" o "Añadir acción".
2. **Admite configuración visual**: el usuario puede modificar las propiedades del componente desde la interfaz (cambiar un título, alternar un modo de visualización, etc.).
3. **La configuración debe persistirse**: lo que el usuario configure debe guardarse para volver a estar disponible al abrir la página la próxima vez.

En resumen, FlowModel resuelve el problema de "hacer que un componente sea configurable y persistente". Si su componente no necesita estas capacidades, no necesita FlowModel.

## Relación entre ambos

FlowModel no pretende "reemplazar" a los componentes React. Es una capa de abstracción por encima de ellos:

```
Componente React: se encarga de renderizar la UI
    ↓ envoltura
FlowModel: gestiona el origen de las props, el panel de configuración y la persistencia
```

Dentro del método `render()` de un FlowModel se escribe código React común. La diferencia es: las props de un componente React común están fijadas o vienen del padre, mientras que las props de un FlowModel se generan dinámicamente a través de un Flow (proceso de configuración).

De hecho, ambos tienen una estructura básica muy similar:

```tsx pure
// Componente React
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

Pero su forma de gestión es completamente distinta. Los componentes React forman un **árbol de componentes** mediante anidamiento de JSX: ese es el árbol de renderizado en tiempo de ejecución. Los FlowModel los gestiona el [FlowEngine](../../flow-engine/index.md) y forman un **árbol de modelos**: una estructura lógica persistente y registrable dinámicamente, en la que la relación padre-hijo se controla explícitamente con `setSubModel` / `addSubModel`. Es ideal para construir bloques de página, flujos de operación y modelos de datos que requieren gestión configurable.

## Comparación de capacidades

Desde un punto de vista más técnico, las diferencias son:

| Capacidad | Componente React | FlowModel |
| --- | --- | --- |
| Renderizar UI | `render()` | `render()` |
| Gestión de estado | `state` / `setState` integrados | A través de `props` y la estructura del árbol de modelos |
| Ciclo de vida | `constructor`, `componentDidMount`, `componentWillUnmount` | `onInit`, `onMount`, `onUnmount` |
| Reaccionar a cambios de entrada | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Manejo de errores | `componentDidCatch` | `onAutoFlowsError` |
| Subcomponentes | Anidamiento JSX | `setSubModel` / `addSubModel` para fijar submodelos explícitamente |
| Comportamiento dinámico | Eventos y actualización de estado | Registrar y despachar Flows |
| Persistencia | Sin mecanismo nativo | `model.save()` y demás, integrados con el backend |
| Reutilización de instancias | Manejo manual | `createFork`, p. ej. cada fila de una tabla |
| Gestión por motor | Ninguna | El FlowEngine se encarga del registro, carga y administración |

Si está familiarizado con el ciclo de vida de React, el de FlowModel se mapea fácilmente: `onInit` corresponde a `constructor`, `onMount` a `componentDidMount` y `onUnmount` a `componentWillUnmount`.

Además, FlowModel ofrece capacidades que los componentes React no tienen:

- **`registerFlow`**: registrar un Flow y definir el proceso de configuración.
- **`applyFlow` / `dispatchEvent`**: ejecutar o disparar un Flow.
- **`openFlowSettings`**: abrir el panel de configuración de un paso del Flow.
- **`save` / `saveStepParams()`**: persistir la configuración del modelo.
- **`createFork`**: reutilizar la lógica de un modelo y renderizarla varias veces (por ejemplo, cada fila de una tabla).

Estas capacidades son la base de la experiencia de "configuración visual". Si su escenario no la necesita, no tiene que preocuparse por ellas. Para más detalles, consulte la [Documentación completa de FlowEngine](../../flow-engine/index.md).

## Tabla de escenarios

| Escenario | Solución | Motivo |
| --- | --- | --- |
| Página de configuración del plugin | Componente React | Página independiente, no necesita aparecer en el menú de configuración |
| Diálogos utilitarios | Componente React | Componente interno, sin configuración visual |
| Bloque de tabla de datos personalizado | FlowModel | Debe aparecer en "Añadir bloque" y permitir configurar la fuente de datos |
| Componente de visualización de campo personalizado | FlowModel | Debe aparecer en la configuración del campo y permitir elegir el modo de visualización |
| Botón de acción personalizado | FlowModel | Debe aparecer en el menú "Añadir acción" |
| Encapsular un gráfico para usar en un bloque | Componente React | El gráfico es un componente interno; lo invoca el bloque FlowModel |

## Adopción gradual

Si tiene dudas, primero implemente la funcionalidad como componente React. Cuando confirme que necesita configuración visual, envuélvala con FlowModel: es la forma de adopción gradual recomendada. Use FlowModel para los grandes bloques y componentes React comunes para los detalles internos. Ambos se complementan.

## Enlaces relacionados

- [Desarrollo de Component](./component/index.md): cómo escribir componentes React y usar `useFlowContext`.
- [Visión general de FlowEngine](./flow-engine/index.md): uso básico de FlowModel y `registerFlow`.
- [Documentación completa de FlowEngine](../../flow-engine/index.md): referencia completa de FlowModel, Flow y Context.
