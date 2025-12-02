:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Життєвий цикл FlowModel

## Методи model

Внутрішні виклики

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

Для зовнішніх тригерів

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Процес

1. Побудова model
    - onInit
2. Рендеринг model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Демонтування компонента
    - onUnMount
4. Запуск потоку
    - onDispatchEventStart
    - onDispatchEventEnd
5. Повторний рендеринг
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount