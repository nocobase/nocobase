:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Ciclo de vida de FlowModel

## Métodos de model

Llamadas internas

```ts
class MyModel extends FlowModel {
  onInit() {}
  onMount() {}
  useHooksBeforeRender() {}
  render() {}
  onUnMount() {}
  onDispatchEventStart() {}
  onDispatchEventEnd() {}
  onDispatchEventError() {}
}
```

## model.emitter

Para activar eventos externamente

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Proceso

1. Construir el model
    - onInit
2. Renderizar el model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Desmontar el componente
    - onUnMount
4. Activar el flujo
    - onDispatchEventStart
    - onDispatchEventEnd
5. Volver a renderizar
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount