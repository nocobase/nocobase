:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# HasManyRepository

`HasManyRepository` एक `Relation Repository` है जिसका उपयोग `HasMany` संबंधों को संभालने के लिए किया जाता है।

## क्लास मेथड्स

### `find()`

संबंधित ऑब्जेक्ट्स खोजें

**सिग्नेचर**

- `async find(options?: FindOptions): Promise<M[]>`

**विवरण**

क्वेरी पैरामीटर्स [`Repository.find()`](../repository.md#find) के समान हैं।

### `findOne()`

एक संबंधित ऑब्जेक्ट खोजें, केवल एक रिकॉर्ड लौटाता है।

**सिग्नेचर**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

क्वेरी शर्तों को पूरा करने वाले रिकॉर्ड्स की संख्या लौटाता है।

**सिग्नेचर**

- `async count(options?: CountOptions)`

**प्रकार**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

डेटाबेस से विशिष्ट शर्तों से मेल खाने वाले डेटासेट और परिणामों की संख्या को क्वेरी करता है।

**सिग्नेचर**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**प्रकार**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

संबंधित ऑब्जेक्ट्स बनाएं

**सिग्नेचर**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

शर्तों को पूरा करने वाले संबंधित ऑब्जेक्ट्स को अपडेट करें।

**सिग्नेचर**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

शर्तों को पूरा करने वाले संबंधित ऑब्जेक्ट्स को हटाएँ।

**सिग्नेचर**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

ऑब्जेक्ट एसोसिएशन जोड़ें

**सिग्नेचर**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**प्रकार**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**विवरण**

- `tk` - संबंधित ऑब्जेक्ट का `targetKey` मान, जो एक एकल मान या एक ऐरे (array) हो सकता है।
  <embed src="../shared/transaction.md"></embed>

### `remove()`

दिए गए ऑब्जेक्ट्स के साथ एसोसिएशन हटाएँ।

**सिग्नेचर**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**विवरण**

पैरामीटर्स [`add()`](#add) मेथड के समान हैं।

### `set()`

वर्तमान संबंध के लिए संबंधित ऑब्जेक्ट्स सेट करें।

**सिग्नेचर**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**विवरण**

पैरामीटर्स [`add()`](#add) मेथड के समान हैं।