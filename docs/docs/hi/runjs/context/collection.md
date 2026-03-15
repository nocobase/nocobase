:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/collection) देखें।
:::

# ctx.collection

वर्तमान RunJS निष्पादन संदर्भ (execution context) से जुड़ा संग्रह (Collection) इंस्टेंस, जिसका उपयोग संग्रह के मेटाडेटा, फ़ील्ड परिभाषाओं और प्राइमरी की (primary keys) जैसे कॉन्फ़िगरेशन तक पहुँचने के लिए किया जाता है। यह आमतौर पर `ctx.blockModel.collection` या `ctx.collectionField?.collection` से प्राप्त होता है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **JSBlock** | ब्लॉक से जुड़ा संग्रह; `name`, `getFields`, `filterTargetKey` आदि तक पहुँच प्राप्त कर सकता है। |
| **JSField / JSItem / JSColumn** | वह संग्रह जिससे वर्तमान फ़ील्ड संबंधित है (या पैरेंट ब्लॉक का संग्रह), जिसका उपयोग फ़ील्ड सूचियों, प्राइमरी की आदि को प्राप्त करने के लिए किया जाता है। |
| **तालिका कॉलम / विवरण ब्लॉक** | संग्रह संरचना के आधार पर रेंडर करने या पॉपअप खोलते समय `filterByTk` पास करने के लिए उपयोग किया जाता है। |

> **नोट:** `ctx.collection` उन परिदृश्यों में उपलब्ध है जहाँ डेटा ब्लॉक, फ़ॉर्म ब्लॉक या तालिका ब्लॉक किसी संग्रह से बंधे होते हैं। एक स्वतंत्र JSBlock में जो किसी संग्रह से नहीं जुड़ा है, यह `null` हो सकता है। उपयोग करने से पहले इसके मान की जाँच (null check) करने की सलाह दी जाती है।

## 类型定义 (प्रकार परिभाषा)

```ts
collection: Collection | null | undefined;
```

## 常用属性 (सामान्य गुण)

| गुण | प्रकार | विवरण |
|------|------|------|
| `name` | `string` | संग्रह का नाम (जैसे `users`, `orders`) |
| `title` | `string` | संग्रह का शीर्षक (अंतर्राष्ट्रीयकरण सहित) |
| `filterTargetKey` | `string \| string[]` | प्राइमरी की फ़ील्ड का नाम, `filterByTk` और `getFilterByTK` के लिए उपयोग किया जाता है |
| `dataSourceKey` | `string` | डेटा स्रोत की (जैसे `main`) |
| `dataSource` | `DataSource` | वह डेटा स्रोत इंस्टेंस जिससे यह संबंधित है |
| `template` | `string` | संग्रह टेम्प्लेट (जैसे `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | उन फ़ील्ड्स की सूची जिन्हें शीर्षक के रूप में प्रदर्शित किया जा सकता है |
| `titleCollectionField` | `CollectionField` | शीर्षक फ़ील्ड इंस्टेंस |

## 常用方法 (सामान्य तरीके)

| तरीका | विवरण |
|------|------|
| `getFields(): CollectionField[]` | सभी फ़ील्ड प्राप्त करें (इनहेरिटेड फ़ील्ड्स सहित) |
| `getField(name: string): CollectionField \| undefined` | फ़ील्ड नाम के आधार पर एक एकल फ़ील्ड प्राप्त करें |
| `getFieldByPath(path: string): CollectionField \| undefined` | पाथ के आधार पर फ़ील्ड प्राप्त करें (जुड़ाव/associations का समर्थन करता है, जैसे `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | एसोसिएशन फ़ील्ड्स प्राप्त करें; `types` का मान `['one']`, `['many']` आदि हो सकता है |
| `getFilterByTK(record): any` | रिकॉर्ड से प्राइमरी की मान निकालें, API के `filterByTk` के लिए उपयोग किया जाता है |

## 与 ctx.collectionField、ctx.blockModel 的关系 (संबंध)

| आवश्यकता | अनुशंसित उपयोग |
|------|----------|
| **वर्तमान संदर्भ से जुड़ा संग्रह** | `ctx.collection` (`ctx.blockModel?.collection` या `ctx.collectionField?.collection` के बराबर) |
| **वर्तमान फ़ील्ड की संग्रह परिभाषा** | `ctx.collectionField?.collection` (वह संग्रह जिससे फ़ील्ड संबंधित है) |
| **एसोसिएशन लक्ष्य संग्रह** | `ctx.collectionField?.targetCollection` (एसोसिएशन फ़ील्ड का लक्ष्य संग्रह) |

सब-टेबल जैसे परिदृश्यों में, `ctx.collection` एसोसिएशन लक्ष्य संग्रह हो सकता है; मानक फ़ॉर्म/तालिकाओं में, यह आमतौर पर ब्लॉक से जुड़ा संग्रह होता है।

## 示例 (उदाहरण)

### प्राइमरी की प्राप्त करें और पॉपअप खोलें

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### वैलिडेशन या लिंकेज के लिए फ़ील्ड्स को इटरेट (Iterate) करें

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} आवश्यक है`);
    return;
  }
}
```

### एसोसिएशन फ़ील्ड्स प्राप्त करें

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// सब-टेबल, संबंधित संसाधन आदि बनाने के लिए उपयोग किया जाता है
```

## 注意事项 (ध्यान देने योग्य बातें)

- `filterTargetKey` संग्रह की प्राइमरी की फ़ील्ड का नाम है; कुछ संग्रहों में कंपोजिट प्राइमरी की के लिए `string[]` का उपयोग किया जा सकता है। यदि कॉन्फ़िगर नहीं किया गया है, तो आमतौर पर `'id'` का उपयोग किया जाता है।
- **सब-टेबल या एसोसिएशन फ़ील्ड** जैसे परिदृश्यों में, `ctx.collection` एसोसिएशन लक्ष्य संग्रह की ओर इशारा कर सकता है, जो `ctx.blockModel.collection` से भिन्न हो सकता है।
- `getFields()` इनहेरिटेड संग्रहों के फ़ील्ड्स को मर्ज करता है; स्थानीय फ़ील्ड समान नाम वाले इनहेरिटेड फ़ील्ड्स को ओवरराइड (override) करते हैं।

## 相关 (संबंधित)

- [ctx.collectionField](./collection-field.md): वर्तमान फ़ील्ड की संग्रह फ़ील्ड परिभाषा
- [ctx.blockModel](./block-model.md): वर्तमान JS को होस्ट करने वाला पैरेंट ब्लॉक, जिसमें `collection` शामिल है
- [ctx.model](./model.md): वर्तमान मॉडल, जिसमें `collection` हो सकता है