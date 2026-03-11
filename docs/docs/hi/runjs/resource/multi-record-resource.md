:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/resource/multi-record-resource) देखें।
:::

# MultiRecordResource

डेटा टेबल (संग्रह) के लिए रिसोर्स: अनुरोध एक ऐरे (array) लौटाता है और पेजिनेशन, फ़िल्टरिंग, सॉर्टिंग और CRUD ऑपरेशंस का समर्थन करता है। यह टेबल, लिस्ट जैसे "मल्टीपल रिकॉर्ड" परिदृश्यों के लिए उपयुक्त है। [APIResource](./api-resource.md) के विपरीत, MultiRecordResource `setResourceName()` के माध्यम से रिसोर्स का नाम निर्दिष्ट करता है, स्वचालित रूप से `users:list`, `users:create` जैसे URL बनाता है, और इसमें पेजिनेशन, फ़िल्टरिंग और चुनी गई पंक्तियों (selected rows) जैसी अंतर्निहित क्षमताएं शामिल हैं।

**इनहेरिटेंस (Inheritance)**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**बनाने का तरीका**: `ctx.makeResource('MultiRecordResource')` या `ctx.initResource('MultiRecordResource')`। उपयोग करने से पहले आपको `setResourceName('संग्रह का नाम')` (जैसे `'users'`) कॉल करना होगा; RunJS में `ctx.api` रनटाइम एनवायरनमेंट द्वारा इंजेक्ट किया जाता है।

---

## उपयोग के मामले (Use Cases)

| परिदृश्य | विवरण |
|------|------|
| **टेबल ब्लॉक** | टेबल और लिस्ट ब्लॉक डिफ़ॉल्ट रूप से MultiRecordResource का उपयोग करते हैं, जो पेजिनेशन, फ़िल्टरिंग और सॉर्टिंग का समर्थन करते हैं। |
| **JSBlock लिस्ट** | JSBlock में उपयोगकर्ताओं, ऑर्डर्स जैसे संग्रहों से डेटा लोड करें और कस्टम रेंडरिंग करें। |
| **बल्क ऑपरेशंस** | चुनी गई पंक्तियों को प्राप्त करने के लिए `getSelectedRows()` और बल्क डिलीट के लिए `destroySelectedRows()` का उपयोग करें। |
| **एसोसिएशन रिसोर्स** | `users.tags` जैसे फॉर्मेट का उपयोग करके संबंधित संग्रहों को लोड करें, जिसके लिए `setSourceId(पैरेंट रिकॉर्ड ID)` की आवश्यकता होती है। |

---

## डेटा फॉर्मेट

- `getData()` **रिकॉर्ड्स का एक ऐरे** लौटाता है, जो लिस्ट API रिस्पॉन्स का `data` फ़ील्ड है।
- `getMeta()` पेजिनेशन और अन्य मेटाडेटा लौटाता है: `page`, `pageSize`, `count`, `totalPage`, आदि।

---

## रिसोर्स का नाम और डेटा स्रोत

| मेथड | विवरण |
|------|------|
| `setResourceName(name)` / `getResourceName()` | रिसोर्स का नाम, जैसे `'users'`, `'users.tags'` (एसोसिएशन रिसोर्स)। |
| `setSourceId(id)` / `getSourceId()` | एसोसिएशन रिसोर्स के लिए पैरेंट रिकॉर्ड ID (जैसे `users.tags` के लिए, उपयोगकर्ता की प्राइमरी की पास करें)। |
| `setDataSourceKey(key)` / `getDataSourceKey()` | डेटा स्रोत (Data Source) पहचानकर्ता (मल्टी-डेटा स्रोत परिदृश्यों में उपयोग किया जाता है)। |

---

## अनुरोध पैरामीटर (फ़िल्टर / फ़ील्ड्स / सॉर्ट)

| मेथड | विवरण |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | प्राइमरी की (primary key) द्वारा फ़िल्टर (सिंगल रिकॉर्ड `get` आदि के लिए)। |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | फ़िल्टर शर्तें, जो `$eq`, `$ne`, `$in` जैसे ऑपरेटर्स का समर्थन करती हैं। |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | फ़िल्टर ग्रुप (कई शर्तों को संयोजित करने के लिए)। |
| `setFields(fields)` / `getFields()` | अनुरोधित फ़ील्ड्स (व्हाइटलिस्ट)। |
| `setSort(sort)` / `getSort()` | सॉर्टिंग, जैसे `['-createdAt']` निर्माण समय के अनुसार अवरोही क्रम (descending order) के लिए। |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | एसोसिएशन लोडिंग (जैसे `['user', 'tags']`)। |

---

## पेजिनेशन

| मेथड | विवरण |
|------|------|
| `setPage(page)` / `getPage()` | वर्तमान पेज (1 से शुरू)। |
| `setPageSize(size)` / `getPageSize()` | प्रति पेज आइटम की संख्या, डिफ़ॉल्ट 20 है। |
| `getTotalPage()` | कुल पेजों की संख्या। |
| `getCount()` | रिकॉर्ड्स की कुल संख्या (सर्वर-साइड मेटा से)। |
| `next()` / `previous()` / `goto(page)` | पेज बदलें और `refresh` ट्रिगर करें। |

---

## चुनी गई पंक्तियाँ (टेबल परिदृश्य)

| मेथड | विवरण |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | वर्तमान में चुनी गई पंक्तियों का डेटा, बल्क डिलीट और अन्य ऑपरेशंस के लिए उपयोग किया जाता है। |

---

## CRUD और लिस्ट ऑपरेशंस

| मेथड | विवरण |
|------|------|
| `refresh()` | वर्तमान मापदंडों के साथ लिस्ट का अनुरोध करता है, `getData()` और पेजिनेशन मेटा को अपडेट करता है, और `'refresh'` इवेंट को ट्रिगर करता है। |
| `get(filterByTk)` | एक सिंगल रिकॉर्ड का अनुरोध करता है और उसे लौटाता है (इसे `getData` में नहीं लिखता)। |
| `create(data, options?)` | रिकॉर्ड बनाता है। वैकल्पिक `{ refresh: false }` स्वचालित रिफ्रेश को रोकता है। `'saved'` ट्रिगर करता है। |
| `update(filterByTk, data, options?)` | प्राइमरी की (primary key) द्वारा रिकॉर्ड अपडेट करता है। |
| `destroy(target)` | रिकॉर्ड्स को डिलीट करता है; `target` एक प्राइमरी की, एक रो ऑब्जेक्ट, या प्राइमरी की/रो ऑब्जेक्ट्स का ऐरे (बल्क डिलीट) हो सकता है। |
| `destroySelectedRows()` | वर्तमान में चुनी गई पंक्तियों को डिलीट करता है (यदि कोई नहीं चुनी गई है तो एरर थ्रो करता है)। |
| `setItem(index, item)` | स्थानीय रूप से डेटा की एक विशिष्ट पंक्ति को बदलता है (अनुरोध शुरू नहीं करता)। |
| `runAction(actionName, options)` | किसी भी रिसोर्स एक्शन (जैसे कस्टम एक्शन) को कॉल करता है। |

---

## कॉन्फ़िगरेशन और इवेंट्स

| मेथड | विवरण |
|------|------|
| `setRefreshAction(name)` | रिफ्रेश के दौरान कॉल किया जाने वाला एक्शन, डिफ़ॉल्ट `'list'` है। |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | create/update के लिए अनुरोध कॉन्फ़िगरेशन। |
| `on('refresh', fn)` / `on('saved', fn)` | रिफ्रेश पूरा होने या सेव होने के बाद ट्रिगर होता है। |

---

## उदाहरण

### बेसिक लिस्ट

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### फ़िल्टरिंग और सॉर्टिंग

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### एसोसिएशन लोडिंग

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### निर्माण और पेजिनेशन

```js
await ctx.resource.create({ name: 'John Doe', email: 'john.doe@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### चुनी गई पंक्तियों को बल्क डिलीट करना

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('कृपया पहले डेटा चुनें');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('हटा दिया गया'));
```

### refresh इवेंट को सुनना

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### एसोसिएशन रिसोर्स (सब-टेबल)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## ध्यान देने योग्य बातें

- **setResourceName अनिवार्य है**: उपयोग से पहले आपको `setResourceName('संग्रह का नाम')` कॉल करना होगा, अन्यथा अनुरोध URL नहीं बनाया जा सकता।
- **एसोसिएशन रिसोर्स**: जब रिसोर्स का नाम `parent.child` फॉर्मेट (जैसे `users.tags`) में हो, तो आपको पहले `setSourceId(पैरेंट प्राइमरी की)` कॉल करना होगा।
- **रिफ्रेश डिबाउंसिंग (Refresh Debouncing)**: एक ही इवेंट लूप के भीतर `refresh()` के कई कॉल केवल अंतिम वाले को ही निष्पादित करेंगे, जिससे अनावश्यक अनुरोधों से बचा जा सके।
- **getData एक ऐरे लौटाता है**: लिस्ट API द्वारा लौटाया गया `data` रिकॉर्ड्स का एक ऐरे है, और `getData()` सीधे इस ऐरे को लौटाता है।

---

## संबंधित

- [ctx.resource](../context/resource.md) - वर्तमान संदर्भ में रिसोर्स इंस्टेंस
- [ctx.initResource()](../context/init-resource.md) - इनिशियलाइज़ करें और ctx.resource से बाइंड करें
- [ctx.makeResource()](../context/make-resource.md) - बिना बाइंड किए एक नया रिसोर्स इंस्टेंस बनाएं
- [APIResource](./api-resource.md) - URL द्वारा अनुरोधित सामान्य API रिसोर्स
- [SingleRecordResource](./single-record-resource.md) - सिंगल रिकॉर्ड के लिए उन्मुख (Oriented)