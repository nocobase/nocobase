:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# רישום FlowModel

## מתחילים עם FlowModel מותאם אישית

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

## מחלקות בסיס זמינות עבור FlowModel

| שם מחלקת בסיס         | תיאור                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | מחלקת בסיס לכל הבלוקים                 |
| `CollectionBlockModel`  | בלוק אוסף, יורש מ-BlockModel |
| `ActionModel`           | מחלקת בסיס לכל הפעולות                |

## רישום FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```