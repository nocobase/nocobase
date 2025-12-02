:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Регистрация FlowModel

## Начните с пользовательского FlowModel

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

| Название базового класса | Описание                               |
| :----------------------- | :------------------------------------- |
| `BlockModel`             | Базовый класс для всех блоков          |
| `CollectionBlockModel`   | Блок коллекции данных, наследуется от BlockModel |
| `ActionModel`            | Базовый класс для всех операций        |

## Регистрация FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```