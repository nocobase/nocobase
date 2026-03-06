:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/request) देखें।
:::

# ctx.request()

RunJS में प्रमाणित (authenticated) HTTP अनुरोध (request) शुरू करें। अनुरोध स्वचालित रूप से वर्तमान एप्लिकेशन के `baseURL`, `Token`, `locale`, `role` आदि को ले जाता है, और एप्लिकेशन के अनुरोध इंटरसेप्शन और त्रुटि हैंडलिंग (error handling) लॉजिक का पालन करता है।

## उपयोग के मामले (Use Cases)

RunJS में किसी भी ऐसे परिदृश्य के लिए लागू है जहाँ रिमोट HTTP अनुरोध शुरू करने की आवश्यकता होती है, जैसे JSBlock, JSField, JSItem, JSColumn, वर्कफ़्लो, लिंकेज, JSAction आदि।

## टाइप परिभाषा (Type Definition)

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions`, Axios के `AxiosRequestConfig` का विस्तार करता है:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // अनुरोध विफल होने पर क्या ग्लोबल एरर प्रॉम्प्ट को छोड़ना है
  skipAuth?: boolean;                                 // क्या प्रमाणीकरण रीडायरेक्शन को छोड़ना है (जैसे 401 पर लॉगिन पेज पर रीडायरेक्ट न करना)
};
```

## सामान्य पैरामीटर

| पैरामीटर | टाइप | विवरण |
|------|------|------|
| `url` | string | अनुरोध URL। संसाधन शैली (जैसे `users:list`, `posts:create`) या पूर्ण URL का समर्थन करता है |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | HTTP मेथड, डिफ़ॉल्ट `'get'` है |
| `params` | object | क्वेरी पैरामीटर, जो URL में सीरियलाइज़ किए जाते हैं |
| `data` | any | अनुरोध बॉडी (Request body), post/put/patch के लिए उपयोग की जाती है |
| `headers` | object | कस्टम अनुरोध हेडर |
| `skipNotify` | boolean \| (error) => boolean | यदि true है या फ़ंक्शन true लौटाता है, तो विफलता पर ग्लोबल एरर प्रॉम्प्ट पॉप अप नहीं होगा |
| `skipAuth` | boolean | यदि true है, तो 401 त्रुटियाँ आदि प्रमाणीकरण रीडायरेक्शन (जैसे लॉगिन पेज पर रीडायरेक्ट करना) को ट्रिगर नहीं करेंगी |

## संसाधन शैली (Resource Style) URL

NocoBase संसाधन API एक संक्षिप्त `संसाधन:क्रिया` (resource:action) प्रारूप का समर्थन करता है:

| प्रारूप | विवरण | उदाहरण |
|------|------|------|
| `collection:action` | एकल संग्रह (संग्रह) CRUD | `users:list`, `users:get`, `users:create`, `posts:update` |
| `collection.relation:action` | संबंधित संसाधन (इसके लिए `resourceOf` या URL के माध्यम से प्राइमरी की पास करना आवश्यक है) | `posts.comments:list` |

सापेक्ष पथ (Relative paths) एप्लिकेशन के `baseURL` (आमतौर पर `/api`) के साथ जुड़ जाएंगे; क्रॉस-ओरिजिन अनुरोधों के लिए पूर्ण URL का उपयोग किया जाना चाहिए, और लक्ष्य सेवा को CORS के साथ कॉन्फ़िगर किया जाना चाहिए।

## रिस्पॉन्स संरचना (Response Structure)

रिटर्न वैल्यू एक Axios रिस्पॉन्स ऑब्जेक्ट है। सामान्य फ़ील्ड:

- `response.data`: रिस्पॉन्स बॉडी
- सूची (List) इंटरफेस आमतौर पर `data.data` (रिकॉर्ड्स का ऐरे) + `data.meta` (पेजिनेशन आदि) लौटाते हैं
- एकल रिकॉर्ड/बनाना/अपडेट इंटरफेस आमतौर पर `data.data` में रिकॉर्ड लौटाते हैं

## उदाहरण

### सूची क्वेरी (List Query)

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // पेजिनेशन और अन्य जानकारी
```

### डेटा सबमिट करना

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'John Doe', email: 'johndoe@example.com' },
});

const newRecord = res?.data?.data;
```

### फ़िल्टरिंग और सॉर्टिंग के साथ

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### एरर नोटिफिकेशन छोड़ना

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // विफलता पर ग्लोबल मैसेज पॉप अप न करें
});

// या त्रुटि के प्रकार के आधार पर तय करें कि छोड़ना है या नहीं
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### क्रॉस-ओरिजिन अनुरोध (Cross-Origin Request)

अन्य डोमेन से अनुरोध करने के लिए पूर्ण URL का उपयोग करते समय, लक्ष्य सेवा को वर्तमान एप्लिकेशन के ऑरिजिन (origin) की अनुमति देने के लिए CORS के साथ कॉन्फ़िगर किया जाना चाहिए। यदि लक्ष्य इंटरफ़ेस को अपने स्वयं के टोकन की आवश्यकता है, तो इसे हेडर के माध्यम से पास किया जा सकता है:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <target_service_token>',
  },
});
```

### ctx.render के साथ प्रदर्शित करना

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('उपयोगकर्ता सूची') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## ध्यान देने योग्य बातें

- **त्रुटि हैंडलिंग (Error Handling)**: अनुरोध विफल होने पर एक एक्सेप्शन (exception) थ्रो होगा, और डिफ़ॉल्ट रूप से एक ग्लोबल एरर प्रॉम्प्ट पॉप अप होगा। इसे स्वयं पकड़ने और संभालने के लिए `skipNotify: true` का उपयोग करें।
- **प्रमाणीकरण (Authentication)**: समान-ओरिजिन (Same-origin) अनुरोध स्वचालित रूप से वर्तमान उपयोगकर्ता के Token, locale और role को ले जाएंगे; क्रॉस-ओरिजिन अनुरोधों के लिए लक्ष्य का CORS का समर्थन करना और आवश्यकतानुसार हेडर में टोकन पास करना आवश्यक है।
- **संसाधन अनुमतियाँ (Resource Permissions)**: अनुरोध ACL बाधाओं के अधीन हैं और केवल उन्हीं संसाधनों तक पहुँच सकते हैं जिनके लिए वर्तमान उपयोगकर्ता के पास अनुमति है।

## संबंधित

- [ctx.message](./message.md) - अनुरोध पूरा होने के बाद हल्के प्रॉम्प्ट दिखाएं
- [ctx.notification](./notification.md) - अनुरोध पूरा होने के बाद सूचनाएं दिखाएं
- [ctx.render](./render.md) - अनुरोध के परिणामों को इंटरफ़ेस पर रेंडर करें
- [ctx.makeResource](./make-resource.md) - श्रृंखलाबद्ध डेटा लोडिंग के लिए एक संसाधन ऑब्जेक्ट बनाएँ (`ctx.request` का विकल्प)