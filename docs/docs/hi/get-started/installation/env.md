:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# पर्यावरण वैरिएबल

## पर्यावरण वैरिएबल कैसे सेट करें?

### गिट सोर्स कोड या `create-nocobase-app` इंस्टॉलेशन तरीका

प्रोजेक्ट की रूट डायरेक्टरी में स्थित `.env` फ़ाइल में पर्यावरण वैरिएबल सेट करें। पर्यावरण वैरिएबल में बदलाव करने के बाद, आपको एप्लिकेशन प्रोसेस को बंद करके उसे फिर से शुरू करना होगा।

### डॉकर इंस्टॉलेशन तरीका

`docker-compose.yml` कॉन्फ़िगरेशन में बदलाव करें और `environment` पैरामीटर में पर्यावरण वैरिएबल सेट करें। उदाहरण:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

आप `.env` फ़ाइल में पर्यावरण वैरिएबल सेट करने के लिए `env_file` का भी उपयोग कर सकते हैं। उदाहरण:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

पर्यावरण वैरिएबल में बदलाव करने के बाद, आपको ऐप कंटेनर को फिर से बनाना होगा।

```yml
docker compose up -d app
```

## ग्लोबल पर्यावरण वैरिएबल

### TZ

इसका उपयोग एप्लिकेशन का टाइम ज़ोन सेट करने के लिए किया जाता है, डिफ़ॉल्ट रूप से यह ऑपरेटिंग सिस्टम का टाइम ज़ोन होता है।

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
समय से संबंधित ऑपरेशन इसी टाइम ज़ोन के अनुसार हैंडल किए जाएंगे। TZ में बदलाव करने से डेटाबेस में तारीख के मान (date values) प्रभावित हो सकते हैं। अधिक जानकारी के लिए, "[तारीख और समय का अवलोकन](/data-sources/data-modeling/collection-fields/datetime)" देखें।
:::

### APP_ENV

एप्लिकेशन एनवायरनमेंट, डिफ़ॉल्ट मान `development` है, विकल्पों में शामिल हैं:

- `production` प्रोडक्शन एनवायरनमेंट
- `development` डेवलपमेंट एनवायरनमेंट

```bash
APP_ENV=production
```

### APP_KEY

एप्लिकेशन की सीक्रेट कुंजी, जिसका उपयोग यूज़र टोकन आदि जनरेट करने के लिए किया जाता है। इसे अपनी एप्लिकेशन कुंजी में बदलें और सुनिश्चित करें कि यह बाहर लीक न हो।

:::warning
यदि APP_KEY बदल दिया जाता है, तो पुराने टोकन भी अमान्य हो जाएंगे।
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

एप्लिकेशन पोर्ट, डिफ़ॉल्ट मान `13000` है।

```bash
APP_PORT=13000
```

### API_BASE_PATH

NocoBase API एड्रेस प्रीफ़िक्स, डिफ़ॉल्ट मान `/api/` है।

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

मल्टी-कोर (क्लस्टर) स्टार्ट मोड। यदि यह वैरिएबल कॉन्फ़िगर किया गया है, तो इसे `pm2 start` कमांड में `-i <instances>` पैरामीटर के रूप में पास किया जाएगा। विकल्प pm2 के `-i` पैरामीटर के अनुरूप हैं (संदर्भ [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), जिनमें शामिल हैं:

- `max`: CPU के अधिकतम कोर का उपयोग करें
- `-1`: CPU के अधिकतम कोर से एक कम का उपयोग करें
- `<number>`: कोर की संख्या निर्दिष्ट करें

डिफ़ॉल्ट मान खाली है, जिसका अर्थ है कि यह सक्षम नहीं है।

:::warning{title="ध्यान दें"}
इस मोड को क्लस्टर मोड से संबंधित प्लगइन के साथ उपयोग करने की आवश्यकता है। अन्यथा, एप्लिकेशन की कार्यक्षमता में असामान्य समस्याएँ आ सकती हैं।
:::

अधिक जानकारी के लिए, [क्लस्टर मोड](/cluster-mode) देखें।

### PLUGIN_PACKAGE_PREFIX

प्लगइन पैकेज प्रीफ़िक्स, डिफ़ॉल्ट रूप से `@nocobase/plugin-,@nocobase/preset-` है।

उदाहरण के लिए, `my-nocobase-app` प्रोजेक्ट में `hello` प्लगइन जोड़ने के लिए, प्लगइन का पूरा पैकेज नाम `@my-nocobase-app/plugin-hello` होगा।

PLUGIN_PACKAGE_PREFIX को इस प्रकार कॉन्फ़िगर किया जा सकता है:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

तो प्लगइन नाम और पैकेज नाम के बीच का संबंध इस प्रकार है:

- `users` प्लगइन का पैकेज नाम `@nocobase/plugin-users` है
- `nocobase` प्लगइन का पैकेज नाम `@nocobase/preset-nocobase` है
- `hello` प्लगइन का पैकेज नाम `@my-nocobase-app/plugin-hello` है

### DB_DIALECT

डेटाबेस प्रकार, विकल्पों में शामिल हैं:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

डेटाबेस होस्ट (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

डिफ़ॉल्ट मान `localhost` है।

```bash
DB_HOST=localhost
```

### DB_PORT

डेटाबेस पोर्ट (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

- MySQL, MariaDB के लिए डिफ़ॉल्ट पोर्ट 3306 है
- PostgreSQL के लिए डिफ़ॉल्ट पोर्ट 5432 है

```bash
DB_PORT=3306
```

### DB_DATABASE

डेटाबेस नाम (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

```bash
DB_DATABASE=nocobase
```

### DB_USER

डेटाबेस यूज़र (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

```bash
DB_USER=nocobase
```

### DB_PASSWORD

डेटाबेस पासवर्ड (MySQL या PostgreSQL डेटाबेस का उपयोग करते समय कॉन्फ़िगर करना आवश्यक है)।

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

डेटा टेबल प्रीफ़िक्स।

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

क्या डेटाबेस टेबल और फ़ील्ड नाम स्नेक केस स्टाइल में बदले जाते हैं, डिफ़ॉल्ट रूप से `false` है। यदि आप `lower_case_table_names=1` के साथ MySQL (MariaDB) डेटाबेस का उपयोग कर रहे हैं, तो DB_UNDERSCORED को `true` पर सेट करना अनिवार्य है।

:::warning
जब `DB_UNDERSCORED=true` होता है, तो डेटाबेस में वास्तविक टेबल और फ़ील्ड नाम UI में दिखने वाले नामों से मेल नहीं खाते हैं। उदाहरण के लिए, `orderDetails` डेटाबेस में `order_details` के रूप में संग्रहीत होगा।
:::

### DB_LOGGING

डेटाबेस लॉग स्विच, डिफ़ॉल्ट मान `off` है, विकल्पों में शामिल हैं:

- `on` चालू
- `off` बंद

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

डेटाबेस कनेक्शन पूल में अधिकतम कनेक्शन की संख्या, डिफ़ॉल्ट मान `5` है।

### DB_POOL_MIN

डेटाबेस कनेक्शन पूल में न्यूनतम कनेक्शन की संख्या, डिफ़ॉल्ट मान `0` है।

### DB_POOL_IDLE

डेटाबेस कनेक्शन पूल में निष्क्रिय रहने का अधिकतम समय, डिफ़ॉल्ट मान `10000` (10 सेकंड) है।

### DB_POOL_ACQUIRE

डेटाबेस कनेक्शन पूल में कनेक्शन प्राप्त करने के लिए अधिकतम प्रतीक्षा समय, डिफ़ॉल्ट मान `60000` (60 सेकंड) है।

### DB_POOL_EVICT

डेटाबेस कनेक्शन पूल में कनेक्शन का अधिकतम जीवनकाल, डिफ़ॉल्ट मान `1000` (1 सेकंड) है।

### DB_POOL_MAX_USES

कनेक्शन को हटाए जाने और बदलने से पहले कितनी बार उपयोग किया जा सकता है, डिफ़ॉल्ट मान `0` (कोई सीमा नहीं) है।

### LOGGER_TRANSPORT

लॉग आउटपुट तरीका, कई मानों को `,` से अलग किया जाता है। डेवलपमेंट एनवायरनमेंट में डिफ़ॉल्ट मान `console` है, प्रोडक्शन एनवायरनमेंट में `console,dailyRotateFile` है। विकल्प:

- `console` - `console.log`
- `file` - फ़ाइल
- `dailyRotateFile` - प्रतिदिन घूमने वाली फ़ाइलें

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

फ़ाइल-आधारित लॉग स्टोरेज पाथ, डिफ़ॉल्ट रूप से `storage/logs` है।

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

आउटपुट लॉग लेवल। डेवलपमेंट एनवायरनमेंट में डिफ़ॉल्ट मान `debug` है, प्रोडक्शन एनवायरनमेंट में `info` है। विकल्प:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

डेटाबेस लॉग आउटपुट लेवल `debug` है, जिसे `DB_LOGGING` द्वारा नियंत्रित किया जाता है कि आउटपुट हो या नहीं, और यह `LOGGER_LEVEL` से प्रभावित नहीं होता है।

### LOGGER_MAX_FILES

रखे जाने वाले लॉग फ़ाइलों की अधिकतम संख्या।

- जब `LOGGER_TRANSPORT` `file` हो, तो डिफ़ॉल्ट मान `10` है।
- जब `LOGGER_TRANSPORT` `dailyRotateFile` हो, तो `[n]d` का उपयोग दिनों को दर्शाने के लिए करें। डिफ़ॉल्ट मान `14d` है।

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

आकार के अनुसार लॉग रोटेशन।

- जब `LOGGER_TRANSPORT` `file` हो, तो इकाई `byte` है, डिफ़ॉल्ट मान `20971520 (20 * 1024 * 1024)` है।
- जब `LOGGER_TRANSPORT` `dailyRotateFile` हो, तो आप `[n]k`, `[n]m`, `[n]g` का उपयोग कर सकते हैं। डिफ़ॉल्ट रूप से कॉन्फ़िगर नहीं किया गया है।

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

लॉग प्रिंट फ़ॉर्मेट। डेवलपमेंट एनवायरनमेंट में डिफ़ॉल्ट `console` है, प्रोडक्शन एनवायरनमेंट में `json` है। विकल्प:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

संदर्भ: [लॉग फ़ॉर्मेट](/log-and-monitor/logger/index.md#लॉग-फ़ॉर्मेट)

### CACHE_DEFAULT_STORE

कैशिंग तरीके के लिए अद्वितीय पहचानकर्ता, सर्वर के डिफ़ॉल्ट कैश तरीके को निर्दिष्ट करता है, डिफ़ॉल्ट मान `memory` है, अंतर्निहित विकल्पों में शामिल हैं:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

मेमोरी कैश में आइटम की अधिकतम संख्या, डिफ़ॉल्ट मान `2000` है।

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redis कनेक्शन URL, वैकल्पिक। उदाहरण: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

टेलीमेट्री डेटा संग्रह सक्षम करें। डिफ़ॉल्ट रूप से `off` है।

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

सक्षम मॉनिटरिंग मेट्रिक कलेक्टर्स, डिफ़ॉल्ट रूप से `console` है। अन्य मानों को संबंधित कलेक्टर प्लगइन द्वारा पंजीकृत नामों का संदर्भ देना चाहिए, जैसे `prometheus`। कई मानों को `,` से अलग किया जाता है।

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

सक्षम ट्रेस डेटा प्रोसेसर, डिफ़ॉल्ट रूप से `console` है। अन्य मानों को संबंधित प्रोसेसर प्लगइन द्वारा पंजीकृत नामों का संदर्भ देना चाहिए। कई मानों को `,` से अलग किया जाता है।

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## प्रयोगात्मक पर्यावरण वैरिएबल

### APPEND_PRESET_LOCAL_PLUGINS

पूर्व-निर्धारित स्थानीय प्लगइन जोड़ने के लिए उपयोग किया जाता है। मान प्लगइन पैकेज नाम है (`package.json` में `name` पैरामीटर), कई प्लगइन को कॉमा से अलग किया जाता है।

:::info
1. सुनिश्चित करें कि प्लगइन स्थानीय रूप से डाउनलोड किया गया है और `node_modules` डायरेक्टरी में पाया जा सकता है। अधिक जानकारी के लिए, [प्लगइन का संगठन](/plugin-development/project-structure) देखें।
2. पर्यावरण वैरिएबल जोड़ने के बाद, प्लगइन केवल प्रारंभिक इंस्टॉलेशन (`nocobase install`) या अपग्रेड (`nocobase upgrade`) के बाद ही प्लगइन मैनेजर पेज पर दिखाई देगा।
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

अंतर्निहित प्लगइन जोड़ने के लिए उपयोग किया जाता है जो डिफ़ॉल्ट रूप से इंस्टॉल होते हैं। मान पैकेज नाम है (`package.json` में `name` पैरामीटर), कई प्लगइन को कॉमा से अलग किया जाता है।

:::info
1. सुनिश्चित करें कि प्लगइन स्थानीय रूप से डाउनलोड किया गया है और `node_modules` डायरेक्टरी में पाया जा सकता है। अधिक जानकारी के लिए, [प्लगइन का संगठन](/plugin-development/project-structure) देखें।
2. पर्यावरण वैरिएबल जोड़ने के बाद, प्लगइन प्रारंभिक इंस्टॉलेशन (`nocobase install`) या अपग्रेड (`nocobase upgrade`) के दौरान स्वचालित रूप से इंस्टॉल या अपग्रेड हो जाएगा।
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## अस्थायी पर्यावरण वैरिएबल

NocoBase इंस्टॉल करते समय, आप अस्थायी पर्यावरण वैरिएबल सेट करके इंस्टॉलेशन में सहायता कर सकते हैं, जैसे:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# इसके बराबर
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# इसके बराबर
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

इंस्टॉलेशन के समय की भाषा। डिफ़ॉल्ट मान `en-US` है। विकल्पों में शामिल हैं:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

रूट यूज़र ईमेल।

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

रूट यूज़र पासवर्ड।

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

रूट यूज़र निकनेम।

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```