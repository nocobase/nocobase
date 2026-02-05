:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# HasOneRepository

## Gambaran Umum

`HasOneRepository` adalah repository untuk asosiasi tipe `HasOne`.

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

// Mendapatkan repository asosiasi
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Dapat juga diinisialisasi secara langsung
new HasOneRepository(User, 'profile', user.get('id'));
```

## Metode Kelas

### `find()`

Mencari objek terkait

**Tanda Tangan**

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

Parameter kueri sama dengan [`Repository.find()`](../repository.md#find).

**Contoh**

```typescript
const profile = await UserProfileRepository.find();
// Mengembalikan null jika objek terkait tidak ada
```

### `create()`

Membuat objek terkait

**Tanda Tangan**

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

**Tanda Tangan**

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

Menghapus objek terkait. Ini hanya melepaskan asosiasi, tidak menghapus objek terkait.

**Tanda Tangan**

- `async remove(options?: Transactionable): Promise<void>`

**Detail**

- `transaction`: Objek transaksi. Jika parameter transaksi tidak diberikan, metode ini akan secara otomatis membuat transaksi internal.

**Contoh**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Menghapus objek terkait

**Tanda Tangan**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Detail**

- `transaction`: Objek transaksi. Jika parameter transaksi tidak diberikan, metode ini akan secara otomatis membuat transaksi internal.

**Contoh**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Mengatur objek terkait

**Tanda Tangan**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Tipe**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Detail**

- `tk`: `targetKey` dari objek terkait yang akan diatur.
- `transaction`: Objek transaksi. Jika parameter transaksi tidak diberikan, metode ini akan secara otomatis membuat transaksi internal.

**Contoh**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```