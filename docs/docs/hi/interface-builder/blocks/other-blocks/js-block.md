:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/interface-builder/blocks/other-blocks/js-block) देखें।
:::

# JS Block ब्लॉक

## परिचय

JS Block एक अत्यधिक लचीला "कस्टम रेंडरिंग ब्लॉक" है, जो इंटरफ़ेस बनाने, इवेंट बाइंड करने, डेटा इंटरफ़ेस कॉल करने या थर्ड-पार्टी लाइब्रेरीज़ को इंटीग्रेट करने के लिए सीधे JavaScript स्क्रिप्ट लिखने का समर्थन करता है। यह उन व्यक्तिगत विज़ुअलाइज़ेशन, अस्थायी प्रयोगों और हल्के विस्तार परिदृश्यों के लिए उपयुक्त है जिन्हें बिल्ट-इन ब्लॉक द्वारा कवर करना कठिन है।

## रनटाइम कॉन्टेक्स्ट API

JS Block के रनटाइम कॉन्टेक्स्ट में सामान्य क्षमताएं इंजेक्ट की गई हैं, जिन्हें सीधे उपयोग किया जा सकता है:

- `ctx.element`: ब्लॉक का DOM कंटेनर (सुरक्षित रूप से एनकैप्सुलेटेड, ElementProxy), जो `innerHTML`, `querySelector`, `addEventListener` आदि का समर्थन करता है;
- `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को एसिंक्रोनस रूप से लोड करें;
- `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को डायनामिक रूप से इम्पोर्ट करें;
- `ctx.openView`: कॉन्फ़िगर किए गए व्यू (पॉपअप/ड्रॉअर/पेज) को खोलें;
- `ctx.useResource(...)` + `ctx.resource`: रिसोर्स के रूप में डेटा एक्सेस करें;
- `ctx.i18n.t()` / `ctx.t()`: बिल्ट-इन अंतर्राष्ट्रीयकरण क्षमता;
- `ctx.onRefReady(ctx.ref, cb)`: टाइमिंग समस्याओं से बचने के लिए कंटेनर तैयार होने के बाद रेंडर करें;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX रेंडरिंग, समय प्रसंस्करण, डेटा संचालन और गणितीय गणनाओं के लिए बिल्ट-इन React / ReactDOM / Ant Design / Ant Design आइकन्स / dayjs / lodash / math.js / formula.js आदि सामान्य लाइब्रेरीज़। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` अभी भी कंपैटिबिलिटी के लिए रखे गए हैं।)
- `ctx.render(vnode)`: React एलिमेंट, HTML स्ट्रिंग या DOM नोड को डिफ़ॉल्ट कंटेनर `ctx.element` में रेंडर करें; बार-बार कॉल करने पर एक ही React Root का पुन: उपयोग होगा और कंटेनर की मौजूदा सामग्री ओवरराइट हो जाएगी।

## ब्लॉक जोड़ना

- आप किसी पेज या पॉपअप में JS Block जोड़ सकते हैं।
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## एडिटर और स्निपेट्स

JS Block का स्क्रिप्ट एडिटर सिंटैक्स हाइलाइटिंग, एरर प्रॉम्प्ट और बिल्ट-इन कोड स्निपेट्स (Snippets) का समर्थन करता है, जिससे आप सामान्य उदाहरणों को तेज़ी से इन्सर्ट कर सकते हैं, जैसे: चार्ट रेंडर करना, बटन इवेंट बाइंड करना, बाहरी लाइब्रेरीज़ लोड करना, React/Vue कंपोनेंट्स रेंडर करना, टाइमलाइन, सूचना कार्ड आदि।

- `Snippets`: बिल्ट-इन कोड स्निपेट्स की सूची खोलें, आप सर्च कर सकते हैं और एक क्लिक से चुने हुए स्निपेट को कोड एडिटर में वर्तमान कर्सर की स्थिति पर इन्सर्ट कर सकते हैं।
- `Run`: वर्तमान एडिटर में कोड को सीधे चलाएं और रन लॉग्स को नीचे `Logs` पैनल में आउटपुट करें। यह `console.log/info/warn/error` प्रदर्शित करने का समर्थन करता है, त्रुटियों को हाइलाइट किया जाएगा और विशिष्ट पंक्ति और कॉलम पर लोकेट किया जा सकता है।

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

इसके अलावा, एडिटर के ऊपरी दाएं कोने से आप सीधे AI कर्मचारी "फ्रंटएंड इंजीनियर · Nathan" को बुला सकते हैं, और उन्हें वर्तमान कॉन्टेक्स्ट के आधार पर स्क्रिप्ट लिखने या संशोधित करने में आपकी मदद करने के लिए कह सकते हैं, फिर प्रभाव देखने के लिए एक क्लिक से "Apply to editor" करके एडिटर में लागू करने के बाद चलाएं। विवरण के लिए देखें:

- [AI कर्मचारी · Nathan: फ्रंटएंड इंजीनियर](/ai-employees/features/built-in-employee)

## रनटाइम एनवायरनमेंट और सुरक्षा

- कंटेनर: सिस्टम स्क्रिप्ट के लिए एक सुरक्षित DOM कंटेनर `ctx.element` (ElementProxy) प्रदान करता है, जो केवल वर्तमान ब्लॉक को प्रभावित करता है और पेज के अन्य क्षेत्रों में हस्तक्षेप नहीं करता है।
- सैंडबॉक्स: स्क्रिप्ट एक नियंत्रित वातावरण में चलती है, `window`/`document`/`navigator` सुरक्षित प्रॉक्सी ऑब्जेक्ट्स का उपयोग करते हैं, सामान्य API उपलब्ध हैं और जोखिम भरे व्यवहार प्रतिबंधित हैं।
- री-रेंडरिंग: ब्लॉक के छिपने और फिर से प्रदर्शित होने पर वह अपने आप री-रेंडर हो जाता है (प्रारंभिक माउंट के बार-बार निष्पादन से बचने के लिए)।

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

### 4) व्यू (ड्रॉअर) खोलना

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) रिसोर्स पढ़ना और JSON रेंडर करना

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## ध्यान देने योग्य बातें

- बाहरी लाइब्रेरीज़ लोड करने के लिए विश्वसनीय CDN का उपयोग करने की सलाह दी जाती है।
- सेलेक्टर उपयोग संबंधी सलाह: प्राथमिकता से `class` या `[name=...]` एट्रिब्यूट सेलेक्टर का उपयोग करें; स्थिर `id` का उपयोग करने से बचें, ताकि कई ब्लॉक/पॉपअप में डुप्लिकेट `id` के कारण स्टाइल या इवेंट संघर्ष से बचा जा सके।
- इवेंट क्लीनअप: ब्लॉक कई बार री-रेंडर हो सकता है, इसलिए इवेंट बाइंड करने से पहले उन्हें साफ़ या डी-डुप्लिकेट किया जाना चाहिए ताकि बार-बार ट्रिगर होने से बचा जा सके। आप "पहले remove फिर add" करने का तरीका, या वन-टाइम लिसनर, या डुप्लिकेट रोकने के लिए फ्लैग का उपयोग कर सकते हैं।

## संबंधित दस्तावेज़

- [वेरिएबल्स और कॉन्टेक्स्ट](/interface-builder/variables)
- [लिंकेज नियम](/interface-builder/linkage-rule)
- [व्यू और पॉपअप](/interface-builder/actions/types/view)