:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Початок роботи з FlowModel

## Створення власного FlowModel

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Привіт, NocoBase!</h1>
        <p>Це простий блок, відтворений за допомогою HelloModel.</p>
      </div>
    );
  }
}
```

## Доступні базові класи FlowModel

| Назва базового класу    | Опис                               |
| ----------------------- | ---------------------------------- |
| `BlockModel`            | Базовий клас для всіх блоків       |
| `CollectionBlockModel`  | Блок колекції, успадковується від BlockModel |
| `ActionModel`           | Базовий клас для всіх дій          |

## Реєстрація FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Динамічний імпорт: модуль моделі завантажується лише тоді, коли ця модель уперше реально потрібна
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```

## Відтворення FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```