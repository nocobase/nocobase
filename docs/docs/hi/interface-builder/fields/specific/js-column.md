:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# जेएस कॉलम

## परिचय

जेएस कॉलम का उपयोग तालिकाओं में "कस्टम कॉलम" के लिए किया जाता है, जो जावास्क्रिप्ट के माध्यम से प्रत्येक पंक्ति के सेल की सामग्री को रेंडर करता है। यह किसी विशिष्ट फ़ील्ड से बंधा नहीं है और व्युत्पन्न कॉलम, फ़ील्ड्स में संयुक्त प्रदर्शन, स्टेटस बैज, एक्शन बटन और रिमोट डेटा एग्रीगेशन जैसे परिदृश्यों के लिए उपयुक्त है।

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## रनटाइम कॉन्टेक्स्ट API

जेएस कॉलम के प्रत्येक सेल को रेंडर करते समय, आप निम्नलिखित कॉन्टेक्स्ट API का उपयोग कर सकते हैं:

- `ctx.element`: वर्तमान सेल का DOM कंटेनर (ElementProxy), जो `innerHTML`, `querySelector`, `addEventListener` आदि को सपोर्ट करता है।
- `ctx.record`: वर्तमान पंक्ति का रिकॉर्ड ऑब्जेक्ट (केवल पढ़ने के लिए)।
- `ctx.recordIndex`: वर्तमान पृष्ठ के भीतर पंक्ति इंडेक्स (0 से शुरू होता है, पेजिंग से प्रभावित हो सकता है)।
- `ctx.collection`: तालिका से बंधे **संग्रह** का मेटाडेटा (केवल पढ़ने के लिए)।
- `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को अतुल्यकालिक रूप से लोड करता है।
- `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को गतिशील रूप से इम्पोर्ट करता है।
- `ctx.openView(options)`: एक कॉन्फ़िगर किए गए व्यू (मॉडल/ड्रॉअर/पेज) को खोलता है।
- `ctx.i18n.t()` / `ctx.t()`: अंतर्राष्ट्रीयकरण।
- `ctx.onRefReady(ctx.ref, cb)`: कंटेनर तैयार होने के बाद रेंडर करता है।
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX रेंडरिंग और समय-संबंधित उपयोगिताओं के लिए बिल्ट-इन React, ReactDOM, Ant Design, Ant Design आइकन और dayjs लाइब्रेरीज़। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` संगतता के लिए रखे गए हैं।)
- `ctx.render(vnode)`: एक React एलिमेंट/HTML/DOM को डिफ़ॉल्ट कंटेनर `ctx.element` (वर्तमान सेल) में रेंडर करता है। कई बार रेंडर करने पर रूट का पुन: उपयोग होगा और कंटेनर की मौजूदा सामग्री को ओवरराइट कर दिया जाएगा।

## एडिटर और स्निपेट्स

जेएस कॉलम का स्क्रिप्ट एडिटर सिंटैक्स हाइलाइटिंग, त्रुटि संकेत और बिल्ट-इन कोड स्निपेट्स को सपोर्ट करता है।

- `Snippets`: बिल्ट-इन कोड स्निपेट्स की सूची खोलता है, जिससे आप खोज सकते हैं और एक क्लिक से उन्हें वर्तमान कर्सर स्थिति पर इन्सर्ट कर सकते हैं।
- `Run`: वर्तमान कोड को सीधे चलाता है। निष्पादन लॉग नीचे `Logs` पैनल में आउटपुट होता है, जो `console.log/info/warn/error` और त्रुटि हाइलाइटिंग को सपोर्ट करता है।

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

आप कोड जनरेट करने के लिए एआई कर्मचारी का भी उपयोग कर सकते हैं:

- [एआई कर्मचारी · नाथन: फ्रंटएंड इंजीनियर](/ai-employees/built-in/ai-coding)

## सामान्य उपयोग

### 1) बेसिक रेंडरिंग (वर्तमान पंक्ति रिकॉर्ड पढ़ना)

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

### 3) सेल से मॉडल/ड्रॉअर खोलना (देखना/संपादित करना)

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

### 4) थर्ड-पार्टी लाइब्रेरीज़ लोड करना (AMD/UMD या ESM)

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

- बाहरी लाइब्रेरीज़ लोड करने के लिए विश्वसनीय CDN का उपयोग करने की सलाह दी जाती है और विफलता के परिदृश्यों के लिए एक फ़ॉलबैक (जैसे `if (!lib) return;`) तैयार रखना चाहिए।
- यह सलाह दी जाती है कि निश्चित `id` के बजाय `class` या `[name=...]` सेलेक्टर का उपयोग करें, ताकि कई ब्लॉक्स या मॉडल्स में `id` के दोहराव से बचा जा सके।
- इवेंट क्लीनअप: तालिका की पंक्तियाँ पेजिंग या रीफ़्रेश के साथ गतिशील रूप से बदल सकती हैं, जिससे सेल कई बार रेंडर होते हैं। इवेंट्स को बाइंड करने से पहले आपको उन्हें क्लीनअप या डुप्लीकेशन हटाना चाहिए ताकि बार-बार ट्रिगर होने से बचा जा सके।
- प्रदर्शन संबंधी सुझाव: प्रत्येक सेल में बड़ी लाइब्रेरीज़ को बार-बार लोड करने से बचें। इसके बजाय, लाइब्रेरी को उच्च स्तर पर (जैसे ग्लोबल वेरिएबल या तालिका-स्तरीय वेरिएबल के माध्यम से) कैश करें और उसका पुन: उपयोग करें।