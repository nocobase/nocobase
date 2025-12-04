:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# JS ब्लॉक

## परिचय

JS ब्लॉक एक अत्यधिक लचीला "कस्टम रेंडरिंग ब्लॉक" है, जो आपको सीधे JavaScript स्क्रिप्ट लिखने की सुविधा देता है। इसका उपयोग इंटरफ़ेस बनाने, इवेंट्स को बाइंड करने, डेटा API को कॉल करने या थर्ड-पार्टी लाइब्रेरीज़ को इंटीग्रेट करने के लिए किया जा सकता है। यह उन परिदृश्यों के लिए उपयुक्त है जिन्हें बिल्ट-इन ब्लॉक से कवर करना मुश्किल होता है, जैसे पर्सनलाइज़्ड विज़ुअलाइज़ेशन, अस्थायी प्रयोग और हल्के एक्सटेंशन।

## रनटाइम कॉन्टेक्स्ट API

JS ब्लॉक के रनटाइम कॉन्टेक्स्ट में सामान्य क्षमताएँ पहले से ही मौजूद होती हैं, जिन्हें आप सीधे उपयोग कर सकते हैं:

- `ctx.element`: ब्लॉक का DOM कंटेनर (ElementProxy के रूप में सुरक्षित रूप से रैप किया गया), जो `innerHTML`, `querySelector`, `addEventListener` आदि को सपोर्ट करता है।
- `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को एसिंक्रोनस रूप से लोड करता है।
- `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को डायनामिक रूप से इम्पोर्ट करता है।
- `ctx.openView`: एक कॉन्फ़िगर किए गए व्यू (पॉपअप/ड्रॉअर/पेज) को खोलता है।
- `ctx.useResource(...)` + `ctx.resource`: डेटा को एक रिसोर्स के रूप में एक्सेस करता है।
- `ctx.i18n.t()` / `ctx.t()`: बिल्ट-इन अंतर्राष्ट्रीयकरण क्षमता।
- `ctx.onRefReady(ctx.ref, cb)`: कंटेनर तैयार होने के बाद रेंडर करता है ताकि टाइमिंग संबंधी समस्याओं से बचा जा सके।
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: बिल्ट-इन React, ReactDOM, Ant Design, Ant Design आइकन्स और dayjs जैसी सामान्य लाइब्रेरीज़, JSX रेंडरिंग और समय प्रबंधन के लिए। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` को कंपैटिबिलिटी के लिए अभी भी रखा गया है।)
- `ctx.render(vnode)`: React एलिमेंट, HTML स्ट्रिंग या DOM नोड को डिफ़ॉल्ट कंटेनर `ctx.element` में रेंडर करता है। कई बार कॉल करने पर एक ही React Root का पुन: उपयोग होगा, और कंटेनर की मौजूदा सामग्री को ओवरराइट कर दिया जाएगा।

## ब्लॉक जोड़ना

आप किसी पेज या पॉपअप में JS ब्लॉक जोड़ सकते हैं।
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## एडिटर और स्निपेट्स

JS ब्लॉक का स्क्रिप्ट एडिटर सिंटैक्स हाइलाइटिंग, एरर हिंट्स और बिल्ट-इन कोड स्निपेट्स (Snippets) को सपोर्ट करता है, जो आपको सामान्य उदाहरणों को तेज़ी से इन्सर्ट करने की सुविधा देता है, जैसे चार्ट रेंडर करना, बटन इवेंट्स को बाइंड करना, बाहरी लाइब्रेरीज़ लोड करना, React/Vue कंपोनेंट्स रेंडर करना, टाइमलाइन, इन्फॉर्मेशन कार्ड आदि।

- `Snippets`: बिल्ट-इन कोड स्निपेट्स की सूची खोलता है। आप सर्च कर सकते हैं और एक क्लिक से चुने हुए स्निपेट को कोड एडिटर में मौजूदा कर्सर की स्थिति पर इन्सर्ट कर सकते हैं।
- `Run`: मौजूदा एडिटर में कोड को सीधे चलाता है और एग्जीक्यूशन लॉग्स को नीचे `Logs` पैनल में आउटपुट करता है। यह `console.log/info/warn/error` को डिस्प्ले करने में सक्षम है, और एरर्स को हाइलाइट किया जाएगा, साथ ही उन्हें विशिष्ट पंक्ति और कॉलम पर लोकेट किया जा सकता है।

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

इसके अलावा, आप एडिटर के ऊपर-दाएँ कोने से सीधे AI कर्मचारी "फ्रंटएंड इंजीनियर · नाथन" को बुला सकते हैं। उन्हें मौजूदा कॉन्टेक्स्ट के आधार पर स्क्रिप्ट लिखने या संशोधित करने में आपकी मदद करने दें। फिर एक क्लिक से "Apply to editor" करके एडिटर में लागू करें और प्रभाव देखने के लिए चलाएँ। अधिक जानकारी के लिए देखें:

- [AI कर्मचारी · नाथन: फ्रंटएंड इंजीनियर](/ai-employees/built-in/ai-coding)

## रनटाइम एनवायरनमेंट और सुरक्षा

- **कंटेनर**: सिस्टम स्क्रिप्ट के लिए एक सुरक्षित DOM कंटेनर `ctx.element` (ElementProxy) प्रदान करता है, जो केवल मौजूदा ब्लॉक को प्रभावित करता है और पेज के अन्य क्षेत्रों में हस्तक्षेप नहीं करता है।
- **सैंडबॉक्स**: स्क्रिप्ट एक नियंत्रित एनवायरनमेंट में चलती है। `window`/`document`/`navigator` सुरक्षित प्रॉक्सी ऑब्जेक्ट्स का उपयोग करते हैं, जिससे सामान्य API उपलब्ध होते हैं, जबकि जोखिम भरे व्यवहार प्रतिबंधित होते हैं।
- **री-रेंडरिंग**: ब्लॉक के छिपाने और फिर से दिखाने पर वह अपने आप री-रेंडर हो जाता है ताकि पहली बार माउंट होने पर बार-बार एग्जीक्यूशन से बचा जा सके।

## सामान्य उपयोग (सरल उदाहरण)

### 1) React (JSX) रेंडर करना

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) API रिक्वेस्ट टेम्पलेट

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) ECharts लोड करना और रेंडर करना

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) एक व्यू (ड्रॉअर) खोलना

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) एक रिसोर्स पढ़ना और JSON रेंडर करना

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## ध्यान देने योग्य बातें

- बाहरी लाइब्रेरीज़ को लोड करने के लिए विश्वसनीय CDN का उपयोग करने की सलाह दी जाती है।
- **सेलेक्टर उपयोग संबंधी सलाह**: प्राथमिकता से `class` या `[name=...]` एट्रीब्यूट सेलेक्टर का उपयोग करें। स्थिर `id` का उपयोग करने से बचें, ताकि कई ब्लॉक/पॉपअप में डुप्लिकेट `id` के कारण स्टाइल या इवेंट संबंधी टकराव से बचा जा सके।
- **इवेंट क्लीनअप**: चूंकि ब्लॉक कई बार री-रेंडर हो सकता है, इसलिए इवेंट बाइंड करने से पहले उन्हें क्लीनअप या डी-डुप्लिकेट किया जाना चाहिए, ताकि बार-बार ट्रिगर होने से बचा जा सके। आप "पहले रिमूव करें फिर ऐड करें" का तरीका, या वन-टाइम लिसनर, या डुप्लिकेट से बचने के लिए एक फ़्लैग का उपयोग कर सकते हैं।

## संबंधित दस्तावेज़

- [वेरिएबल्स और कॉन्टेक्स्ट](/interface-builder/variables)
- [लिंकेज नियम](/interface-builder/linkage-rule)
- [व्यू और पॉपअप](/interface-builder/actions/types/view)