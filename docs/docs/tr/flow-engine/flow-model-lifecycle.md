:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowModel Yaşam Döngüsü

## model Metotları

Dahili çağrılar

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

Harici tetikleyiciler için

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Süreç

1. Modeli oluşturma
    - onInit
2. Modeli render etme
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Bileşeni kaldırma
    - onUnMount
4. Akışı tetikleme
    - onDispatchEventStart
    - onDispatchEventEnd
5. Yeniden render etme
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount