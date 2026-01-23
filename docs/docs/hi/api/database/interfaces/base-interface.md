:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# BaseInterface

## अवलोकन

BaseInterface सभी Interface प्रकारों का आधार वर्ग (base class) है। उपयोगकर्ता इस वर्ग (class) को इनहेरिट करके अपनी कस्टम Interface लॉजिक को लागू कर सकते हैं।

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // कस्टम toValue लॉजिक
  }

  toString(value: any, ctx?: any) {
    // कस्टम toString लॉजिक
  }
}
// Interface को रजिस्टर करें
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## API

### toValue(value: string, ctx?: any): Promise<any>

यह बाहरी स्ट्रिंग को Interface के वास्तविक मान (actual value) में बदलता है। इस मान को सीधे Repository को राइट ऑपरेशन (write operation) के लिए पास किया जा सकता है।

### toString(value: any, ctx?: any)

यह Interface के वास्तविक मान (actual value) को स्ट्रिंग प्रकार (string type) में बदलता है। स्ट्रिंग प्रकार का उपयोग एक्सपोर्ट (export) करने या प्रदर्शित करने के लिए किया जा सकता है।