:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מתחילים עם FlowModel

## FlowModel מותאם אישית

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

## מחלקות בסיס זמינות של FlowModel

| שם מחלקת בסיס           | תיאור                        |
| ----------------------- | ---------------------------- |
| `BlockModel`            | מחלקה בסיסית לכל הבלוקים         |
| `CollectionBlockModel`  | בלוק אוסף, יורש מ-BlockModel |
| `ActionModel`           | מחלקה בסיסית לכל הפעולות         |

## רישום FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## רינדור FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```