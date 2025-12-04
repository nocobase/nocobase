:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# डेटाबेस

## अवलोकन

डेटाबेस NocoBase द्वारा प्रदान किया गया एक डेटाबेस इंटरैक्शन टूल है, जो नो-कोड और लो-कोड एप्लिकेशनों के लिए बहुत सुविधाजनक डेटाबेस इंटरैक्शन क्षमताएँ प्रदान करता है। वर्तमान में समर्थित डेटाबेस हैं:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### डेटाबेस से कनेक्ट करें

`Database` कंस्ट्रक्टर में, आप `options` पैरामीटर पास करके डेटाबेस कनेक्शन को कॉन्फ़िगर कर सकते हैं।

```javascript
const { Database } = require('@nocobase/database');

// SQLite डेटाबेस कॉन्फ़िगरेशन पैरामीटर
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// MySQL \ PostgreSQL डेटाबेस कॉन्फ़िगरेशन पैरामीटर
const database = new Database({
  dialect: /* 'postgres' या 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

विस्तृत कॉन्फ़िगरेशन पैरामीटर के लिए, कृपया [कंस्ट्रक्टर](#कंस्ट्रक्टर) देखें।

### डेटा मॉडल परिभाषा

`Database` `संग्रह` (Collection) के माध्यम से डेटाबेस संरचना को परिभाषित करता है। एक `संग्रह` ऑब्जेक्ट डेटाबेस में एक तालिका (table) का प्रतिनिधित्व करता है।

```javascript
// संग्रह (Collection) परिभाषित करें
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

डेटाबेस संरचना परिभाषित होने के बाद, आप डेटाबेस संरचना को सिंक्रनाइज़ करने के लिए `sync()` विधि का उपयोग कर सकते हैं।

```javascript
await database.sync();
```

`संग्रह` (Collection) के अधिक विस्तृत उपयोग के लिए, कृपया [संग्रह](/api/database/collection) देखें।

### डेटा पढ़ना/लिखना

`Database` `रिपॉजिटरी` (Repository) के माध्यम से डेटा पर ऑपरेशन करता है।

```javascript
const UserRepository = UserCollection.repository();

// बनाएँ
await UserRepository.create({
  name: '张三',
  age: 18,
});

// क्वेरी करें
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// संशोधित करें
await UserRepository.update({
  values: {
    age: 20,
  },
});

// हटाएँ
await UserRepository.destroy(user.id);
```

डेटा CRUD के अधिक विस्तृत उपयोग के लिए, कृपया [रिपॉजिटरी](/api/database/repository) देखें।

## कंस्ट्रक्टर

**सिग्नेचर**

- `constructor(options: DatabaseOptions)`

एक डेटाबेस इंस्टेंस बनाता है।

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host` | `string` | `'localhost'` | डेटाबेस होस्ट |
| `options.port` | `number` | - | डेटाबेस सेवा पोर्ट, उपयोग किए गए डेटाबेस के अनुसार एक डिफ़ॉल्ट पोर्ट होता है |
| `options.username` | `string` | - | डेटाबेस यूज़रनेम |
| `options.password` | `string` | - | डेटाबेस पासवर्ड |
| `options.database` | `string` | - | डेटाबेस नाम |
| `options.dialect` | `string` | `'mysql'` | डेटाबेस टाइप |
| `options.storage?` | `string` | `':memory:'` | SQLite के लिए स्टोरेज मोड |
| `options.logging?` | `boolean` | `false` | क्या लॉगिंग सक्षम करनी है |
| `options.define?` | `Object` | `{}` | डिफ़ॉल्ट तालिका परिभाषा पैरामीटर |
| `options.tablePrefix?` | `string` | `''` | NocoBase एक्सटेंशन, तालिका नाम प्रीफ़िक्स |
| `options.migrator?` | `UmzugOptions` | `{}` | NocoBase एक्सटेंशन, माइग्रेशन मैनेजर से संबंधित पैरामीटर, [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) इम्प्लीमेंटेशन देखें |

## माइग्रेशन से संबंधित विधियाँ

### `addMigration()`

एक एकल माइग्रेशन फ़ाइल जोड़ता है।

**सिग्नेचर**

- `addMigration(options: MigrationItem)`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name` | `string` | - | माइग्रेशन फ़ाइल का नाम |
| `options.context?` | `string` | - | माइग्रेशन फ़ाइल का कॉन्टेक्स्ट |
| `options.migration?` | `typeof Migration` | - | माइग्रेशन फ़ाइल के लिए कस्टम क्लास |
| `options.up` | `Function` | - | माइग्रेशन फ़ाइल की `up` विधि |
| `options.down` | `Function` | - | माइग्रेशन फ़ाइल की `down` विधि |

**उदाहरण**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* आपकी माइग्रेशन SQLs */);
  },
});
```

### `addMigrations()`

एक निर्दिष्ट डायरेक्टरी से माइग्रेशन फ़ाइलें जोड़ता है।

**सिग्नेचर**

- `addMigrations(options: AddMigrationsOptions): void`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | `''` | माइग्रेशन फ़ाइलें जिस डायरेक्टरी में स्थित हैं |
| `options.extensions` | `string[]` | `['js', 'ts']` | फ़ाइल एक्सटेंशन |
| `options.namespace?` | `string` | `''` | नेमस्पेस |
| `options.context?` | `Object` | `{ db }` | माइग्रेशन फ़ाइल का कॉन्टेक्स्ट |

**उदाहरण**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## यूटिलिटी विधियाँ

### `inDialect()`

जाँचता है कि वर्तमान डेटाबेस टाइप निर्दिष्ट टाइप में से एक है या नहीं।

**सिग्नेचर**

- `inDialect(dialect: string[]): boolean`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | - | डेटाबेस टाइप, संभावित मान `mysql`/`postgres`/`mariadb` हैं |

### `getTablePrefix()`

कॉन्फ़िगरेशन से तालिका नाम प्रीफ़िक्स प्राप्त करता है।

**सिग्नेचर**

- `getTablePrefix(): string`

## संग्रह (Collection) कॉन्फ़िगरेशन

### `collection()`

एक संग्रह (collection) को परिभाषित करता है। यह कॉल Sequelize के `define` विधि के समान है, जो केवल मेमोरी में तालिका संरचना बनाता है। इसे डेटाबेस में स्थायी करने के लिए, आपको `sync` विधि को कॉल करना होगा।

**सिग्नेचर**

- `collection(options: CollectionOptions): Collection`

**पैरामीटर्स**

`options` के सभी कॉन्फ़िगरेशन पैरामीटर `संग्रह` (Collection) क्लास के कंस्ट्रक्टर के अनुरूप हैं, [संग्रह](/api/database/collection#constructor) देखें।

**इवेंट्स**

- `'beforeDefineCollection'`: एक संग्रह को परिभाषित करने से पहले ट्रिगर होता है।
- `'afterDefineCollection'`: एक संग्रह को परिभाषित करने के बाद ट्रिगर होता है।

**उदाहरण**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// संग्रह को तालिका के रूप में डेटाबेस में सिंक्रनाइज़ करें
await db.sync();
```

### `getCollection()`

एक परिभाषित संग्रह (collection) प्राप्त करता है।

**सिग्नेचर**

- `getCollection(name: string): Collection`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | संग्रह का नाम |

**उदाहरण**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

जाँचता है कि एक निर्दिष्ट संग्रह (collection) परिभाषित किया गया है या नहीं।

**सिग्नेचर**

- `hasCollection(name: string): boolean`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | संग्रह का नाम |

**उदाहरण**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

एक परिभाषित संग्रह (collection) को हटाता है। इसे केवल मेमोरी से हटाया जाता है; परिवर्तन को स्थायी करने के लिए, आपको `sync` विधि को कॉल करना होगा।

**सिग्नेचर**

- `removeCollection(name: string): void`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | संग्रह का नाम |

**इवेंट्स**

- `'beforeRemoveCollection'`: एक संग्रह को हटाने से पहले ट्रिगर होता है।
- `'afterRemoveCollection'`: एक संग्रह को हटाने के बाद ट्रिगर होता है।

**उदाहरण**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

एक डायरेक्टरी में सभी फ़ाइलों को संग्रह (collection) कॉन्फ़िगरेशन के रूप में मेमोरी में इम्पोर्ट करता है।

**सिग्नेचर**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | - | इम्पोर्ट करने के लिए डायरेक्टरी का पाथ |
| `options.extensions` | `string[]` | `['ts', 'js']` | विशिष्ट सफ़िक्स के लिए स्कैन करें |

**उदाहरण**

`./collections/books.ts` फ़ाइल में परिभाषित संग्रह (collection) इस प्रकार है:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

प्लगइन लोड होने पर संबंधित कॉन्फ़िगरेशन इम्पोर्ट करें:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## एक्सटेंशन पंजीकरण और पुनर्प्राप्ति

### `registerFieldTypes()`

कस्टम फ़ील्ड टाइप पंजीकृत करता है।

**सिग्नेचर**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**पैरामीटर्स**

`fieldTypes` एक की-वैल्यू पेयर है जहाँ की फ़ील्ड टाइप का नाम है और वैल्यू फ़ील्ड टाइप क्लास है।

**उदाहरण**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

कस्टम डेटा मॉडल क्लास पंजीकृत करता है।

**सिग्नेचर**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**पैरामीटर्स**

`models` एक की-वैल्यू पेयर है जहाँ की डेटा मॉडल का नाम है और वैल्यू डेटा मॉडल क्लास है।

**उदाहरण**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

कस्टम रिपॉजिटरी क्लास पंजीकृत करता है।

**सिग्नेचर**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**पैरामीटर्स**

`repositories` एक की-वैल्यू पेयर है जहाँ की रिपॉजिटरी का नाम है और वैल्यू रिपॉजिटरी क्लास है।

**उदाहरण**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

कस्टम डेटा क्वेरी ऑपरेटर पंजीकृत करता है।

**सिग्नेचर**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**पैरामीटर्स**

`operators` एक की-वैल्यू पेयर है जहाँ की ऑपरेटर का नाम है और वैल्यू तुलना स्टेटमेंट जनरेट करने वाला फ़ंक्शन है।

**उदाहरण**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // पंजीकृत ऑपरेटर
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

एक परिभाषित डेटा मॉडल क्लास प्राप्त करता है। यदि पहले कोई कस्टम मॉडल क्लास पंजीकृत नहीं की गई थी, तो यह Sequelize की डिफ़ॉल्ट मॉडल क्लास लौटाएगा। डिफ़ॉल्ट नाम संग्रह (collection) में परिभाषित नाम के समान होता है।

**सिग्नेचर**

- `getModel(name: string): Model`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | - | पंजीकृत मॉडल का नाम |

**उदाहरण**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

ध्यान दें: संग्रह (collection) से प्राप्त मॉडल क्लास पंजीकृत मॉडल क्लास के बिल्कुल समान नहीं होती है, बल्कि यह पंजीकृत मॉडल क्लास से इनहेरिट होती है। चूंकि Sequelize की मॉडल क्लास के गुण इनिशियलाइज़ेशन प्रक्रिया के दौरान संशोधित होते हैं, इसलिए NocoBase इस इनहेरिटेंस संबंध को स्वचालित रूप से संभालता है। क्लास के असमान होने के अलावा, अन्य सभी परिभाषाओं का सामान्य रूप से उपयोग किया जा सकता है।

### `getRepository()`

एक कस्टम रिपॉजिटरी क्लास प्राप्त करता है। यदि पहले कोई कस्टम रिपॉजिटरी क्लास पंजीकृत नहीं की गई थी, तो यह NocoBase की डिफ़ॉल्ट रिपॉजिटरी क्लास लौटाएगा। डिफ़ॉल्ट नाम संग्रह (collection) में परिभाषित नाम के समान होता है।

रिपॉजिटरी क्लास मुख्य रूप से डेटा मॉडल पर आधारित CRUD (बनाना, पढ़ना, अपडेट करना, हटाना) ऑपरेशनों के लिए उपयोग की जाती हैं, [रिपॉजिटरी](/api/database/repository) देखें।

**सिग्नेचर**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ------------ | -------------------- | ------ | ------------------ |
| `name` | `string` | - | पंजीकृत रिपॉजिटरी का नाम |
| `relationId` | `string` \| `number` | - | संबंधपरक डेटा के लिए फ़ॉरेन की वैल्यू |

जब नाम `'tables.relations'` जैसे संबंधपरक नाम के रूप में होता है, तो यह संबंधित रिपॉजिटरी क्लास लौटाएगा। यदि दूसरा पैरामीटर प्रदान किया जाता है, तो रिपॉजिटरी का उपयोग करते समय (क्वेरी करना, अपडेट करना आदि) यह संबंधपरक डेटा के फ़ॉरेन की वैल्यू पर आधारित होगा।

**उदाहरण**

मान लीजिए कि दो संग्रह (collections) हैं, *पोस्ट* और *लेखक*, और पोस्ट संग्रह में एक फ़ॉरेन की है जो लेखक संग्रह की ओर इशारा करती है:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## डेटाबेस इवेंट्स

### `on()`

डेटाबेस इवेंट्स को सुनता है।

**सिग्नेचर**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| -------- | -------- | ------ | ---------- |
| event | string | - | इवेंट का नाम |
| listener | Function | - | इवेंट लिसनर |

इवेंट के नाम डिफ़ॉल्ट रूप से Sequelize के मॉडल इवेंट्स को सपोर्ट करते हैं। ग्लोबल इवेंट्स के लिए, `<sequelize_model_global_event>` फ़ॉर्मेट का उपयोग करके सुनें, और एकल मॉडल इवेंट्स के लिए, `<model_name>.<sequelize_model_event>` फ़ॉर्मेट का उपयोग करके सुनें।

सभी बिल्ट-इन इवेंट टाइप के पैरामीटर विवरण और विस्तृत उदाहरणों के लिए, [बिल्ट-इन इवेंट्स](#बिल्ट-इन-इवेंट्स) सेक्शन देखें।

### `off()`

एक इवेंट लिसनर फ़ंक्शन हटाता है।

**सिग्नेचर**

- `off(name: string, listener: Function)`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| -------- | -------- | ------ | ---------- |
| name | string | - | इवेंट का नाम |
| listener | Function | - | इवेंट लिसनर |

**उदाहरण**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## डेटाबेस ऑपरेशंस

### `auth()`

डेटाबेस कनेक्शन प्रमाणीकरण। इसका उपयोग यह सुनिश्चित करने के लिए किया जा सकता है कि एप्लिकेशन ने डेटा के साथ कनेक्शन स्थापित कर लिया है।

**सिग्नेचर**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?` | `Object` | - | प्रमाणीकरण विकल्प |
| `options.retry?` | `number` | `10` | प्रमाणीकरण विफल होने पर पुनः प्रयास की संख्या |
| `options.transaction?` | `Transaction` | - | ट्रांजेक्शन ऑब्जेक्ट |
| `options.logging?` | `boolean` \| `Function` | `false` | क्या लॉग प्रिंट करने हैं |

**उदाहरण**

```ts
await db.auth();
```

### `reconnect()`

डेटाबेस से फिर से कनेक्ट होता है।

**उदाहरण**

```ts
await db.reconnect();
```

### `closed()`

जाँचता है कि डेटाबेस कनेक्शन बंद है या नहीं।

**सिग्नेचर**

- `closed(): boolean`

### `close()`

डेटाबेस कनेक्शन बंद करता है। `sequelize.close()` के समान है।

### `sync()`

डेटाबेस संग्रह (collection) संरचना को सिंक्रनाइज़ करता है। `sequelize.sync()` के समान है, पैरामीटर के लिए [Sequelize डॉक्यूमेंटेशन](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync) देखें।

### `clean()`

डेटाबेस को साफ़ करता है, सभी संग्रह (collections) को हटा देगा।

**सिग्नेचर**

- `clean(options: CleanOptions): Promise<void>`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop` | `boolean` | `false` | क्या सभी संग्रह (collections) हटाने हैं |
| `options.skip` | `string[]` | - | छोड़े जाने वाले संग्रह (collection) नामों का कॉन्फ़िगरेशन |
| `options.transaction` | `Transaction` | - | ट्रांजेक्शन ऑब्जेक्ट |

**उदाहरण**

`users` संग्रह (collection) को छोड़कर सभी संग्रह (collections) हटाता है।

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## पैकेज-स्तर के एक्सपोर्ट्स

### `defineCollection()`

एक संग्रह (collection) के लिए कॉन्फ़िगरेशन सामग्री बनाता है।

**सिग्नेचर**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | `db.collection()` के सभी पैरामीटर के समान |

**उदाहरण**

`db.import()` द्वारा इम्पोर्ट की जाने वाली संग्रह (collection) कॉन्फ़िगरेशन फ़ाइल के लिए:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

मेमोरी में पहले से मौजूद संग्रह (collection) संरचना कॉन्फ़िगरेशन सामग्री का विस्तार करता है, मुख्य रूप से `import()` विधि द्वारा इम्पोर्ट की गई फ़ाइल सामग्री के लिए उपयोग किया जाता है। यह विधि `@nocobase/database` पैकेज द्वारा एक्सपोर्ट की गई एक टॉप-लेवल विधि है और इसे db इंस्टेंस के माध्यम से कॉल नहीं किया जाता है। `extend` उपनाम का भी उपयोग किया जा सकता है।

**सिग्नेचर**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**पैरामीटर्स**

| पैरामीटर | टाइप | डिफ़ॉल्ट मान | विवरण |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | `db.collection()` के सभी पैरामीटर के समान |
| `mergeOptions?` | `MergeOptions` | - | npm पैकेज [deepmerge](https://npmjs.com/package/deepmerge) के लिए पैरामीटर |

**उदाहरण**

मूल बुक्स संग्रह (collection) परिभाषा (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

विस्तारित बुक्स संग्रह (collection) परिभाषा (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// फिर से विस्तार करें
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

यदि ऊपर दिए गए दो फ़ाइलों को `import()` को कॉल करते समय इम्पोर्ट किया जाता है, और `extend()` के साथ फिर से विस्तारित किया जाता है, तो बुक्स संग्रह (collection) में `title` और `price` दोनों फ़ील्ड होंगे।

यह विधि मौजूदा प्लगइन्स द्वारा पहले से परिभाषित संग्रह (collection) संरचनाओं का विस्तार करने के लिए बहुत उपयोगी है।

## बिल्ट-इन इवेंट्स

डेटाबेस अपने जीवनचक्र के विभिन्न चरणों में निम्नलिखित संबंधित इवेंट्स को ट्रिगर करता है। `on()` विधि के साथ उन्हें सब्सक्राइब करने के बाद विशिष्ट प्रोसेसिंग करके कुछ व्यावसायिक आवश्यकताओं को पूरा किया जा सकता है।

### `'beforeSync'` / `'afterSync'`

जब एक नई संग्रह (collection) संरचना कॉन्फ़िगरेशन (फ़ील्ड, इंडेक्स आदि) डेटाबेस में सिंक्रनाइज़ की जाती है, तो उससे पहले और बाद में यह ट्रिगर होता है। यह आमतौर पर `collection.sync()` (आंतरिक कॉल) निष्पादित होने पर ट्रिगर होता है और आमतौर पर विशेष फ़ील्ड एक्सटेंशन के लॉजिक को संभालने के लिए उपयोग किया जाता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**टाइप**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**उदाहरण**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // कुछ करें
});

db.on('users.afterSync', async (options) => {
  // कुछ करें
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

डेटा बनाने या अपडेट करने से पहले, संग्रह (collection) में परिभाषित नियमों के आधार पर डेटा का सत्यापन (validation) होता है। सत्यापन से पहले और बाद में संबंधित इवेंट्स ट्रिगर होते हैं। यह `repository.create()` या `repository.update()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**टाइप**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**उदाहरण**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// सभी मॉडल
db.on('beforeValidate', async (model, options) => {
  // कुछ करें
});
// टेस्ट मॉडल
db.on('tests.beforeValidate', async (model, options) => {
  // कुछ करें
});

// सभी मॉडल
db.on('afterValidate', async (model, options) => {
  // कुछ करें
});
// टेस्ट मॉडल
db.on('tests.afterValidate', async (model, options) => {
  // कुछ करें
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // ईमेल फ़ॉर्मेट की जाँच करता है
  },
});
// या
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // ईमेल फ़ॉर्मेट की जाँच करता है
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

एक रिकॉर्ड बनाने से पहले और बाद में संबंधित इवेंट्स ट्रिगर होते हैं। यह `repository.create()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**टाइप**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**उदाहरण**

```ts
db.on('beforeCreate', async (model, options) => {
  // कुछ करें
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

एक रिकॉर्ड अपडेट करने से पहले और बाद में संबंधित इवेंट्स ट्रिगर होते हैं। यह `repository.update()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**टाइप**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**उदाहरण**

```ts
db.on('beforeUpdate', async (model, options) => {
  // कुछ करें
});

db.on('books.afterUpdate', async (model, options) => {
  // कुछ करें
});
```

### `'beforeSave'` / `'afterSave'`

एक रिकॉर्ड बनाने या अपडेट करने से पहले और बाद में संबंधित इवेंट्स ट्रिगर होते हैं। यह `repository.create()` या `repository.update()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**टाइप**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**उदाहरण**

```ts
db.on('beforeSave', async (model, options) => {
  // कुछ करें
});

db.on('books.afterSave', async (model, options) => {
  // कुछ करें
});
```

### `'beforeDestroy'` / `'afterDestroy'`

एक रिकॉर्ड हटाने से पहले और बाद में संबंधित इवेंट्स ट्रिगर होते हैं। यह `repository.destroy()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**टाइप**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**उदाहरण**

```ts
db.on('beforeDestroy', async (model, options) => {
  // कुछ करें
});

db.on('books.afterDestroy', async (model, options) => {
  // कुछ करें
});
```

### `'afterCreateWithAssociations'`

पदानुक्रमित संबंध डेटा के साथ एक रिकॉर्ड बनाने के बाद यह इवेंट ट्रिगर होता है। यह `repository.create()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**टाइप**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**उदाहरण**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // कुछ करें
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // कुछ करें
});
```

### `'afterUpdateWithAssociations'`

पदानुक्रमित संबंध डेटा के साथ एक रिकॉर्ड अपडेट करने के बाद यह इवेंट ट्रिगर होता है। यह `repository.update()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**टाइप**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**उदाहरण**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // कुछ करें
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // कुछ करें
});
```

### `'afterSaveWithAssociations'`

पदानुक्रमित संबंध डेटा के साथ एक रिकॉर्ड बनाने या अपडेट करने के बाद यह इवेंट ट्रिगर होता है। यह `repository.create()` या `repository.update()` को कॉल करने पर ट्रिगर होता है।

**सिग्नेचर**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**टाइप**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**उदाहरण**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // कुछ करें
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // कुछ करें
});
```

### `'beforeDefineCollection'`

एक संग्रह (collection) को परिभाषित करने से पहले ट्रिगर होता है, जैसे `db.collection()` को कॉल करने पर।

ध्यान दें: यह एक सिंक्रोनस इवेंट है।

**सिग्नेचर**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**टाइप**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**उदाहरण**

```ts
db.on('beforeDefineCollection', (options) => {
  // कुछ करें
});
```

### `'afterDefineCollection'`

एक संग्रह (collection) को परिभाषित करने के बाद ट्रिगर होता है, जैसे `db.collection()` को कॉल करने पर।

ध्यान दें: यह एक सिंक्रोनस इवेंट है।

**सिग्नेचर**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**टाइप**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**उदाहरण**

```ts
db.on('afterDefineCollection', (collection) => {
  // कुछ करें
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

जब एक संग्रह (collection) को मेमोरी से हटाया जाता है, तो उससे पहले और बाद में यह ट्रिगर होता है, जैसे `db.removeCollection()` को कॉल करने पर।

ध्यान दें: यह एक सिंक्रोनस इवेंट है।

**सिग्नेचर**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**टाइप**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**उदाहरण**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // कुछ करें
});

db.on('afterRemoveCollection', (collection) => {
  // कुछ करें
});
```