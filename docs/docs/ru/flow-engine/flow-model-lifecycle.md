# Жизненный цикл FlowModel

## Методы модели

Внутренние вызовы

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

Для внешних триггеров

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Процесс

1. Создание model
    - onInit
2. Рендер модели
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. Размонтирование компонента
    - onUnMount
4. Запуск потока
    - onDispatchEventStart
    - onDispatchEventEnd
5. Повторный рендер
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount