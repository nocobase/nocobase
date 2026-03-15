:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/off) देखें।
:::

# ctx.off()

`ctx.on(eventName, handler)` के माध्यम से पंजीकृत (registered) इवेंट लिसनर्स को हटाता है। इसका उपयोग अक्सर [ctx.on](./on.md) के साथ उचित समय पर अनसब्सक्राइब करने के लिए किया जाता है, ताकि मेमोरी लीक या डुप्लिकेट ट्रिगर्स से बचा जा सके।

## उपयोग के मामले

| परिदृश्य | विवरण |
|------|------|
| **React useEffect क्लीनअप** | कंपोनेंट के अनमाउंट (unmount) होने पर लिसनर्स को हटाने के लिए `useEffect` के क्लीनअप फंक्शन के भीतर कॉल किया जाता है। |
| **JSField / JSEditableField** | फ़ील्ड्स के लिए टू-वे डेटा बाइंडिंग के दौरान `js-field:value-change` से अनसब्सक्राइब करने के लिए। |
| **रिसोर्स (Resource) से संबंधित** | `ctx.resource.on` के माध्यम से पंजीकृत `refresh`, `saved` आदि जैसे लिसनर्स से अनसब्सक्राइब करने के लिए। |

## टाइप डेफिनिशन

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## उदाहरण

### React useEffect में जोड़ी के रूप में उपयोग

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### रिसोर्स इवेंट्स से अनसब्सक्राइब करना

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// उचित समय पर
ctx.resource?.off('refresh', handler);
```

## महत्वपूर्ण बातें

1. **हैंडलर रेफरेंस की निरंतरता**: `ctx.off` में पास किया गया `handler` वही रेफरेंस होना चाहिए जो `ctx.on` में उपयोग किया गया था; अन्यथा, इसे सही ढंग से हटाया नहीं जा सकेगा।
2. **समय पर क्लीनअप**: मेमोरी लीक से बचने के लिए कंपोनेंट के अनमाउंट होने या कॉन्टेक्स्ट (context) के नष्ट होने से पहले `ctx.off` को कॉल करें।

## संबंधित दस्तावेज़

- [ctx.on](./on.md) - इवेंट्स को सब्सक्राइब करें
- [ctx.resource](./resource.md) - रिसोर्स इंस्टेंस और इसके `on`/`off` मेथड्स