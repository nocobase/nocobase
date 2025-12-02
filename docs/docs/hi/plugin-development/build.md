:::tip AI अनुवाद सूचना
यह दस्तावेज़ AI द्वारा स्वचालित रूप से अनुवादित किया गया है।
:::


# बिल्ड

## कस्टम बिल्ड कॉन्फ़िगरेशन

यदि आप बिल्ड कॉन्फ़िगरेशन को कस्टम करना चाहते हैं, तो आप प्लगइन के रूट डायरेक्टरी में `build.config.ts` फ़ाइल बना सकते हैं, जिसमें निम्नलिखित सामग्री हो:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite का उपयोग `src/client` कोड को बंडल करने के लिए किया जाता है

    // Vite कॉन्फ़िगरेशन को संशोधित करें, अधिक जानकारी के लिए देखें: https://vite.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup का उपयोग `src/server` कोड को बंडल करने के लिए किया जाता है

    // tsup कॉन्फ़िगरेशन को संशोधित करें, अधिक जानकारी के लिए देखें: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // यह बिल्ड शुरू होने से पहले चलने वाला एक कॉलबैक फ़ंक्शन है, जो बिल्ड से पहले के ऑपरेशंस की अनुमति देता है।
  },
  afterBuild: (log: PkgLog) => {
    // यह बिल्ड पूरा होने के बाद चलने वाला एक कॉलबैक फ़ंक्शन है, जो बिल्ड के बाद के ऑपरेशंस की अनुमति देता है।
  };
});
```