:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/data-source-manager) देखें।
:::

# ctx.dataSourceManager

डेटा स्रोत प्रबंधक (`DataSourceManager` इंस्टेंस), जिसका उपयोग कई डेटा स्रोतों (जैसे मुख्य डेटाबेस `main`, लॉगिंग डेटाबेस `logging` आदि) को प्रबंधित करने और उन तक पहुँचने के लिए किया जाता है। इसका उपयोग तब किया जाता है जब कई डेटा स्रोत मौजूद हों या जब क्रॉस-डेटा स्रोत मेटाडेटा एक्सेस की आवश्यकता हो।

##适用场景 (उपयोग के मामले)

| परिदृश्य | विवरण |
|------|------|
| **मल्टी-डेटा स्रोत** | सभी डेटा स्रोतों को सूचीबद्ध करना, या की (key) द्वारा किसी विशिष्ट डेटा स्रोत को प्राप्त करना। |
| **क्रॉस-डेटा स्रोत एक्सेस** | जब वर्तमान संदर्भ (context) का डेटा स्रोत अज्ञात हो, तब "डेटा स्रोत की (key) + संग्रह नाम" का उपयोग करके मेटाडेटा तक पहुँचना। |
| **पूर्ण पथ द्वारा फ़ील्ड प्राप्त करना** | विभिन्न डेटा स्रोतों में फ़ील्ड परिभाषाओं को प्राप्त करने के लिए `dataSourceKey.collectionName.fieldPath` प्रारूप का उपयोग करना। |

> **ध्यान दें:** यदि आप केवल वर्तमान डेटा स्रोत पर काम कर रहे हैं, तो `ctx.dataSource` के उपयोग को प्राथमिकता दें। `ctx.dataSourceManager` का उपयोग केवल तब करें जब आपको डेटा स्रोतों को सूचीबद्ध करने या उनके बीच स्विच करने की आवश्यकता हो।

## प्रकार परिभाषा (Type Definition)

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // डेटा स्रोत प्रबंधन
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // डेटा स्रोत पढ़ें
  getDataSources(): DataSource[];                     // सभी डेटा स्रोत प्राप्त करें
  getDataSource(key: string): DataSource | undefined;  // की (key) द्वारा डेटा स्रोत प्राप्त करें

  // डेटा स्रोत + संग्रह द्वारा सीधे मेटाडेटा तक पहुँचें
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## ctx.dataSource के साथ संबंध

| आवश्यकता | अनुशंसित उपयोग |
|------|----------|
| **वर्तमान संदर्भ से जुड़ा एकल डेटा स्रोत** | `ctx.dataSource` (जैसे वर्तमान पेज/ब्लॉक का डेटा स्रोत) |
| **सभी डेटा स्रोतों के लिए प्रवेश बिंदु** | `ctx.dataSourceManager` |
| **डेटा स्रोतों को सूचीबद्ध करना या बदलना** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **वर्तमान डेटा स्रोत के भीतर संग्रह प्राप्त करना** | `ctx.dataSource.getCollection(name)` |
| **डेटा स्रोतों के बीच संग्रह प्राप्त करना** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **वर्तमान डेटा स्रोत के भीतर फ़ील्ड प्राप्त करना** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **डेटा स्रोतों के बीच फ़ील्ड प्राप्त करना** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## उदाहरण

### विशिष्ट डेटा स्रोत प्राप्त करना

```ts
// 'main' नामक डेटा स्रोत प्राप्त करें
const mainDS = ctx.dataSourceManager.getDataSource('main');

// इस डेटा स्रोत के अंतर्गत सभी संग्रह प्राप्त करें
const collections = mainDS?.getCollections();
```

### डेटा स्रोतों के बीच संग्रह मेटाडेटा तक पहुँचना

```ts
// dataSourceKey + collectionName द्वारा संग्रह प्राप्त करें
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// संग्रह की प्राइमरी की (primary key) प्राप्त करें
const primaryKey = users?.filterTargetKey ?? 'id';
```

### पूर्ण पथ द्वारा फ़ील्ड परिभाषा प्राप्त करना

```ts
// प्रारूप: dataSourceKey.collectionName.fieldPath
// "डेटा स्रोत की.संग्रह नाम.फ़िल्ड पथ" द्वारा फ़ील्ड परिभाषा प्राप्त करें
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// एसोसिएशन फ़ील्ड पथ का समर्थन करता है
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### सभी डेटा स्रोतों के माध्यम से पुनरावृत्ति (Iterate) करना

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`डेटा स्रोत: ${ds.key}, प्रदर्शित नाम: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - संग्रह: ${col.name}`);
  }
}
```

### वेरिएबल के आधार पर गतिशील रूप से डेटा स्रोत चुनना

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## ध्यान देने योग्य बातें

- `getCollectionField` के लिए पथ प्रारूप `dataSourceKey.collectionName.fieldPath` है, जहाँ पहला खंड डेटा स्रोत की (key) है, उसके बाद संग्रह का नाम और फ़ील्ड पथ आता है।
- यदि डेटा स्रोत मौजूद नहीं है, तो `getDataSource(key)` `undefined` लौटाता है; उपयोग करने से पहले नल चेक (null check) करने की सलाह दी जाती है।
- यदि की (key) पहले से मौजूद है, तो `addDataSource` एक अपवाद (exception) थ्रो करेगा; `upsertDataSource` या तो मौजूदा को ओवरराइट करेगा या नया जोड़ देगा।

## संबंधित

- [ctx.dataSource](./data-source.md): वर्तमान डेटा स्रोत इंस्टेंस
- [ctx.collection](./collection.md): वर्तमान संदर्भ से जुड़ा संग्रह
- [ctx.collectionField](./collection-field.md): वर्तमान फ़ील्ड के लिए संग्रह फ़ील्ड परिभाषा