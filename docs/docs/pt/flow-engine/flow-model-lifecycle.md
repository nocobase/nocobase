:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Ciclo de Vida do FlowModel

## Métodos do model

Chamadas internas

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

Para gatilhos externos

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Processo

1. Construir o model
    - onInit
2. Renderizar o model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Desmontar o componente
    - onUnMount
4. Disparar o fluxo
    - onDispatchEventStart
    - onDispatchEventEnd
5. Re-renderizar
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount