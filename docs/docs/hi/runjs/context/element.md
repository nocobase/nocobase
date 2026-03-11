:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/element) देखें।
:::

# ctx.element

सैंडबॉक्स DOM कंटेनर की ओर इशारा करने वाला एक `ElementProxy` इंस्टेंस, जो `ctx.render()` के लिए डिफ़ॉल्ट रेंडरिंग लक्ष्य (target) के रूप में कार्य करता है। यह उन परिदृश्यों में उपलब्ध है जहाँ रेंडरिंग कंटेनर मौजूद होता है, जैसे `JSBlock`, `JSField`, `JSItem`, और `JSColumn`।

## उपयुक्त परिदृश्य

| परिदृश्य | विवरण |
|------|------|
| **JSBlock** | ब्लॉक के लिए DOM कंटेनर, जिसका उपयोग ब्लॉक की कस्टम सामग्री को रेंडर करने के लिए किया जाता है। |
| **JSField / JSItem / FormJSFieldItem** | किसी फ़ील्ड या फ़ॉर्म आइटम के लिए रेंडरिंग कंटेनर (आमतौर पर एक `<span>`)। |
| **JSColumn** | टेबल सेल के लिए DOM कंटेनर, जिसका उपयोग कस्टम कॉलम सामग्री को रेंडर करने के लिए किया जाता है। |

> **नोट:** `ctx.element` केवल उन RunJS संदर्भों (contexts) में उपलब्ध है जिनमें रेंडरिंग कंटेनर होता है। बिना UI वाले संदर्भों (जैसे शुद्ध बैकएंड लॉजिक) में, यह `undefined` हो सकता है। उपयोग करने से पहले इसकी जांच करने की सलाह दी जाती है।

## टाइप परिभाषा (Type Definition)

```typescript
element: ElementProxy | undefined;

// ElementProxy मूल HTMLElement के लिए एक प्रॉक्सी है, जो एक सुरक्षित API प्रदान करता है
class ElementProxy {
  __el: HTMLElement;  // आंतरिक मूल DOM तत्व (केवल विशिष्ट परिदृश्यों में सुलभ)
  innerHTML: string;  // पढ़ते/लिखते समय DOMPurify के माध्यम से साफ़ (sanitized) किया गया
  outerHTML: string; // ऊपर के समान
  appendChild(child: HTMLElement | string): void;
  // अन्य HTMLElement मेथड पास-थ्रू हैं (सीधे उपयोग की अनुशंसा नहीं की जाती है)
}
```

## सुरक्षा आवश्यकताएं

**अनुशंसित: सभी रेंडरिंग `ctx.render()` के माध्यम से की जानी चाहिए।** `ctx.element` के DOM API (जैसे `innerHTML`, `appendChild`, `querySelector`, आदि) का सीधे उपयोग करने से बचें।

### ctx.render() की अनुशंसा क्यों की जाती है

| लाभ | विवरण |
|------|------|
| **सुरक्षा** | XSS और अनुचित DOM ऑपरेशन्स को रोकने के लिए केंद्रीकृत सुरक्षा नियंत्रण। |
| **React समर्थन** | JSX, React घटकों (components) और लाइफ़साइकिल के लिए पूर्ण समर्थन। |
| **संदर्भ इनहेरिटेंस (Context Inheritance)** | एप्लिकेशन के ConfigProvider, थीम आदि को स्वचालित रूप से इनहेरिट करता है। |
| **संघर्ष प्रबंधन (Conflict Handling)** | मल्टी-इंस्टेंस संघर्षों से बचने के लिए React रूट निर्माण/अनमाउंटिंग को स्वचालित रूप से प्रबंधित करता है। |

### ❌ अनुशंसित नहीं: ctx.element का सीधा हेरफेर

```ts
// ❌ अनुशंसित नहीं: ctx.element API का सीधे उपयोग करना
ctx.element.innerHTML = '<div>सामग्री</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` अब हटा दिया गया (deprecated) है। कृपया इसके बजाय `ctx.render()` का उपयोग करें।

### ✅ अनुशंसित: ctx.render() का उपयोग करना

```ts
// ✅ React घटक को रेंडर करना
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('स्वागत है')}>
    <Button type="primary">क्लिक करें</Button>
  </Card>
);

// ✅ HTML स्ट्रिंग को रेंडर करना
ctx.render('<div style="padding:16px;">' + ctx.t('सामग्री') + '</div>');

// ✅ DOM नोड को रेंडर करना
const div = document.createElement('div');
div.textContent = ctx.t('नमस्ते');
ctx.render(div);
```

## विशेष मामला: पॉपओवर एंकर के रूप में

जब आपको वर्तमान तत्व को एंकर के रूप में उपयोग करके पॉपओवर (Popover) खोलने की आवश्यकता हो, तो आप `target` के रूप में मूल DOM प्राप्त करने के लिए `ctx.element?.__el` तक पहुँच सकते हैं:

```ts
// ctx.viewer.popover को लक्ष्य के रूप में मूल DOM की आवश्यकता होती है
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>पॉपअप सामग्री</div>,
});
```

> केवल "वर्तमान कंटेनर को एंकर के रूप में उपयोग करने" जैसे परिदृश्यों में `__el` का उपयोग करें; अन्य मामलों में सीधे DOM में हेरफेर न करें।

## ctx.render के साथ संबंध

- यदि `ctx.render(vnode)` को बिना `container` तर्क (argument) के कॉल किया जाता है, तो यह डिफ़ॉल्ट रूप से `ctx.element` कंटेनर में रेंडर होता है।
- यदि `ctx.element` मौजूद नहीं है और कोई `container` भी प्रदान नहीं किया गया है, तो एक त्रुटि (error) आएगी।
- आप स्पष्ट रूप से एक कंटेनर निर्दिष्ट कर सकते हैं: `ctx.render(vnode, customContainer)`।

## महत्वपूर्ण बातें

- `ctx.element` का उद्देश्य `ctx.render()` द्वारा आंतरिक कंटेनर के रूप में उपयोग किया जाना है। इसके गुणों या मेथड्स को सीधे एक्सेस करने या संशोधित करने की अनुशंसा नहीं की जाती है।
- बिना रेंडरिंग कंटेनर वाले संदर्भों में, `ctx.element`, `undefined` होगा। `ctx.render()` कॉल करने से पहले सुनिश्चित करें कि कंटेनर उपलब्ध है या मैन्युअल रूप से `container` पास करें।
- यद्यपि `ElementProxy` में `innerHTML`/`outerHTML` को DOMPurify के माध्यम से साफ़ किया जाता है, फिर भी एकीकृत रेंडरिंग प्रबंधन के लिए `ctx.render()` का उपयोग करने की अनुशंसा की जाती है।

## संबंधित

- [ctx.render](./render.md): सामग्री को कंटेनर में रेंडर करना
- [ctx.view](./view.md): वर्तमान व्यू कंट्रोलर
- [ctx.modal](./modal.md): मोडल के लिए शॉर्टकट API