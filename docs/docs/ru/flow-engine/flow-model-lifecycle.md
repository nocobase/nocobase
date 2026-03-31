:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Жизненный цикл FlowModel

## Методы `model`

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

## `model.emitter`

Для внешних триггеров

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## Процесс

1. Создание модели
    - onInit
2. Рендеринг модели
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
5. Повторный рендеринг
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount