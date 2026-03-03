:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/resource) देखें।
:::

# ctx.resource

वर्तमान संदर्भ (context) में **FlowResource** इंस्टेंस, जिसका उपयोग डेटा तक पहुँचने और उसे संचालित करने के लिए किया जाता है। अधिकांश ब्लॉक (फॉर्म, टेबल, विवरण आदि) और पॉप-अप परिदृश्यों में, रनटाइम एनवायरनमेंट `ctx.resource` को पहले से बाइंड कर देता है। JSBlock जैसे परिदृश्यों में जहाँ डिफ़ॉल्ट रूप से कोई रिसोर्स नहीं होता है, आपको `ctx.resource` के माध्यम से इसका उपयोग करने से पहले [ctx.initResource()](./init-resource.md) को कॉल करके इसे इनिशियलाइज़ करना होगा।

## उपयुक्त परिदृश्य

RunJS के किसी भी ऐसे परिदृश्य में जहाँ स्ट्रक्चर्ड डेटा (सूचियाँ, एकल रिकॉर्ड, कस्टम API, SQL) तक पहुँच की आवश्यकता हो, इसका उपयोग किया जा सकता है। फॉर्म, टेबल, विवरण ब्लॉक और पॉप-अप आमतौर पर पहले से बाइंड होते हैं; JSBlock, JSField, JSItem, JSColumn आदि के लिए यदि डेटा लोड करने की आवश्यकता है, तो आप पहले `ctx.initResource(type)` को कॉल कर सकते हैं और फिर `ctx.resource` का उपयोग कर सकते हैं।

## प्रकार परिभाषा (Type Definition)

```ts
resource: FlowResource | undefined;
```

- पहले से बाइंड किए गए संदर्भों में, `ctx.resource` संबंधित रिसोर्स इंस्टेंस होता है;
- JSBlock जैसे परिदृश्यों में जहाँ डिफ़ॉल्ट रूप से कोई रिसोर्स नहीं होता है, यह `undefined` होता है और `ctx.initResource(type)` कॉल करने के बाद ही इसमें वैल्यू आती है।

## सामान्य मेथड

विभिन्न रिसोर्स प्रकारों (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) द्वारा उपलब्ध कराए गए मेथड थोड़े भिन्न हो सकते हैं। नीचे सार्वभौमिक या आमतौर पर उपयोग किए जाने वाले मेथड दिए गए हैं:

| मेथड | विवरण |
|------|------|
| `getData()` | वर्तमान डेटा प्राप्त करें (सूची या एकल रिकॉर्ड) |
| `setData(value)` | स्थानीय डेटा सेट करें |
| `refresh()` | डेटा को रिफ्रेश करने के लिए वर्तमान मापदंडों के साथ अनुरोध शुरू करें |
| `setResourceName(name)` | रिसोर्स का नाम सेट करें (जैसे `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | प्राइमरी की (primary key) फ़िल्टर सेट करें (एकल रिकॉर्ड `get` आदि के लिए) |
| `runAction(actionName, options)` | किसी भी रिसोर्स एक्शन को कॉल करें (जैसे `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | इवेंट्स को सब्सक्राइब/अनसब्सक्राइब करें (जैसे `refresh`, `saved`) |

**MultiRecordResource विशिष्ट**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` आदि।

## उदाहरण

### सूची डेटा (पहले initResource की आवश्यकता है)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### टेबल परिदृश्य (पहले से बाइंड)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('हटा दिया गया'));
```

### एकल रिकॉर्ड

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### कस्टम एक्शन को कॉल करना

```js
await ctx.resource.runAction('create', { data: { name: 'राम' } });
```

## ctx.initResource / ctx.makeResource के साथ संबंध

- **ctx.initResource(type)**: यदि `ctx.resource` मौजूद नहीं है, तो यह उसे बनाता है और बाइंड करता है; यदि यह पहले से मौजूद है, तो यह सीधे उसे वापस कर देता है। यह सुनिश्चित करता है कि `ctx.resource` उपलब्ध है।
- **ctx.makeResource(type)**: एक नया रिसोर्स इंस्टेंस बनाता है और उसे वापस करता है, लेकिन उसे `ctx.resource` में **नहीं** लिखता है। यह उन परिदृश्यों के लिए उपयुक्त है जहाँ कई स्वतंत्र रिसोर्स या अस्थायी उपयोग की आवश्यकता होती है।
- **ctx.resource**: वर्तमान संदर्भ में पहले से बाइंड किए गए रिसोर्स तक पहुँचता है। अधिकांश ब्लॉक/पॉप-अप पहले से बाइंड होते हैं; अन्यथा, यह `undefined` होता है और इसके लिए `ctx.initResource` की आवश्यकता होती है।

## ध्यान देने योग्य बातें

- उपयोग करने से पहले नल चेक (null check) करने की सलाह दी जाती है: `ctx.resource?.refresh()`, विशेष रूप से JSBlock जैसे परिदृश्यों में जहाँ पहले से बाइंडिंग मौजूद नहीं हो सकती है।
- इनिशियलाइज़ेशन के बाद, `refresh()` के माध्यम से डेटा लोड करने से पहले आपको संग्रह (collection) निर्दिष्ट करने के लिए `setResourceName(name)` को कॉल करना होगा।
- प्रत्येक रिसोर्स प्रकार के पूर्ण API के लिए, नीचे दिए गए लिंक देखें।

## संबंधित

- [ctx.initResource()](./init-resource.md) - रिसोर्स को इनिशियलाइज़ करें और वर्तमान संदर्भ में बाइंड करें
- [ctx.makeResource()](./make-resource.md) - `ctx.resource` में बाइंड किए बिना एक नया रिसोर्स इंस्टेंस बनाएँ
- [MultiRecordResource](../resource/multi-record-resource.md) - कई रिकॉर्ड/सूचियाँ
- [SingleRecordResource](../resource/single-record-resource.md) - एकल रिकॉर्ड
- [APIResource](../resource/api-resource.md) - सामान्य API रिसोर्स
- [SQLResource](../resource/sql-resource.md) - SQL क्वेरी रिसोर्स