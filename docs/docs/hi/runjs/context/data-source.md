:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/data-source) देखें।
:::

# ctx.dataSource

वर्तमान RunJS निष्पादन संदर्भ (execution context) से जुड़ा डेटा स्रोत इंस्टेंस (`DataSource`), जिसका उपयोग **वर्तमान डेटा स्रोत के भीतर** संग्रह (collections), फ़ील्ड मेटाडेटा तक पहुँचने और संग्रह कॉन्फ़िगरेशन को प्रबंधित करने के लिए किया जाता है। यह आमतौर पर वर्तमान पृष्ठ/ब्लॉक के लिए चुने गए डेटा स्रोत (जैसे मुख्य डेटाबेस `main`) से मेल खाता है।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **एकल डेटा स्रोत संचालन** | जब वर्तमान डेटा स्रोत ज्ञात हो, तब संग्रह और फ़ील्ड मेटाडेटा प्राप्त करना |
| **संग्रह प्रबंधन** | वर्तमान डेटा स्रोत के तहत संग्रहों (collections) को प्राप्त करना/जोड़ना/अपडेट करना/हटाना |
| **पाथ (path) द्वारा फ़ील्ड प्राप्त करना** | फ़ील्ड परिभाषाएँ प्राप्त करने के लिए `collectionName.fieldPath` प्रारूप का उपयोग करना (एसोसिएशन पाथ समर्थित हैं) |

> ध्यान दें: `ctx.dataSource` वर्तमान संदर्भ के एकल डेटा स्रोत को दर्शाता है; अन्य डेटा स्रोतों को सूचीबद्ध करने या उन तक पहुँचने के लिए, कृपया [ctx.dataSourceManager](./data-source-manager.md) का उपयोग करें।

## 类型定义 (टाइप परिभाषा)

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // केवल पढ़ने योग्य (Read-only) प्रॉपर्टीज
  get flowEngine(): FlowEngine;   // वर्तमान FlowEngine इंस्टेंस
  get displayName(): string;      // प्रदर्शित नाम (i18n समर्थित)
  get key(): string;              // डेटा स्रोत key, जैसे 'main'
  get name(): string;             // key के समान

  // संग्रह रीडिंग (Collection reading)
  getCollections(): Collection[];                      // सभी संग्रह प्राप्त करें
  getCollection(name: string): Collection | undefined; // नाम से संग्रह प्राप्त करें
  getAssociation(associationName: string): CollectionField | undefined; // एसोसिएशन फ़ील्ड प्राप्त करें (जैसे users.roles)

  // संग्रह प्रबंधन (Collection management)
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // फ़ील्ड मेटाडेटा
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## 常用属性 (सामान्य प्रॉपर्टीज)

| प्रॉपर्टी | प्रकार | विवरण |
|------|------|------|
| `key` | `string` | डेटा स्रोत key, जैसे `'main'` |
| `name` | `string` | key के समान |
| `displayName` | `string` | प्रदर्शित नाम (i18n समर्थित) |
| `flowEngine` | `FlowEngine` | वर्तमान FlowEngine इंस्टेंस |

## 常用方法 (सामान्य मेथड)

| मेथड | विवरण |
|------|------|
| `getCollections()` | वर्तमान डेटा स्रोत के तहत सभी संग्रह प्राप्त करता है (क्रमबद्ध और छिपे हुए फ़िल्टर किए गए) |
| `getCollection(name)` | नाम से संग्रह प्राप्त करता है; एसोसिएशन के लक्ष्य संग्रह को प्राप्त करने के लिए `name` को `collectionName.fieldName` के रूप में दिया जा सकता है |
| `getAssociation(associationName)` | `collectionName.fieldName` द्वारा एसोसिएशन फ़ील्ड परिभाषा प्राप्त करता है |
| `getCollectionField(fieldPath)` | `collectionName.fieldPath` द्वारा फ़ील्ड परिभाषा प्राप्त करता है, जो `users.profile.avatar` जैसे एसोसिएशन पाथ का समर्थन करता है |

## 与 ctx.dataSourceManager 的关系 (ctx.dataSourceManager के साथ संबंध)

| आवश्यकता | अनुशंसित उपयोग |
|------|----------|
| **वर्तमान संदर्भ से जुड़ा एकल डेटा स्रोत** | `ctx.dataSource` |
| **सभी डेटा स्रोतों के लिए प्रवेश बिंदु** | `ctx.dataSourceManager` |
| **वर्तमान डेटा स्रोत के भीतर संग्रह प्राप्त करना** | `ctx.dataSource.getCollection(name)` |
| **विभिन्न डेटा स्रोतों में संग्रह प्राप्त करना** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **वर्तमान डेटा स्रोत के भीतर फ़ील्ड प्राप्त करना** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **विभिन्न डेटा स्रोतों में फ़ील्ड प्राप्त करना** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## 示例 (उदाहरण)

### 获取数据表及字段 (संग्रह और फ़ील्ड प्राप्त करना)

```ts
// सभी संग्रह प्राप्त करें
const collections = ctx.dataSource.getCollections();

// नाम से संग्रह प्राप्त करें
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// "संग्रह.फ़ील्ड पाथ" द्वारा फ़ील्ड परिभाषा प्राप्त करें (एसोसिएशन समर्थित)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### 获取关联字段 (एसोसिएशन फ़ील्ड प्राप्त करना)

```ts
// collectionName.fieldName द्वारा एसोसिएशन फ़ील्ड परिभाषा प्राप्त करें
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // लक्ष्य संग्रह संरचना के आधार पर प्रोसेस करें
}
```

### 遍历数据表做动态处理 (डायनेमिक प्रोसेसिंग के लिए संग्रहों के माध्यम से पुनरावृत्ति करें)

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### 根据字段元数据做校验或动态 UI (फ़ील्ड मेटाडेटा के आधार पर सत्यापन या डायनेमिक UI करें)

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // interface, enum, validation आदि के आधार पर UI या सत्यापन (validation) करें
}
```

## 注意事项 (ध्यान देने योग्य बातें)

- `getCollectionField(fieldPath)` के लिए पाथ प्रारूप `collectionName.fieldPath` है, जहाँ पहला भाग संग्रह का नाम है और उसके बाद फ़ील्ड पाथ है (एसोसिएशन समर्थित है, जैसे `user.name`) ।
- `getCollection(name)` प्रारूप `collectionName.fieldName` का समर्थन करता है, जो एसोसिएशन फ़ील्ड के लक्ष्य संग्रह को लौटाता है।
- RunJS संदर्भ में, `ctx.dataSource` आमतौर पर वर्तमान ब्लॉक/पृष्ठ के डेटा स्रोत द्वारा निर्धारित किया जाता है; यदि संदर्भ में कोई डेटा स्रोत जुड़ा नहीं है, तो यह `undefined` हो सकता है, इसलिए उपयोग से पहले इसकी जाँच करने की सलाह दी जाती है।

## 相关 (संबंधित)

- [ctx.dataSourceManager](./data-source-manager.md)：डेटा स्रोत प्रबंधक, सभी डेटा स्रोतों को प्रबंधित करता है
- [ctx.collection](./collection.md)：वर्तमान संदर्भ से जुड़ा संग्रह
- [ctx.collectionField](./collection-field.md)：वर्तमान फ़ील्ड की संग्रह फ़ील्ड परिभाषा