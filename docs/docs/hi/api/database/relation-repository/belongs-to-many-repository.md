:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# BelongsToManyRepository

`BelongsToManyRepository` एक `Relation Repository` है जिसका उपयोग `BelongsToMany` संबंधों को संभालने के लिए किया जाता है।

अन्य संबंध प्रकारों के विपरीत, `BelongsToMany` प्रकार के संबंधों को एक मध्यवर्ती तालिका (junction table) के माध्यम से रिकॉर्ड करने की आवश्यकता होती है। NocoBase में एक संबंध परिभाषित करते समय, एक मध्यवर्ती तालिका स्वचालित रूप से बनाई जा सकती है, या आप इसे स्पष्ट रूप से निर्दिष्ट कर सकते हैं।

## क्लास मेथड्स

### `find()`

संबंधित ऑब्जेक्ट्स को खोजें

**हस्ताक्षर**

- `async find(options?: FindOptions): Promise<M[]>`

**विवरण**

क्वेरी पैरामीटर [`Repository.find()`](../repository.md#find) के समान हैं।

### `findOne()`

एक संबंधित ऑब्जेक्ट को खोजें, केवल एक रिकॉर्ड लौटाता है

**हस्ताक्षर**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

क्वेरी शर्तों से मेल खाने वाले रिकॉर्ड की संख्या लौटाता है

**हस्ताक्षर**

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

विशिष्ट शर्तों के तहत डेटाबेस से एक डेटासेट और कुल संख्या को क्वेरी करता है।

**हस्ताक्षर**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**प्रकार**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

एक संबंधित ऑब्जेक्ट बनाएं

**हस्ताक्षर**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

शर्तों को पूरा करने वाले संबंधित ऑब्जेक्ट्स को अपडेट करें

**हस्ताक्षर**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

शर्तों को पूरा करने वाले संबंधित ऑब्जेक्ट्स को हटाएँ

**हस्ताक्षर**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

नए संबंधित ऑब्जेक्ट्स जोड़ें

**हस्ताक्षर**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**प्रकार**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**विवरण**

आप सीधे संबंधित ऑब्जेक्ट का `targetKey` पास कर सकते हैं, या `targetKey` को मध्यवर्ती तालिका के फ़ील्ड मानों के साथ पास कर सकते हैं।

**उदाहरण**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// targetKey पास करें
PostTagRepository.add([t1.id, t2.id]);

// मध्यवर्ती तालिका के फ़ील्ड पास करें
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

संबंधित ऑब्जेक्ट्स सेट करें

**हस्ताक्षर**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**विवरण**

पैरामीटर [add()](#add) के समान हैं।

### `remove()`

दिए गए ऑब्जेक्ट्स के साथ संबंध हटाएँ

**हस्ताक्षर**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**प्रकार**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

संबंधित ऑब्जेक्ट्स को टॉगल करें।

कुछ व्यावसायिक परिदृश्यों में, संबंधित ऑब्जेक्ट्स को टॉगल करना अक्सर आवश्यक होता है। उदाहरण के लिए, एक उपयोगकर्ता किसी उत्पाद को पसंदीदा बना सकता है, उसे पसंदीदा सूची से हटा सकता है, और फिर से पसंदीदा बना सकता है। `toggle` मेथड का उपयोग ऐसी कार्यक्षमता को तेज़ी से लागू करने के लिए किया जा सकता है।

**हस्ताक्षर**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**विवरण**

`toggle` मेथड स्वचालित रूप से जांचता है कि संबंधित ऑब्जेक्ट पहले से मौजूद है या नहीं। यदि यह मौजूद है, तो इसे हटा दिया जाता है; यदि नहीं, तो इसे जोड़ दिया जाता है।