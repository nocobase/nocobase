:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/interface-builder/fields/specific/js-field) देखें।
:::

# JS Field

## परिचय

JS Field का उपयोग फ़ील्ड की स्थिति में JavaScript के साथ सामग्री को कस्टम रूप से रेंडर करने के लिए किया जाता है, जो आमतौर पर विवरण ब्लॉक (details blocks), फ़ॉर्म के केवल-पढ़ने वाले आइटम (read-only items), या तालिका कॉलम में "अन्य कस्टम आइटम" (other custom items) में देखा जाता है। यह व्यक्तिगत प्रदर्शन, व्युत्पन्न जानकारी के संयोजन, स्थिति बैज, रिच टेक्स्ट या चार्ट आदि को रेंडर करने के लिए उपयुक्त है।

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## प्रकार

- केवल-पढ़ने वाला प्रकार (Read-only): गैर-संपादन योग्य प्रदर्शन के लिए उपयोग किया जाता है, आउटपुट रेंडर करने के लिए `ctx.value` को पढ़ता है।
- संपादन योग्य प्रकार (Editable): कस्टम इनपुट इंटरैक्शन के लिए उपयोग किया जाता है, `ctx.getValue()`/`ctx.setValue(v)` और कंटेनर इवेंट `js-field:value-change` प्रदान करता है, जिससे फ़ॉर्म मानों के साथ दो-तरफ़ा सिंक्रनाइज़ेशन आसान हो जाता है।

## उपयोग के मामले

- केवल-पढ़ने वाला प्रकार
  - विवरण ब्लॉक (Details block): गणना परिणाम, स्थिति बैज, रिच टेक्स्ट स्निपेट, चार्ट आदि जैसी केवल-पढ़ने वाली सामग्री प्रदर्शित करें;
  - तालिका ब्लॉक (Table block): केवल-पढ़ने वाले प्रदर्शन के लिए "अन्य कस्टम कॉलम > JS Field" के रूप में उपयोग किया जाता है (यदि आपको किसी फ़ील्ड से नहीं जुड़े कॉलम की आवश्यकता है, तो कृपया JS Column का उपयोग करें);

- संपादन योग्य प्रकार
  - फ़ॉर्म ब्लॉक (CreateForm/EditForm): कस्टम इनपुट नियंत्रण या मिश्रित इनपुट के लिए उपयोग किया जाता है, जो फ़ॉर्म सत्यापन और सबमिशन के साथ चलते हैं;
  - उपयुक्त परिदृश्य: बाहरी लाइब्रेरी इनपुट घटक, रिच टेक्स्ट/कोड एडिटर, जटिल गतिशील घटक आदि;

## रनटाइम कॉन्टेक्स्ट API

JS Field रनटाइम कोड सीधे निम्नलिखित संदर्भ (context) क्षमताओं का उपयोग कर सकता है:

- `ctx.element`: फ़ील्ड का DOM कंटेनर (ElementProxy), `innerHTML`, `querySelector`, `addEventListener` आदि का समर्थन करता है;
- `ctx.value`: वर्तमान फ़ील्ड मान (केवल-पढ़ने वाला);
- `ctx.record`: वर्तमान रिकॉर्ड ऑब्जेक्ट (केवल-पढ़ने वाला);
- `ctx.collection`: फ़ील्ड जिस **संग्रह** (collection) से संबंधित है उसकी मेटा-जानकारी (केवल-पढ़ने वाला);
- `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को एसिंक्रोनस रूप से लोड करें;
- `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को गतिशील रूप से इम्पोर्ट करें;
- `ctx.openView(options)`: कॉन्फ़िगर किए गए व्यू (पॉपअप/ड्रॉअर/पेज) को खोलें;
- `ctx.i18n.t()` / `ctx.t()`: अंतर्राष्ट्रीयकरण;
- `ctx.onRefReady(ctx.ref, cb)`: कंटेनर तैयार होने के बाद रेंडर करें;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX रेंडरिंग, समय प्रसंस्करण, डेटा संचालन और गणितीय गणनाओं के लिए अंतर्निहित React / ReactDOM / Ant Design / Ant Design आइकन / dayjs / lodash / math.js / formula.js जैसी सामान्य लाइब्रेरीज़। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` अभी भी संगतता के लिए रखे गए हैं।)
- `ctx.render(vnode)`: React एलिमेंट, HTML स्ट्रिंग या DOM नोड को डिफ़ॉल्ट कंटेनर `ctx.element` में रेंडर करें; बार-बार रेंडर करने पर Root का पुन: उपयोग होगा और कंटेनर की मौजूदा सामग्री ओवरराइट हो जाएगी।

संपादन योग्य प्रकार (JSEditableField) के लिए विशिष्ट:

- `ctx.getValue()`: वर्तमान फ़ॉर्म मान प्राप्त करें (पहले फ़ॉर्म स्थिति का उपयोग करता है, फिर फ़ील्ड प्रॉप्स पर वापस आता है)।
- `ctx.setValue(v)`: फ़ॉर्म मान और फ़ील्ड प्रॉप्स सेट करें, दो-तरफ़ा सिंक्रनाइज़ेशन बनाए रखें।
- कंटेनर इवेंट `js-field:value-change`: बाहरी मान बदलने पर ट्रिगर होता है, जिससे स्क्रिप्ट के लिए इनपुट प्रदर्शन को अपडेट करना आसान हो जाता है।

## एडिटर और स्निपेट

JS Field का स्क्रिप्ट एडिटर सिंटैक्स हाइलाइटिंग, त्रुटि संकेत और अंतर्निहित कोड स्निपेट्स (Snippets) का समर्थन करता है।

- `Snippets`: अंतर्निहित कोड स्निपेट्स की सूची खोलें, जिसे खोजा जा सकता है और एक क्लिक से वर्तमान कर्सर स्थिति पर डाला जा सकता है।
- `Run`: वर्तमान कोड को सीधे चलाएँ, रन लॉग नीचे `Logs` पैनल में आउटपुट होते हैं, जो `console.log/info/warn/error` और त्रुटि हाइलाइटिंग स्थिति का समर्थन करते हैं।

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

कोड जनरेट करने के लिए AI कर्मचारी के साथ जोड़ा जा सकता है:

- [AI कर्मचारी · Nathan: फ़्रंटएंड इंजीनियर](/ai-employees/features/built-in-employee)

## सामान्य उपयोग

### 1) बुनियादी रेंडरिंग (फ़ील्ड मान पढ़ना)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) React घटक रेंडर करने के लिए JSX का उपयोग करना

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
ctx.element.innerHTML = `<a class="open-detail">查看详情</a>`;
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

- बाहरी लाइब्रेरी लोड करने के लिए विश्वसनीय CDN का उपयोग करने का सुझाव दिया जाता है, और विफलता के परिदृश्यों के लिए बैकअप तैयार रखें (जैसे `if (!lib) return;`)।
- चयनकर्ताओं (selectors) के लिए `class` या `[name=...]` को प्राथमिकता देने का सुझाव दिया जाता है, निश्चित `id` के उपयोग से बचें ताकि कई ब्लॉक/पॉपअप में `id` के दोहराव को रोका जा सके।
- इवेंट क्लीनअप: डेटा परिवर्तन या व्यू स्विच के कारण फ़ील्ड कई बार फिर से रेंडर हो सकता है, इवेंट बाइंड करने से पहले उन्हें साफ़ करना या डुप्लीकेशन हटाना चाहिए ताकि बार-बार ट्रिगर होने से बचा जा सके। आप "पहले remove करें फिर add करें" का उपयोग कर सकते हैं।