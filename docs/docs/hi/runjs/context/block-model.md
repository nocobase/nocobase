:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/block-model) देखें।
:::

# ctx.blockModel

वर्तमान JS फ़ील्ड / JS ब्लॉक का पैरेंट ब्लॉक मॉडल (BlockModel इंस्टेंस)। JSField, JSItem, JSColumn जैसे परिदृश्यों में, `ctx.blockModel` उस फ़ॉर्म ब्लॉक या टेबल ब्लॉक की ओर इशारा करता है जिसमें वर्तमान JS लॉजिक मौजूद है। एक स्वतंत्र (standalone) JSBlock में, यह `null` हो सकता है या `ctx.model` के समान हो सकता है।

## लागू होने वाले परिदृश्य

| परिदृश्य | विवरण |
|------|------|
| **JSField** | लिंकेज या वैलिडेशन लागू करने के लिए फ़ॉर्म फ़ील्ड के भीतर पैरेंट फ़ॉर्म ब्लॉक के `form`, `collection`, और `resource` तक पहुँचने के लिए। |
| **JSItem** | सब-टेबल आइटम के भीतर पैरेंट टेबल/फ़ॉर्म ब्लॉक के रिसोर्स और डेटा संग्रह (collection) की जानकारी तक पहुँचने के लिए। |
| **JSColumn** | टेबल कॉलम के भीतर पैरेंट टेबल ब्लॉक के `resource` (जैसे `getSelectedRows`) और `collection` तक पहुँचने के लिए। |
| **फ़ॉर्म ऑपरेशन / इवेंट फ्लो** | सबमिशन से पहले वैलिडेशन के लिए `form` तक पहुँचने, रिफ्रेश करने के लिए `resource` तक पहुँचने आदि के लिए। |

> **नोट:** `ctx.blockModel` केवल उन RunJS संदर्भों (contexts) में उपलब्ध है जहाँ पैरेंट ब्लॉक मौजूद हो। स्वतंत्र JSBlocks (बिना पैरेंट फ़ॉर्म/टेबल के) में, यह `null` हो सकता है। उपयोग करने से पहले इसकी जाँच (null check) करने की सलाह दी जाती है।

## टाइप परिभाषा (Type Definition)

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

विशिष्ट प्रकार पैरेंट ब्लॉक के प्रकार पर निर्भर करता है: फ़ॉर्म ब्लॉक अक्सर `FormBlockModel` या `EditFormModel` होते हैं, जबकि टेबल ब्लॉक अक्सर `TableBlockModel` होते हैं।

## सामान्य गुण (Common Properties)

| गुण | प्रकार | विवरण |
|------|------|------|
| `uid` | `string` | ब्लॉक मॉडल का विशिष्ट पहचानकर्ता (unique identifier)। |
| `collection` | `Collection` | वर्तमान ब्लॉक से जुड़ा डेटा संग्रह (collection)। |
| `resource` | `Resource` | ब्लॉक द्वारा उपयोग किया जाने वाला रिसोर्स इंस्टेंस (`SingleRecordResource` / `MultiRecordResource` आदि)। |
| `form` | `FormInstance` | फ़ॉर्म ब्लॉक: Ant Design Form इंस्टेंस, जो `getFieldsValue`, `validateFields`, `setFieldsValue` आदि को सपोर्ट करता है। |
| `emitter` | `EventEmitter` | इवेंट एमीटर, जिसका उपयोग `formValuesChange`, `onFieldReset` आदि को सुनने के लिए किया जाता है। |

## ctx.model और ctx.form के साथ संबंध

| आवश्यकता | अनुशंसित उपयोग |
|------|----------|
| **वर्तमान JS का पैरेंट ब्लॉक** | `ctx.blockModel` |
| **फ़ॉर्म फ़ील्ड को पढ़ना/लिखना** | `ctx.form` (`ctx.blockModel?.form` के बराबर, फ़ॉर्म ब्लॉक के तहत अधिक सुविधाजनक) |
| **वर्तमान निष्पादन संदर्भ का मॉडल** | `ctx.model` (JSField में फ़ील्ड मॉडल, JSBlock में ब्लॉक मॉडल) |

JSField में, `ctx.model` फ़ील्ड मॉडल है, और `ctx.blockModel` उस फ़ील्ड को धारण करने वाला फ़ॉर्म या टेबल ब्लॉक है; `ctx.form` आमतौर पर `ctx.blockModel.form` ही होता है।

## उदाहरण

### टेबल: चयनित पंक्तियाँ प्राप्त करें और प्रोसेस करें

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('कृपया पहले डेटा चुनें');
  return;
}
```

### फ़ॉर्म परिदृश्य: वैलिडेट और रिफ्रेश करें

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### फ़ॉर्म के बदलावों को सुनना

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // नवीनतम फ़ॉर्म मानों के आधार पर लिंकेज या पुन: रेंडर (re-render) करें
});
```

### ब्लॉक को फिर से रेंडर करना ट्रिगर करें

```ts
ctx.blockModel?.rerender?.();
```

## ध्यान देने योग्य बातें

- एक **स्वतंत्र JSBlock** (बिना पैरेंट फ़ॉर्म या टेबल ब्लॉक के) में, `ctx.blockModel` `null` हो सकता है। इसके गुणों तक पहुँचने से पहले ऑप्शनल चेनिंग का उपयोग करने की सलाह दी जाती है: `ctx.blockModel?.resource?.refresh?.()`।
- **JSField / JSItem / JSColumn** में, `ctx.blockModel` उस फ़ॉर्म या टेबल ब्लॉक को संदर्भित करता है जिसमें वर्तमान फ़ील्ड है। **JSBlock** में, यह वास्तविक पदानुक्रम (hierarchy) के आधार पर स्वयं या ऊपरी स्तर का ब्लॉक हो सकता है।
- `resource` केवल डेटा ब्लॉक के तहत मौजूद होता है; `form` केवल फ़ॉर्म ब्लॉक के तहत मौजूद होता है, टेबल ब्लॉक में आमतौर पर `form` नहीं होता है।

## संबंधित

- [ctx.model](./model.md): वर्तमान निष्पादन संदर्भ का मॉडल।
- [ctx.form](./form.md): फ़ॉर्म इंस्टेंस, फ़ॉर्म ब्लॉक के तहत अक्सर उपयोग किया जाता है।
- [ctx.resource](./resource.md): रिसोर्स इंस्टेंस (`ctx.blockModel?.resource` के बराबर, उपलब्ध होने पर सीधे उपयोग करें)।
- [ctx.getModel()](./get-model.md): UID द्वारा अन्य ब्लॉक मॉडल प्राप्त करें।