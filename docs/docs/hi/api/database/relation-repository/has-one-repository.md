:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# HasOneRepository

## अवलोकन

`HasOneRepository`, `HasOne` प्रकार के एसोसिएशन के लिए एक रिपॉजिटरी है।

```typescript
const User = db.collection({
  name: 'users',
  fields: [
    { type: 'hasOne', name: 'profile' },
    { type: 'string', name: 'name' },
  ],
});

const Profile = db.collection({
  name: 'profiles',
  fields: [{ type: 'string', name: 'avatar' }],
});

const user = await User.repository.create({
  values: { name: 'u1' },
});

// एसोसिएशन रिपॉजिटरी प्राप्त करें
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// इसे सीधे भी इनिशियलाइज़ किया जा सकता है
new HasOneRepository(User, 'profile', user.get('id'));
```

## क्लास मेथड्स

### `find()`

संबंधित ऑब्जेक्ट को खोजें

**सिग्नेचर**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**प्रकार**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**विवरण**

क्वेरी पैरामीटर [`Repository.find()`](../repository.md#find) के समान हैं।

**उदाहरण**

```typescript
const profile = await UserProfileRepository.find();
// यदि संबंधित ऑब्जेक्ट मौजूद नहीं है, तो null लौटाता है
```

### `create()`

संबंधित ऑब्जेक्ट बनाएँ

**सिग्नेचर**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**उदाहरण**

```typescript
const profile = await UserProfileRepository.create({
  values: { avatar: 'avatar1' },
});

console.log(profile.toJSON());
/*
{
  id: 1,
  avatar: 'avatar1',
  userId: 1,
  updatedAt: 2022-09-24T13:59:40.025Z,
  createdAt: 2022-09-24T13:59:40.025Z
}
*/
```

### `update()`

संबंधित ऑब्जेक्ट को अपडेट करें

**सिग्नेचर**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**उदाहरण**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

संबंधित ऑब्जेक्ट को हटाएँ। यह केवल एसोसिएशन को अनलिंक करता है, संबंधित ऑब्जेक्ट को डिलीट नहीं करता है।

**सिग्नेचर**

- `async remove(options?: Transactionable): Promise<void>`

**विवरण**

- `transaction`: ट्रांजेक्शन ऑब्जेक्ट। यदि कोई ट्रांजेक्शन पैरामीटर पास नहीं किया जाता है, तो यह मेथड स्वचालित रूप से एक आंतरिक ट्रांजेक्शन बनाएगा।

**उदाहरण**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

संबंधित ऑब्जेक्ट को डिलीट करें

**सिग्नेचर**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**विवरण**

- `transaction`: ट्रांजेक्शन ऑब्जेक्ट। यदि कोई ट्रांजेक्शन पैरामीटर पास नहीं किया जाता है, तो यह मेथड स्वचालित रूप से एक आंतरिक ट्रांजेक्शन बनाएगा।

**उदाहरण**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

संबंधित ऑब्जेक्ट को सेट करें

**सिग्नेचर**

- `async set(options: TargetKey | SetOption): Promise<void>`

**प्रकार**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**विवरण**

- `tk`: सेट किए जाने वाले संबंधित ऑब्जेक्ट का targetKey।
- `transaction`: ट्रांजेक्शन ऑब्जेक्ट। यदि कोई ट्रांजेक्शन पैरामीटर पास नहीं किया जाता है, तो यह मेथड स्वचालित रूप से एक आंतरिक ट्रांजेक्शन बनाएगा।

**उदाहरण**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```