:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/notification) देखें।
:::

# ctx.notification

Ant Design Notification पर आधारित यह ग्लोबल नोटिफिकेशन API, पेज के **ऊपरी दाएं कोने (top-right corner)** में नोटिफिकेशन पैनल दिखाने के लिए उपयोग किया जाता है। `ctx.message` की तुलना में, नोटिफिकेशन में शीर्षक (title) और विवरण (description) शामिल हो सकते हैं, जो उन्हें ऐसी सामग्री के लिए उपयुक्त बनाता है जिसे लंबे समय तक दिखाने की आवश्यकता होती है या जिस पर उपयोगकर्ता का ध्यान आकर्षित करना आवश्यक होता है।

## उपयोग के मामले

| परिदृश्य | विवरण |
|------|------|
| **JSBlock / ऑपरेशन इवेंट्स** | कार्य पूरा होने की सूचना, बैच ऑपरेशन के परिणाम, एक्सपोर्ट पूरा होना आदि। |
| **इवेंट फ्लो (वर्कफ़्लो)** | एसिंक्रोनस (asynchronous) प्रक्रियाओं के समाप्त होने के बाद सिस्टम-स्तरीय अलर्ट। |
| **लंबी अवधि तक प्रदर्शित होने वाली सामग्री** | शीर्षक, विवरण और एक्शन बटन के साथ पूर्ण नोटिफिकेशन। |

## टाइप परिभाषा (Type Definition)

```ts
notification: NotificationInstance;
```

`NotificationInstance` एक Ant Design नोटिफिकेशन इंटरफ़ेस है, जो निम्नलिखित तरीके (methods) प्रदान करता है।

## सामान्य तरीके (Common Methods)

| तरीका | विवरण |
|------|------|
| `open(config)` | कस्टम कॉन्फ़िगरेशन के साथ नोटिफिकेशन खोलें |
| `success(config)` | सफलता (success) प्रकार का नोटिफिकेशन दिखाएं |
| `info(config)` | सूचना (info) प्रकार का नोटिफिकेशन दिखाएं |
| `warning(config)` | चेतावनी (warning) प्रकार का नोटिफिकेशन दिखाएं |
| `error(config)` | त्रुटि (error) प्रकार का नोटिफिकेशन दिखाएं |
| `destroy(key?)` | निर्दिष्ट key वाले नोटिफिकेशन को बंद करें; यदि key नहीं दी गई है, तो सभी नोटिफिकेशन बंद करें |

**कॉन्फ़िगरेशन पैरामीटर** ([Ant Design notification](https://ant.design/components/notification) के अनुरूप):

| पैरामीटर | प्रकार | विवरण |
|------|------|------|
| `message` | `ReactNode` | नोटिफिकेशन शीर्षक |
| `description` | `ReactNode` | नोटिफिकेशन विवरण |
| `duration` | `number` | स्वचालित रूप से बंद होने की देरी (सेकंड में)। डिफ़ॉल्ट 4.5 सेकंड है; इसे 0 सेट करने पर यह स्वचालित रूप से बंद नहीं होगा |
| `key` | `string` | नोटिफिकेशन की विशिष्ट पहचान (unique identifier), जिसका उपयोग `destroy(key)` द्वारा किसी विशेष नोटिफिकेशन को बंद करने के लिए किया जाता है |
| `onClose` | `() => void` | नोटिफिकेशन बंद होने पर ट्रिगर होने वाला कॉल-बैक फंक्शन |
| `placement` | `string` | स्थिति: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## उदाहरण

### बुनियादी उपयोग

```ts
ctx.notification.open({
  message: 'ऑपरेशन सफल रहा',
  description: 'डेटा सर्वर पर सहेज लिया गया है।',
});
```

### प्रकार के अनुसार त्वरित कॉल

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### कस्टम अवधि और Key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // स्वचालित रूप से बंद न करें
});

// कार्य पूरा होने के बाद मैन्युअल रूप से बंद करें
ctx.notification.destroy('task-123');
```

### सभी नोटिफिकेशन बंद करें

```ts
ctx.notification.destroy();
```

## ctx.message के साथ अंतर

| विशेषता | ctx.message | ctx.notification |
|------|--------------|------------------|
| **स्थिति** | पेज के शीर्ष केंद्र में | ऊपरी दाएं कोने में (कॉन्फ़िगर करने योग्य) |
| **संरचना** | सिंगल-लाइन हल्का संकेत | इसमें शीर्षक + विवरण शामिल हो सकते हैं |
| **उद्देश्य** | अस्थायी फीडबैक, स्वतः गायब हो जाता है | पूर्ण नोटिफिकेशन, लंबे समय तक दिखाया जा सकता है |
| **विशिष्ट परिदृश्य** | ऑपरेशन सफल, सत्यापन विफल, कॉपी सफल | कार्य पूरा होना, सिस्टम संदेश, उपयोगकर्ता का ध्यान आकर्षित करने वाली लंबी सामग्री |

## संबंधित

- [ctx.message](./message.md) - शीर्ष हल्का संकेत, त्वरित फीडबैक के लिए उपयुक्त
- [ctx.modal](./modal.md) - मोडल पुष्टिकरण, ब्लॉकिंग इंटरैक्शन
- [ctx.t()](./t.md) - अंतर्राष्ट्रीयकरण, अक्सर नोटिफिकेशन के साथ उपयोग किया जाता है