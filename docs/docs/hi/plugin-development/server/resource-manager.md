:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# रिसोर्स मैनेजर (ResourceManager)

NocoBase की रिसोर्स प्रबंधन सुविधा मौजूदा **संग्रह** (collection) और संबंधों (association) को अपने आप रिसोर्स में बदल देती है। इसमें कई अंतर्निहित ऑपरेशन प्रकार भी शामिल हैं जो डेवलपर्स को REST API रिसोर्स ऑपरेशंस को तेज़ी से बनाने में मदद करते हैं। पारंपरिक REST API से थोड़ा अलग, NocoBase के रिसोर्स ऑपरेशंस HTTP रिक्वेस्ट मेथड पर निर्भर नहीं करते हैं, बल्कि एक स्पष्ट `:action` परिभाषा के माध्यम से विशिष्ट ऑपरेशन को निर्धारित करते हैं।

## रिसोर्स को अपने आप जनरेट करना

NocoBase डेटाबेस में परिभाषित `collection` और `association` को अपने आप रिसोर्स में बदल देता है। उदाहरण के लिए, `posts` और `tags` नामक दो संग्रह परिभाषित करने पर:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

इससे अपने आप ये रिसोर्स जनरेट होंगे:

*   `posts` रिसोर्स
*   `tags` रिसोर्स
*   `posts.tags` संबंध रिसोर्स

रिक्वेस्ट के उदाहरण:

| मेथड | पाथ                     | ऑपरेशन         |
| -------- | ---------------------- | -------------- |
| `GET`  | `/api/posts:list`      | लिस्ट क्वेरी करें |
| `GET`  | `/api/posts:get/1`     | सिंगल आइटम क्वेरी करें |
| `POST` | `/api/posts:create`    | नया बनाएँ       |
| `POST` | `/api/posts:update/1`  | अपडेट करें      |
| `POST` | `/api/posts:destroy/1` | डिलीट करें      |

| मेथड | पाथ                   | ऑपरेशन         |
| -------- | --------------------- | -------------- |
| `GET`  | `/api/tags:list`      | लिस्ट क्वेरी करें |
| `GET`  | `/api/tags:get/1`     | सिंगल आइटम क्वेरी करें |
| `POST` | `/api/tags:create`    | नया बनाएँ       |
| `POST` | `/api/tags:update/1`  | अपडेट करें      |
| `POST` | `/api/tags:destroy/1` | डिलीट करें      |

| मेथड | पाथ                             | ऑपरेशन                               |
| -------- | ------------------------------ | ------------------------------------ |
| `GET`  | `/api/posts/1/tags:list`       | किसी `post` से जुड़े सभी `tags` क्वेरी करें |
| `GET`  | `/api/posts/1/tags:get/1`      | किसी `post` के तहत एक सिंगल `tag` क्वेरी करें |
| `POST` | `/api/posts/1/tags:create`     | किसी `post` के तहत एक सिंगल `tag` बनाएँ |
| `POST` | `/api/posts/1/tags:update/1`   | किसी `post` के तहत एक सिंगल `tag` अपडेट करें |
| `POST` | `/api/posts/1/tags:destroy/1`  | किसी `post` के तहत एक सिंगल `tag` डिलीट करें |
| `POST` | `/api/posts/1/tags:add`        | किसी `post` में संबंधित `tags` जोड़ें |
| `POST` | `/api/posts/1/tags:remove`     | किसी `post` से संबंधित `tags` हटाएँ |
| `POST` | `/api/posts/1/tags:set`        | किसी `post` के लिए सभी संबंधित `tags` सेट करें |
| `POST` | `/api/posts/1/tags:toggle`     | किसी `post` के लिए `tags` संबंध टॉगल करें |

:::tip सुझाव

NocoBase के रिसोर्स ऑपरेशंस सीधे रिक्वेस्ट मेथड पर निर्भर नहीं करते हैं, बल्कि स्पष्ट `:action` परिभाषाओं के माध्यम से ऑपरेशंस को निर्धारित करते हैं।

:::

## रिसोर्स ऑपरेशंस

NocoBase विभिन्न व्यावसायिक ज़रूरतों को पूरा करने के लिए कई अंतर्निहित ऑपरेशन प्रकार प्रदान करता है।

### बेसिक CRUD ऑपरेशंस

| ऑपरेशन का नाम   | विवरण                                  | लागू रिसोर्स प्रकार | रिक्वेस्ट मेथड | उदाहरण पाथ                |
| ---------------- | --------------------------------------- | ------------------ | -------------- | --------------------------- |
| `list`           | लिस्ट डेटा क्वेरी करें                   | सभी               | GET/POST       | `/api/posts:list`           |
| `get`            | सिंगल डेटा क्वेरी करें                   | सभी               | GET/POST       | `/api/posts:get/1`          |
| `create`         | नया रिकॉर्ड बनाएँ                       | सभी               | POST           | `/api/posts:create`         |
| `update`         | रिकॉर्ड अपडेट करें                       | सभी               | POST           | `/api/posts:update/1`       |
| `destroy`        | रिकॉर्ड डिलीट करें                       | सभी               | POST           | `/api/posts:destroy/1`      |
| `firstOrCreate`  | पहला रिकॉर्ड ढूँढें, अगर मौजूद नहीं है तो बनाएँ | सभी               | POST           | `/api/users:firstOrCreate`  |
| `updateOrCreate` | रिकॉर्ड अपडेट करें, अगर मौजूद नहीं है तो बनाएँ | सभी               | POST           | `/api/users:updateOrCreate` |

### संबंध ऑपरेशंस

| ऑपरेशन का नाम | विवरण               | लागू संबंध प्रकार                                   | उदाहरण पाथ                   |
| -------------- | ------------------ | ------------------------------------------------- | ------------------------------ |
| `add`          | संबंध जोड़ें       | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`       | संबंध हटाएँ       | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | संबंध रीसेट करें   | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | संबंध जोड़ें या हटाएँ | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### ऑपरेशन पैरामीटर्स

सामान्य ऑपरेशन पैरामीटर्स में शामिल हैं:

*   `filter`: क्वेरी की शर्तें
*   `values`: सेट किए जाने वाले मान
*   `fields`: लौटाए जाने वाले फ़ील्ड निर्दिष्ट करें
*   `appends`: संबंधित डेटा शामिल करें
*   `except`: फ़ील्ड को बाहर करें
*   `sort`: सॉर्टिंग नियम
*   `page`, `pageSize`: पेजिंग पैरामीटर्स
*   `paginate`: क्या पेजिंग सक्षम करनी है
*   `tree`: क्या ट्री स्ट्रक्चर लौटाना है
*   `whitelist`, `blacklist`: फ़ील्ड व्हाइटलिस्ट/ब्लैकलिस्ट
*   `updateAssociationValues`: क्या संबंध मानों को अपडेट करना है

---

## कस्टम रिसोर्स ऑपरेशंस

NocoBase मौजूदा रिसोर्स के लिए अतिरिक्त ऑपरेशंस रजिस्टर करने की अनुमति देता है। आप सभी या विशिष्ट रिसोर्स के लिए ऑपरेशंस को कस्टमाइज़ करने के लिए `registerActionHandlers` का उपयोग कर सकते हैं।

### ग्लोबल ऑपरेशंस रजिस्टर करें

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### रिसोर्स-विशिष्ट ऑपरेशंस रजिस्टर करें

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

रिक्वेस्ट के उदाहरण:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

नामकरण नियम: `resourceName:actionName`, संबंध शामिल करते समय डॉट सिंटैक्स (`posts.comments`) का उपयोग करें।

## कस्टम रिसोर्स

यदि आपको ऐसे रिसोर्स प्रदान करने की आवश्यकता है जो संग्रह से संबंधित नहीं हैं, तो आप उन्हें परिभाषित करने के लिए `resourceManager.define` मेथड का उपयोग कर सकते हैं:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

रिक्वेस्ट मेथड स्वचालित रूप से जनरेट किए गए रिसोर्स के समान हैं:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (डिफ़ॉल्ट रूप से GET/POST दोनों को सपोर्ट करता है)

## कस्टम मिडलवेयर

ग्लोबल मिडलवेयर रजिस्टर करने के लिए `resourceManager.use()` मेथड का उपयोग करें। उदाहरण के लिए:

ग्लोबल लॉगिंग मिडलवेयर

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## विशेष कॉन्टेक्स्ट प्रॉपर्टीज़

`resourceManager` लेयर के मिडलवेयर या एक्शन में प्रवेश करने का मतलब है कि रिसोर्स निश्चित रूप से मौजूद है।

### ctx.action

*   `ctx.action.actionName`: ऑपरेशन का नाम
*   `ctx.action.resourceName`: यह एक संग्रह या संबंध हो सकता है
*   `ctx.action.params`: ऑपरेशन पैरामीटर्स

### ctx.dataSource

वर्तमान **डेटा स्रोत** ऑब्जेक्ट।

### ctx.getCurrentRepository()

वर्तमान रिपॉजिटरी ऑब्जेक्ट।

## विभिन्न डेटा स्रोत के लिए रिसोर्समैनेजर ऑब्जेक्ट कैसे प्राप्त करें

`resourceManager` एक **डेटा स्रोत** से संबंधित है, और विभिन्न **डेटा स्रोत** के लिए ऑपरेशंस को अलग-अलग रजिस्टर किया जा सकता है।

### मुख्य डेटा स्रोत

मुख्य **डेटा स्रोत** के लिए, आप सीधे `app.resourceManager` का उपयोग करके ऑपरेशंस कर सकते हैं:

```ts
app.resourceManager.registerActionHandlers();
```

### अन्य डेटा स्रोत

अन्य **डेटा स्रोत** के लिए, आप `dataSourceManager` के माध्यम से एक विशिष्ट **डेटा स्रोत** इंस्टेंस प्राप्त कर सकते हैं और उस इंस्टेंस के `resourceManager` का उपयोग करके ऑपरेशंस कर सकते हैं:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### सभी डेटा स्रोत पर इटरेट करें

यदि आपको सभी जोड़े गए **डेटा स्रोत** पर समान ऑपरेशंस करने की आवश्यकता है, तो आप इटरेट करने के लिए `dataSourceManager.afterAddDataSource` मेथड का उपयोग कर सकते हैं, यह सुनिश्चित करते हुए कि प्रत्येक **डेटा स्रोत** का `resourceManager` संबंधित ऑपरेशंस को रजिस्टर कर सके:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```