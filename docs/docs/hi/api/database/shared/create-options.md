:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

**प्रकार**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**विवरण**

- `values`: यह उस रिकॉर्ड का डेटा ऑब्जेक्ट है जिसे आप बनाना चाहते हैं।
- `whitelist`: यह बताता है कि बनाए जाने वाले रिकॉर्ड के डेटा ऑब्जेक्ट में कौन से फ़ील्ड **लिखे जा सकते हैं**। यदि आप यह पैरामीटर नहीं देते हैं, तो डिफ़ॉल्ट रूप से सभी फ़ील्ड लिखने की अनुमति होती है।
- `blacklist`: यह बताता है कि बनाए जाने वाले रिकॉर्ड के डेटा ऑब्जेक्ट में कौन से फ़ील्ड **लिखने की अनुमति नहीं है**। यदि आप यह पैरामीटर नहीं देते हैं, तो डिफ़ॉल्ट रूप से सभी फ़ील्ड लिखने की अनुमति होती है।
- `transaction`: यह ट्रांज़ैक्शन ऑब्जेक्ट है। यदि आप कोई ट्रांज़ैक्शन पैरामीटर नहीं देते हैं, तो यह विधि अपने आप एक आंतरिक ट्रांज़ैक्शन बना देगी।