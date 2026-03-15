:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/jsx) देखें।
:::

# JSX

RunJS JSX सिंटैक्स का समर्थन करता है, जिससे आप React घटकों (components) की तरह कोड लिख सकते हैं। JSX निष्पादन (execution) से पहले स्वचालित रूप से संकलित (compile) हो जाता है।

## संकलन निर्देश (Compilation Notes)

- JSX को रूपांतरित करने के लिए [sucrase](https://github.com/alangpierce/sucrase) का उपयोग किया जाता है।
- JSX को `ctx.libs.React.createElement` और `ctx.libs.React.Fragment` में संकलित किया जाता है।
- **React को इम्पोर्ट करने की आवश्यकता नहीं है**: आप सीधे JSX लिख सकते हैं; संकलन के बाद यह स्वचालित रूप से `ctx.libs.React` का उपयोग करेगा।
- जब `ctx.importAsync('react@x.x.x')` के माध्यम से बाहरी React लोड किया जाता है, तो JSX उस विशिष्ट इंस्टेंस के `createElement` मेथड का उपयोग करने लगेगा।

## बिल्ट-इन React और घटकों का उपयोग करना

RunJS में React और सामान्य UI लाइब्रेरी पहले से मौजूद (built-in) हैं। आप `import` का उपयोग किए बिना सीधे `ctx.libs` के माध्यम से उनका उपयोग कर सकते हैं:

- **ctx.libs.React** — React कोर
- **ctx.libs.ReactDOM** — ReactDOM (यदि आवश्यक हो तो इसे `createRoot` के साथ उपयोग किया जा सकता है)
- **ctx.libs.antd** — Ant Design घटक
- **ctx.libs.antdIcons** — Ant Design आइकन

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>क्लिक करें</Button>);
```

सीधे JSX लिखते समय, आपको React को डिस्ट्रक्चर (destructure) करने की आवश्यकता नहीं है; केवल **Hooks** (जैसे `useState`, `useEffect`) या **Fragment** (`<>...</>`) का उपयोग करते समय ही आपको `ctx.libs` से डिस्ट्रक्चर करने की आवश्यकता होती है:

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**ध्यान दें**: बिल्ट-इन React और `ctx.importAsync()` के माध्यम से इम्पोर्ट किए गए बाहरी React को **एक साथ मिलाया नहीं जा सकता**। यदि आप किसी बाहरी UI लाइब्रेरी का उपयोग करते हैं, तो React को भी उसी बाहरी स्रोत से इम्पोर्ट किया जाना चाहिए।

## बाहरी React और घटकों का उपयोग करना

जब `ctx.importAsync()` के माध्यम से React और UI लाइब्रेरी के किसी विशिष्ट संस्करण को लोड किया जाता है, तो JSX उस React इंस्टेंस का उपयोग करेगा:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>क्लिक करें</Button>);
```

यदि antd, react/react-dom पर निर्भर है, तो आप कई इंस्टेंस से बचने के लिए `deps` के माध्यम से वही संस्करण निर्दिष्ट कर सकते हैं:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**ध्यान दें**: बाहरी React का उपयोग करते समय, antd जैसी UI लाइब्रेरी को भी `ctx.importAsync()` के माध्यम से इम्पोर्ट किया जाना चाहिए। उन्हें `ctx.libs.antd` के साथ न मिलाएँ।

## JSX सिंटैक्स के मुख्य बिंदु

- **घटक (Components) और प्रॉप्स (props)**: `<Button type="primary">टेक्स्ट</Button>`
- **Fragment**: `<>...</>` या `<React.Fragment>...</React.Fragment>` (Fragment का उपयोग करते समय `const { React } = ctx.libs` को डिस्ट्रक्चर करना आवश्यक है)
- **एक्सप्रेशन (Expressions)**: वेरिएबल या ऑपरेशन डालने के लिए JSX में `{expression}` का उपयोग करें, जैसे `{ctx.user.name}` या `{count + 1}`; `{{ }}` टेम्पलेट सिंटैक्स का उपयोग न करें।
- **कंडीशनल रेंडरिंग**: `{flag && <span>सामग्री</span>}` या `{flag ? <A /> : <B />}`
- **लिस्ट रेंडरिंग**: तत्वों की सूची वापस करने के लिए `array.map()` का उपयोग करें, और सुनिश्चित करें कि प्रत्येक तत्व की एक स्थिर `key` हो।

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```