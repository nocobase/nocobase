:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/init-resource) देखें।
:::

# ctx.initResource()

वर्तमान संदर्भ (context) के संसाधन (resource) को **प्रारंभ (Initialize)** करता है: यदि `ctx.resource` पहले से मौजूद नहीं है, तो यह निर्दिष्ट प्रकार का एक संसाधन बनाता है और उसे संदर्भ से जोड़ देता है; यदि यह पहले से मौजूद है, तो सीधे उसी का उपयोग किया जाता है। इसके बाद, इसे `ctx.resource` के माध्यम से एक्सेस किया जा सकता है।

## उपयोग के मामले (Use Cases)

आमतौर पर इसका उपयोग केवल **JSBlock** (स्वतंत्र ब्लॉक) परिदृश्यों में किया जाता है। अधिकांश ब्लॉक, पॉपअप आदि में `ctx.resource` पहले से ही जुड़ा होता है और उन्हें मैन्युअल कॉल की आवश्यकता नहीं होती है; JSBlock में डिफ़ॉल्ट रूप से कोई संसाधन नहीं होता है, इसलिए आपको `ctx.resource` के माध्यम से डेटा लोड करने से पहले `ctx.initResource(type)` को कॉल करना होगा।

## टाइप परिभाषा (Type Definition)

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| पैरामीटर | प्रकार | विवरण |
|-----------|------|-------------|
| `type` | `string` | संसाधन का प्रकार: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**रिटर्न वैल्यू**: वर्तमान संदर्भ में संसाधन का इंस्टेंस (यानी `ctx.resource`)।

## ctx.makeResource() से अंतर

| मेथड | व्यवहार |
|--------|----------|
| `ctx.initResource(type)` | यदि `ctx.resource` मौजूद नहीं है, तो इसे बनाता और बाइंड करता है; यदि मौजूद है, तो सीधे उसे ही वापस कर देता है। यह सुनिश्चित करता है कि `ctx.resource` उपलब्ध है। |
| `ctx.makeResource(type)` | केवल एक नया इंस्टेंस बनाता है और उसे वापस करता है, यह `ctx.resource` में **नहीं** लिखता है। यह उन परिदृश्यों के लिए उपयुक्त है जहाँ कई स्वतंत्र संसाधनों या अस्थायी उपयोग की आवश्यकता होती है। |

## उदाहरण

### सूची डेटा (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### एकल रिकॉर्ड (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // प्राथमिक कुंजी (primary key) निर्दिष्ट करें
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### डेटा स्रोत निर्दिष्ट करना

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## महत्वपूर्ण बातें

- अधिकांश ब्लॉक परिदृश्यों (फॉर्म, टेबल, विवरण आदि) और पॉपअप में, `ctx.resource` पहले से ही रनटाइम वातावरण द्वारा बाइंड होता है, इसलिए `ctx.initResource` को कॉल करना अनावश्यक है।
- मैन्युअल इनिशियलाइजेशन केवल JSBlock जैसे संदर्भों में आवश्यक है जहाँ कोई डिफ़ॉल्ट संसाधन नहीं होता है।
- इनिशियलाइजेशन के बाद, आपको संग्रह (collection) निर्दिष्ट करने के लिए `setResourceName(name)` को कॉल करना होगा, और फिर डेटा लोड करने के लिए `refresh()` को कॉल करना होगा।

## संबंधित

- [ctx.resource](./resource.md) — वर्तमान संदर्भ में संसाधन का इंस्टेंस
- [ctx.makeResource()](./make-resource.md) — `ctx.resource` से बाइंड किए बिना एक नया संसाधन इंस्टेंस बनाता है
- [MultiRecordResource](../resource/multi-record-resource.md) — कई रिकॉर्ड/सूची
- [SingleRecordResource](../resource/single-record-resource.md) — एकल रिकॉर्ड
- [APIResource](../resource/api-resource.md) — सामान्य API संसाधन
- [SQLResource](../resource/sql-resource.md) — SQL क्वेरी संसाधन