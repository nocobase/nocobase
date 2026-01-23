:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# API कुंजी

## परिचय

## इंस्टॉलेशन

## उपयोग निर्देश

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API कुंजी जोड़ें

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**ध्यान दें**

- आपके द्वारा जोड़ी गई API कुंजी वर्तमान उपयोगकर्ता की होती है और उसे वर्तमान उपयोगकर्ता की भूमिका मिलती है।
- सुनिश्चित करें कि `APP_KEY` एनवायरनमेंट वेरिएबल कॉन्फ़िगर किया गया है और उसे गोपनीय रखा गया है। यदि `APP_KEY` बदल जाता है, तो पहले से जोड़ी गई सभी API कुंजियाँ अमान्य हो जाएंगी।

### `APP_KEY` को कैसे कॉन्फ़िगर करें

डॉकर (Docker) संस्करण के लिए, `docker-compose.yml` फ़ाइल को संशोधित करें:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

सोर्स कोड या `create-nocobase-app` इंस्टॉलेशन के लिए, आप सीधे `.env` फ़ाइल में `APP_KEY` को संशोधित कर सकते हैं:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```