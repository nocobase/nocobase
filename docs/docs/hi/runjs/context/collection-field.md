:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/collection-field) देखें।
:::

# ctx.collectionField

वर्तमान RunJS निष्पादन संदर्भ (execution context) से संबद्ध डेटा टेबल फ़ील्ड (CollectionField) इंस्टेंस, जिसका उपयोग फ़ील्ड के मेटाडेटा, प्रकार, वैधीकरण नियमों और एसोसिएशन जानकारी तक पहुँचने के लिए किया जाता है। यह केवल तभी मौजूद होता है जब फ़ील्ड किसी संग्रह (Collection) परिभाषा से बंधी हो; कस्टम/वर्चुअल फ़ील्ड `null` हो सकते हैं।

## लागू होने वाले परिदृश्य

| परिदृश्य | विवरण |
|------|------|
| **JSField** | `interface`, `enum`, `targetCollection` आदि के आधार पर फ़ॉर्म फ़ील्ड में लिंकेज या वैधीकरण करना। |
| **JSItem** | सब-टेबल आइटम में वर्तमान कॉलम के संबंधित फ़ील्ड के मेटाडेटा तक पहुँचना। |
| **JSColumn** | टेबल कॉलम में `collectionField.interface` के अनुसार रेंडरिंग विधि चुनना, या `targetCollection` तक पहुँचना। |

> **नोट:** `ctx.collectionField` केवल तभी उपलब्ध होता है जब फ़ील्ड किसी संग्रह (Collection) परिभाषा से बंधी हो; JSBlock स्वतंत्र ब्लॉक, बिना फ़ील्ड बाइंडिंग वाले एक्शन इवेंट आदि जैसे परिदृश्यों में यह आमतौर पर `undefined` होता है। उपयोग करने से पहले शून्य (null) मानों की जाँच करने की सलाह दी जाती है।

## टाइप परिभाषा (Type Definition)

```ts
collectionField: CollectionField | null | undefined;
```

## सामान्य गुण (Properties)

| गुण | प्रकार | विवरण |
|------|------|------|
| `name` | `string` | फ़ील्ड का नाम (जैसे `status`, `userId`) |
| `title` | `string` | फ़ील्ड का शीर्षक (अंतर्राष्ट्रीयकरण सहित) |
| `type` | `string` | फ़ील्ड डेटा प्रकार (`string`, `integer`, `belongsTo` आदि) |
| `interface` | `string` | फ़ील्ड इंटरफ़ेस प्रकार (`input`, `select`, `m2o`, `o2m`, `m2m` आदि) |
| `collection` | `Collection` | वह संग्रह जिससे फ़ील्ड संबंधित है |
| `targetCollection` | `Collection` | एसोसिएशन फ़ील्ड का लक्षित संग्रह (केवल एसोसिएशन प्रकारों के लिए) |
| `target` | `string` | लक्षित संग्रह का नाम (एसोसिएशन फ़ील्ड के लिए) |
| `enum` | `array` | गणना विकल्प (select, radio आदि) |
| `defaultValue` | `any` | डिफ़ॉल्ट मान |
| `collectionName` | `string` | संबंधित संग्रह का नाम |
| `foreignKey` | `string` | विदेशी कुंजी (foreign key) फ़ील्ड का नाम (belongsTo आदि) |
| `sourceKey` | `string` | एसोसिएशन स्रोत कुंजी (hasMany आदि) |
| `targetKey` | `string` | एसोसिएशन लक्ष्य कुंजी |
| `fullpath` | `string` | पूर्ण पथ (जैसे `main.users.status`), API या वेरिएबल संदर्भों के लिए उपयोग किया जाता है |
| `resourceName` | `string` | संसाधन का नाम (जैसे `users.status`) |
| `readonly` | `boolean` | क्या यह केवल पढ़ने के लिए (read-only) है |
| `titleable` | `boolean` | क्या इसे शीर्षक के रूप में प्रदर्शित किया जा सकता है |
| `validation` | `object` | वैधीकरण नियम कॉन्फ़िगरेशन |
| `uiSchema` | `object` | UI कॉन्फ़िगरेशन |
| `targetCollectionTitleField` | `CollectionField` | लक्षित संग्रह का शीर्षक फ़ील्ड (एसोसिएशन फ़ील्ड के लिए) |

## सामान्य विधियाँ (Methods)

| विधि | विवरण |
|------|------|
| `isAssociationField(): boolean` | क्या यह एक एसोसिएशन फ़ील्ड है (belongsTo, hasMany, hasOne, belongsToMany आदि) |
| `isRelationshipField(): boolean` | क्या यह एक संबंधपरक (relationship) फ़ील्ड है (o2o, m2o, o2m, m2m आदि सहित) |
| `getComponentProps(): object` | फ़ील्ड घटक के डिफ़ॉल्ट props प्राप्त करें |
| `getFields(): CollectionField[]` | लक्षित संग्रह की फ़ील्ड सूची प्राप्त करें (केवल एसोसिएशन फ़ील्ड) |
| `getFilterOperators(): object[]` | इस फ़ील्ड द्वारा समर्थित फ़िल्टर ऑपरेटर प्राप्त करें (जैसे `$eq`, `$ne` आदि) |

## उदाहरण

### फ़ील्ड प्रकार के आधार पर ब्रांच रेंडरिंग

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // एसोसिएशन फ़ील्ड: संबद्ध रिकॉर्ड प्रदर्शित करें
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### एसोसिएशन फ़ील्ड की पहचान करना और लक्षित संग्रह तक पहुँचना

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // लक्षित संग्रह संरचना के अनुसार प्रोसेस करें
}
```

### गणना (enumeration) विकल्प प्राप्त करना

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### केवल-पढ़ने (read-only)/केवल-प्रदर्शन मोड के आधार पर सशर्त रेंडरिंग

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### लक्षित संग्रह का शीर्षक फ़ील्ड प्राप्त करना

```ts
// एसोसिएशन फ़ील्ड प्रदर्शित करते समय, शीर्षक फ़ील्ड नाम प्राप्त करने के लिए targetCollectionTitleField का उपयोग करें
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## ctx.collection के साथ संबंध

| आवश्यकता | अनुशंसित उपयोग |
|------|----------|
| **वर्तमान फ़ील्ड का संबंधित संग्रह** | `ctx.collectionField?.collection` या `ctx.collection` |
| **फ़ील्ड मेटाडेटा (नाम, प्रकार, इंटरफ़ेस, enum आदि)** | `ctx.collectionField` |
| **लक्षित संग्रह** | `ctx.collectionField?.targetCollection` |

`ctx.collection` आमतौर पर वर्तमान ब्लॉक से बंधे संग्रह (Collection) को दर्शाता है; `ctx.collectionField` संग्रह में वर्तमान फ़ील्ड की परिभाषा को दर्शाता है। सब-टेबल, एसोसिएशन फ़ील्ड आदि जैसे परिदृश्यों में, दोनों अलग-अलग हो सकते हैं।

## महत्वपूर्ण बातें

- **JSBlock**, **JSAction (बिना फ़ील्ड बाइंडिंग के)** आदि जैसे परिदृश्यों में, `ctx.collectionField` आमतौर पर `undefined` होता है, पहुँचने से पहले वैकल्पिक चेनिंग (optional chaining) का उपयोग करने की सलाह दी जाती है।
- यदि कोई कस्टम JS फ़ील्ड किसी संग्रह फ़ील्ड से बंधा नहीं है, तो `ctx.collectionField` `null` हो सकता है।
- `targetCollection` केवल एसोसिएशन प्रकार के फ़ील्ड (जैसे m2o, o2m, m2m) के लिए मौजूद होता है; `enum` केवल select, radioGroup जैसे विकल्पों वाले फ़ील्ड के लिए मौजूद होता है।

## संबंधित

- [ctx.collection](./collection.md): वर्तमान संदर्भ से संबद्ध संग्रह
- [ctx.model](./model.md): वर्तमान निष्पादन संदर्भ का मॉडल
- [ctx.blockModel](./block-model.md): वर्तमान JS को धारण करने वाला पैरेंट ब्लॉक
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): वर्तमान फ़ील्ड मान को पढ़ें और लिखें