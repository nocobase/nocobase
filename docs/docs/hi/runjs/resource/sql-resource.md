:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/resource/sql-resource) देखें।
:::

# SQLResource

SQLResource एक ऐसा रिसोर्स है जो **सहेजे गए SQL कॉन्फ़िगरेशन** या **डायनेमिक SQL** के आधार पर क्वेरी निष्पादित (execute) करता है, जिसका डेटा `flowSql:run` / `flowSql:runById` जैसे इंटरफेस से आता है। यह रिपोर्ट, सांख्यिकी (statistics), कस्टम SQL सूचियों और अन्य समान परिदृश्यों के लिए उपयुक्त है। [MultiRecordResource](./multi-record-resource.md) के विपरीत, SQLResource डेटा संग्रह (collections) पर निर्भर नहीं करता है; यह सीधे SQL क्वेरी निष्पादित करता है और पेजिनेशन (pagination), पैरामीटर बाइंडिंग, टेम्पलेट वेरिएबल्स (`{{ctx.xxx}}`) और परिणाम प्रकार (result type) नियंत्रण का समर्थन करता है।

**वंशानुक्रम (Inheritance)**: FlowResource → APIResource → BaseRecordResource → SQLResource।

**बनाने का तरीका**: `ctx.makeResource('SQLResource')` या `ctx.initResource('SQLResource')`। सहेजे गए कॉन्फ़िगरेशन के आधार पर निष्पादित करने के लिए `setFilterByTk(uid)` (SQL टेम्पलेट का UID) का उपयोग करें; डिबगिंग के लिए, सीधे SQL निष्पादित करने के लिए `setDebug(true)` + `setSQL(sql)` का उपयोग करें; RunJS में, `ctx.api` रनटाइम वातावरण द्वारा इंजेक्ट किया जाता है।

---

## उपयोग के मामले (Use Cases)

| परिदृश्य | विवरण |
|------|------|
| **रिपोर्ट / सांख्यिकी** | जटिल एग्रीगेशन, क्रॉस-टेबल क्वेरी और कस्टम सांख्यिकीय मेट्रिक्स। |
| **JSBlock कस्टम सूचियाँ** | कस्टम रेंडरिंग के साथ विशेष फ़िल्टरिंग, सॉर्टिंग या जुड़ाव (associations) को SQL का उपयोग करके लागू करना। |
| **चार्ट ब्लॉक** | सहेजे गए SQL टेम्पलेट्स के साथ चार्ट डेटा स्रोतों को संचालित करना, पेजिनेशन के समर्थन के साथ। |
| **SQLResource और ctx.sql के बीच चुनाव** | जब पेजिनेशन, इवेंट्स या रिएक्टिव डेटा की आवश्यकता हो, तब SQLResource का उपयोग करें; सरल एक-बार की क्वेरी के लिए `ctx.sql.run()` / `ctx.sql.runById()` का उपयोग करें। |

---

## डेटा प्रारूप (Data Format)

- `getData()` आपके द्वारा `setSQLType()` में सेट किए गए प्रकार के आधार पर अलग-अलग प्रारूप लौटाता है:
  - `selectRows` (डिफ़ॉल्ट): **एरे (Array)**, कई पंक्तियों के परिणाम।
  - `selectRow`: **एकल ऑब्जेक्ट (Single object)**।
  - `selectVar`: **स्केलर मान (Scalar value)** (जैसे, COUNT, SUM)।
- `getMeta()` पेजिनेशन जैसी मेटा जानकारी लौटाता है: `page`, `pageSize`, `count`, `totalPage`, आदि।

---

## SQL कॉन्फ़िगरेशन और निष्पादन मोड

| मेथड | विवरण |
|------|------|
| `setFilterByTk(uid)` | निष्पादित किए जाने वाले SQL टेम्पलेट का UID सेट करता है (`runById` के अनुरूप; इसे पहले एडमिन इंटरफेस में सहेजा जाना चाहिए)। |
| `setSQL(sql)` | रॉ SQL सेट करता है (केवल तभी `runBySQL` के लिए उपयोग किया जाता है जब डिबग मोड `setDebug(true)` सक्षम हो)। |
| `setSQLType(type)` | परिणाम का प्रकार: `'selectVar'` / `'selectRow'` / `'selectRows'`। |
| `setDebug(enabled)` | जब `true` पर सेट होता है, तो `refresh` मेथड `runBySQL()` को कॉल करता है; अन्यथा, यह `runById()` को कॉल करता है। |
| `run()` | डिबग स्थिति के आधार पर `runBySQL()` या `runById()` को कॉल करता है। |
| `runBySQL()` | `setSQL` में परिभाषित SQL का उपयोग करके निष्पादित करता है (`setDebug(true)` की आवश्यकता है)। |
| `runById()` | वर्तमान UID का उपयोग करके सहेजे गए SQL टेम्पलेट को निष्पादित करता है। |

---

## पैरामीटर्स और संदर्भ (Context)

| मेथड | विवरण |
|------|------|
| `setBind(bind)` | वेरिएबल्स को बाइंड करता है। `:name` प्लेसहोल्डर्स के लिए ऑब्जेक्ट का या `?` प्लेसहोल्डर्स के लिए एरे का उपयोग करें। |
| `setLiquidContext(ctx)` | टेम्पलेट संदर्भ (Liquid), जिसका उपयोग `{{ctx.xxx}}` को पार्स करने के लिए किया जाता है। |
| `setFilter(filter)` | अतिरिक्त फ़िल्टर शर्तें (अनुरोध डेटा में पास की जाती हैं)। |
| `setDataSourceKey(key)` | डेटा स्रोत पहचानकर्ता (मल्टी-डेटा स्रोत वातावरण के लिए उपयोग किया जाता है)। |

---

## पेजिनेशन (Pagination)

| मेथड | विवरण |
|------|------|
| `setPage(page)` / `getPage()` | वर्तमान पृष्ठ (डिफ़ॉल्ट 1 है)। |
| `setPageSize(size)` / `getPageSize()` | प्रति पृष्ठ आइटम (डिफ़ॉल्ट 20 है)। |
| `next()` / `previous()` / `goto(page)` | पृष्ठों पर नेविगेट करता है और `refresh` को ट्रिगर करता है। |

SQL में, आप पेजिनेशन पैरामीटर्स को संदर्भित करने के लिए `{{ctx.limit}}` और `{{ctx.offset}}` का उपयोग कर सकते हैं। SQLResource स्वचालित रूप से संदर्भ (context) में `limit` और `offset` इंजेक्ट करता है।

---

## डेटा फ़ेचिंग और इवेंट्स

| मेथड | विवरण |
|------|------|
| `refresh()` | SQL (`runById` या `runBySQL`) निष्पादित करता है, परिणाम को `setData(data)` में लिखता है, मेटा अपडेट करता है, और `'refresh'` इवेंट को ट्रिगर करता है। |
| `runAction(actionName, options)` | अंतर्निहित क्रियाओं (actions) को कॉल करता है (जैसे, `getBind`, `run`, `runById`)। |
| `on('refresh', fn)` / `on('loading', fn)` | रिफ्रेश पूरा होने पर या लोडिंग शुरू होने पर ट्रिगर होता है। |

---

## उदाहरण

### सहेजे गए टेम्पलेट के माध्यम से निष्पादित करना (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // सहेजे गए SQL टेम्पलेट का UID
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, आदि
```

### डिबग मोड: सीधे SQL निष्पादित करना (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### पेजिनेशन और नेविगेशन

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// नेविगेशन
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### परिणाम के प्रकार (Result Types)

```js
// कई पंक्तियाँ (डिफ़ॉल्ट)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// एकल पंक्ति
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// एकल मान (जैसे, COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### टेम्पलेट वेरिएबल्स का उपयोग करना

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### refresh इवेंट को सुनना

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## ध्यान देने योग्य बातें

- **runById के लिए पहले टेम्पलेट सहेजना आवश्यक है**: `setFilterByTk(uid)` में उपयोग किया गया UID एडमिन इंटरफेस में पहले से सहेजा गया SQL टेम्पलेट ID होना चाहिए। आप इसे `ctx.sql.save({ uid, sql })` के माध्यम से सहेज सकते हैं।
- **डिबग मोड के लिए अनुमतियों (permissions) की आवश्यकता होती है**: `setDebug(true)` के लिए `flowSql:run` का उपयोग किया जाता है, जिसके लिए वर्तमान भूमिका (role) के पास SQL कॉन्फ़िगरेशन अनुमति होना आवश्यक है। `runById` के लिए केवल उपयोगकर्ता का लॉग इन होना पर्याप्त है।
- **रिफ्रेश डिबाउंसिंग (Refresh Debouncing)**: एक ही इवेंट लूप के भीतर `refresh()` के कई कॉल्स होने पर, अनावश्यक अनुरोधों से बचने के लिए केवल अंतिम कॉल ही निष्पादित होगा।
- **इंजेक्शन से बचाव के लिए पैरामीटर बाइंडिंग**: SQL इंजेक्शन को रोकने के लिए स्ट्रिंग कॉनकैटिनेशन (string concatenation) के बजाय `:name` या `?` प्लेसहोल्डर्स के साथ `setBind()` का उपयोग करें।

---

## संबंधित

- [ctx.sql](../context/sql.md) - SQL निष्पादन और प्रबंधन; `ctx.sql.runById` सरल एक-बार की क्वेरी के लिए उपयुक्त है।
- [ctx.resource](../context/resource.md) - वर्तमान संदर्भ में रिसोर्स इंस्टेंस।
- [ctx.initResource()](../context/init-resource.md) - इनिशियलाइज़ करता है और `ctx.resource` से बाइंड करता है।
- [ctx.makeResource()](../context/make-resource.md) - बिना बाइंड किए एक नया रिसोर्स इंस्टेंस बनाता है।
- [APIResource](./api-resource.md) - सामान्य API रिसोर्स।
- [MultiRecordResource](./multi-record-resource.md) - संग्रहों (collections) और सूचियों के लिए डिज़ाइन किया गया।