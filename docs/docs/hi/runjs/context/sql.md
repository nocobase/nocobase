:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/sql) देखें।
:::

# ctx.sql

`ctx.sql` SQL निष्पादन और प्रबंधन क्षमताएं प्रदान करता है, जिसका उपयोग अक्सर RunJS (जैसे JSBlock और इवेंट फ्लो) में सीधे डेटाबेस तक पहुँचने के लिए किया जाता है। यह अस्थायी SQL निष्पादन, ID द्वारा सहेजे गए SQL टेम्पलेट्स के निष्पादन, पैरामीटर बाइंडिंग, टेम्पलेट वेरिएबल्स (`{{ctx.xxx}}`) और परिणाम प्रकार नियंत्रण का समर्थन करता है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **JSBlock** | कस्टम सांख्यिकीय रिपोर्ट, जटिल फ़िल्टर की गई सूचियाँ, और क्रॉस-टेबल एग्रीगेशन क्वेरी। |
| **चार्ट ब्लॉक** | चार्ट डेटा स्रोतों को चलाने के लिए SQL टेम्पलेट्स को सहेजना। |
| **इवेंट फ्लो / लिंकेज** | बाद के लॉजिक के लिए डेटा प्राप्त करने हेतु प्रीसेट SQL निष्पादित करना। |
| **SQLResource** | पेजिनेटेड सूचियों जैसे परिदृश्यों के लिए `ctx.initResource('SQLResource')` के साथ उपयोग किया जाता है। |

> ध्यान दें: `ctx.sql`, `flowSql` API के माध्यम से डेटाबेस तक पहुँचता है। सुनिश्चित करें कि वर्तमान उपयोगकर्ता के पास संबंधित डेटा स्रोत के लिए निष्पादन अनुमति है।

##权限说明 (अनुमति विवरण)

| अनुमति | विधि | विवरण |
|------|------|------|
| **लॉगिन उपयोगकर्ता** | `runById` | कॉन्फ़िगर किए गए SQL टेम्पलेट ID के आधार पर निष्पादित करें। |
| **SQL कॉन्फ़िगरेशन अनुमति** | `run`, `save`, `destroy` | अस्थायी SQL निष्पादित करें, या SQL टेम्पलेट्स को सहेजें/अपडेट करें/हटाएं। |

सामान्य उपयोगकर्ताओं के लिए लक्षित फ्रंटएंड लॉजिक को `ctx.sql.runById(uid, options)` का उपयोग करना चाहिए। जब डायनेमिक SQL या टेम्पलेट प्रबंधन की आवश्यकता हो, तो सुनिश्चित करें कि वर्तमान भूमिका के पास SQL कॉन्फ़िगरेशन अनुमति है।

##类型定义 (टाइप परिभाषा)

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

##常用方法 (सामान्य विधियाँ)

| विधि | विवरण | अनुमति की आवश्यकता |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | अस्थायी SQL निष्पादित करता है; पैरामीटर बाइंडिंग और टेम्पलेट वेरिएबल्स का समर्थन करता है। | SQL कॉन्फ़िगरेशन अनुमति |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | पुन: उपयोग के लिए ID द्वारा SQL टेम्पलेट को सहेजता या अपडेट करता है। | SQL कॉन्फ़िगरेशन अनुमति |
| `ctx.sql.runById(uid, options?)` | पहले से सहेजे गए SQL टेम्पलेट को उसकी ID द्वारा निष्पादित करता है। | कोई भी लॉगिन उपयोगकर्ता |
| `ctx.sql.destroy(uid)` | ID द्वारा निर्दिष्ट SQL टेम्पलेट को हटाता है। | SQL कॉन्फ़िगरेशन अनुमति |

ध्यान दें:

- `run` का उपयोग SQL डिबगिंग के लिए किया जाता है और इसके लिए कॉन्फ़िगरेशन अनुमति की आवश्यकता होती है।
- `save` और `destroy` का उपयोग SQL टेम्पलेट्स के प्रबंधन के लिए किया जाता है और इसके लिए कॉन्फ़िगरेशन अनुमति की आवश्यकता होती है।
- `runById` सामान्य उपयोगकर्ताओं के लिए खुला है; यह केवल सहेजे गए टेम्पलेट्स को निष्पादित कर सकता है और SQL को डिबग या संशोधित नहीं कर सकता है।
- जब SQL टेम्पलेट में बदलाव किया जाता है, तो परिवर्तनों को सुरक्षित करने के लिए `save` को कॉल किया जाना चाहिए।

##参数说明 (पैरामीटर विवरण)

### run / runById के options

| पैरामीटर | प्रकार | विवरण |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | बाइंडिंग वेरिएबल्स। `:name` प्लेसहोल्डर्स के लिए ऑब्जेक्ट या `?` प्लेसहोल्डर्स के लिए ऐरे का उपयोग करें। |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | परिणाम प्रकार: कई पंक्तियाँ, एकल पंक्ति, या एकल मान। डिफ़ॉल्ट `selectRows` है। |
| `dataSourceKey` | `string` | डेटा स्रोत पहचानकर्ता। डिफ़ॉल्ट रूप से मुख्य डेटा स्रोत का उपयोग करता है। |
| `filter` | `Record<string, any>` | अतिरिक्त फ़िल्टर शर्तें (इंटरफ़ेस समर्थन के आधार पर)। |

### save के options

| पैरामीटर | प्रकार | विवरण |
|------|------|------|
| `uid` | `string` | टेम्पलेट के लिए विशिष्ट पहचानकर्ता। सहेजने के बाद, इसे `runById(uid, ...)` के माध्यम से निष्पादित किया जा सकता है। |
| `sql` | `string` | SQL सामग्री। `{{ctx.xxx}}` टेम्पलेट वेरिएबल्स और `:name` / `?` प्लेसहोल्डर्स का समर्थन करता है। |
| `dataSourceKey` | `string` | वैकल्पिक, डेटा स्रोत पहचानकर्ता। |

## SQL 模板变量与参数绑定 (SQL टेम्पलेट वेरिएबल्स और पैरामीटर बाइंडिंग)

### 模板变量 `{{ctx.xxx}}` (टेम्पलेट वेरिएबल्स)

आप संदर्भ वेरिएबल्स को संदर्भित करने के लिए SQL में `{{ctx.xxx}}` का उपयोग कर सकते हैं। निष्पादन से पहले इन्हें वास्तविक मानों में पार्स किया जाता है:

```js
// ctx.user.id को संदर्भित करें
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

संदर्भित किए जाने वाले वेरिएबल्स के स्रोत वही हैं जो `ctx.getVar()` के हैं (जैसे `ctx.user.*`, `ctx.record.*`, कस्टम `ctx.defineProperty`, आदि)।

### 参数绑定 (पैरामीटर बाइंडिंग)

- **नामित पैरामीटर (Named Parameters)**: SQL में `:name` का उपयोग करें और `bind` में एक ऑब्जेक्ट `{ name: value }` पास करें।
- **स्थितीय पैरामीटर (Positional Parameters)**: SQL में `?` का उपयोग करें और `bind` में एक ऐरे `[value1, value2]` पास करें।

```js
// नामित पैरामीटर
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// स्थितीय पैरामीटर
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Beijing', 'active'], type: 'selectVar' }
);
```

## 示例 (उदाहरण)

### 临时执行 SQL（需 SQL 配置权限）(अस्थायी SQL निष्पादित करना - SQL कॉन्फ़िगरेशन अनुमति आवश्यक)

```js
// कई पंक्तियाँ (डिफ़ॉल्ट)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// एकल पंक्ति
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// एकल मान (जैसे COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### 使用模板变量 (टेम्पलेट वेरिएबल्स का उपयोग करना)

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### 保存模板并复用 (टेम्पलेट सहेजना और पुन: उपयोग करना)

```js
// सहेजें (SQL कॉन्फ़िगरेशन अनुमति आवश्यक)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// कोई भी लॉगिन उपयोगकर्ता इसे निष्पादित कर सकता है
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// टेम्पलेट हटाएं (SQL कॉन्फ़िगरेशन अनुमति आवश्यक)
await ctx.sql.destroy('active-users-report');
```

### 分页列表（SQLResource）(पेजिनेटेड सूची - SQLResource)

```js
// जब पेजिनेशन या फ़िल्टरिंग की आवश्यकता हो, तो SQLResource का उपयोग करें
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // सहेजे गए SQL टेम्पलेट की ID
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // इसमें page, pageSize आदि शामिल हैं
```

## 与 ctx.resource、ctx.request 的关系 (ctx.resource और ctx.request के साथ संबंध)

| उपयोग | अनुशंसित उपयोग |
|------|----------|
| **SQL क्वेरी निष्पादित करना** | `ctx.sql.run()` या `ctx.sql.runById()` |
| **SQL पेजिनेटेड सूची (ब्लॉक)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **सामान्य HTTP अनुरोध** | `ctx.request()` |

`ctx.sql`, `flowSql` API को रैप करता है और SQL परिदृश्यों के लिए विशिष्ट है; `ctx.request` का उपयोग किसी भी API को कॉल करने के लिए किया जा सकता है।

## 注意事项 (ध्यान देने योग्य बातें)

- SQL इंजेक्शन से बचने के लिए स्ट्रिंग कॉनकैटिनेशन के बजाय पैरामीटर बाइंडिंग (`:name` / `?`) का उपयोग करें।
- `type: 'selectVar'` एक स्केलर मान लौटाता है, जो आमतौर पर `COUNT`, `SUM` आदि के लिए उपयोग किया जाता है।
- टेम्पलेट वेरिएबल्स `{{ctx.xxx}}` निष्पादन से पहले हल किए जाते हैं; सुनिश्चित करें कि संबंधित वेरिएबल्स संदर्भ में परिभाषित हैं।

## 相关 (संबंधित)

- [ctx.resource](./resource.md): डेटा संसाधन; SQLResource आंतरिक रूप से `flowSql` API को कॉल करता है।
- [ctx.initResource()](./init-resource.md): पेजिनेटेड सूचियों आदि के लिए SQLResource को इनिशियलाइज़ करता है।
- [ctx.request()](./request.md): सामान्य HTTP अनुरोध।