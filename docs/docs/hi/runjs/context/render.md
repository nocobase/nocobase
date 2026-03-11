:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/render) देखें।
:::

# ctx.render()

React तत्वों (elements), HTML स्ट्रिंग्स, या DOM नोड्स को एक निर्दिष्ट कंटेनर में रेंडर करता है। यदि `container` प्रदान नहीं किया गया है, तो यह डिफ़ॉल्ट रूप से `ctx.element` में रेंडर होता है और स्वचालित रूप से एप्लिकेशन के संदर्भ (context) जैसे कि ConfigProvider और थीम को इनहेरिट करता है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **JSBlock** | कस्टम ब्लॉक सामग्री (चार्ट, सूचियाँ, कार्ड आदि) रेंडर करें |
| **JSField / JSItem / JSColumn** | संपादन योग्य फ़ील्ड या टेबल कॉलम के लिए कस्टम डिस्प्ले रेंडर करें |
| **विवरण ब्लॉक (Details Block)** | विवरण पेजों में फ़ील्ड के प्रदर्शन प्रारूप को कस्टमाइज़ करें |

> ध्यान दें: `ctx.render()` को एक रेंडरिंग कंटेनर की आवश्यकता होती है। यदि `container` पास नहीं किया गया है और `ctx.element` मौजूद नहीं है (जैसे कि बिना UI वाले शुद्ध लॉजिक परिदृश्यों में), तो एक त्रुटि (error) आएगी।

## टाइप परिभाषा (Type Definition)

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| पैरामीटर | प्रकार | विवरण |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | रेंडर की जाने वाली सामग्री |
| `container` | `Element` \| `DocumentFragment` (वैकल्पिक) | रेंडरिंग लक्ष्य कंटेनर, डिफ़ॉल्ट `ctx.element` है |

**रिटर्न वैल्यू**:

- **React तत्व** रेंडर करते समय: `ReactDOMClient.Root` लौटाता है, जिससे बाद के अपडेट के लिए `root.render()` को कॉल करना आसान हो जाता है।
- **HTML स्ट्रिंग** या **DOM नोड** रेंडर करते समय: `null` लौटाता है।

## vnode प्रकार विवरण

| प्रकार | व्यवहार |
|------|------|
| `React.ReactElement` (JSX) | React के `createRoot` का उपयोग करके रेंडर किया गया, जो पूर्ण React क्षमताएं प्रदान करता है और स्वचालित रूप से एप्लिकेशन संदर्भ (context) को इनहेरिट करता है। |
| `string` | DOMPurify के साथ सफाई (sanitization) के बाद कंटेनर का `innerHTML` सेट करता है; किसी भी मौजूदा React रूट को पहले अनमाउंट (unmount) कर दिया जाएगा। |
| `Node` (Element, Text आदि) | कंटेनर को खाली करने के बाद `appendChild` के माध्यम से जोड़ता है; किसी भी मौजूदा React रूट को पहले अनमाउंट कर दिया जाएगा। |
| `DocumentFragment` | फ्रैगमेंट चाइल्ड नोड्स को कंटेनर में जोड़ता है; किसी भी मौजूदा React रूट को पहले अनमाउंट कर दिया जाएगा। |

## उदाहरण

### React तत्वों (JSX) को रेंडर करना

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('शीर्षक')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('क्लिक किया गया'))}>
      {ctx.t('बटन')}
    </Button>
  </Card>
);
```

### HTML स्ट्रिंग्स को रेंडर करना

```ts
ctx.render('<h1>Hello World</h1>');

// अंतर्राष्ट्रीयकरण (internationalization) के लिए ctx.t के साथ संयोजन
ctx.render('<div style="padding:16px">' + ctx.t('सामग्री') + '</div>');

// सशर्त रेंडरिंग (Conditional rendering)
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### DOM नोड्स को रेंडर करना

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// पहले एक खाली कंटेनर रेंडर करें, फिर उसे इनिशियलाइजेशन के लिए किसी थर्ड-पार्टी लाइब्रेरी (जैसे ECharts) को सौंप दें
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### एक कस्टम कंटेनर निर्दिष्ट करना

```ts
// एक विशिष्ट DOM तत्व में रेंडर करें
const customEl = document.getElementById('my-container');
ctx.render(<div>सामग्री</div>, customEl);
```

### बार-बार कॉल करने पर सामग्री बदल जाएगी

```ts
// दूसरी कॉल कंटेनर में मौजूदा सामग्री को बदल देगी
ctx.render(<div>पहला</div>);
ctx.render(<div>दूसरा</div>);  // केवल "दूसरा" प्रदर्शित होगा
```

## ध्यान देने योग्य बातें

- **कई कॉल सामग्री को बदल देंगे**: प्रत्येक `ctx.render()` कॉल कंटेनर में मौजूदा सामग्री को जोड़ने के बजाय उसे बदल देती है।
- **HTML स्ट्रिंग सुरक्षा**: XSS जोखिमों को कम करने के लिए पास किए गए HTML को DOMPurify के माध्यम से साफ किया जाता है, लेकिन फिर भी अविश्वसनीय उपयोगकर्ता इनपुट को जोड़ने से बचने की सलाह दी जाती है।
- **ctx.element को सीधे हेरफेर न करें**: `ctx.element.innerHTML` अब अप्रचलित (deprecated) है; इसके बजाय `ctx.render()` का लगातार उपयोग किया जाना चाहिए।
- **डिफ़ॉल्ट मौजूद न होने पर कंटेनर पास करें**: उन परिदृश्यों में जहाँ `ctx.element` `undefined` है (जैसे कि `ctx.importAsync` के माध्यम से लोड किए गए मॉड्यूल के भीतर), एक `container` स्पष्ट रूप से प्रदान किया जाना चाहिए।

## संबंधित

- [ctx.element](./element.md) - डिफ़ॉल्ट रेंडरिंग कंटेनर, जिसका उपयोग तब किया जाता है जब `ctx.render()` को कोई कंटेनर पास नहीं किया जाता है।
- [ctx.libs](./libs.md) - React और Ant Design जैसी बिल्ट-इन लाइब्रेरी, जिनका उपयोग JSX रेंडरिंग के लिए किया जाता है।
- [ctx.importAsync()](./import-async.md) - मांग पर बाहरी React/कंपोनेंट लाइब्रेरी लोड करने के बाद `ctx.render()` के साथ संयोजन में उपयोग किया जाता है।