:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/interface-builder/actions/types/js-action) देखें।
:::

# JS Action

## परिचय

JS Action का उपयोग बटन क्लिक करने पर JavaScript निष्पादित करने और किसी भी व्यावसायिक व्यवहार को अनुकूलित करने के लिए किया जाता है। इसका उपयोग फ़ॉर्म टूलबार, टेबल टूलबार (संग्रह स्तर), टेबल पंक्ति (रिकॉर्ड स्तर) आदि जैसे स्थानों पर सत्यापन, संकेत, इंटरफ़ेस कॉल, पॉपअप/ड्रॉअर खोलने, डेटा रीफ़्रेश करने आदि जैसे कार्यों को करने के लिए किया जा सकता है।

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## रनटाइम कॉन्टेक्स्ट API (अक्सर उपयोग किए जाने वाले)

- `ctx.api.request(options)`: HTTP अनुरोध शुरू करें;
- `ctx.openView(viewUid, options)`: कॉन्फ़िगर किए गए व्यू (ड्रॉअर/डायलॉग/पेज) को खोलें;
- `ctx.message` / `ctx.notification`: वैश्विक संकेत और सूचनाएं;
- `ctx.t()` / `ctx.i18n.t()`: अंतर्राष्ट्रीयकरण;
- `ctx.resource`: संग्रह-स्तर संदर्भ का डेटा संसाधन (जैसे टेबल टूलबार, जिसमें `getSelectedRows()`, `refresh()` आदि शामिल हैं);
- `ctx.record`: रिकॉर्ड-स्तर संदर्भ का वर्तमान पंक्ति रिकॉर्ड (जैसे टेबल पंक्ति बटन);
- `ctx.form`: फ़ॉर्म-स्तर संदर्भ का AntD Form इंस्टेंस (जैसे फ़ॉर्म टूलबार बटन);
- `ctx.collection`: वर्तमान संग्रह की मेटा-जानकारी;
- कोड एडिटर `Snippets` और `Run` प्री-रन का समर्थन करता है (नीचे देखें)।


- `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को एसिंक्रोनस रूप से लोड करें;
- `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को गतिशील रूप से इम्पोर्ट करें;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: अंतर्निहित React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js आदि सामान्य लाइब्रेरी, जिनका उपयोग JSX रेंडरिंग, समय प्रसंस्करण, डेटा संचालन और गणितीय गणनाओं के लिए किया जाता है।

> वास्तविक उपलब्ध वेरिएबल बटन के स्थान के आधार पर भिन्न होंगे, ऊपर सामान्य क्षमताओं का अवलोकन दिया गया है।

## एडिटर और स्निपेट्स

- `Snippets`: अंतर्निहित कोड स्निपेट सूची खोलें, जिसे खोजा जा सकता है और एक क्लिक के साथ वर्तमान कर्सर स्थिति पर डाला जा सकता है।
- `Run`: वर्तमान कोड को सीधे चलाएं और रनिंग लॉग को नीचे `Logs` पैनल में आउटपुट करें; यह `console.log/info/warn/error` और त्रुटि हाइलाइटिंग का समर्थन करता है।

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- आप AI कर्मचारी के साथ मिलकर स्क्रिप्ट बना/संशोधित कर सकते हैं: [AI कर्मचारी · Nathan: फ्रंटएंड इंजीनियर](/ai-employees/features/built-in-employee)

## सामान्य उपयोग (सरलीकृत उदाहरण)

### 1) इंटरफ़ेस अनुरोध और संकेत

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) संग्रह बटन: चयन को सत्यापित करें और संसाधित करें

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: व्यावसायिक लॉजिक निष्पादित करें…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) रिकॉर्ड बटन: वर्तमान पंक्ति रिकॉर्ड पढ़ें

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) व्यू खोलें (ड्रॉअर/डायलॉग)

```js
const popupUid = ctx.model.uid + '-open'; // स्थिरता के लिए वर्तमान बटन से बाइंड करें
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) सबमिशन के बाद डेटा रीफ़्रेश करें

```js
// सामान्य रीफ़्रेश: टेबल/सूची संसाधनों को प्राथमिकता दें, उसके बाद फ़ॉर्म वाले ब्लॉक के संसाधन को
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## ध्यान देने योग्य बातें

- क्रियाओं की स्थिरता (Idempotency): बार-बार क्लिक करने से होने वाले कई सबमिशन से बचें, आप लॉजिक में स्थिति स्विच जोड़ सकते हैं या बटन को अक्षम कर सकते हैं।
- त्रुटि प्रबंधन: इंटरफ़ेस कॉल के लिए try/catch जोड़ें और उपयोगकर्ता को संकेत दें।
- व्यू लिंकेज: `ctx.openView` के माध्यम से पॉपअप/ड्रॉअर खोलते समय, स्पष्ट रूप से पैरामीटर पास करने का सुझाव दिया जाता है, और यदि आवश्यक हो, तो सफल सबमिशन के बाद पैरेंट संसाधन को सक्रिय रूप से रीफ़्रेश करें।

## संबंधित दस्तावेज़

- [वैरिएबल और कॉन्टेक्स्ट](/interface-builder/variables)
- [लिंकेज नियम](/interface-builder/linkage-rule)
- [व्यू और पॉप-अप](/interface-builder/actions/types/view)