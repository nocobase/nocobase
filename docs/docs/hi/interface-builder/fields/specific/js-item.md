:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/interface-builder/fields/specific/js-item) देखें।
:::

# JS Item

## परिचय

JS Item का उपयोग फ़ॉर्म में "कस्टम आइटम" (गैर-फ़ील्ड बाइंडिंग) के लिए किया जाता है। आप JavaScript/JSX का उपयोग करके किसी भी सामग्री (सुझाव, आँकड़े, पूर्वावलोकन, बटन आदि) को रेंडर कर सकते हैं और फ़ॉर्म, रिकॉर्ड संदर्भ के साथ इंटरैक्ट कर सकते हैं, जो रीयल-टाइम पूर्वावलोकन, निर्देशात्मक सुझावों, छोटे इंटरैक्टिव घटकों आदि जैसे परिदृश्यों के लिए उपयुक्त है।

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## रनटाइम संदर्भ एपीआई (सामान्यतः उपयोग किए जाने वाले)

- `ctx.element`: वर्तमान आइटम का DOM कंटेनर (ElementProxy), जो `innerHTML`, `querySelector`, `addEventListener` आदि का समर्थन करता है;
- `ctx.form`: AntD Form इंस्टेंस, जिससे `getFieldValue / getFieldsValue / setFieldsValue / validateFields` आदि किया जा सकता है;
- `ctx.blockModel`: वह फ़ॉर्म ब्लॉक मॉडल जिसमें यह स्थित है, लिंकेज लागू करने के लिए `formValuesChange` को सुन सकता है;
- `ctx.record` / `ctx.collection`: वर्तमान रिकॉर्ड और संग्रह (collection) मेटा-जानकारी (कुछ परिदृश्यों में उपलब्ध);
- `ctx.requireAsync(url)`: URL के माध्यम से AMD/UMD लाइब्रेरी को एसिंक्रोनस रूप से लोड करें;
- `ctx.importAsync(url)`: URL के माध्यम से ESM मॉड्यूल को डायनामिक रूप से इम्पोर्ट करें;
- `ctx.openView(viewUid, options)`: कॉन्फ़िगर किए गए व्यू (ड्रॉअर/डायलॉग/पेज) को खोलें;
- `ctx.message` / `ctx.notification`: वैश्विक संदेश और सूचनाएं;
- `ctx.t()` / `ctx.i18n.t()`: अंतर्राष्ट्रीयकरण;
- `ctx.onRefReady(ctx.ref, cb)`: कंटेनर तैयार होने के बाद रेंडर करें;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: JSX रेंडरिंग, समय प्रसंस्करण, डेटा संचालन और गणितीय गणनाओं के लिए अंतर्निहित React / ReactDOM / Ant Design / Ant Design आइकन / dayjs / lodash / math.js / formula.js आदि सामान्य लाइब्रेरीज़। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` अभी भी संगतता के लिए रखे गए हैं।)
- `ctx.render(vnode)`: React एलिमेंट/HTML/DOM को डिफ़ॉल्ट कंटेनर `ctx.element` में रेंडर करें; बार-बार रेंडर करने पर Root का पुन: उपयोग होगा और कंटेनर की मौजूदा सामग्री को बदल दिया जाएगा।

## एडिटर और स्निपेट्स

- `Snippets`: अंतर्निहित कोड स्निपेट्स की सूची खोलें, जिन्हें खोजा जा सकता है और एक क्लिक से वर्तमान कर्सर स्थिति पर डाला जा सकता है।
- `Run`: वर्तमान कोड को सीधे चलाएँ और रन लॉग को नीचे `Logs` पैनल में आउटपुट करें; `console.log/info/warn/error` और त्रुटि हाइलाइटिंग का समर्थन करता है।

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- स्क्रिप्ट बनाने/संशोधित करने के लिए एआई कर्मचारी के साथ जोड़ा जा सकता है: [AI कर्मचारी · Nathan: फ्रंटएंड इंजीनियर](/ai-employees/features/built-in-employee)

## सामान्य उपयोग (सरलीकृत उदाहरण)

### 1) रीयल-टाइम पूर्वावलोकन (फ़ॉर्म मान पढ़ना)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) व्यू खोलें (ड्रॉअर)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) बाहरी लाइब्रेरी लोड करें और रेंडर करें

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

##注意事项 (ध्यान दें)

- बाहरी लाइब्रेरी लोड करने के लिए विश्वसनीय CDN का उपयोग करने का सुझाव दिया जाता है, और विफलता के मामलों के लिए बैकअप तैयार रखना चाहिए (जैसे `if (!lib) return;`)।
- चयनकर्ताओं (selectors) के लिए `class` या `[name=...]` को प्राथमिकता देने का सुझाव दिया जाता है, और निश्चित `id` के उपयोग से बचें ताकि कई ब्लॉक/पॉपअप में `id` दोहराई न जाए।
- इवेंट क्लीनअप: फ़ॉर्म मानों में बार-बार होने वाले बदलाव कई बार रेंडरिंग ट्रिगर करेंगे, इसलिए इवेंट बाइंड करने से पहले उन्हें साफ़ करना या डुप्लिकेट रोकना चाहिए (जैसे पहले `remove` फिर `add`, या `{ once: true }`, या डुप्लिकेट रोकने के लिए `dataset` मार्क)।

## संबंधित दस्तावेज़

- [वेरिएबल्स और संदर्भ](/interface-builder/variables)
- [लिंकेज नियम](/interface-builder/linkage-rule)
- [व्यू और पॉपअप](/interface-builder/actions/types/view)