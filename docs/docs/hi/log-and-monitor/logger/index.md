---
pkg: "@nocobase/plugin-logger"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::



pkg: '@nocobase/plugin-logger'
---

# लॉगिंग

## परिचय

लॉग सिस्टम की समस्याओं का पता लगाने में हमारी मदद करने का एक महत्वपूर्ण साधन हैं। NocoBase के सर्वर लॉग में मुख्य रूप से इंटरफ़ेस अनुरोध लॉग और सिस्टम ऑपरेशन लॉग शामिल होते हैं, जो लॉग स्तर, रोलिंग रणनीति, आकार, प्रिंटिंग प्रारूप और अन्य कॉन्फ़िगरेशन का समर्थन करते हैं। यह दस्तावेज़ मुख्य रूप से NocoBase सर्वर लॉग से संबंधित सामग्री और लॉगिंग प्लगइन द्वारा प्रदान की गई सर्वर लॉग को पैकेज करने और डाउनलोड करने की कार्यक्षमता का परिचय देता है।

## लॉग कॉन्फ़िगरेशन

लॉग स्तर, आउटपुट विधि और प्रिंटिंग प्रारूप जैसे लॉग-संबंधित पैरामीटर [पर्यावरण चर](/get-started/installation/env.md#logger_transport) के माध्यम से कॉन्फ़िगर किए जा सकते हैं।

## लॉग प्रारूप

NocoBase चार अलग-अलग लॉग प्रारूपों को कॉन्फ़िगर करने का समर्थन करता है।

### `console`

डेवलपमेंट वातावरण में डिफ़ॉल्ट प्रारूप, संदेशों को हाइलाइट किए गए रंगों में प्रदर्शित किया जाता है।

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

प्रोडक्शन वातावरण में डिफ़ॉल्ट प्रारूप।

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

डिलिमिटर `|` द्वारा अलग किया गया।

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## लॉग निर्देशिका

NocoBase लॉग फ़ाइलों की मुख्य निर्देशिका संरचना इस प्रकार है:

-   `storage/logs` - लॉग आउटपुट निर्देशिका
    -   `main` - मुख्य एप्लिकेशन नाम
        -   `request_YYYY-MM-DD.log` - अनुरोध लॉग
        -   `system_YYYY-MM-DD.log` - सिस्टम लॉग
        -   `system_error_YYYY-MM-DD.log` - सिस्टम त्रुटि लॉग
        -   `sql_YYYY-MM-DD.log` - SQL निष्पादन लॉग
        -   ...
    -   `sub-app` - उप-एप्लिकेशन नाम
        -   `request_YYYY-MM-DD.log`
        -   ...

## लॉग फ़ाइलें

### अनुरोध लॉग

`request_YYYY-MM-DD.log`, इंटरफ़ेस अनुरोध और प्रतिक्रिया लॉग।

| फ़ील्ड         | विवरण                               |
| ------------- | ------------------------------------ |
| `level`       | लॉग स्तर                            |
| `timestamp`   | लॉग प्रिंट समय `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` या `response`              |
| `userId`      | केवल `response` में                  |
| `method`      | अनुरोध विधि                         |
| `path`        | अनुरोध पथ                           |
| `req` / `res` | अनुरोध/प्रतिक्रिया सामग्री           |
| `action`      | अनुरोधित संसाधन और पैरामीटर         |
| `status`      | प्रतिक्रिया स्थिति कोड               |
| `cost`        | अनुरोध अवधि                         |
| `app`         | वर्तमान एप्लिकेशन नाम               |
| `reqId`       | अनुरोध ID                           |

:::info{title=टिप}
`reqId` को `X-Request-Id` रिस्पांस हेडर के माध्यम से फ्रंटएंड पर भेजा जाएगा।
:::

### सिस्टम लॉग

`system_YYYY-MM-DD.log`, एप्लिकेशन, मिडलवेयर, प्लगइन और अन्य सिस्टम ऑपरेशन लॉग, `error` स्तर के लॉग `system_error_YYYY-MM-DD.log` में अलग से प्रिंट किए जाएंगे।

| फ़ील्ड       | विवरण                               |
| ----------- | ------------------------------------ |
| `level`     | लॉग स्तर                            |
| `timestamp` | लॉग प्रिंट समय `YYYY-MM-DD hh:mm:ss` |
| `message`   | लॉग संदेश                           |
| `module`    | मॉड्यूल                             |
| `submodule` | सबमॉड्यूल                           |
| `method`    | कॉल की गई विधि                       |
| `meta`      | अन्य संबंधित जानकारी, JSON प्रारूप   |
| `app`       | वर्तमान एप्लिकेशन नाम               |
| `reqId`     | अनुरोध ID                           |

### SQL निष्पादन लॉग

`sql_YYYY-MM-DD.log`, डेटाबेस SQL निष्पादन लॉग। `INSERT INTO` स्टेटमेंट केवल पहले 2000 वर्णों तक सीमित हैं।

| फ़ील्ड       | विवरण                               |
| ----------- | ------------------------------------ |
| `level`     | लॉग स्तर                            |
| `timestamp` | लॉग प्रिंट समय `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL स्टेटमेंट                        |
| `app`       | वर्तमान एप्लिकेशन नाम               |
| `reqId`     | अनुरोध ID                           |

## लॉग पैकेजिंग और डाउनलोडिंग

1.  लॉग प्रबंधन पृष्ठ पर जाएँ।
2.  उन लॉग फ़ाइलों का चयन करें जिन्हें आप डाउनलोड करना चाहते हैं।
3.  डाउनलोड (Download) बटन पर क्लिक करें।

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## संबंधित दस्तावेज़

-   [प्लगइन डेवलपमेंट - सर्वर - लॉगिंग](/plugin-development/server/logger)
-   [API संदर्भ - @nocobase/logger](/api/logger/logger)