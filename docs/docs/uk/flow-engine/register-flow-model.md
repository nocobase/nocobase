:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Реєстрація FlowModel

## Почніть з власного FlowModel

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Привіт, NocoBase!</h1>
        <p>Це простий блок, відрендерений за допомогою HelloModel.</p>
      </div>
    );
  }
}
```

## Доступні базові класи FlowModel

| Назва базового класу    | Опис                               |
| ----------------------- | ---------------------------------- |
| `BlockModel`            | Базовий клас для всіх блоків       |
| `CollectionBlockModel`  | Блок колекції, успадковує від BlockModel |
| `ActionModel`           | Базовий клас для всіх дій          |

## Реєстрація FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```