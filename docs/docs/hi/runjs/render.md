:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/render) देखें।
:::

# कंटेनर के भीतर रेंडरिंग

वर्तमान कंटेनर (`ctx.element`) में सामग्री रेंडर करने के लिए `ctx.render()` का उपयोग करें। यह निम्नलिखित तीन रूपों का समर्थन करता है:

## `ctx.render()`

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

## JSX विवरण

RunJS सीधे JSX रेंडर कर सकता है। आप अंतर्निहित (built-in) React/कंपोनेंट लाइब्रेरी का उपयोग कर सकते हैं या आवश्यकतानुसार बाहरी डिपेंडेंसी लोड कर सकते हैं।

### अंतर्निहित React और कंपोनेंट लाइब्रेरी का उपयोग करना

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### बाहरी React और कंपोनेंट लाइब्रेरी का उपयोग करना

`ctx.importAsync()` के माध्यम से आवश्यकतानुसार विशिष्ट वर्ज़न लोड करें:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

यह उन स्थितियों के लिए उपयुक्त है जहाँ विशिष्ट वर्ज़न या तृतीय-पक्ष (third-party) कंपोनेंट्स की आवश्यकता होती है।

## ctx.element

अनुपयुक्त उपयोग (पदावनत/deprecated):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

अनुशंसित तरीका:

```js
ctx.render(<h1>Hello World</h1>);
```