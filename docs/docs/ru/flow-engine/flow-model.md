:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Начало работы с FlowModel

## Создание собственного FlowModel

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}
```

## Доступные базовые классы FlowModel

| Базовый класс           | Описание                                  |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Базовый класс для всех блоков             |
| `CollectionBlockModel`  | Блок коллекции, наследуется от BlockModel |
| `ActionModel`           | Базовый класс для всех действий           |

## Регистрация FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Динамический импорт: модуль модели загружается только тогда, когда эта модель впервые действительно нужна
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```

## Отображение FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```