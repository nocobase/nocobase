:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/resource/single-record-resource) देखें।
:::

# SingleRecordResource

**एकल रिकॉर्ड (single record)** के लिए रिसोर्स: डेटा एक एकल ऑब्जेक्ट होता है, जो प्राथमिक कुंजी (primary key) द्वारा प्राप्त करने, बनाने/अपडेट करने (save) और हटाने का समर्थन करता है। यह विवरण (details), फ़ॉर्म (forms) जैसे "एकल रिकॉर्ड" परिदृश्यों के लिए उपयुक्त है। [MultiRecordResource](./multi-record-resource.md) के विपरीत, SingleRecordResource का `getData()` एक एकल ऑब्जेक्ट लौटाता है, `setFilterByTk(id)` के माध्यम से प्राथमिक कुंजी निर्दिष्ट की जाती है, और `save()` स्वचालित रूप से `isNewRecord` के आधार पर create या update को कॉल करता है।

**विरासत (Inheritance)**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource।

**बनाने का तरीका**: `ctx.makeResource('SingleRecordResource')` या `ctx.initResource('SingleRecordResource')`। उपयोग करने से पहले `setResourceName('संग्रह का नाम')` कॉल करना आवश्यक है; प्राथमिक कुंजी द्वारा ऑपरेशन करते समय `setFilterByTk(id)` का उपयोग करें; RunJS में `ctx.api` रनटाइम वातावरण द्वारा इंजेक्ट किया जाता है।

---

## उपयोग के परिदृश्य

| परिदृश्य | विवरण |
|------|------|
| **विवरण ब्लॉक (Details Block)** | विवरण ब्लॉक डिफ़ॉल्ट रूप से SingleRecordResource का उपयोग करता है, जो प्राथमिक कुंजी द्वारा एकल रिकॉर्ड लोड करता है। |
| **फ़ॉर्म ब्लॉक (Form Block)** | फ़ॉर्म बनाने/संपादित करने के लिए SingleRecordResource का उपयोग किया जाता है, जहाँ `save()` स्वचालित रूप से create और update के बीच अंतर करता है। |
| **JSBlock विवरण** | JSBlock में एकल उपयोगकर्ता, ऑर्डर आदि लोड करने और डिस्प्ले को कस्टमाइज़ करने के लिए। |
| **एसोसिएशन रिसोर्स** | `users.profile` जैसे प्रारूप में संबंधित एकल रिकॉर्ड लोड करने के लिए, जिसके लिए `setSourceId(पैरेंट रिकॉर्ड ID)` की आवश्यकता होती है। |

---

## डेटा प्रारूप

- `getData()` एक **एकल रिकॉर्ड ऑब्जेक्ट** लौटाता है, जो get API प्रतिक्रिया के `data` फ़ील्ड के अनुरूप होता है।
- `getMeta()` मेटा-जानकारी लौटाता है (यदि उपलब्ध हो)।

---

## रिसोर्स का नाम और प्राथमिक कुंजी

| विधि (Method) | विवरण |
|------|------|
| `setResourceName(name)` / `getResourceName()` | रिसोर्स का नाम, जैसे `'users'`, `'users.profile'` (एसोसिएशन रिसोर्स)। |
| `setSourceId(id)` / `getSourceId()` | एसोसिएशन रिसोर्स के लिए पैरेंट रिकॉर्ड ID (जैसे `users.profile` के लिए `users` की प्राथमिक कुंजी आवश्यक है)। |
| `setDataSourceKey(key)` / `getDataSourceKey()` | डेटा स्रोत पहचानकर्ता (मल्टी-डेटा स्रोत वातावरण में उपयोग किया जाता है)। |
| `setFilterByTk(tk)` / `getFilterByTk()` | वर्तमान रिकॉर्ड की प्राथमिक कुंजी; सेट होने के बाद `isNewRecord` फ़ॉल्स (false) हो जाता है। |

---

## स्थिति (State)

| प्रॉपर्टी/विधि | विवरण |
|----------|------|
| `isNewRecord` | क्या यह "नई" स्थिति में है (यदि `filterByTk` सेट नहीं है या अभी बनाया गया है, तो यह true होता है)। |

---

## अनुरोध पैरामीटर (फ़िल्टर / फ़ील्ड्स)

| विधि | विवरण |
|------|------|
| `setFilter(filter)` / `getFilter()` | फ़िल्टर (नई स्थिति में न होने पर उपलब्ध)। |
| `setFields(fields)` / `getFields()` | अनुरोधित फ़ील्ड्स। |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | एसोसिएशन विस्तार (appends)। |

---

## CRUD

| विधि | विवरण |
|------|------|
| `refresh()` | वर्तमान `filterByTk` के आधार पर get अनुरोध करता है और `getData()` को अपडेट करता है; "नई" स्थिति में यह अनुरोध नहीं करता है। |
| `save(data, options?)` | नई स्थिति में होने पर create को कॉल करता है, अन्यथा update को; वैकल्पिक `{ refresh: false }` स्वचालित रिफ्रेश को रोकता है। |
| `destroy(options?)` | वर्तमान `filterByTk` के आधार पर रिकॉर्ड हटाता है और स्थानीय डेटा साफ़ करता है। |
| `runAction(actionName, options)` | किसी भी रिसोर्स एक्शन को कॉल करता है। |

---

## कॉन्फ़िगरेशन और इवेंट्स

| विधि | विवरण |
|------|------|
| `setSaveActionOptions(options)` | save एक्शन के लिए अनुरोध कॉन्फ़िगरेशन। |
| `on('refresh', fn)` / `on('saved', fn)` | रिफ्रेश पूरा होने या सेव होने के बाद ट्रिगर होता है। |

---

## उदाहरण

### बुनियादी प्राप्ति और अपडेट

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// अपडेट करें
await ctx.resource.save({ name: 'राम' });
```

### नया रिकॉर्ड बनाना

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'श्याम', email: 'shyam@example.com' });
```

### रिकॉर्ड हटाना

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// destroy के बाद getData() null लौटाता है
```

### एसोसिएशन विस्तार और फ़ील्ड्स

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### एसोसिएशन रिसोर्स (जैसे users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // पैरेंट रिकॉर्ड की प्राथमिक कुंजी
res.setFilterByTk(profileId);    // यदि profile एक hasOne संबंध है, तो filterByTk छोड़ा जा सकता है
await res.refresh();
const profile = res.getData();
```

### बिना ऑटो-रिफ्रेश के सेव करना

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// सेव करने के बाद रिफ्रेश ट्रिगर नहीं होता है, इसलिए getData() पुराना मान ही रखता है
```

### refresh / saved इवेंट्स को सुनना

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>उपयोगकर्ता: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('सफलतापूर्वक सहेजा गया');
});
await ctx.resource?.refresh?.();
```

---

## महत्वपूर्ण बातें

- **setResourceName अनिवार्य है**: उपयोग करने से पहले आपको `setResourceName('संग्रह का नाम')` कॉल करना होगा, अन्यथा अनुरोध URL नहीं बनाया जा सकता।
- **filterByTk और isNewRecord**: यदि `setFilterByTk` कॉल नहीं किया जाता है, तो `isNewRecord` true होता है और `refresh()` कोई अनुरोध शुरू नहीं करेगा; `save()` एक create एक्शन निष्पादित करेगा।
- **एसोसिएशन रिसोर्स**: जब रिसोर्स का नाम `parent.child` प्रारूप (जैसे `users.profile`) में हो, तो आपको पहले `setSourceId(पैरेंट प्राथमिक कुंजी)` कॉल करना होगा।
- **getData एक ऑब्जेक्ट लौटाता है**: एकल-रिकॉर्ड API द्वारा लौटाया गया `data` एक रिकॉर्ड ऑब्जेक्ट होता है; `getData()` सीधे इस ऑब्जेक्ट को लौटाता है। `destroy()` के बाद यह `null` हो जाता है।

---

## संबंधित

- [ctx.resource](../context/resource.md) - वर्तमान संदर्भ में रिसोर्स इंस्टेंस
- [ctx.initResource()](../context/init-resource.md) - इनिशियलाइज़ करें और `ctx.resource` से बाइंड करें
- [ctx.makeResource()](../context/make-resource.md) - बिना बाइंड किए एक नया रिसोर्स इंस्टेंस बनाएँ
- [APIResource](./api-resource.md) - URL द्वारा अनुरोधित सामान्य API रिसोर्स
- [MultiRecordResource](./multi-record-resource.md) - संग्रहों/सूचियों के लिए, जो CRUD और पेजिनेशन का समर्थन करता है