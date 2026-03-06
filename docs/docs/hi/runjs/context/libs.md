:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/libs) देखें।
:::

# ctx.libs

`ctx.libs` RunJS में बिल्ट-इन लाइब्रेरीज़ के लिए एक एकीकृत नेमस्पेस (unified namespace) है, जिसमें React, Ant Design, dayjs और lodash जैसी सामान्य लाइब्रेरीज़ शामिल हैं। **किसी `import` या एसिंक्रोनस लोडिंग की आवश्यकता नहीं है**; इन्हें सीधे `ctx.libs.xxx` के माध्यम से उपयोग किया जा सकता है।

## उपयोग के मामले (Use Cases)

| परिदृश्य (Scenario) | विवरण |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | UI रेंडर करने के लिए React + Ant Design, दिनांक (date) हैंडलिंग के लिए dayjs, और डेटा प्रोसेसिंग के लिए lodash का उपयोग करें। |
| **फ़ॉर्मूला / गणना** | Excel जैसे फ़ॉर्मूला और गणितीय अभिव्यक्तियों (mathematical expressions) के लिए formula या math का उपयोग करें। |
| **वर्कफ़्लो / लिंकेज नियम** | शुद्ध लॉजिक वाले परिदृश्यों में lodash, dayjs और formula जैसी यूटिलिटी लाइब्रेरीज़ को कॉल करें। |

## बिल्ट-इन लाइब्रेरीज़ का अवलोकन

| प्रॉपर्टी | विवरण | दस्तावेज़ |
|------|------|------|
| `ctx.libs.React` | React कोर, JSX और Hooks के लिए उपयोग किया जाता है | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM क्लाइंट API (`createRoot` सहित), रेंडरिंग के लिए React के साथ उपयोग किया जाता है | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design कॉम्पोनेंट लाइब्रेरी (Button, Card, Table, Form, Input, Modal, आदि) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design आइकन लाइब्रेरी (जैसे PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | दिनांक और समय यूटिलिटी लाइब्रेरी | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | यूटिलिटी लाइब्रेरी (get, set, debounce, आदि) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel जैसी फ़ॉर्मूला फ़ंक्शन लाइब्रेरी (SUM, AVERAGE, IF, आदि) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | गणितीय अभिव्यक्ति और गणना लाइब्रेरी | [Math.js](https://mathjs.org/docs/) |

## टॉप-लेवल उपनाम (Top-level Aliases)

पुराने कोड के साथ संगतता (compatibility) के लिए, कुछ लाइब्रेरीज़ टॉप लेवल पर भी उपलब्ध हैं: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, और `ctx.dayjs` । बेहतर रखरखाव और दस्तावेज़ खोजने में आसानी के लिए **लगातार `ctx.libs.xxx` का उपयोग करने की अनुशंसा की जाती है**।

## लेज़ी लोडिंग (Lazy Loading)

`lodash`, `formula`, और `math` **लेज़ी लोडिंग (lazy loading)** का उपयोग करते हैं: पहली बार `ctx.libs.lodash` एक्सेस करने पर ही डायनेमिक इम्पोर्ट ट्रिगर होता है, और उसके बाद कैश का पुन: उपयोग किया जाता है। `React`, `antd`, `dayjs`, और `antdIcons` कॉन्टेक्स्ट द्वारा पहले से कॉन्फ़िगर किए गए हैं और तुरंत उपलब्ध हैं।

## उदाहरण

### React और Ant Design के साथ रेंडरिंग

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="शीर्षक">
    <Button type="primary">क्लिक करें</Button>
  </Card>
);
```

### Hooks का उपयोग करना

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### आइकन का उपयोग करना

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>उपयोगकर्ता</Button>);
```

### dayjs के साथ दिनांक प्रोसेसिंग

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### lodash यूटिलिटी फ़ंक्शन

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### फ़ॉर्मूला गणना (Formula Calculations)

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### math.js के साथ गणितीय अभिव्यक्तियाँ

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## महत्वपूर्ण बातें

- **ctx.importAsync के साथ मिलाना**: यदि `ctx.importAsync('react@19')` के माध्यम से एक बाहरी React लोड किया गया है, तो JSX उस इंस्टेंस का उपयोग करेगा। इस मामले में, इसे `ctx.libs.antd` के साथ **न मिलाएं**। Ant Design को उस React वर्ज़न के साथ मेल खाने के लिए लोड किया जाना चाहिए (जैसे `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`)।
- **एकाधिक React इंस्टेंस**: यदि "Invalid hook call" त्रुटि आती है या hook dispatcher नल (null) है, तो यह आमतौर पर कई React इंस्टेंस के कारण होता है। `ctx.libs.React` को पढ़ने या Hooks को कॉल करने से पहले, यह सुनिश्चित करने के लिए कि पेज के साथ वही React इंस्टेंस साझा किया गया है, पहले `await ctx.importAsync('react@version')` निष्पादित करें।

## संबंधित

- [ctx.importAsync()](./import-async.md) - मांग पर बाहरी ESM मॉड्यूल लोड करें (जैसे React, Vue के विशिष्ट वर्ज़न)
- [ctx.render()](./render.md) - कंटेनर में सामग्री रेंडर करें