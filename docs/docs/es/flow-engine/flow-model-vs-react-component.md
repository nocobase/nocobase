:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# FlowModel vs. React.Component

## Comparación de Responsabilidades Básicas

| Característica/Capacidad | `React.Component` | `FlowModel` |
| :----------------------- | :---------------------------------- | :------------------------------------------------------------------ |
| Capacidad de renderizado | Sí, el método `render()` genera la interfaz de usuario | Sí, el método `render()` genera la interfaz de usuario |
| Gestión de estado | `state` y `setState` integrados | Usa `props`, pero la gestión de estado depende más de la estructura del árbol de modelos |
| Ciclo de vida | Sí, por ejemplo, `componentDidMount` | Sí, por ejemplo, `onInit`, `onMount`, `onUnmount` |
| Propósito | Construcción de componentes de interfaz de usuario | Construcción de "árboles de modelos" estructurados, basados en flujos y dirigidos por datos |
| Estructura de datos | Árbol de componentes | Árbol de modelos (admite modelos padre-hijo, bifurcación de múltiples instancias) |
| Componentes hijos | Usa JSX para anidar componentes | Usa `setSubModel`/`addSubModel` para establecer explícitamente submodelos |
| Comportamiento dinámico | El enlace de eventos y las actualizaciones de estado impulsan la interfaz de usuario | Registro/envío de flujos, manejo de flujos automáticos |
| Persistencia | Sin mecanismo integrado | Admite persistencia (por ejemplo, `model.save()`) |
| Admite bifurcación (múltiples renderizados) | No (requiere reutilización manual) | Sí (`createFork` para múltiples instanciaciones) |
| Control del motor | Ninguno | Sí, es gestionado, registrado y cargado por `FlowEngine` |

## Comparación del Ciclo de Vida

| Gancho del ciclo de vida | `React.Component` | `FlowModel` |
| :----------------------- | :-------------------------------- | :-------------------------------------------- |
| Inicialización | `constructor`, `componentDidMount` | `onInit`, `onMount` |
| Desmontaje | `componentWillUnmount` | `onUnmount` |
| Respuesta a la entrada | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Manejo de errores | `componentDidCatch` | `onAutoFlowsError` |

## Comparación de la Estructura de Construcción

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Árbol de Componentes vs. Árbol de Modelos

*   **Árbol de Componentes de React**: Un árbol de renderizado de interfaz de usuario formado por el anidamiento de JSX en tiempo de ejecución.
*   **Árbol de Modelos de FlowModel**: Un árbol de estructura lógica gestionado por FlowEngine, que puede ser persistido y permite el registro y control dinámico de submodelos. Es adecuado para construir bloques de página, flujos de acción, modelos de datos, etc.

## Características Especiales (Exclusivas de FlowModel)

| Función | Descripción |
| :---------------------------- | :--------------------------------------------------------------------------------- |
| `registerFlow` | Registrar un flujo |
| `applyFlow` / `dispatchEvent` | Ejecutar/disparar un flujo |
| `setSubModel` / `addSubModel` | Controlar explícitamente la creación y el enlace de submodelos |
| `createFork` | Permite reutilizar la lógica de un modelo para múltiples renderizados (por ejemplo, cada fila en una tabla) |
| `openFlowSettings` | Configuración de los pasos del flujo |
| `save` / `saveStepParams()` | El modelo puede ser persistido e integrado con el backend |

## Resumen

| Aspecto | React.Component | FlowModel |
| :------ | :------------------------------ | :------------------------------------------ |
| Escenarios adecuados | Organización de componentes de la capa de interfaz de usuario | Gestión de flujos y bloques dirigida por datos |
| Idea central | Interfaz de usuario declarativa | Flujo estructurado dirigido por modelos |
| Método de gestión | React controla el ciclo de vida | FlowModel controla el ciclo de vida y la estructura del modelo |
| Ventajas | Amplio ecosistema y herramientas | Fuertemente estructurado, los flujos pueden ser persistidos, los submodelos son controlables |

> FlowModel puede usarse de forma complementaria con React: utilice React para el renderizado dentro de un FlowModel, mientras que su ciclo de vida y estructura son gestionados por FlowEngine.