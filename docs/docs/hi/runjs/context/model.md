:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/model) देखें।
:::

# ctx.model

`FlowModel` इंस्टेंस जहाँ वर्तमान RunJS निष्पादन संदर्भ (execution context) स्थित है, यह JSBlock, JSField, JSAction जैसे परिदृश्यों के लिए डिफ़ॉल्ट प्रवेश बिंदु (entry point) है। विशिष्ट प्रकार संदर्भ के अनुसार बदलता रहता है: यह `BlockModel`, `ActionModel`, या `JSEditableFieldModel` जैसे सब-क्लास हो सकते हैं।

##适用场景 (उपयुक्त परिदृश्य)

| परिदृश्य | विवरण |
|------|------|
| **JSBlock** | `ctx.model` वर्तमान ब्लॉक मॉडल है। आप `resource`, `collection` (संग्रह), `setProps` आदि तक पहुँच सकते हैं। |
| **JSField / JSItem / JSColumn** | `ctx.model` फ़ील्ड मॉडल है। आप `setProps`, `dispatchEvent` आदि तक पहुँच सकते हैं। |
| **एक्शन इवेंट / ActionModel** | `ctx.model` एक्शन मॉडल है। आप स्टेप पैरामीटर्स पढ़/लिख सकते हैं, इवेंट डिस्पैच कर सकते हैं, आदि। |

> संकेत: यदि आपको **वर्तमान JS को धारण करने वाले पैरेंट ब्लॉक** (जैसे फ़ॉर्म या टेबल ब्लॉक) तक पहुँचने की आवश्यकता है, तो `ctx.blockModel` का उपयोग करें; **अन्य मॉडलों** तक पहुँचने के लिए, `ctx.getModel(uid)` का उपयोग करें।

## टाइप परिभाषा

```ts
model: FlowModel;
```

`FlowModel` बेस क्लास है। रनटाइम पर, यह विभिन्न सब-क्लासेस (जैसे `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` आदि) का एक इंस्टेंस होता है। उपलब्ध प्रॉपर्टीज़ और मेथड विशिष्ट प्रकार के आधार पर भिन्न होते हैं।

## सामान्य प्रॉपर्टीज़

| प्रॉपर्टी | टाइप | विवरण |
|------|------|------|
| `uid` | `string` | मॉडल का विशिष्ट पहचानकर्ता। इसका उपयोग `ctx.getModel(uid)` या पॉपअप UID बाइंडिंग के लिए किया जा सकता है। |
| `collection` | `Collection` | वर्तमान मॉडल से जुड़ा **संग्रह** (तब मौजूद होता है जब ब्लॉक/फ़ील्ड डेटा से जुड़ा हो)। |
| `resource` | `Resource` | संबद्ध रिसोर्स इंस्टेंस, जिसका उपयोग रिफ्रेश करने, चुनी गई पंक्तियों को प्राप्त करने आदि के लिए किया जाता है। |
| `props` | `object` | मॉडल का UI/व्यवहार कॉन्फ़िगरेशन। इसे `setProps` का उपयोग करके अपडेट किया जा सकता है। |
| `subModels` | `Record<string, FlowModel>` | चाइल्ड मॉडलों का संग्रह (जैसे फ़ॉर्म के भीतर फ़ील्ड, टेबल के भीतर कॉलम)। |
| `parent` | `FlowModel` | पैरेंट मॉडल (यदि कोई हो)। |

## सामान्य मेथड

| मेथड | विवरण |
|------|------|
| `setProps(partialProps: any): void` | मॉडल कॉन्फ़िगरेशन को अपडेट करता है और पुन: रेंडरिंग (re-rendering) को ट्रिगर करता है (जैसे, `ctx.model.setProps({ loading: true })`)। |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | मॉडल को एक इवेंट डिस्पैच करता है, जिससे उस मॉडल पर कॉन्फ़िगर किए गए **वर्कफ़्लो** ट्रिगर होते हैं जो उस इवेंट नाम को सुनते हैं। वैकल्पिक `payload` वर्कफ़्लो हैंडलर को पास किया जाता है; `options.debounce` डिबाउंसिंग सक्षम कर सकता है। |
| `getStepParams?.(flowKey, stepKey)` | कॉन्फ़िगरेशन फ्लो स्टेप पैरामीटर्स पढ़ता है (सेटिंग्स पैनल, कस्टम एक्शन आदि परिदृश्यों में उपयोग किया जाता है)। |
| `setStepParams?.(flowKey, stepKey, params)` | कॉन्फ़िगरेशन फ्लो स्टेप पैरामीटर्स लिखता है। |

## ctx.blockModel और ctx.getModel के साथ संबंध

| आवश्यकता | अनुशंसित उपयोग |
|------|----------|
| **वर्तमान निष्पादन संदर्भ का मॉडल** | `ctx.model` |
| **वर्तमान JS का पैरेंट ब्लॉक** | `ctx.blockModel`, अक्सर `resource`, `form`, या `collection` (संग्रह) तक पहुँचने के लिए उपयोग किया जाता है। |
| **UID द्वारा कोई भी मॉडल प्राप्त करें** | `ctx.getModel(uid)` या `ctx.getModel(uid, true)` (व्यू स्टैक में खोजें)। |

JSField में, `ctx.model` फ़ील्ड मॉडल है, जबकि `ctx.blockModel` उस फ़ील्ड को धारण करने वाला फ़ॉर्म या टेबल ब्लॉक है।

## उदाहरण

### ब्लॉक/एक्शन स्थिति अपडेट करना

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### मॉडल इवेंट डिस्पैच करना

```ts
// इवेंट डिस्पैच करें, ताकि इस मॉडल पर कॉन्फ़िगर किया गया वर्कफ़्लो ट्रिगर हो सके जो इस इवेंट नाम को सुनता है
await ctx.model.dispatchEvent('remove');

// जब पेलोड दिया जाता है, तो इसे वर्कफ़्लो हैंडलर के ctx.inputArgs में पास किया जाता है
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### पॉपअप बाइंडिंग या क्रॉस-मॉडल एक्सेस के लिए UID का उपयोग करना

```ts
const myUid = ctx.model.uid;
// पॉपअप कॉन्फ़िगरेशन में, आप जुड़ाव के लिए openerUid: myUid पास कर सकते हैं
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## संबंधित

- [ctx.blockModel](./block-model.md): पैरेंट ब्लॉक मॉडल जहाँ वर्तमान JS स्थित है
- [ctx.getModel()](./get-model.md): UID द्वारा अन्य मॉडल प्राप्त करें