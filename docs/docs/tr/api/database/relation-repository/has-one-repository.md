:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# HasOneRepository

## Genel Bakış

`HasOneRepository`, `HasOne` tipi ilişkiler için kullanılan bir repository'dir.

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

// İlişkili repository'yi alın
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Doğrudan da başlatılabilir
new HasOneRepository(User, 'profile', user.get('id'));
```

## Sınıf Metotları

### `find()`

İlişkili nesneyi bulur.

**İmza**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Tip**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Detaylar**

Sorgu parametreleri, [`Repository.find()`](../repository.md#find) ile aynıdır.

**Örnek**

```typescript
const profile = await UserProfileRepository.find();
// İlişkili nesne mevcut değilse null döner
```

### `create()`

İlişkili bir nesne oluşturur.

**İmza**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Örnek**

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

İlişkili nesneyi günceller.

**İmza**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Örnek**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

İlişkili nesneyi kaldırır. Bu işlem yalnızca ilişkiyi keser, ilişkili nesneyi silmez.

**İmza**

- `async remove(options?: Transactionable): Promise<void>`

**Detaylar**

- `transaction`: İşlem (transaction) nesnesi. Eğer bir işlem parametresi geçilmezse, metot otomatik olarak dahili bir işlem oluşturacaktır.

**Örnek**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

İlişkili nesneyi siler.

**İmza**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Detaylar**

- `transaction`: İşlem (transaction) nesnesi. Eğer bir işlem parametresi geçilmezse, metot otomatik olarak dahili bir işlem oluşturacaktır.

**Örnek**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

İlişkili nesneyi ayarlar.

**İmza**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Tip**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Detaylar**

- `tk`: Ayarlanacak ilişkili nesnenin `targetKey`'i.
- `transaction`: İşlem (transaction) nesnesi. Eğer bir işlem parametresi geçilmezse, metot otomatik olarak dahili bir işlem oluşturacaktır.

**Örnek**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```