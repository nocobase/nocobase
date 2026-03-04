:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/get-model) देखें।
:::

# ctx.getModel()

मॉडल `uid` के आधार पर वर्तमान इंजन या व्यू स्टैक (view stack) से मॉडल इंस्टेंस (जैसे BlockModel, PageModel, ActionModel आदि) प्राप्त करता है। इसका उपयोग RunJS में ब्लॉक, पेज या पॉपअप के बीच अन्य मॉडल तक पहुँचने के लिए किया जाता है।

यदि आपको केवल उस मॉडल या ब्लॉक की आवश्यकता है जहाँ वर्तमान निष्पादन संदर्भ (execution context) स्थित है, तो `ctx.getModel` के बजाय `ctx.model` या `ctx.blockModel` का उपयोग करने को प्राथमिकता दें।

## उपयोग के मामले

| परिदृश्य | विवरण |
|------|------|
| **JSBlock / JSAction** | ज्ञात `uid` के आधार पर अन्य ब्लॉकों के मॉडल प्राप्त करें ताकि उनके `resource`, `form`, `setProps` आदि को पढ़ा या लिखा जा सके। |
| **पॉपअप में RunJS** | पॉपअप के भीतर, जब उस पेज के किसी मॉडल तक पहुँचने की आवश्यकता हो जिसने पॉपअप खोला है, तो `searchInPreviousEngines: true` पास करें। |
| **कस्टम क्रियाएं (Custom Actions)** | व्यू स्टैक में `uid` द्वारा कॉन्फ़िगरेशन पैनल में फॉर्म या सब-मॉडल का पता लगाएँ ताकि उनके कॉन्फ़िगरेशन या स्थिति (state) को पढ़ा जा सके। |

## टाइप परिभाषा (Type Definition)

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## पैरामीटर्स

| पैरामीटर | टाइप | विवरण |
|------|------|------|
| `uid` | `string` | लक्ष्य मॉडल इंस्टेंस का विशिष्ट पहचानकर्ता (unique identifier), जो कॉन्फ़िगरेशन या निर्माण के दौरान निर्दिष्ट किया जाता है (जैसे `ctx.model.uid`) |
| `searchInPreviousEngines` | `boolean` | वैकल्पिक, डिफ़ॉल्ट `false` है। `true` होने पर, यह "व्यू स्टैक" में वर्तमान इंजन से रूट (root) तक खोजता है, जिससे ऊपरी स्तर के इंजन (जैसे वह पेज जिसने पॉपअप खोला है) के मॉडल तक पहुँच प्राप्त होती है। |

## रिटर्न वैल्यू

- मिलने पर संबंधित `FlowModel` सबक्लास इंस्टेंस (जैसे `BlockModel`, `FormBlockModel`, `ActionModel`) लौटाता है।
- नहीं मिलने पर `undefined` लौटाता है।

## खोज का दायरा (Search Scope)

- **डिफ़ॉल्ट (`searchInPreviousEngines: false`)**: केवल **वर्तमान इंजन** के भीतर `uid` द्वारा खोजता है। पॉपअप या बहु-स्तरीय व्यू में, प्रत्येक व्यू का एक स्वतंत्र इंजन होता है; डिफ़ॉल्ट रूप से, यह केवल वर्तमान व्यू के भीतर मॉडल खोजता है।
- **`searchInPreviousEngines: true`**: वर्तमान इंजन से शुरू करते हुए `previousEngine` श्रृंखला के साथ ऊपर की ओर खोजता है, और पहला मैच मिलने पर उसे लौटाता है। यह उस पेज के मॉडल तक पहुँचने के लिए उपयोगी है जिसने वर्तमान पॉपअप खोला है।

## उदाहरण

### अन्य ब्लॉक प्राप्त करना और रिफ्रेश करना

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### पॉपअप से पेज पर मौजूद मॉडल तक पहुँचना

```ts
// उस पेज के ब्लॉक तक पहुँचें जिसने वर्तमान पॉपअप खोला है
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### क्रॉस-मॉडल रीड/राइट और री-रेंडर ट्रिगर करना

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### सुरक्षा जांच (Safety check)

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('लक्ष्य मॉडल मौजूद नहीं है');
  return;
}
```

## संबंधित

- [ctx.model](./model.md): वह मॉडल जहाँ वर्तमान निष्पादन संदर्भ स्थित है।
- [ctx.blockModel](./block-model.md): पैरेंट ब्लॉक मॉडल जहाँ वर्तमान JS स्थित है; आमतौर पर `getModel` की आवश्यकता के बिना पहुँचा जा सकता है।