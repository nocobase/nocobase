:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# रिपॉजिटरी

## अवलोकन

किसी दिए गए `संग्रह` ऑब्जेक्ट पर, आप डेटा तालिका पर पढ़ने और लिखने के ऑपरेशन करने के लिए उसका `रिपॉजिटरी` ऑब्जेक्ट प्राप्त कर सकते हैं।

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### क्वेरी

#### बेसिक क्वेरी

`रिपॉजिटरी` ऑब्जेक्ट पर, आप `find*` से संबंधित तरीकों को कॉल करके क्वेरी ऑपरेशन कर सकते हैं। सभी क्वेरी तरीके डेटा को फ़िल्टर करने के लिए `filter` पैरामीटर पास करने का समर्थन करते हैं।

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### ऑपरेटर

`रिपॉजिटरी` में `filter` पैरामीटर, अधिक विविध क्वेरी ऑपरेशन करने के लिए विभिन्न प्रकार के ऑपरेटर भी प्रदान करता है।

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

ऑपरेटरों के बारे में अधिक जानकारी के लिए, कृपया [फ़िल्टर ऑपरेटर](/api/database/operators) देखें।

#### फ़ील्ड कंट्रोल

क्वेरी ऑपरेशन करते समय, आप `fields`, `except`, और `appends` पैरामीटर के माध्यम से आउटपुट फ़ील्ड को नियंत्रित कर सकते हैं।

- `fields`: आउटपुट फ़ील्ड निर्दिष्ट करें
- `except`: आउटपुट फ़ील्ड को बाहर करें
- `appends`: आउटपुट में संबंधित फ़ील्ड जोड़ें

```javascript
// प्राप्त परिणाम में केवल id और name फ़ील्ड शामिल होंगे
userRepository.find({
  fields: ['id', 'name'],
});

// प्राप्त परिणाम में password फ़ील्ड शामिल नहीं होगा
userRepository.find({
  except: ['password'],
});

// प्राप्त परिणाम में संबंधित ऑब्जेक्ट posts का डेटा शामिल होगा
userRepository.find({
  appends: ['posts'],
});
```

#### संबंध फ़ील्ड क्वेरी करना

`filter` पैरामीटर संबंध फ़ील्ड द्वारा फ़िल्टर करने का समर्थन करता है, उदाहरण के लिए:

```javascript
// उन उपयोगकर्ता ऑब्जेक्ट्स के लिए क्वेरी करें जिनके संबंधित पोस्ट में 'post title' शीर्षक वाला ऑब्जेक्ट है
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

संबंध फ़ील्ड को नेस्ट भी किया जा सकता है।

```javascript
// उन उपयोगकर्ता ऑब्जेक्ट्स के लिए क्वेरी करें जिनके पोस्ट की टिप्पणियों में कीवर्ड शामिल हैं
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### सॉर्टिंग

आप क्वेरी परिणामों को `sort` पैरामीटर का उपयोग करके सॉर्ट कर सकते हैं।

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

आप संबंधित ऑब्जेक्ट के फ़ील्ड द्वारा भी सॉर्ट कर सकते हैं।

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### बनाना

#### बेसिक बनाना

`रिपॉजिटरी` के माध्यम से नए डेटा ऑब्जेक्ट बनाएँ।

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// बैच में बनाने का समर्थन करता है
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### संबंध बनाना

बनाते समय, आप एक साथ संबंधित ऑब्जेक्ट भी बना सकते हैं। क्वेरी करने के समान, संबंधित ऑब्जेक्ट के नेस्टेड उपयोग का भी समर्थन किया जाता है, उदाहरण के लिए:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// उपयोगकर्ता बनाते समय, एक पोस्ट बनाई जाती है और उपयोगकर्ता से संबंधित होती है, और टैग बनाए जाते हैं और पोस्ट से संबंधित होते हैं।
```

यदि संबंधित ऑब्जेक्ट डेटाबेस में पहले से मौजूद है, तो आप बनाते समय उसके ID को पास करके उसके साथ एक संबंध स्थापित कर सकते हैं।

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // एक मौजूदा संबंधित ऑब्जेक्ट के साथ संबंध स्थापित करें
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### अपडेट करना

#### बेसिक अपडेट

एक डेटा ऑब्जेक्ट प्राप्त करने के बाद, आप सीधे डेटा ऑब्जेक्ट (`Model`) पर उसकी प्रॉपर्टीज़ को संशोधित कर सकते हैं और फिर परिवर्तनों को सहेजने के लिए `save` विधि को कॉल कर सकते हैं।

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

डेटा ऑब्जेक्ट `Model` Sequelize Model से इनहेरिट होता है। `Model` पर ऑपरेशनों के लिए, कृपया [Sequelize Model](https://sequelize.org/master/manual/model-basics.html) देखें।

आप `रिपॉजिटरी` के माध्यम से भी डेटा अपडेट कर सकते हैं:

```javascript
// फ़िल्टर मानदंडों को पूरा करने वाले डेटा रिकॉर्ड को अपडेट करें
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

अपडेट करते समय, आप `whitelist` और `blacklist` पैरामीटर का उपयोग करके नियंत्रित कर सकते हैं कि कौन से फ़ील्ड अपडेट किए जाते हैं, उदाहरण के लिए:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // केवल age फ़ील्ड को अपडेट करें
});
```

#### संबंध फ़ील्ड अपडेट करना

अपडेट करते समय, आप संबंधित ऑब्जेक्ट सेट कर सकते हैं, उदाहरण के लिए:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // tag1 के साथ संबंध स्थापित करें
      },
      {
        name: 'tag2', // एक नया टैग बनाएँ और संबंध स्थापित करें
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // पोस्ट को टैग से अलग करें
  },
});
```

### हटाना

आप `रिपॉजिटरी` में `destroy()` विधि को कॉल करके हटाने का ऑपरेशन कर सकते हैं। हटाते समय आपको फ़िल्टर मानदंड निर्दिष्ट करने की आवश्यकता है:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## कंस्ट्रक्टर

आमतौर पर डेवलपर्स द्वारा सीधे कॉल नहीं किया जाता है। यह मुख्य रूप से `db.registerRepositories()` के माध्यम से प्रकार को रजिस्टर करने और `db.collection()` के पैरामीटर में संबंधित रजिस्टर्ड रिपॉजिटरी प्रकार को निर्दिष्ट करने के बाद इंस्टेंशिएट किया जाता है।

**सिग्नेचर**

- `constructor(collection: Collection)`

**उदाहरण**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // यहाँ रजिस्टर्ड रिपॉजिटरी से लिंक करें
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## इंस्टेंस सदस्य

### `database`

संदर्भ का डेटाबेस प्रबंधन इंस्टेंस।

### `collection`

संबंधित संग्रह प्रबंधन इंस्टेंस।

### `model`

संबंधित मॉडल क्लास।

## इंस्टेंस विधियाँ

### `find()`

डेटाबेस से एक डेटासेट क्वेरी करता है, जिसमें फ़िल्टर शर्तें, सॉर्टिंग आदि निर्दिष्ट करने की अनुमति होती है।

**सिग्नेचर**

- `async find(options?: FindOptions): Promise<Model[]>`

**टाइप**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**विवरण**

#### `filter: Filter`

क्वेरी शर्त जिसका उपयोग डेटा परिणामों को फ़िल्टर करने के लिए किया जाता है। पास किए गए क्वेरी पैरामीटर में, `key` क्वेरी करने के लिए फ़ील्ड का नाम है, और `value` क्वेरी करने के लिए मान हो सकता है या अन्य सशर्त डेटा फ़िल्टरिंग के लिए ऑपरेटरों के साथ उपयोग किया जा सकता है।

```typescript
// उन रिकॉर्ड्स के लिए क्वेरी करें जहाँ नाम 'foo' है, और उम्र 18 से अधिक है
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

अधिक ऑपरेटरों के लिए, कृपया [क्वेरी ऑपरेटर](./operators.md) देखें।

#### `filterByTk: TargetKey`

`TargetKey` द्वारा डेटा क्वेरी करता है, जो `filter` पैरामीटर के लिए एक सुविधाजनक तरीका है। `TargetKey` के लिए विशिष्ट फ़ील्ड को `संग्रह` में [कॉन्फ़िगर](./collection.md#filtertargetkey) किया जा सकता है, जो डिफ़ॉल्ट रूप से `primaryKey` होता है।

```typescript
// डिफ़ॉल्ट रूप से, id = 1 वाले रिकॉर्ड को ढूंढता है
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

क्वेरी कॉलम, डेटा फ़ील्ड परिणामों को नियंत्रित करने के लिए उपयोग किए जाते हैं। इस पैरामीटर को पास करने के बाद, केवल निर्दिष्ट फ़ील्ड ही वापस किए जाएंगे।

#### `except: string[]`

बहिष्कृत कॉलम, डेटा फ़ील्ड परिणामों को नियंत्रित करने के लिए उपयोग किए जाते हैं। इस पैरामीटर को पास करने के बाद, पास किए गए फ़ील्ड आउटपुट नहीं होंगे।

#### `appends: string[]`

जोड़े गए कॉलम, संबंधित डेटा को लोड करने के लिए उपयोग किए जाते हैं। इस पैरामीटर को पास करने के बाद, निर्दिष्ट संबंध फ़ील्ड भी आउटपुट होंगे।

#### `sort: string[] | string`

क्वेरी परिणामों के लिए सॉर्टिंग विधि निर्दिष्ट करता है। पैरामीटर फ़ील्ड का नाम है, जो डिफ़ॉल्ट रूप से आरोही (`asc`) क्रम में होता है। अवरोही (`desc`) क्रम के लिए, फ़ील्ड नाम से पहले `-` प्रतीक जोड़ें, जैसे: `['-id', 'name']`, जिसका अर्थ है `id desc, name asc` द्वारा सॉर्ट करना।

#### `limit: number`

परिणामों की संख्या को सीमित करता है, `SQL` में `limit` के समान।

#### `offset: number`

क्वेरी ऑफ़सेट, `SQL` में `offset` के समान।

**उदाहरण**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

डेटाबेस से विशिष्ट मानदंडों को पूरा करने वाले डेटा के एक टुकड़े को क्वेरी करता है। Sequelize के `Model.findOne()` के समतुल्य।

**सिग्नेचर**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**उदाहरण**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

डेटाबेस से विशिष्ट मानदंडों को पूरा करने वाले डेटा प्रविष्टियों की कुल संख्या को क्वेरी करता है। Sequelize के `Model.count()` के समतुल्य।

**सिग्नेचर**

- `count(options?: CountOptions): Promise<number>`

**टाइप**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**उदाहरण**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

डेटाबेस से विशिष्ट मानदंडों को पूरा करने वाले एक डेटासेट और परिणामों की कुल संख्या को क्वेरी करता है। Sequelize में `Model.findAndCountAll()` के समतुल्य।

**सिग्नेचर**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**टाइप**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**विवरण**

क्वेरी पैरामीटर `find()` के समान हैं। रिटर्न वैल्यू एक ऐरे है जहाँ पहला एलिमेंट क्वेरी परिणाम है और दूसरा एलिमेंट कुल संख्या है।

### `create()`

`संग्रह` में एक नया रिकॉर्ड सम्मिलित करता है। Sequelize में `Model.create()` के समतुल्य। जब बनाए जाने वाले डेटा ऑब्जेक्ट में संबंध फ़ील्ड के बारे में जानकारी होती है, तो संबंधित संबंध डेटा रिकॉर्ड भी बनाए या अपडेट किए जाएंगे।

**सिग्नेचर**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**उदाहरण**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 रिलीज़ नोट्स',
    tags: [
      // जब संबंध तालिका की प्राइमरी कुंजी का मान मौजूद हो, तो यह उस डेटा को अपडेट करता है
      { id: 1 },
      // जब प्राइमरी कुंजी का मान मौजूद न हो, तो यह नया डेटा बनाता है
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

`संग्रह` में कई नए रिकॉर्ड सम्मिलित करता है। `create()` विधि को कई बार कॉल करने के समतुल्य।

**सिग्नेचर**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**टाइप**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**विवरण**

- `records`: बनाए जाने वाले रिकॉर्ड के लिए डेटा ऑब्जेक्ट्स का एक ऐरे।
- `transaction`: ट्रांज़ैक्शन ऑब्जेक्ट। यदि कोई ट्रांज़ैक्शन पैरामीटर पास नहीं किया जाता है, तो विधि स्वचालित रूप से एक आंतरिक ट्रांज़ैक्शन बनाएगी।

**उदाहरण**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 रिलीज़ नोट्स',
      tags: [
        // जब संबंध तालिका की प्राइमरी कुंजी का मान मौजूद हो, तो यह उस डेटा को अपडेट करता है
        { id: 1 },
        // जब प्राइमरी कुंजी का मान मौजूद न हो, तो यह नया डेटा बनाता है
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 रिलीज़ नोट्स',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

`संग्रह` में डेटा अपडेट करता है। Sequelize में `Model.update()` के समतुल्य। जब अपडेट किए जाने वाले डेटा ऑब्जेक्ट में संबंध फ़ील्ड के बारे में जानकारी होती है, तो संबंधित संबंध डेटा रिकॉर्ड भी बनाए या अपडेट किए जाएंगे।

**सिग्नेचर**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**उदाहरण**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 रिलीज़ नोट्स',
    tags: [
      // जब संबंध तालिका की प्राइमरी कुंजी का मान मौजूद हो, तो यह उस डेटा को अपडेट करता है
      { id: 1 },
      // जब प्राइमरी कुंजी का मान मौजूद न हो, तो यह नया डेटा बनाता है
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

`संग्रह` से डेटा हटाता है। Sequelize में `Model.destroy()` के समतुल्य।

**सिग्नेचर**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**टाइप**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**विवरण**

- `filter`: हटाए जाने वाले रिकॉर्ड के लिए फ़िल्टर शर्तें निर्दिष्ट करता है। फ़िल्टर के विस्तृत उपयोग के लिए [`find()`](#find) विधि देखें।
- `filterByTk`: TargetKey द्वारा हटाए जाने वाले रिकॉर्ड के लिए फ़िल्टर शर्तें निर्दिष्ट करता है।
- `truncate`: क्या `संग्रह` डेटा को ट्रंकेट करना है, यह तब प्रभावी होता है जब कोई `filter` या `filterByTk` पैरामीटर पास नहीं किया जाता है।
- `transaction`: ट्रांज़ैक्शन ऑब्जेक्ट। यदि कोई ट्रांज़ैक्शन पैरामीटर पास नहीं किया जाता है, तो विधि स्वचालित रूप से एक आंतरिक ट्रांज़ैक्शन बनाएगी।