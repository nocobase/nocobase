:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowModel के साथ शुरुआत करना

## कस्टम FlowModel

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

| बेस क्लास का नाम         | विवरण                                     |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | सभी ब्लॉक्स के लिए बेस क्लास                 |
| `CollectionBlockModel`  | संग्रह ब्लॉक, BlockModel से इनहेरिट होता है |
| `ActionModel`           | सभी एक्शन्स के लिए बेस क्लास                |

## FlowModel को रजिस्टर करना

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## FlowModel को रेंडर करना

```tsx pure
<FlowModelRenderer model={model} />
```