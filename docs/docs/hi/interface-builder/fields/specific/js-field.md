:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# JS फ़ील्ड

## परिचय

JS फ़ील्ड का उपयोग JavaScript का इस्तेमाल करके किसी फ़ील्ड की जगह पर सामग्री को कस्टम रूप से रेंडर करने के लिए किया जाता है। यह आमतौर पर विवरण ब्लॉक, फ़ॉर्म में केवल-पढ़ने वाले आइटम या तालिका कॉलम में "अन्य कस्टम आइटम" के रूप में उपयोग किया जाता है। यह व्यक्तिगत प्रदर्शन, व्युत्पन्न जानकारी के संयोजन, स्थिति बैज, रिच टेक्स्ट या चार्ट आदि को रेंडर करने के लिए उपयुक्त है।

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## प्रकार

- **केवल-पढ़ने वाला प्रकार**: इसका उपयोग गैर-संपादन योग्य प्रदर्शन के लिए किया जाता है, यह आउटपुट को रेंडर करने के लिए `ctx.value` को पढ़ता है।
- **संपादन योग्य प्रकार**: इसका उपयोग कस्टम इनपुट इंटरैक्शन के लिए किया जाता है। यह `ctx.getValue()`/`ctx.setValue(v)` और एक कंटेनर इवेंट `js-field:value-change` प्रदान करता है, जिससे फ़ॉर्म मानों के साथ दो-तरफ़ा सिंक्रनाइज़ेशन आसान हो जाता है।

## उपयोग के मामले

- **केवल-पढ़ने वाला प्रकार**
  - **विवरण ब्लॉक**: गणना परिणाम, स्थिति बैज, रिच टेक्स्ट स्निपेट, चार्ट आदि जैसी केवल-पढ़ने वाली सामग्री प्रदर्शित करें।
  - **तालिका ब्लॉक**: केवल-पढ़ने वाले प्रदर्शन के लिए "अन्य कस्टम कॉलम > JS फ़ील्ड" के रूप में उपयोग किया जाता है (यदि आपको किसी फ़ील्ड से बंधे हुए कॉलम की आवश्यकता नहीं है, तो कृपया JS कॉलम का उपयोग करें)।

- **संपादन योग्य प्रकार**
  - **फ़ॉर्म ब्लॉक (CreateForm/EditForm)**: कस्टम इनपुट नियंत्रण या मिश्रित इनपुट के लिए उपयोग किया जाता है, जो फ़ॉर्म के साथ मान्य और सबमिट किए जाते हैं।
  - **इन परिदृश्यों के लिए उपयुक्त**: बाहरी लाइब्रेरी इनपुट घटक, रिच टेक्स्ट/कोड एडिटर, जटिल गतिशील घटक आदि।

## रनटाइम कॉन्टेक्स्ट API

JS फ़ील्ड रनटाइम कोड सीधे निम्नलिखित कॉन्टेक्स्ट क्षमताओं का उपयोग कर सकता है:

- `ctx.element`: फ़ील्ड का DOM कंटेनर (ElementProxy), `innerHTML`, `querySelector`, `addEventListener` आदि को सपोर्ट करता है।
- `ctx.value`: वर्तमान फ़ील्ड मान (केवल-पढ़ने वाला)।
- `ctx.record`: वर्तमान रिकॉर्ड ऑब्जेक्ट (केवल-पढ़ने वाला)।
- `ctx.collection`: फ़ील्ड जिस **संग्रह** से संबंधित है, उसका मेटाडेटा (केवल-पढ़ने वाला)।
- `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को अतुल्यकालिक रूप से लोड करें।
- `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को गतिशील रूप से इम्पोर्ट करें।
- `ctx.openView(options)`: एक कॉन्फ़िगर किए गए व्यू (पॉपअप/ड्रॉअर/पेज) को खोलें।
- `ctx.i18n.t()` / `ctx.t()`: अंतर्राष्ट्रीयकरण।
- `ctx.onRefReady(ctx.ref, cb)`: कंटेनर तैयार होने के बाद रेंडर करें।
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX रेंडरिंग और समय-संबंधित उपयोगिताओं के लिए बिल्ट-इन React, ReactDOM, Ant Design, Ant Design आइकन और dayjs लाइब्रेरीज़। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` संगतता के लिए रखे गए हैं।)
- `ctx.render(vnode)`: एक React एलिमेंट, HTML स्ट्रिंग, या DOM नोड को डिफ़ॉल्ट कंटेनर `ctx.element` में रेंडर करता है। बार-बार रेंडर करने से रूट का पुन: उपयोग होगा, और कंटेनर की मौजूदा सामग्री ओवरराइट हो जाएगी।

संपादन योग्य प्रकार (JSEditableField) के लिए विशिष्ट:

- `ctx.getValue()`: वर्तमान फ़ॉर्म मान प्राप्त करें (फ़ॉर्म स्थिति को प्राथमिकता देता है, फिर फ़ील्ड प्रॉप्स पर वापस आता है)।
- `ctx.setValue(v)`: फ़ॉर्म मान और फ़ील्ड प्रॉप्स सेट करें, दो-तरफ़ा सिंक्रनाइज़ेशन बनाए रखें।
- कंटेनर इवेंट `js-field:value-change`: जब कोई बाहरी मान बदलता है तो ट्रिगर होता है, जिससे स्क्रिप्ट के लिए इनपुट डिस्प्ले को अपडेट करना आसान हो जाता है।

## एडिटर और स्निपेट

JS फ़ील्ड का स्क्रिप्ट एडिटर सिंटैक्स हाइलाइटिंग, त्रुटि संकेत और बिल्ट-इन कोड स्निपेट्स को सपोर्ट करता है।

- `Snippets`: बिल्ट-इन कोड स्निपेट्स की सूची खोलता है, जिसे खोजा जा सकता है और एक क्लिक से वर्तमान कर्सर स्थिति पर डाला जा सकता है।
- `Run`: वर्तमान कोड को सीधे निष्पादित करता है। निष्पादन लॉग नीचे `Logs` पैनल में आउटपुट होता है, जो `console.log/info/warn/error` और आसान स्थान के लिए त्रुटि हाइलाइटिंग को सपोर्ट करता है।

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

आप AI कर्मचारी के साथ मिलकर कोड जनरेट कर सकते हैं:

- [AI कर्मचारी · नाथन: फ़्रंटएंड इंजीनियर](/ai-employees/built-in/ai-coding)

## सामान्य उपयोग

### 1) मूल रेंडरिंग (फ़ील्ड मान पढ़ना)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) React घटक को रेंडर करने के लिए JSX का उपयोग करना

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) थर्ड-पार्टी लाइब्रेरीज़ लोड करना (AMD/UMD या ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) पॉपअप/ड्रॉअर खोलने के लिए क्लिक करना (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">विवरण देखें</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) संपादन योग्य इनपुट (JSEditableFieldModel)

```js
// JSX का उपयोग करके एक साधारण इनपुट को रेंडर करें और फ़ॉर्म मान को सिंक्रनाइज़ करें
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// जब बाहरी मान बदलता है तो इनपुट को सिंक्रनाइज़ करें (वैकल्पिक)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## ध्यान दें

- बाहरी लाइब्रेरीज़ लोड करने के लिए विश्वसनीय CDN का उपयोग करने की सलाह दी जाती है, और विफलता के मामलों के लिए फ़ॉलबैक तैयार रखें (जैसे `if (!lib) return;`)।
- चयनकर्ताओं के लिए `class` या `[name=...]` का उपयोग करने को प्राथमिकता देने की सलाह दी जाती है, और निश्चित `id` का उपयोग करने से बचें ताकि कई ब्लॉक/पॉपअप में `id` के दोहराव को रोका जा सके।
- इवेंट क्लीनअप: डेटा परिवर्तन या व्यू स्विच के कारण फ़ील्ड कई बार फिर से रेंडर हो सकता है। किसी इवेंट को बाइंड करने से पहले, आपको उसे साफ़ करना या डुप्लीकेशन हटाना चाहिए ताकि बार-बार ट्रिगर होने से बचा जा सके। आप "पहले हटाएँ फिर जोड़ें" का उपयोग कर सकते हैं।