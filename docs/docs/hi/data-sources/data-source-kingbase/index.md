---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# डेटा स्रोत - किंगबेसईएस डेटाबेस

## परिचय

किंगबेसईएस डेटाबेस को डेटा स्रोत के रूप में उपयोग किया जा सकता है, चाहे वह मुख्य डेटाबेस के रूप में हो या बाहरी डेटाबेस के रूप में।

:::चेतावनी
वर्तमान में, केवल pg मोड में चलने वाले किंगबेसईएस डेटाबेस ही समर्थित हैं।
:::

## इंस्टॉलेशन

### मुख्य डेटाबेस के रूप में उपयोग करना

सेटअप प्रक्रियाओं के लिए इंस्टॉलेशन दस्तावेज़ का संदर्भ लें, मुख्य अंतर एनवायरनमेंट वेरिएबल्स में है।

#### एनवायरनमेंट वेरिएबल्स

.env फ़ाइल को संपादित करके निम्नलिखित संबंधित एनवायरनमेंट वेरिएबल कॉन्फ़िगरेशन जोड़ें या संशोधित करें:

```bash
# अपनी आवश्यकतानुसार DB पैरामीटर्स समायोजित करें
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### डॉकर इंस्टॉलेशन

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### create-nocobase-app का उपयोग करके इंस्टॉलेशन

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### बाहरी डेटाबेस के रूप में उपयोग करना

इंस्टॉलेशन या अपग्रेड कमांड चलाएँ

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

प्लगइन सक्रिय करें

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## उपयोगकर्ता मार्गदर्शिका

- मुख्य डेटाबेस: [मुख्य डेटा स्रोत](/data-sources/data-source-main/) देखें
- बाहरी डेटाबेस: [डेटा स्रोत / बाहरी डेटाबेस](/data-sources/data-source-manager/external-database) देखें