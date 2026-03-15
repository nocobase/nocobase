:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/make-resource) देखें।
:::

# ctx.makeResource()

एक नया resource इंस्टेंस **बनाता है** और उसे वापस (return) करता है, यह `ctx.resource` में **नहीं** लिखता या उसे नहीं बदलता है। यह उन परिन्यासों के लिए उपयुक्त है जहाँ कई स्वतंत्र resources या अस्थायी उपयोग की आवश्यकता होती है।

## उपयोग के मामले

| परिदृश्य | विवरण |
|------|------|
| **कई resources** | एक साथ कई डेटा स्रोतों (जैसे, उपयोगकर्ता सूची + ऑर्डर सूची) को लोड करें, प्रत्येक एक स्वतंत्र resource का उपयोग करता है। |
| **अस्थायी प्रश्न (Queries)** | एक बार के प्रश्न जो उपयोग के बाद हटा दिए जाते हैं, जिन्हें `ctx.resource` से बाइंड करने की आवश्यकता नहीं होती है। |
| **सहायक डेटा** | मुख्य डेटा के लिए `ctx.resource` का उपयोग करें और अतिरिक्त डेटा के लिए इंस्टेंस बनाने के लिए `makeResource` का उपयोग करें। |

यदि आपको केवल एक ही resource की आवश्यकता है और आप उसे `ctx.resource` से बाइंड करना चाहते हैं, तो [ctx.initResource()](./init-resource.md) का उपयोग करना अधिक उपयुक्त है।

## टाइप परिभाषा (Type Definition)

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| पैरामीटर | टाइप | विवरण |
|------|------|------|
| `resourceType` | `string` | संसाधन का प्रकार: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**रिटर्न वैल्यू**: नया बनाया गया resource इंस्टेंस।

## ctx.initResource() से अंतर

| विधि | व्यवहार |
|------|------|
| `ctx.makeResource(type)` | केवल एक नया इंस्टेंस बनाता है और वापस करता है, `ctx.resource` में **नहीं** लिखता है। कई स्वतंत्र resources प्राप्त करने के लिए इसे कई बार कॉल किया जा सकता है। |
| `ctx.initResource(type)` | यदि `ctx.resource` मौजूद नहीं है तो बनाता है और बाइंड करता है; यदि यह पहले से मौजूद है तो इसे सीधे वापस कर देता है। यह सुनिश्चित करता है कि `ctx.resource` उपलब्ध है। |

## उदाहरण

### एकल resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource अभी भी अपना मूल मान (यदि कोई हो) बना रहता है
```

### कई resources

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>उपयोगकर्ता संख्या: {usersRes.getData().length}</p>
    <p>ऑर्डर संख्या: {ordersRes.getData().length}</p>
  </div>
);
```

### अस्थायी प्रश्न (Temporary query)

```ts
// एक बार का प्रश्न, ctx.resource को प्रभावित नहीं करता है
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## महत्वपूर्ण बातें

- नए बनाए गए resource को संग्रह (collection) निर्दिष्ट करने के लिए `setResourceName(name)` को कॉल करने की आवश्यकता होती है, और फिर `refresh()` के माध्यम से डेटा लोड करना होता है।
- प्रत्येक resource इंस्टेंस स्वतंत्र है और दूसरों को प्रभावित नहीं करता है; यह समानांतर में कई डेटा स्रोतों को लोड करने के लिए उपयुक्त है।

## संबंधित

- [ctx.initResource()](./init-resource.md): `ctx.resource` को इनिशियलाइज़ और बाइंड करें
- [ctx.resource](./resource.md): वर्तमान संदर्भ (context) में resource इंस्टेंस
- [MultiRecordResource](../resource/multi-record-resource) — कई रिकॉर्ड/सूची
- [SingleRecordResource](../resource/single-record-resource) — एकल रिकॉर्ड
- [APIResource](../resource/api-resource) — सामान्य API संसाधन
- [SQLResource](../resource/sql-resource) — SQL क्वेरी संसाधन