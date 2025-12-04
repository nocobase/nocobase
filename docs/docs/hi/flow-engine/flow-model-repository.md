:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowModel स्थायित्व
FlowEngine एक पूर्ण स्थायित्व सिस्टम प्रदान करता है।

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository
`IFlowModelRepository` FlowEngine के लिए मॉडल स्थायित्व इंटरफ़ेस है, जो मॉडल के रिमोट लोडिंग, सेविंग और डिलीटिंग जैसे ऑपरेशंस को परिभाषित करता है। इस इंटरफ़ेस को लागू करके, मॉडल डेटा को बैकएंड डेटाबेस, API या अन्य स्टोरेज माध्यमों में स्थायी किया जा सकता है, जिससे फ्रंटएंड और बैकएंड के बीच डेटा सिंक्रनाइज़ेशन सक्षम होता है।

### मुख्य विधियाँ
- **findOne(query: Query): Promise<FlowModel \| null>**  
  अद्वितीय पहचानकर्ता `uid` के आधार पर रिमोट स्रोत से मॉडल डेटा लोड करता है।

- **save(model: FlowModel): Promise<any\>**  
  मॉडल डेटा को रिमोट स्टोरेज में सेव करता है।

- **destroy(uid: string): Promise<boolean\>**  
  `uid` के आधार पर रिमोट स्टोरेज से मॉडल को हटाता है।

### FlowModelRepository उदाहरण

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // लागू करें: uid द्वारा मॉडल प्राप्त करें
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // लागू करें: मॉडल सेव करें
    return model;
  }

  async destroy(uid: string) {
    // लागू करें: uid द्वारा मॉडल हटाएँ
    return true;
  }
}
```

### FlowModelRepository सेट करें

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## FlowEngine द्वारा प्रदान की गई मॉडल प्रबंधन विधियाँ

### स्थानीय विधियाँ

```ts
flowEngine.createModel(options); // एक स्थानीय मॉडल इंस्टेंस बनाएँ
flowEngine.getModel(uid);        // एक स्थानीय मॉडल इंस्टेंस प्राप्त करें
flowEngine.removeModel(uid);     // एक स्थानीय मॉडल इंस्टेंस हटाएँ
```

### रिमोट विधियाँ (ModelRepository द्वारा लागू की गई)

```ts
await flowEngine.loadModel(uid);     // रिमोट से मॉडल लोड करें
await flowEngine.saveModel(model);   // मॉडल को रिमोट में सेव करें
await flowEngine.destroyModel(uid);  // रिमोट से मॉडल हटाएँ
```

## मॉडल इंस्टेंस विधियाँ

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // रिमोट में सेव करें
await model.destroy();  // रिमोट से हटाएँ
```