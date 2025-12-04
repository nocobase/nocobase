:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowModel रजिस्टर करें

## एक कस्टम FlowModel से शुरुआत करें

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

## उपलब्ध FlowModel बेस क्लास

| बेस क्लास का नाम         | विवरण                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | सभी ब्लॉक के लिए बेस क्लास                 |
| `CollectionBlockModel`  | संग्रह ब्लॉक, BlockModel से इनहेरिट करता है |
| `ActionModel`           | सभी एक्शन के लिए बेस क्लास                |

## FlowModel रजिस्टर करें

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```