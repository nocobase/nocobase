:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# संग्रह

## अवलोकन

`संग्रह` का उपयोग सिस्टम में डेटा मॉडल को परिभाषित करने के लिए किया जाता है, जैसे मॉडल का नाम, फ़ील्ड, इंडेक्स, और संबंध जैसी जानकारी।
इसे आमतौर पर `Database` इंस्टेंस के `collection` मेथड के ज़रिए प्रॉक्सी एंट्री पॉइंट के रूप में कॉल किया जाता है।

```javascript
const { Database } = require('@nocobase/database')

// डेटाबेस इंस्टेंस बनाएँ
const db = new Database({...});

// डेटा मॉडल परिभाषित करें
db.collection({
  name: 'users',
  // मॉडल फ़ील्ड परिभाषित करें
  fields: [
    // स्केलर फ़ील्ड
    {
      name: 'name',
      type: 'string',
    },

    // संबंध फ़ील्ड
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

अधिक फ़ील्ड प्रकारों के लिए, कृपया [फ़ील्ड](/api/database/field) देखें।

## कंस्ट्रक्टर

**सिग्नेचर**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**पैरामीटर**

| पैरामीटर              | टाइप                                                        | डिफ़ॉल्ट मान | विवरण                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | `संग्रह` पहचानकर्ता                                                                     |
| `options.tableName?`  | `string`                                                    | -      | डेटाबेस टेबल का नाम। यदि प्रदान नहीं किया गया है, तो `options.name` का मान उपयोग किया जाएगा। |
| `options.fields?`     | `FieldOptions[]`                                            | -      | फ़ील्ड परिभाषाएँ। विवरण के लिए [फ़ील्ड](./field) देखें।                                 |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Sequelize मॉडल टाइप। यदि `string` का उपयोग किया जाता है, तो मॉडल का नाम पहले से ही `db` पर रजिस्टर होना चाहिए। |
| `options.repository?` | `string \| RepositoryType`                                  | -      | रिपॉजिटरी टाइप। यदि `string` का उपयोग किया जाता है, तो रिपॉजिटरी टाइप पहले से ही `db` पर रजिस्टर होना चाहिए। |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | सॉर्टेबल फ़ील्ड कॉन्फ़िगरेशन। डिफ़ॉल्ट रूप से सॉर्टेबल नहीं होता है।                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | क्या एक अद्वितीय प्राइमरी की स्वचालित रूप से जनरेट करनी है। डिफ़ॉल्ट `true` है।                                                    |
| `context.database`    | `Database`                                                  | -      | वर्तमान संदर्भ में डेटाबेस।                                                                 |

**उदाहरण**

एक पोस्ट `संग्रह` बनाएँ:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // मौजूदा डेटाबेस इंस्टेंस
    database: db,
  },
);
```

## इंस्टेंस मेंबर्स

### `options`

`संग्रह` के लिए प्रारंभिक कॉन्फ़िगरेशन पैरामीटर। यह कंस्ट्रक्टर के `options` पैरामीटर के समान है।

### `context`

वर्तमान `संग्रह` जिस संदर्भ से संबंधित है, वह मुख्य रूप से डेटाबेस इंस्टेंस है।

### `name`

`संग्रह` का नाम।

### `db`

संबंधित डेटाबेस इंस्टेंस।

### `filterTargetKey`

प्राइमरी की के रूप में उपयोग किया जाने वाला फ़ील्ड नाम।

### `isThrough`

क्या यह एक थ्रू `संग्रह` है।

### `model`

Sequelize मॉडल टाइप से मेल खाता है।

### `repository`

रिपॉजिटरी इंस्टेंस।

## फ़ील्ड कॉन्फ़िगरेशन मेथड्स

### `getField()`

`संग्रह` में परिभाषित संबंधित नाम वाले फ़ील्ड ऑब्जेक्ट को प्राप्त करता है।

**सिग्नेचर**

- `getField(name: string): Field`

**पैरामीटर**

| पैरामीटर | टाइप     | डिफ़ॉल्ट मान | विवरण     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | फ़ील्ड का नाम |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

`संग्रह` के लिए एक फ़ील्ड सेट करता है।

**सिग्नेचर**

- `setField(name: string, options: FieldOptions): Field`

**पैरामीटर**

| पैरामीटर  | टाइप           | डिफ़ॉल्ट मान | विवरण                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | फ़ील्ड का नाम                        |
| `options` | `FieldOptions` | -      | फ़ील्ड कॉन्फ़िगरेशन। विवरण के लिए [फ़ील्ड](./field) देखें। |

**उदाहरण**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

`संग्रह` के लिए एक साथ कई फ़ील्ड सेट करता है।

**सिग्नेचर**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**पैरामीटर**

| पैरामीटर      | टाइप             | डिफ़ॉल्ट मान | विवरण                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | फ़ील्ड कॉन्फ़िगरेशन। विवरण के लिए [फ़ील्ड](./field) देखें। |
| `resetFields` | `boolean`        | `true` | क्या मौजूदा फ़ील्ड्स को रीसेट करना है।            |

**उदाहरण**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

`संग्रह` में परिभाषित संबंधित नाम वाले फ़ील्ड ऑब्जेक्ट को हटाता है।

**सिग्नेचर**

- `removeField(name: string): void | Field`

**पैरामीटर**

| पैरामीटर | टाइप     | डिफ़ॉल्ट मान | विवरण     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | फ़ील्ड का नाम |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

`संग्रह` के फ़ील्ड्स को रीसेट (खाली) करता है।

**सिग्नेचर**

- `resetFields(): void`

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

जाँचता है कि क्या `संग्रह` में संबंधित नाम वाला फ़ील्ड ऑब्जेक्ट परिभाषित है।

**सिग्नेचर**

- `hasField(name: string): boolean`

**पैरामीटर**

| पैरामीटर | टाइप     | डिफ़ॉल्ट मान | विवरण     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | फ़ील्ड का नाम |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

`संग्रह` में शर्तों को पूरा करने वाले फ़ील्ड ऑब्जेक्ट को ढूँढता है।

**सिग्नेचर**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**पैरामीटर**

| पैरामीटर    | टाइप                        | डिफ़ॉल्ट मान | विवरण     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | खोजने की शर्त |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

`संग्रह` में फ़ील्ड ऑब्जेक्ट्स पर इटरेट करता है।

**सिग्नेचर**

- `forEachField(callback: (field: Field) => void): void`

**पैरामीटर**

| पैरामीटर   | टाइप                     | डिफ़ॉल्ट मान | विवरण     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | कॉलबैक फ़ंक्शन |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## इंडेक्स कॉन्फ़िगरेशन मेथड्स

### `addIndex()`

`संग्रह` में एक इंडेक्स जोड़ता है।

**सिग्नेचर**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**पैरामीटर**

| पैरामीटर | टाइप                                                         | डिफ़ॉल्ट मान | विवरण                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | इंडेक्स किए जाने वाले फ़ील्ड का नाम/नाम। |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | पूर्ण कॉन्फ़िगरेशन।             |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

`संग्रह` से एक इंडेक्स हटाता है।

**सिग्नेचर**

- `removeIndex(fields: string[])`

**पैरामीटर**

| पैरामीटर  | टाइप       | डिफ़ॉल्ट मान | विवरण                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | हटाए जाने वाले इंडेक्स के लिए फ़ील्ड नामों का संयोजन। |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## `संग्रह` कॉन्फ़िगरेशन मेथड्स

### `remove()`

`संग्रह` को हटाता है।

**सिग्नेचर**

- `remove(): void`

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## डेटाबेस ऑपरेशन मेथड्स

### `sync()`

`संग्रह` परिभाषा को डेटाबेस में सिंक करता है। Sequelize में `Model.sync` के डिफ़ॉल्ट लॉजिक के अलावा, यह संबंध फ़ील्ड्स से संबंधित `संग्रह` को भी प्रोसेस करता है।

**सिग्नेचर**

- `sync(): Promise<void>`

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

जाँचता है कि क्या `संग्रह` डेटाबेस में मौजूद है।

**सिग्नेचर**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**पैरामीटर**

| पैरामीटर               | टाइप          | डिफ़ॉल्ट मान | विवरण     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | ट्रांज़ैक्शन इंस्टेंस |

**उदाहरण**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(मौजूद है); // false
```

### `removeFromDb()`

**सिग्नेचर**

- `removeFromDb(): Promise<void>`

**उदाहरण**

```ts
const books = db.collection({
  name: 'books',
});

// किताबों के `संग्रह` को डेटाबेस में सिंक करें
await db.sync();

// डेटाबेस से किताबों के `संग्रह` को हटाएँ
await books.removeFromDb();
```