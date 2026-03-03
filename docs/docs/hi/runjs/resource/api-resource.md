:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/resource/api-resource) देखें।
:::

# APIResource

URL के आधार पर अनुरोध (request) करने के लिए एक **सामान्य API संसाधन (Generic API Resource)**, जो किसी भी HTTP इंटरफ़ेस के लिए उपयुक्त है। यह `FlowResource` बेस क्लास से इनहेरिट करता है और इसमें अनुरोध कॉन्फ़िगरेशन और `refresh()` की सुविधा जोड़ी गई है। [MultiRecordResource](./multi-record-resource.md) और [SingleRecordResource](./single-record-resource.md) के विपरीत, APIResource किसी संसाधन नाम (resource name) पर निर्भर नहीं करता है; यह सीधे URL द्वारा अनुरोध करता है, जो इसे कस्टम इंटरफ़ेस, थर्ड-पार्टी API और अन्य परिदृश्यों के लिए उपयुक्त बनाता है।

**बनाने का तरीका**: `ctx.makeResource('APIResource')` या `ctx.initResource('APIResource')`। उपयोग करने से पहले आपको `setURL()` सेट करना होगा; RunJS कॉन्टेक्स्ट में `ctx.api` (APIClient) अपने आप इंजेक्ट हो जाता है, इसलिए मैन्युअल रूप से `setAPIClient` करने की आवश्यकता नहीं है।

---

## उपयोग के मामले (Use Cases)

| परिदृश्य | विवरण |
|------|------|
| **कस्टम इंटरफ़ेस** | गैर-मानक संसाधन API को कॉल करना (जैसे, `/api/custom/stats`, `/api/reports/summary`) |
| **थर्ड-पार्टी API** | पूर्ण URL के माध्यम से बाहरी सेवाओं से अनुरोध करना (लक्ष्य द्वारा CORS समर्थित होना आवश्यक है) |
| **एक बार की क्वेरी** | अस्थायी डेटा प्राप्त करना जिसे `ctx.resource` से बाइंड करने की आवश्यकता नहीं है |
| **APIResource और ctx.request के बीच चुनाव** | जब रिएक्टिव डेटा, इवेंट या एरर स्टेट्स की आवश्यकता हो, तब APIResource का उपयोग करें; सरल एक-बार के अनुरोधों के लिए `ctx.request()` का उपयोग किया जा सकता है |

---

## बेस क्लास की क्षमताएं (FlowResource)

सभी संसाधनों (Resources) में निम्नलिखित क्षमताएं होती हैं:

| मेथड | विवरण |
|------|------|
| `getData()` | वर्तमान डेटा प्राप्त करें |
| `setData(value)` | डेटा सेट करें (केवल स्थानीय रूप से) |
| `hasData()` | क्या डेटा मौजूद है |
| `getMeta(key?)` / `setMeta(meta)` | मेटाडेटा पढ़ें/लिखें |
| `getError()` / `setError(err)` / `clearError()` | एरर स्टेट मैनेजमेंट |
| `on(event, callback)` / `once` / `off` / `emit` | इवेंट सब्सक्रिप्शन और ट्रिगरिंग |

---

## अनुरोध कॉन्फ़िगरेशन (Request Configuration)

| मेथड | विवरण |
|------|------|
| `setAPIClient(api)` | APIClient इंस्टेंस सेट करें (RunJS में आमतौर पर कॉन्टेक्स्ट द्वारा स्वचालित रूप से इंजेक्ट किया जाता है) |
| `getURL()` / `setURL(url)` | अनुरोध URL |
| `loading` | लोडिंग स्थिति पढ़ें/लिखें (get/set) |
| `clearRequestParameters()` | अनुरोध पैरामीटर साफ़ करें |
| `setRequestParameters(params)` | अनुरोध पैरामीटर मर्ज करें और सेट करें |
| `setRequestMethod(method)` | अनुरोध विधि सेट करें (जैसे, `'get'`, `'post'`, डिफ़ॉल्ट `'get'` है) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | अनुरोध हेडर |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | एकल पैरामीटर जोड़ें, हटाएं या क्वेरी करें |
| `setRequestBody(data)` | रिक्वेस्ट बॉडी (POST/PUT/PATCH के दौरान उपयोग किया जाता है) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | सामान्य अनुरोध विकल्प |

---

## URL प्रारूप (URL Format)

- **संसाधन शैली (Resource Style)**: NocoBase संसाधन शॉर्टहैंड का समर्थन करता है, जैसे `users:list`, `posts:get`, जिसे `baseURL` के साथ जोड़ा जाएगा।
- **सापेक्ष पथ (Relative Path)**: जैसे `/api/custom/endpoint`, जो एप्लिकेशन के `baseURL` के साथ जोड़ा जाता है।
- **पूर्ण URL (Full URL)**: क्रॉस-ओरिजिन अनुरोधों के लिए पूर्ण पते का उपयोग करें; लक्ष्य पर CORS कॉन्फ़िगर होना चाहिए।

---

## डेटा प्राप्त करना (Data Fetching)

| मेथड | विवरण |
|------|------|
| `refresh()` | वर्तमान URL, मेथड, पैरामीटर, हेडर और डेटा के आधार पर अनुरोध शुरू करता है। यह रिस्पॉन्स `data` को `setData(data)` में लिखता है और `'refresh'` इवेंट को ट्रिगर करता है। विफलता पर, यह `setError(err)` सेट करता है और `ResourceError` थ्रो करता है, और `refresh` इवेंट ट्रिगर नहीं होता है। इसके लिए `api` और URL सेट होना आवश्यक है। |

---

## उदाहरण

### बुनियादी GET अनुरोध

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### संसाधन शैली URL

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST अनुरोध (रिक्वेस्ट बॉडी के साथ)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'परीक्षण', type: 'report' });
await res.refresh();
const result = res.getData();
```

### refresh इवेंट को सुनना

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>सांख्यिकी: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### एरर हैंडलिंग

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'अनुरोध विफल रहा');
}
```

### कस्टम अनुरोध हेडर

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## ध्यान देने योग्य बातें

- **ctx.api निर्भरता**: RunJS में `ctx.api` वातावरण द्वारा इंजेक्ट किया जाता है, आमतौर पर मैन्युअल `setAPIClient` की आवश्यकता नहीं होती है; यदि बिना कॉन्टेक्स्ट वाले परिदृश्य में उपयोग किया जाता है, तो आपको इसे स्वयं सेट करना होगा।
- **Refresh का अर्थ अनुरोध है**: `refresh()` वर्तमान कॉन्फ़िगरेशन के आधार पर एक अनुरोध शुरू करता है; मेथड, पैरामीटर, डेटा आदि को कॉल करने से पहले कॉन्फ़िगर किया जाना चाहिए।
- **एरर होने पर डेटा अपडेट नहीं होता**: अनुरोध विफल होने पर `getData()` अपना पिछला मान बनाए रखता है; एरर की जानकारी `getError()` के माध्यम से प्राप्त की जा सकती है।
- **ctx.request के साथ तुलना**: सरल एक-बार के अनुरोधों के लिए `ctx.request()` का उपयोग करें; जब रिएक्टिव डेटा, इवेंट और एरर स्टेट मैनेजमेंट की आवश्यकता हो, तब APIResource का उपयोग करें।

---

## संबंधित

- [ctx.resource](../context/resource.md) - वर्तमान कॉन्टेक्स्ट में संसाधन इंस्टेंस
- [ctx.initResource()](../context/init-resource.md) - इनिशियलाइज़ करें और `ctx.resource` से बाइंड करें
- [ctx.makeResource()](../context/make-resource.md) - बिना बाइंड किए एक नया संसाधन इंस्टेंस बनाएं
- [ctx.request()](../context/request.md) - सामान्य HTTP अनुरोध, सरल एक-बार की कॉल के लिए उपयुक्त
- [MultiRecordResource](./multi-record-resource.md) - डेटा तालिकाओं/सूचियों के लिए, CRUD और पेजिनेशन का समर्थन करता है
- [SingleRecordResource](./single-record-resource.md) - एकल रिकॉर्ड के लिए