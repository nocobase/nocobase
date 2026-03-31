:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Cycle de vie de FlowModel

## Méthodes de `model`

Appels internes

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

Pour les déclencheurs externes

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Processus

1.  Construction du modèle
    - onInit
2.  Rendu du modèle
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3.  Démontage du composant
    - onUnMount
4.  Déclenchement du flux
    - onDispatchEventStart
    - onDispatchEventEnd
5.  Re-rendu
    - onUnMount
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - onUnMount