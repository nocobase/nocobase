:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/open-view) देखें।
:::

# ctx.openView()

प्रोग्रामेटिक रूप से एक निर्दिष्ट व्यू (ड्रॉर, डायलॉग, एम्बेडेड पेज आदि) खोलें। यह `FlowModelContext` द्वारा प्रदान किया जाता है, जिसका उपयोग `JSBlock`, टेबल सेल और वर्कफ़्लो जैसे परिदृश्यों में कॉन्फ़िगर किए गए `ChildPage` या `PopupAction` व्यू को खोलने के लिए किया जाता है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **JSBlock** | बटन क्लिक के बाद विवरण/संपादन डायलॉग खोलें, वर्तमान पंक्ति का `filterByTk` पास करें। |
| **टेबल सेल** | सेल के भीतर एक बटन रेंडर करें जो क्लिक करने पर पंक्ति विवरण डायलॉग खोलता है। |
| **इवेंट स्ट्रीम / JSAction** | सफल ऑपरेशन के बाद अगला व्यू या डायलॉग खोलें। |
| **एसोसिएशन फ़ील्ड** | `ctx.runAction('openView', params)` के माध्यम से चयन/संपादन डायलॉग खोलें। |

> **ध्यान दें:** `ctx.openView` उस RunJS वातावरण में उपलब्ध है जहाँ `FlowModel` संदर्भ (context) मौजूद है। यदि `uid` के अनुरूप मॉडल मौजूद नहीं है, तो एक `PopupActionModel` स्वचालित रूप से बनाया और सहेजा (persist) जाएगा।

## सिग्नेचर

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## पैरामीटर विवरण

### uid

व्यू मॉडल का विशिष्ट पहचानकर्ता (unique identifier)। यदि यह मौजूद नहीं है, तो इसे स्वचालित रूप से बनाया और सहेजा जाएगा। एक स्थिर UID का उपयोग करने की सलाह दी जाती है, जैसे `${ctx.model.uid}-detail`, ताकि एक ही डायलॉग को कई बार खोलते समय कॉन्फ़िगरेशन का पुन: उपयोग किया जा सके।

### options के सामान्य फ़ील्ड

| फ़ील्ड | प्रकार | विवरण |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | खोलने का तरीका: ड्रॉर, डायलॉग, या एम्बेडेड। डिफ़ॉल्ट `drawer` है। |
| `size` | `small` / `medium` / `large` | डायलॉग या ड्रॉर का आकार। डिफ़ॉल्ट `medium` है। |
| `title` | `string` | व्यू का शीर्षक। |
| `params` | `Record<string, any>` | व्यू को पास किए गए मनमाने पैरामीटर। |
| `filterByTk` | `any` | प्राइमरी की (Primary key) मान, जिसका उपयोग एकल रिकॉर्ड विवरण/संपादन परिदृश्यों के लिए किया जाता है। |
| `sourceId` | `string` | स्रोत रिकॉर्ड ID, एसोसिएशन परिदृश्यों में उपयोग किया जाता है। |
| `dataSourceKey` | `string` | डेटा स्रोत। |
| `collectionName` | `string` | संग्रह (Collection) का नाम। |
| `associationName` | `string` | एसोसिएशन फ़ील्ड का नाम। |
| `navigation` | `boolean` | क्या रूट नेविगेशन का उपयोग करना है। यदि `defineProperties` या `defineMethods` प्रदान किए जाते हैं, तो इसे जबरन `false` पर सेट कर दिया जाता है। |
| `preventClose` | `boolean` | क्या बंद होने से रोकना है। |
| `defineProperties` | `Record<string, PropertyOptions>` | व्यू के भीतर मॉडल में डायनामिक रूप से प्रॉपर्टीज़ इंजेक्ट करें। |
| `defineMethods` | `Record<string, Function>` | व्यू के भीतर मॉडल में डायनामिक रूप से मेथड इंजेक्ट करें। |

## उदाहरण

### बुनियादी उपयोग: एक ड्रॉर खोलें

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('विवरण'),
});
```

### वर्तमान पंक्ति का संदर्भ (Context) पास करना

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('पंक्ति विवरण'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### runAction के माध्यम से खोलें

जब एक मॉडल को `openView` एक्शन (जैसे एसोसिएशन फ़ील्ड या क्लिक करने योग्य फ़ील्ड) के साथ कॉन्फ़िगर किया जाता है, तो आप कॉल कर सकते हैं:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### कस्टम संदर्भ (Context) इंजेक्ट करना

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## ctx.viewer और ctx.view के साथ संबंध

| उद्देश्य | अनुशंसित उपयोग |
|------|----------|
| **कॉन्फ़िगर किए गए वर्कफ़्लो व्यू को खोलना** | `ctx.openView(uid, options)` |
| **कस्टम कंटेंट खोलना (बिना वर्कफ़्लो के)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **वर्तमान में खुले व्यू पर काम करना** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` एक `FlowPage` (`ChildPageModel`) खोलता है, जो आंतरिक रूप से एक पूर्ण वर्कफ़्लो पेज रेंडर करता है; `ctx.viewer` किसी भी मनमाने React कंटेंट को खोलता है।

## ध्यान देने योग्य बातें

- मल्टीपल ब्लॉक्स के बीच टकराव से बचने के लिए `uid` को `ctx.model.uid` के साथ जोड़ने की सलाह दी जाती है (जैसे, `${ctx.model.uid}-xxx`) ।
- जब `defineProperties` या `defineMethods` पास किए जाते हैं, तो रिफ्रेश के बाद संदर्भ के नुकसान को रोकने के लिए `navigation` को जबरन `false` पर सेट किया जाता है।
- डायलॉग के अंदर, `ctx.view` वर्तमान व्यू इंस्टेंस को संदर्भित करता है, और `ctx.view.inputArgs` का उपयोग खोलते समय पास किए गए पैरामीटर को पढ़ने के लिए किया जा सकता है।

## संबंधित

- [ctx.view](./view.md): वर्तमान में खुला व्यू इंस्टेंस।
- [ctx.model](./model.md): वर्तमान मॉडल, जिसका उपयोग स्थिर `popupUid` बनाने के लिए किया जाता है।