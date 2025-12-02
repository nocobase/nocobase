:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# البدء باستخدام FlowModel

## تخصيص FlowModel

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

## فئات FlowModel الأساسية المتاحة

| اسم الفئة الأساسية      | الوصف                       |
| ----------------------- | --------------------------- |
| `BlockModel`            | الفئة الأساسية لجميع الكتل      |
| `CollectionBlockModel`  | كتلة المجموعة، ترث من BlockModel |
| `ActionModel`           | الفئة الأساسية لجميع الإجراءات   |

## تسجيل FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## عرض FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```