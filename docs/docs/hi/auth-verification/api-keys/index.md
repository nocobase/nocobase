---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# API कुंजी

## परिचय

## उपयोग निर्देश

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API कुंजी जोड़ें

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e9f81dfe14a0a8.png)

**ध्यान दें**

- जो API कुंजी जोड़ी जाती है, वह वर्तमान उपयोगकर्ता के लिए होती है और उसे उपयोगकर्ता की भूमिका मिलती है।
- कृपया सुनिश्चित करें कि `APP_KEY` एनवायरनमेंट वेरिएबल कॉन्फ़िगर किया गया है और उसे गोपनीय रखा गया है। यदि `APP_KEY` बदल जाता है, तो जोड़ी गई सभी API कुंजियाँ अमान्य हो जाएँगी।

### APP_KEY को कैसे कॉन्फ़िगर करें

डॉकर (Docker) संस्करण के लिए, `docker-compose.yml` फ़ाइल को संशोधित करें:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

सोर्स कोड (Source Code) या `create-nocobase-app` इंस्टॉलेशन के लिए, आप सीधे `.env` फ़ाइल में `APP_KEY` को संशोधित कर सकते हैं:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```