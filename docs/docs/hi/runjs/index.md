:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/index) देखें।
:::

# RunJS अवलोकन

RunJS, NocoBase में **JS ब्लॉक**, **JS फ़ील्ड**, और **JS क्रियाओं** जैसे परिदृश्यों के लिए उपयोग किया जाने वाला JavaScript निष्पादन वातावरण (execution environment) है। कोड एक सीमित सैंडबॉक्स (sandbox) में चलता है, जो `ctx` (कॉन्टेक्स्ट API) तक सुरक्षित पहुँच प्रदान करता है और इसमें निम्नलिखित क्षमताएं शामिल हैं:

- टॉप-लेवल `await` (Top-level `await`)
- बाहरी मॉड्यूल आयात करना
- कंटेनर के भीतर रेंडरिंग
- ग्लोबल वेरिएबल्स

## टॉप-लेवल `await` (Top-level `await`)

RunJS टॉप-लेवल `await` का समर्थन करता है, जिससे कोड को IIFE में लपेटने की आवश्यकता नहीं होती है।

**अनुशंसित नहीं**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**अनुशंसित**

```js
async function test() {}
await test();
```

## बाहरी मॉड्यूल आयात करना

- ESM मॉड्यूल के लिए `ctx.importAsync()` का उपयोग करें (अनुशंसित)
- UMD/AMD मॉड्यूल के लिए `ctx.requireAsync()` का उपयोग करें

## कंटेनर के भीतर रेंडरिंग

सामग्री को वर्तमान कंटेनर (`ctx.element`) में रेंडर करने के लिए `ctx.render()` का उपयोग करें। यह निम्नलिखित तीन प्रारूपों का समर्थन करता है:

### JSX रेंडर करना

```jsx
ctx.render(<button>Button</button>);
```

### DOM नोड्स रेंडर करना

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### HTML स्ट्रिंग्स रेंडर करना

```js
ctx.render('<h1>Hello World</h1>');
```

## ग्लोबल वेरिएबल्स

- `window`
- `document`
- `navigator`
- `ctx`