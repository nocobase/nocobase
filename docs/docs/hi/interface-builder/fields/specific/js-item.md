:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# जेएस आइटम

## परिचय

जेएस आइटम का उपयोग फ़ॉर्म में 'कस्टम आइटम' (जो किसी फ़ील्ड से बंधे नहीं होते) के लिए किया जाता है। आप JavaScript/JSX का उपयोग करके कोई भी सामग्री (जैसे सुझाव, आँकड़े, पूर्वावलोकन, बटन आदि) प्रस्तुत कर सकते हैं और फ़ॉर्म व रिकॉर्ड संदर्भ के साथ इंटरैक्ट कर सकते हैं। यह रीयल-टाइम पूर्वावलोकन, निर्देशात्मक सुझाव और छोटे इंटरैक्टिव घटकों जैसे परिदृश्यों के लिए उपयुक्त है।

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## रनटाइम संदर्भ एपीआई (सामान्यतः उपयोग किए जाने वाले)

-   `ctx.element`: वर्तमान आइटम का DOM कंटेनर (ElementProxy), जो `innerHTML`, `querySelector`, `addEventListener` आदि का समर्थन करता है;
-   `ctx.form`: AntD फ़ॉर्म इंस्टेंस, जो `getFieldValue / getFieldsValue / setFieldsValue / validateFields` आदि ऑपरेशंस की अनुमति देता है;
-   `ctx.blockModel`: उस फ़ॉर्म ब्लॉक का मॉडल जिससे यह संबंधित है, जो लिंकेज लागू करने के लिए `formValuesChange` को सुन सकता है;
-   `ctx.record` / `ctx.collection`: वर्तमान रिकॉर्ड और संग्रह मेटा-जानकारी (कुछ परिदृश्यों में उपलब्ध);
-   `ctx.requireAsync(url)`: URL द्वारा AMD/UMD लाइब्रेरी को अतुल्यकालिक रूप से लोड करें;
-   `ctx.importAsync(url)`: URL द्वारा ESM मॉड्यूल को गतिशील रूप से इम्पोर्ट करें;
-   `ctx.openView(viewUid, options)`: एक कॉन्फ़िगर किए गए व्यू (ड्रॉअर/डायलॉग/पेज) को खोलें;
-   `ctx.message` / `ctx.notification`: वैश्विक संदेश और सूचना;
-   `ctx.t()` / `ctx.i18n.t()`: अंतर्राष्ट्रीयकरण;
-   `ctx.onRefReady(ctx.ref, cb)`: कंटेनर तैयार होने के बाद रेंडर करें;
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX रेंडरिंग और दिनांक-समय उपयोगिताओं के लिए अंतर्निहित React, ReactDOM, Ant Design, Ant Design आइकन और dayjs लाइब्रेरीज़। (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` संगतता के लिए रखे गए हैं।);
-   `ctx.render(vnode)`: एक React एलिमेंट/HTML/DOM को डिफ़ॉल्ट कंटेनर `ctx.element` में रेंडर करता है; कई रेंडरिंग रूट का पुन: उपयोग करेंगे और कंटेनर की मौजूदा सामग्री को अधिलेखित कर देंगे।

## एडिटर और स्निपेट्स

-   `Snippets`: अंतर्निहित कोड स्निपेट्स की सूची खोलता है, जिससे आप उन्हें खोज सकते हैं और एक क्लिक से वर्तमान कर्सर स्थिति पर इन्सर्ट कर सकते हैं।
-   `Run`: वर्तमान कोड को सीधे निष्पादित करता है और निष्पादन लॉग को नीचे के `Logs` पैनल में आउटपुट करता है; यह `console.log/info/warn/error` और त्रुटि हाइलाइटिंग का समर्थन करता है।

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

-   स्क्रिप्ट बनाने/संशोधित करने के लिए एआई कर्मचारी के साथ उपयोग किया जा सकता है: [एआई कर्मचारी · नाथन: फ्रंटएंड इंजीनियर](/ai-employees/built-in/ai-coding)

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

### 2) एक व्यू खोलें (ड्रॉअर)

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

### 3) बाहरी लाइब्रेरीज़ लोड और रेंडर करें

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## ध्यान दें

-   बाहरी लाइब्रेरीज़ लोड करने के लिए विश्वसनीय CDN का उपयोग करने की सलाह दी जाती है, और विफलता के परिदृश्यों के लिए एक फ़ॉलबैक (जैसे, `if (!lib) return;`) रखना चाहिए।
-   सेलेक्टर्स के लिए `class` या `[name=...]` का उपयोग करने को प्राथमिकता देने और कई ब्लॉकों/पॉपअप में डुप्लिकेट `id`s को रोकने के लिए निश्चित `id`s का उपयोग करने से बचने की सलाह दी जाती है।
-   इवेंट क्लीनअप: फ़ॉर्म मानों में बार-बार बदलाव कई रेंडरिंग को ट्रिगर करेगा। किसी इवेंट को बाइंड करने से पहले, उसे साफ़ किया जाना चाहिए या डुप्लिकेट होने से रोका जाना चाहिए (जैसे, `add` से पहले `remove` करें, `{ once: true }` का उपयोग करें, या डुप्लिकेट को रोकने के लिए `dataset` विशेषता का उपयोग करें)।

## संबंधित दस्तावेज़

-   [वेरिएबल्स और संदर्भ](/interface-builder/variables)
-   [लिंकेज नियम](/interface-builder/linkage-rule)
-   [व्यू और पॉपअप](/interface-builder/actions/types/view)