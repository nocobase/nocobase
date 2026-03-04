:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/import-modules) देखें।
:::

# मॉड्यूल इम्पोर्ट करना

RunJS में आप दो प्रकार के मॉड्यूल का उपयोग कर सकते हैं: **इन-बिल्ट मॉड्यूल** (बिना किसी import के `ctx.libs` के माध्यम से सीधे उपयोग किए जाते हैं) और **बाहरी मॉड्यूल** (`ctx.importAsync()` या `ctx.requireAsync()` के माध्यम से आवश्यकतानुसार लोड किए जाते हैं)।

---

## इन-बिल्ट मॉड्यूल - ctx.libs (इम्पोर्ट की आवश्यकता नहीं है)

RunJS में कई इन-बिल्ट लाइब्रेरी शामिल हैं जिन्हें सीधे `ctx.libs` के माध्यम से एक्सेस किया जा सकता है। इनके लिए आपको `import` या एसिंक्रोनस लोडिंग का उपयोग करने की **आवश्यकता नहीं** है।

| प्रॉपर्टी | विवरण |
|------|------|
| **ctx.libs.React** | React कोर, JSX और Hooks के लिए उपयोग किया जाता है |
| **ctx.libs.ReactDOM** | ReactDOM (इसका उपयोग `createRoot` आदि के लिए किया जा सकता है) |
| **ctx.libs.antd** | Ant Design कंपोनेंट लाइब्रेरी |
| **ctx.libs.antdIcons** | Ant Design आइकन |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): गणितीय व्यंजक (expressions), मैट्रिक्स गणना आदि। |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel जैसे फ़ॉर्मूले (SUM, AVERAGE आदि) |

### उदाहरण: React और antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>क्लिक करें</Button>);
```

### उदाहरण: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### उदाहरण: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## बाहरी मॉड्यूल

जब आपको थर्ड-पार्टी लाइब्रेरी की आवश्यकता हो, तो मॉड्यूल फॉर्मेट के आधार पर लोडिंग विधि चुनें:

- **ESM मॉड्यूल** → `ctx.importAsync()` का उपयोग करें
- **UMD/AMD मॉड्यूल** → `ctx.requireAsync()` का उपयोग करें

---

### ESM मॉड्यूल इम्पोर्ट करना

URL द्वारा ESM मॉड्यूल को डायनामिक रूप से लोड करने के लिए **`ctx.importAsync()`** का उपयोग करें। यह JS ब्लॉक, JS फ़ील्ड और JS एक्शन जैसे परिदृश्यों के लिए उपयुक्त है।

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: ESM मॉड्यूल का पता। यह शॉर्टहैंड फॉर्मेट जैसे `<package>@<version>` या सब-पाथ जैसे `<package>@<version>/<file-path>` (जैसे `vue@3.4.0`, `lodash@4/lodash.js`) को सपोर्ट करता है। यह कॉन्फ़िगर किए गए CDN प्रीफ़िक्स के साथ जुड़ जाएगा; पूर्ण URL भी समर्थित हैं।
- **रिटर्न**: रिज़ॉल्व किया गया मॉड्यूल नेमस्पेस ऑब्जेक्ट।

#### डिफ़ॉल्ट रूप से https://esm.sh

यदि अन्यथा कॉन्फ़िगर नहीं किया गया है, तो शॉर्टहैंड फॉर्म CDN प्रीफ़िक्स के रूप में **https://esm.sh** का उपयोग करेंगे। उदाहरण के लिए:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// यह https://esm.sh/vue@3.4.0 से लोड करने के बराबर है
```

#### स्वयं-होस्ट की गई esm.sh सेवा

यदि आपको आंतरिक नेटवर्क या स्वयं-निर्मित CDN की आवश्यकता है, तो आप esm.sh प्रोटोकॉल के साथ संगत सेवा तैनात कर सकते हैं और एनवायरनमेंट वेरिएबल्स के माध्यम से इसे निर्दिष्ट कर सकते हैं:

- **ESM_CDN_BASE_URL**: ESM CDN का बेस एड्रेस (डिफ़ॉल्ट `https://esm.sh`)
- **ESM_CDN_SUFFIX**: वैकल्पिक सफ़िक्स (जैसे jsDelivr के लिए `/+esm`)

स्वयं-होस्टिंग के लिए, इसे देखें: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### UMD/AMD मॉड्यूल इम्पोर्ट करना

UMD/AMD मॉड्यूल या ग्लोबल ऑब्जेक्ट से जुड़ने वाली स्क्रिप्ट को एसिंक्रोनस रूप से लोड करने के लिए **`ctx.requireAsync()`** का उपयोग करें।

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: यह दो रूपों का समर्थन करता है:
  - **शॉर्टहैंड पाथ**: `<package>@<version>/<file-path>`, `ctx.importAsync()` के समान, वर्तमान ESM CDN कॉन्फ़िगरेशन के अनुसार रिज़ॉल्व किया गया। रिज़ॉल्व करते समय, रॉ फ़ाइल (आमतौर पर UMD बिल्ड) का सीधे अनुरोध करने के लिए `?raw` जोड़ा जाता है। उदाहरण के लिए, `echarts@5/dist/echarts.min.js` वास्तव में `https://esm.sh/echarts@5/dist/echarts.min.js?raw` का अनुरोध करता है (जब डिफ़ॉल्ट रूप से esm.sh का उपयोग किया जा रहा हो)।
  - **पूर्ण URL**: किसी भी CDN का पूरा पता (जैसे `https://cdn.jsdelivr.net/npm/xxx`)।
- **रिटर्न**: लोड किया गया लाइब्रेरी ऑब्जेक्ट (विशिष्ट रूप इस बात पर निर्भर करता है कि लाइब्रेरी अपने कंटेंट को कैसे एक्सपोर्ट करती है)।

लोड होने के बाद, कई UMD लाइब्रेरी ग्लोबल ऑब्जेक्ट (जैसे `window.xxx`) से जुड़ जाती हैं। आप उस लाइब्रेरी के दस्तावेज़ों के अनुसार उनका उपयोग कर सकते हैं।

**उदाहरण**

```ts
// शॉर्टहैंड पाथ (esm.sh के माध्यम से ...?raw के रूप में रिज़ॉल्व किया गया)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// पूर्ण URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**नोट**: यदि कोई लाइब्रेरी ESM वर्ज़न भी प्रदान करती है, तो बेहतर मॉड्यूल सिमेंटिक्स और Tree-shaking के लिए `ctx.importAsync()` का उपयोग करना बेहतर है।