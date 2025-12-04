:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# लॉगर

NocoBase का लॉगिंग <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a> पर आधारित है। डिफ़ॉल्ट रूप से, NocoBase लॉग्स को API अनुरोध लॉग्स, सिस्टम रनटाइम लॉग्स और SQL निष्पादन लॉग्स में विभाजित करता है। API अनुरोध लॉग्स और SQL निष्पादन लॉग्स एप्लिकेशन द्वारा आंतरिक रूप से प्रिंट किए जाते हैं, जबकि प्लगइन डेवलपर्स को आमतौर पर केवल प्लगइन-संबंधित सिस्टम रनटाइम लॉग्स को प्रिंट करने की आवश्यकता होती है।

यह दस्तावेज़ मुख्य रूप से बताता है कि प्लगइन विकसित करते समय लॉग्स कैसे बनाएँ और प्रिंट करें।

## डिफ़ॉल्ट प्रिंटिंग तरीके

NocoBase सिस्टम रनटाइम लॉग्स को प्रिंट करने के तरीके प्रदान करता है। लॉग्स निर्दिष्ट फ़ील्ड्स के अनुसार प्रिंट किए जाते हैं और साथ ही निर्दिष्ट फ़ाइलों में आउटपुट किए जाते हैं।

```ts
// डिफ़ॉल्ट प्रिंटिंग तरीका
app.log.info("message");

// मिडलवेयर में उपयोग करें
async function (ctx, next) {
  ctx.log.info("message");
}

// प्लगइन में उपयोग करें
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

ऊपर दिए गए सभी तरीके नीचे दिए गए उपयोग का पालन करते हैं:

पहला पैरामीटर लॉग संदेश होता है, और दूसरा पैरामीटर एक वैकल्पिक मेटाडेटा ऑब्जेक्ट होता है, जो कोई भी की-वैल्यू पेयर हो सकता है। इसमें `module`, `submodule`, और `method` को अलग फ़ील्ड के रूप में निकाला जाएगा, और शेष फ़ील्ड्स को `meta` फ़ील्ड में रखा जाएगा।

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## अन्य फ़ाइलों में आउटपुट करना

यदि आप सिस्टम के डिफ़ॉल्ट प्रिंटिंग तरीके का उपयोग करना चाहते हैं, लेकिन डिफ़ॉल्ट फ़ाइल में आउटपुट नहीं करना चाहते हैं, तो आप `createSystemLogger` का उपयोग करके एक कस्टम सिस्टम लॉग इंस्टेंस बना सकते हैं।

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // क्या error स्तर के लॉग्स को 'xxx_error.log' में अलग से आउटपुट करना है
});
```

## कस्टम लॉगर

यदि आप सिस्टम द्वारा प्रदान किए गए प्रिंटिंग तरीकों का उपयोग नहीं करना चाहते हैं और Winston के नेटिव तरीकों का उपयोग करना चाहते हैं, तो आप निम्नलिखित तरीकों से लॉग्स बना सकते हैं।

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` मूल `winston.LoggerOptions` का विस्तार करता है।

- `transports` - प्रीसेट आउटपुट तरीकों को लागू करने के लिए `'console' | 'file' | 'dailyRotateFile'` का उपयोग करें।
- `format` - प्रीसेट प्रिंटिंग फ़ॉर्मेट्स को लागू करने के लिए `'logfmt' | 'json' | 'delimiter'` का उपयोग करें।

### `app.createLogger`

मल्टी-एप्लिकेशन परिदृश्यों में, कभी-कभी हम कस्टम आउटपुट डायरेक्टरी और फ़ाइलें चाहते हैं, जिन्हें वर्तमान एप्लिकेशन के नाम वाली डायरेक्टरी में आउटपुट किया जा सकता है।

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // /storage/logs/main/custom.log में आउटपुट होगा
});
```

### `plugin.createLogger`

उपयोग का मामला और तरीका `app.createLogger` के समान हैं।

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // /storage/logs/main/custom-plugin/YYYY-MM-DD.log में आउटपुट होगा
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```