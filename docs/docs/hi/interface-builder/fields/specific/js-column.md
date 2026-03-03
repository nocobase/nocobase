:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/interface-builder/fields/specific/js-column) देखें।
:::

# JS Column

## परिचय

JS Column का उपयोग तालिकाओं में "कस्टम कॉलम" के लिए किया जाता है, जो JavaScript के माध्यम से प्रत्येक पंक्ति के सेल की सामग्री को रेंडर करता है। यह किसी विशिष्ट फ़ील्ड से बंधा नहीं है और व्युत्पन्न कॉलम (derived columns), क्रॉस-फ़ील्ड संयोजित प्रदर्शन, स्थिति बैज (status badges), बटन संचालन और रिमोट डेटा एकत्रीकरण जैसे परिदृश्यों के लिए उपयुक्त है।

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## रनटाइम कॉन्टेक्स्ट API

JS Column के प्रत्येक सेल को रेंडर करते समय निम्नलिखित संदर्भ (context) क्षमताओं का उपयोग किया जा सकता है:

- `ctx.element`: वर्तमान सेल का DOM कंटेनर (ElementProxy), जो `innerHTML`, `querySelector`, `addEventListener` आदि का समर्थन करता है;
- `ctx.record`: वर्तमान पंक्ति रिकॉर्ड ऑब्जेक्ट (केवल पढ़ने के लिए);
- `ctx.recordIndex`: वर्तमान पृष्ठ के भीतर पंक्ति इंडेक्स (0 से शुरू होता है, पेजिंग से प्रभावित हो सकता है);
- `ctx.collection`: तालिका से जुड़े **संग्रह** की मेटा-जानकारी (केवल पढ़ने के लिए);
- `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को एसिंक्रोनस रूप से लोड करें;
- `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को डायनेमिक रूप से इम्पोर्ट करें;
- `ctx.openView(options)`: कॉन्फ़िगर किए गए व्यू (पॉपअप/ड्रॉअर/पेज) को खोलें;
- `ctx.i18n.t()` / `ctx.t()`: अंतर्राष्ट्रीयकरण;
- `ctx.onRefReady(ctx.ref, cb)`: कंटेनर तैयार होने के बाद रेंडर करें;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX रेंडरिंग, समय प्रसंस्करण, डेटा संचालन और गणितीय गणनाओं के लिए बिल्ट-इन React / ReactDOM / Ant Design / Ant Design Icons / dayjs / lodash / math.js / formula.js आदि सामान्य लाइब्रेरीज़। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` अभी भी संगतता के लिए रखे गए हैं।)
- `ctx.render(vnode)`: React एलिमेंट/HTML/DOM को डिफ़ॉल्ट कंटेनर `ctx.element` (वर्तमान सेल) में रेंडर करें, बार-बार रेंडर करने पर Root का पुन: उपयोग होगा और कंटेनर की मौजूदा सामग्री को ओवरराइट कर दिया जाएगा।

## एडिटर और स्निपेट्स

JS Column का स्क्रिप्ट एडिटर सिंटैक्स हाइलाइटिंग, त्रुटि संकेतों और बिल्ट-इन कोड स्निपेट्स (Snippets) का समर्थन करता है।

- `Snippets`: बिल्ट-इन कोड स्निपेट्स की सूची खोलें, जिसे आप खोज सकते हैं और एक क्लिक से वर्तमान कर्सर स्थिति पर डाल सकते हैं।
- `Run`: वर्तमान कोड को सीधे चलाएं, रन लॉग नीचे `Logs` पैनल में आउटपुट होते हैं, जो `console.log/info/warn/error` और त्रुटि हाइलाइटिंग का समर्थन करते हैं।

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

कोड जनरेट करने के लिए AI कर्मचारी के साथ जोड़ा जा सकता है:

- [AI कर्मचारी · Nathan: फ्रंटएंड इंजीनियर](/ai-employees/features/built-in-employee)

## सामान्य उपयोग

### 1) बुनियादी रेंडरिंग (वर्तमान पंक्ति रिकॉर्ड पढ़ना)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) React कंपोनेंट्स को रेंडर करने के लिए JSX का उपयोग करना

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) सेल में पॉपअप/ड्रॉअर खोलना (देखना/संपादित करना)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>देखें</a>
);
```

### 4) थर्ड-पार्टी लाइब्रेरी लोड करना (AMD/UMD या ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## ध्यान दें

- बाहरी लाइब्रेरी लोड करने के लिए विश्वसनीय CDN का उपयोग करने का सुझाव दिया जाता है, और विफलता के परिदृश्यों के लिए बैकअप तैयार रखें (जैसे `if (!lib) return;`)।
- चयनकर्ताओं (selectors) के लिए `class` या `[name=...]` को प्राथमिकता देने का सुझाव दिया जाता है, निश्चित `id` के उपयोग से बचें ताकि कई ब्लॉक/पॉपअप में `id` के दोहराव को रोका जा सके।
- इवेंट क्लीनअप: तालिका की पंक्तियाँ पेजिंग/रिफ्रेश के साथ गतिशील रूप से बदल सकती हैं, और सेल कई बार रेंडर होंगे। इवेंट बाइंड करने से पहले उन्हें साफ़ करना या डुप्लीकेशन हटाना चाहिए ताकि बार-बार ट्रिगर होने से बचा जा सके।
- प्रदर्शन सुझाव: प्रत्येक सेल में बड़ी लाइब्रेरीज़ को बार-बार लोड करने से बचें; लाइब्रेरी को ऊपरी स्तर पर (जैसे वैश्विक चर या तालिका-स्तरीय चर के माध्यम से) कैश किया जाना चाहिए और फिर पुन: उपयोग किया जाना चाहिए।