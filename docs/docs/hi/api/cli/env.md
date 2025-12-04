:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# वैश्विक पर्यावरण चर

## TZ

ऐप का टाइम ज़ोन (समय क्षेत्र) सेट करने के लिए उपयोग किया जाता है, डिफ़ॉल्ट रूप से ऑपरेटिंग सिस्टम का टाइम ज़ोन होता है।

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
इस टाइम ज़ोन के अनुसार समय-संबंधी ऑपरेशन प्रोसेस किए जाएँगे। TZ को बदलने से डेटाबेस में तारीख के मान (values) प्रभावित हो सकते हैं। विवरण के लिए, '[तारीख और समय का अवलोकन](#)' देखें।
:::

## APP_ENV

एप्लिकेशन का वातावरण, डिफ़ॉल्ट मान `development` है। विकल्पों में शामिल हैं:

- `production` - प्रोडक्शन वातावरण
- `development` - डेवलपमेंट वातावरण

```bash
APP_ENV=production
```

## APP_KEY

एप्लिकेशन की गुप्त कुंजी (secret key), जिसका उपयोग यूज़र टोकन आदि बनाने के लिए किया जाता है। इसे अपनी एप्लिकेशन कुंजी में बदलें और सुनिश्चित करें कि यह किसी को भी पता न चले।

:::warning
यदि APP_KEY बदल दिया जाता है, तो पुराने टोकन भी अमान्य हो जाएँगे।
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

एप्लिकेशन पोर्ट, डिफ़ॉल्ट मान `13000` है।

```bash
APP_PORT=13000
```

## API_BASE_PATH

NocoBase API पते का प्रीफ़िक्स (prefix), डिफ़ॉल्ट मान `/api/` है।

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

मल्टी-कोर (क्लस्टर) स्टार्टअप मोड। यदि यह चर (variable) कॉन्फ़िगर किया गया है, तो इसे `pm2 start` कमांड में `-i <instances>` पैरामीटर के रूप में पास किया जाएगा। विकल्प pm2 के `-i` पैरामीटर के अनुरूप हैं (देखें [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), जिनमें शामिल हैं:

- `max`: CPU के अधिकतम कोर का उपयोग करें
- `-1`: CPU के अधिकतम कोर से 1 कम का उपयोग करें
- `<number>`: कोर की संख्या निर्दिष्ट करें

डिफ़ॉल्ट मान खाली है, जिसका अर्थ है कि यह सक्षम नहीं है।

:::warning{title="ध्यान दें"}
इस मोड को क्लस्टर मोड से संबंधित प्लगइन के साथ उपयोग करने की आवश्यकता है, अन्यथा एप्लिकेशन की कार्यक्षमता में असामान्यताएँ आ सकती हैं।
:::

अधिक जानकारी के लिए, देखें: [क्लस्टर मोड](#)।

## PLUGIN_PACKAGE_PREFIX

प्लगइन पैकेज नाम का प्रीफ़िक्स, डिफ़ॉल्ट रूप से है: `@nocobase/plugin-,@nocobase/preset-`।

उदाहरण के लिए, `my-nocobase-app` प्रोजेक्ट में `hello` प्लगइन जोड़ने के लिए, प्लगइन का पूरा पैकेज नाम `@my-nocobase-app/plugin-hello` होगा।

PLUGIN_PACKAGE_PREFIX को इस प्रकार कॉन्फ़िगर किया जा सकता है:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

तो प्लगइन नामों और पैकेज नामों के बीच संबंध इस प्रकार है:

- `users` प्लगइन का पैकेज नाम `@nocobase/plugin-users` है
- `nocobase` प्लगइन का पैकेज नाम `@nocobase/preset-nocobase` है
- `hello` प्लगइन का पैकेज नाम `@my-nocobase-app/plugin-hello` है

## DB_DIALECT

डेटाबेस का प्रकार, विकल्पों में शामिल हैं:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

डेटाबेस होस्ट (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

डिफ़ॉल्ट मान `localhost` है।

```bash
DB_HOST=localhost
```

## DB_PORT

डेटाबेस पोर्ट (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

- MySQL, MariaDB का डिफ़ॉल्ट पोर्ट 3306 है
- PostgreSQL का डिफ़ॉल्ट पोर्ट 5432 है

```bash
DB_PORT=3306
```

## DB_DATABASE

डेटाबेस का नाम (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

```bash
DB_DATABASE=nocobase
```

## DB_USER

डेटाबेस उपयोगकर्ता (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

```bash
DB_USER=nocobase
```

## DB_PASSWORD

डेटाबेस पासवर्ड (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

डेटा तालिका (table) प्रीफ़िक्स।

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

क्या डेटाबेस तालिका के नाम और फ़ील्ड के नाम को स्नेक केस (snake case) शैली में बदलना है, डिफ़ॉल्ट रूप से `false` है। यदि आप MySQL (MariaDB) डेटाबेस का उपयोग कर रहे हैं, और `lower_case_table_names=1` है, तो DB_UNDERSCORED `true` होना चाहिए।

:::warning
जब `DB_UNDERSCORED=true` होता है, तो डेटाबेस में वास्तविक तालिका और फ़ील्ड के नाम इंटरफ़ेस में दिखाई देने वाले नामों से भिन्न होंगे। उदाहरण के लिए, `orderDetails` डेटाबेस में `order_details` होगा।
:::

## DB_LOGGING

डेटाबेस लॉगिंग स्विच, डिफ़ॉल्ट मान `off` है। विकल्पों में शामिल हैं:

- `on` - सक्षम
- `off` - अक्षम

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

लॉग आउटपुट का तरीका, कई मानों को `,` से अलग किया जाता है। डेवलपमेंट वातावरण में डिफ़ॉल्ट मान `console` है, और प्रोडक्शन वातावरण में `console,dailyRotateFile` है। विकल्प:

- `console` - `console.log`
- `file` - `फ़ाइल`
- `dailyRotateFile` - `दैनिक रोटेटिंग फ़ाइल`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

फ़ाइल-आधारित लॉग स्टोरेज पाथ, डिफ़ॉल्ट रूप से `storage/logs` है।

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

आउटपुट लॉग स्तर। डेवलपमेंट वातावरण में डिफ़ॉल्ट मान `debug` है, और प्रोडक्शन वातावरण में `info` है। विकल्प:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

डेटाबेस लॉग आउटपुट स्तर `debug` है, और इसका आउटपुट `DB_LOGGING` द्वारा नियंत्रित होता है, `LOGGER_LEVEL` से प्रभावित नहीं होता है।

## LOGGER_MAX_FILES

रखने के लिए लॉग फ़ाइलों की अधिकतम संख्या।

- जब `LOGGER_TRANSPORT` `file` हो, तो डिफ़ॉल्ट मान `10` है।
- जब `LOGGER_TRANSPORT` `dailyRotateFile` हो, तो दिनों को दर्शाने के लिए `[n]d` का उपयोग करें। डिफ़ॉल्ट मान `14d` है।

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

आकार के अनुसार लॉग रोटेट करें।

- जब `LOGGER_TRANSPORT` `file` हो, तो इकाई `byte` है, और डिफ़ॉल्ट मान `20971520 (20 * 1024 * 1024)` है।
- जब `LOGGER_TRANSPORT` `dailyRotateFile` हो, तो आप `[n]k`, `[n]m`, `[n]g` का उपयोग कर सकते हैं। डिफ़ॉल्ट रूप से कॉन्फ़िगर नहीं किया गया है।

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

लॉग प्रिंटिंग प्रारूप। डेवलपमेंट वातावरण में डिफ़ॉल्ट `console` है, और प्रोडक्शन वातावरण में `json` है। विकल्प:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

देखें: [लॉग प्रारूप](#)

## CACHE_DEFAULT_STORE

उपयोग की जाने वाली कैश स्टोर का अद्वितीय पहचानकर्ता, सर्वर-साइड डिफ़ॉल्ट कैश स्टोर को निर्दिष्ट करता है। डिफ़ॉल्ट मान `memory` है। अंतर्निहित विकल्प:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

मेमोरी कैश में आइटम की अधिकतम संख्या, डिफ़ॉल्ट मान `2000` है।

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis कनेक्शन, वैकल्पिक। उदाहरण: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

टेलीमेट्री डेटा संग्रह सक्षम करें, डिफ़ॉल्ट रूप से `off` है।

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

सक्षम किए गए मॉनिटरिंग मेट्रिक रीडर, डिफ़ॉल्ट रूप से `console` है। अन्य मानों के लिए संबंधित रीडर प्लगइन के पंजीकृत नामों को देखना होगा, जैसे `prometheus`। कई मानों को `,` से अलग किया जाता है।

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

सक्षम किए गए ट्रेस डेटा प्रोसेसर, डिफ़ॉल्ट रूप से `console` है। अन्य मानों के लिए संबंधित प्रोसेसर प्लगइन के पंजीकृत नामों को देखना होगा। कई मानों को `,` से अलग किया जाता है।

```bash
TELEMETRY_TRACE_PROCESSOR=console
```