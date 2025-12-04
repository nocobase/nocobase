:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# HTTP API

अटैचमेंट फ़ील्ड और फ़ाइल संग्रह दोनों के लिए फ़ाइल अपलोड को HTTP API का उपयोग करके संभाला जा सकता है। अटैचमेंट या फ़ाइल संग्रह द्वारा उपयोग किए जाने वाले स्टोरेज इंजन के आधार पर, इन्हें कॉल करने के तरीके अलग-अलग होते हैं।

## सर्वर-साइड अपलोड

S3, OSS, और COS जैसे इन-बिल्ट ओपन-सोर्स स्टोरेज इंजन के लिए, HTTP API कॉल यूज़र इंटरफ़ेस अपलोड फ़ीचर के समान ही काम करता है, जहाँ फ़ाइलें सर्वर के माध्यम से अपलोड की जाती हैं। API कॉल के लिए आपको `Authorization` रिक्वेस्ट हेडर में यूज़र लॉगिन-आधारित JWT टोकन पास करना होगा, अन्यथा एक्सेस अस्वीकृत कर दिया जाएगा।

### अटैचमेंट फ़ील्ड

अटैचमेंट रिसोर्स (`attachments`) पर `create` ऑपरेशन शुरू करके, POST रिक्वेस्ट भेजें और `file` फ़ील्ड के माध्यम से बाइनरी कंटेंट अपलोड करें। इस कॉल के बाद, फ़ाइल डिफ़ॉल्ट स्टोरेज इंजन में अपलोड हो जाएगी।

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

यदि आप फ़ाइलों को किसी अन्य स्टोरेज इंजन में अपलोड करना चाहते हैं, तो आप `attachmentField` पैरामीटर का उपयोग करके उस स्टोरेज इंजन को निर्दिष्ट कर सकते हैं जो संग्रह फ़ील्ड के लिए कॉन्फ़िगर किया गया है। यदि कोई कॉन्फ़िगरेशन नहीं है, तो फ़ाइल डिफ़ॉल्ट स्टोरेज इंजन में अपलोड हो जाएगी।

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### फ़ाइल संग्रह

फ़ाइल संग्रह में अपलोड करने पर स्वचालित रूप से एक फ़ाइल रिकॉर्ड बन जाएगा। इसके लिए, फ़ाइल संग्रह रिसोर्स पर `create` ऑपरेशन शुरू करें, POST रिक्वेस्ट भेजें और `file` फ़ील्ड के माध्यम से बाइनरी कंटेंट अपलोड करें।

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

फ़ाइल संग्रह में अपलोड करते समय, आपको स्टोरेज इंजन निर्दिष्ट करने की आवश्यकता नहीं होती है; फ़ाइल उस संग्रह के लिए कॉन्फ़िगर किए गए स्टोरेज इंजन में अपने आप अपलोड हो जाएगी।

## क्लाइंट-साइड अपलोड

कमर्शियल S3-Pro प्लगइन के माध्यम से उपलब्ध S3-संगत स्टोरेज इंजन के लिए, HTTP API अपलोड को कई चरणों में कॉल करना पड़ता है।

### अटैचमेंट फ़ील्ड

1.  स्टोरेज इंजन की जानकारी प्राप्त करें

    स्टोरेज संग्रह (`storages`) पर `getBasicInfo` ऑपरेशन शुरू करें। इसमें स्टोरेज नाम (storage name) भी शामिल करें, ताकि स्टोरेज इंजन की कॉन्फ़िगरेशन जानकारी का अनुरोध किया जा सके।

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    लौटाई गई स्टोरेज इंजन कॉन्फ़िगरेशन जानकारी का उदाहरण:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  सेवा प्रदाता से प्री-साइन्ड जानकारी प्राप्त करें

    `fileStorageS3` रिसोर्स पर `createPresignedUrl` ऑपरेशन शुरू करें। POST रिक्वेस्ट भेजते समय, बॉडी में फ़ाइल से संबंधित जानकारी शामिल करें, ताकि प्री-साइन्ड अपलोड जानकारी प्राप्त की जा सके।

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > ध्यान दें:
    >
    > *   `name`: फ़ाइल का नाम
    > *   `size`: फ़ाइल का आकार (बाइट्स में)
    > *   `type`: फ़ाइल का MIME प्रकार। आप [सामान्य MIME प्रकार](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types) का संदर्भ ले सकते हैं।
    > *   `storageId`: स्टोरेज इंजन की ID (पहले चरण में लौटाई गई `id` फ़ील्ड)।
    > *   `storageType`: स्टोरेज इंजन का प्रकार (पहले चरण में लौटाई गई `type` फ़ील्ड)।
    >
    > रिक्वेस्ट डेटा का उदाहरण:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    प्राप्त प्री-साइन्ड जानकारी की डेटा संरचना इस प्रकार है:

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  फ़ाइल अपलोड करें

    लौटाई गई `putUrl` का उपयोग करके `PUT` रिक्वेस्ट भेजें और फ़ाइल को बॉडी के रूप में अपलोड करें।

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > ध्यान दें:
    >
    > *   `putUrl`: पिछले चरण में लौटाई गई `putUrl` फ़ील्ड।
    > *   `file_path`: अपलोड की जाने वाली स्थानीय फ़ाइल का पाथ।
    >
    > रिक्वेस्ट डेटा का उदाहरण:
    >
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  फ़ाइल रिकॉर्ड बनाएँ

    सफल अपलोड के बाद, अटैचमेंट रिसोर्स (`attachments`) पर `create` ऑपरेशन शुरू करके, POST रिक्वेस्ट के माध्यम से फ़ाइल रिकॉर्ड बनाएँ।

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > `data-raw` में निर्भर डेटा का स्पष्टीकरण:
    >
    > *   `title`: पिछले चरण में लौटाई गई `fileInfo.title` फ़ील्ड।
    > *   `filename`: पिछले चरण में लौटाई गई `fileInfo.key` फ़ील्ड।
    > *   `extname`: पिछले चरण में लौटाई गई `fileInfo.extname` फ़ील्ड।
    > *   `path`: डिफ़ॉल्ट रूप से खाली।
    > *   `size`: पिछले चरण में लौटाई गई `fileInfo.size` फ़ील्ड।
    > *   `url`: डिफ़ॉल्ट रूप से खाली।
    > *   `mimetype`: पिछले चरण में लौटाई गई `fileInfo.mimetype` फ़ील्ड।
    > *   `meta`: पिछले चरण में लौटाई गई `fileInfo.meta` फ़ील्ड।
    > *   `storageId`: पहले चरण में लौटाई गई `id` फ़ील्ड।
    >
    > रिक्वेस्ट डेटा का उदाहरण:
    >
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### फ़ाइल संग्रह

पहले तीन चरण अटैचमेंट फ़ील्ड में अपलोड करने के समान ही हैं। हालाँकि, चौथे चरण में, आपको फ़ाइल रिकॉर्ड बनाना होगा। इसके लिए, फ़ाइल संग्रह रिसोर्स पर `create` ऑपरेशन शुरू करें, POST रिक्वेस्ट भेजें और बॉडी में फ़ाइल की जानकारी अपलोड करें।

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> `data-raw` में निर्भर डेटा का स्पष्टीकरण:
>
> *   `title`: पिछले चरण में लौटाई गई `fileInfo.title` फ़ील्ड।
> *   `filename`: पिछले चरण में लौटाई गई `fileInfo.key` फ़ील्ड।
> *   `extname`: पिछले चरण में लौटाई गई `fileInfo.extname` फ़ील्ड।
> *   `path`: डिफ़ॉल्ट रूप से खाली।
> *   `size`: पिछले चरण में लौटाई गई `fileInfo.size` फ़ील्ड।
> *   `url`: डिफ़ॉल्ट रूप से खाली।
> *   `mimetype`: पिछले चरण में लौटाई गई `fileInfo.mimetype` फ़ील्ड।
> *   `meta`: पिछले चरण में लौटाई गई `fileInfo.meta` फ़ील्ड।
> *   `storageId`: पहले चरण में लौटाई गई `id` फ़ील्ड।
>
> रिक्वेस्ट डेटा का उदाहरण:
>
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```