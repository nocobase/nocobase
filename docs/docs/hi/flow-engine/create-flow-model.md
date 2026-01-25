:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowModel बनाएँ

## एक रूट नोड के रूप में

### एक FlowModel इंस्टेंस बनाएँ

स्थानीय रूप से एक इंस्टेंस बनाएँ

```ts
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel सहेजें

जब किसी बनाए गए इंस्टेंस को स्थायी रूप से सहेजने की आवश्यकता हो, तो उसे `save` मेथड का उपयोग करके सहेजा जा सकता है।

```ts
await model.save();
```

### रिमोट से FlowModel लोड करें

एक सहेजे गए मॉडल को `loadModel` का उपयोग करके लोड किया जा सकता है। यह मेथड पूरे मॉडल ट्री (चाइल्ड नोड्स सहित) को लोड करेगी:

```ts
await engine.loadModel(uid);
```

### FlowModel लोड करें या बनाएँ

यदि मॉडल मौजूद है, तो उसे लोड किया जाएगा; अन्यथा, उसे बनाया और सहेजा जाएगा।

```ts
await engine.loadOrCreateModel({
  uid: 'unique1',
  use: 'HelloModel',
});
```

### FlowModel रेंडर करें

```tsx pure
const model = engine.buildModel({
  uid: 'unique1',
  use: 'HelloModel',
});
const model = await engine.loadModel(uid);
const model = await engine.loadOrCreateModel(options);

<FlowModelRenderer model={model} />
```

## एक चाइल्ड नोड के रूप में

जब आपको किसी मॉडल के भीतर कई सब-कंपोनेंट्स या मॉड्यूल्स के गुणों और व्यवहार को प्रबंधित करने की आवश्यकता होती है, तो आपको SubModel का उपयोग करना होगा, जैसे कि नेस्टेड लेआउट, कंडीशनल रेंडरिंग आदि जैसे परिदृश्यों में।

### SubModel बनाएँ

`<AddSubModelButton />` का उपयोग करने की सलाह दी जाती है।

यह चाइल्ड मॉडल्स को जोड़ने, बाइंड करने और स्टोर करने जैसे मुद्दों को स्वचालित रूप से संभाल सकता है। विवरण के लिए, [AddSubModelButton उपयोग निर्देश](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-sub-models/add-sub-model) देखें।

### SubModel रेंडर करें

```tsx pure
model.mapSubModels('subKey', (subModel) => {
  return <FlowModelRenderer model={subModel} />;
});
```

## एक ForkModel के रूप में

Fork का उपयोग आमतौर पर ऐसे परिदृश्यों में किया जाता है जहाँ एक ही मॉडल टेम्पलेट को कई स्थानों पर (लेकिन स्वतंत्र अवस्थाओं के साथ) रेंडर करने की आवश्यकता होती है, जैसे कि एक तालिका में प्रत्येक पंक्ति।

### ForkModel बनाएँ

```tsx pure
const fork1 = model.createFork('key1', {});
const fork2 = model.createFork('key2', {});
```
### ForkModel रेंडर करें

```tsx pure
<FlowModelRenderer model={fork1} />
<FlowModelRenderer model={fork2} />
```