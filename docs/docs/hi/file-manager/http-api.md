:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# HTTP API

अटैचमेंट फ़ील्ड और फ़ाइल संग्रह दोनों के लिए फ़ाइल अपलोड को HTTP API के ज़रिए संभाला जा सकता है। अटैचमेंट या फ़ाइल संग्रह द्वारा उपयोग किए जा रहे स्टोरेज इंजन के आधार पर, इन्हें कॉल करने के तरीके अलग-अलग होते हैं।

## सर्वर-साइड अपलोड

प्रोजेक्ट में पहले से मौजूद S3, OSS, और COS जैसे ओपन-सोर्स स्टोरेज इंजन के लिए, HTTP API कॉल और यूज़र इंटरफ़ेस अपलोड फ़ंक्शन एक जैसे ही काम करते हैं, और फ़ाइलें सर्वर के ज़रिए अपलोड होती हैं। API को कॉल करने के लिए आपको `Authorization` रिक्वेस्ट हेडर में यूज़र लॉगिन पर आधारित JWT टोकन भेजना होगा, नहीं तो एक्सेस नहीं मिलेगा।

### अटैचमेंट फ़ील्ड

`attachments` संसाधन पर `create` क्रिया शुरू करके, आप POST रिक्वेस्ट भेज सकते हैं और `file` फ़ील्ड के ज़रिए बाइनरी कंटेंट अपलोड कर सकते हैं। इस कॉल के बाद, फ़ाइल डिफ़ॉल्ट स्टोरेज इंजन में अपलोड हो जाएगी।

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

अगर आप किसी अलग स्टोरेज इंजन में फ़ाइल अपलोड करना चाहते हैं, तो आप `attachmentField` पैरामीटर का इस्तेमाल करके संग्रह फ़ील्ड के लिए कॉन्फ़िगर किए गए स्टोरेज इंजन को बता सकते हैं (अगर कोई कॉन्फ़िगरेशन नहीं है, तो यह डिफ़ॉल्ट स्टोरेज इंजन में अपलोड हो जाएगी)।

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### फ़ाइल संग्रह

किसी फ़ाइल संग्रह में अपलोड करने पर अपने आप एक फ़ाइल रिकॉर्ड बन जाता है। इसके लिए, आप फ़ाइल संग्रह संसाधन पर `create` क्रिया शुरू करें, POST रिक्वेस्ट भेजें और `file` फ़ील्ड के ज़रिए बाइनरी कंटेंट अपलोड करें।

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

फ़ाइल संग्रह में अपलोड करते समय, आपको स्टोरेज इंजन बताने की ज़रूरत नहीं होती; फ़ाइल अपने आप उस संग्रह के लिए कॉन्फ़िगर किए गए स्टोरेज इंजन में अपलोड हो जाती है।

## क्लाइंट-साइड अपलोड

कमर्शियल प्लगइन S3-Pro के ज़रिए उपलब्ध कराए गए S3-कम्पेटिबल स्टोरेज इंजन के लिए, HTTP API अपलोड को कई चरणों में करना पड़ता है।

### अटैचमेंट फ़ील्ड

1.  स्टोरेज इंजन की जानकारी प्राप्त करें

    `storages` संग्रह पर `getBasicInfo` क्रिया शुरू करें और स्टोरेज नाम के साथ स्टोरेज इंजन की कॉन्फ़िगरेशन जानकारी का अनुरोध करें।

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

    `fileStorageS3` संसाधन पर `createPresignedUrl` क्रिया शुरू करें, POST रिक्वेस्ट भेजें और बॉडी में फ़ाइल से संबंधित जानकारी शामिल करें, ताकि प्री-साइन्ड अपलोड जानकारी मिल सके।

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
    > * name: फ़ाइल का नाम
    > * size: फ़ाइल का आकार (बाइट्स में)
    > * type: फ़ाइल का MIME प्रकार। आप यहाँ देख सकते हैं: [सामान्य MIME प्रकार](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: स्टोरेज इंजन की ID (पहले चरण में लौटाई गई `id` फ़ील्ड)
    > * storageType: स्टोरेज इंजन का प्रकार (पहले चरण में लौटाई गई `type` फ़ील्ड)
    > 
    > रिक्वेस्ट डेटा का उदाहरण:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    प्राप्त प्री-साइन्ड जानकारी का डेटा स्ट्रक्चर इस प्रकार है:

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

3.  फ़ाइल अपलोड

    लौटाई गई `putUrl` का इस्तेमाल करके `PUT` रिक्वेस्ट भेजें और फ़ाइल को बॉडी के रूप में अपलोड करें।

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > ध्यान दें:
    > * putUrl: पिछले चरण में लौटाई गई `putUrl` फ़ील्ड
    > * file_path: अपलोड की जाने वाली स्थानीय फ़ाइल का पाथ
    > 
    > रिक्वेस्ट डेटा का उदाहरण:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  फ़ाइल रिकॉर्ड बनाएँ

    सफलतापूर्वक अपलोड होने के बाद, `attachments` संसाधन पर `create` क्रिया शुरू करके, POST रिक्वेस्ट भेजें और फ़ाइल रिकॉर्ड बनाएँ।

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > data-raw में निर्भर डेटा का विवरण:
    > * title: पिछले चरण में लौटाई गई `fileInfo.title` फ़ील्ड
    > * filename: पिछले चरण में लौटाई गई `fileInfo.key` फ़ील्ड
    > * extname: पिछले चरण में लौटाई गई `fileInfo.extname` फ़ील्ड
    > * path: डिफ़ॉल्ट रूप से खाली
    > * size: पिछले चरण में लौटाई गई `fileInfo.size` फ़ील्ड
    > * url: डिफ़ॉल्ट रूप से खाली
    > * mimetype: पिछले चरण में लौटाई गई `fileInfo.mimetype` फ़ील्ड
    > * meta: पिछले चरण में लौटाई गई `fileInfo.meta` फ़ील्ड
    > * storageId: पहले चरण में लौटाई गई `id` फ़ील्ड
    > 
    > रिक्वेस्ट डेटा का उदाहरण:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### फ़ाइल संग्रह

पहले तीन चरण अटैचमेंट फ़ील्ड अपलोड के जैसे ही हैं, लेकिन चौथे चरण में आपको फ़ाइल रिकॉर्ड बनाना होगा। इसके लिए, आप फ़ाइल संग्रह संसाधन पर `create` क्रिया शुरू करें, POST रिक्वेस्ट भेजें और बॉडी के ज़रिए फ़ाइल जानकारी अपलोड करें।

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> data-raw में निर्भर डेटा का विवरण:
> * title: पिछले चरण में लौटाई गई `fileInfo.title` फ़ील्ड
> * filename: पिछले चरण में लौटाई गई `fileInfo.key` फ़ील्ड
> * extname: पिछले चरण में लौटाई गई `fileInfo.extname` फ़ील्ड
> * path: डिफ़ॉल्ट रूप से खाली
> * size: पिछले चरण में लौटाई गई `fileInfo.size` फ़ील्ड
> * url: डिफ़ॉल्ट रूप से खाली
> * mimetype: पिछले चरण में लौटाई गई `fileInfo.mimetype` फ़ील्ड
> * meta: पिछले चरण में लौटाई गई `fileInfo.meta` फ़ील्ड
> * storageId: पहले चरण में लौटाई गई `id` फ़ील्ड
> 
> रिक्वेस्ट डेटा का उदाहरण:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```