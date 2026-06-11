---
title: "HasOneRepository"
description: "Repository relasi HasOne NocoBase: menangani CRUD untuk relasi one-to-one, antarmukanya konsisten dengan BelongsToRepository."
keywords: "HasOneRepository,HasOne,one-to-one,Repository,NocoBase"
---

# HasOneRepository

## Ikhtisar

`HasOneRepository` adalah Repository asosiasi tipe `HasOne`.

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

// Mendapatkan Repository asosiasi
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Atau dapat langsung diinisialisasi
new HasOneRepository(User, 'profile', user.get('id'));
```

## Method Class

### `find()`

Mencari objek terkait

**Signature**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Tipe**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Detail**

Parameter query konsisten dengan [`Repository.find()`](../repository.md#find).

**Contoh**

```typescript
const profile = await UserProfileRepository.find();
// Saat objek terkait tidak ada, mengembalikan null
```

### `create()`

Membuat objek terkait

**Signature**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Contoh**

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

Memperbarui objek terkait

**Signature**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Contoh**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Menghapus objek terkait, hanya melepaskan asosiasi, tidak menghapus objek terkait

**Signature**

- `async remove(options?: Transactionable): Promise<void>`

**Detail**

- `transaction`: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.

**Contoh**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Menghapus objek terkait

**Signature**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Detail**

- `transaction`: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.

**Contoh**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Mengatur objek terkait

**Signature**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Tipe**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Detail**

- tk: Mengatur targetKey dari objek terkait
- transaction: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.

**Contoh**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```
