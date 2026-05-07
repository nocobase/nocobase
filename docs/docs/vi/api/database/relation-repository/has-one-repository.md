---
title: "HasOneRepository"
description: "Repository quan hệ HasOne của NocoBase: xử lý CRUD cho quan hệ một-một, interface giống BelongsToRepository."
keywords: "HasOneRepository,HasOne,một-một,Repository,NocoBase"
---

# HasOneRepository

## Tổng quan

`HasOneRepository` là Repository quan hệ kiểu `HasOne`.

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

// Lấy Repository quan hệ
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Hoặc khởi tạo trực tiếp
new HasOneRepository(User, 'profile', user.get('id'));
```

## Phương thức của lớp

### `find()`

Tìm đối tượng quan hệ.

**Chữ ký**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Kiểu**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Thông tin chi tiết**

Tham số truy vấn giống [`Repository.find()`](../repository.md#find).

**Ví dụ**

```typescript
const profile = await UserProfileRepository.find();
// Khi đối tượng quan hệ không tồn tại, trả về null
```

### `create()`

Tạo đối tượng quan hệ.

**Chữ ký**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Ví dụ**

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

Cập nhật đối tượng quan hệ.

**Chữ ký**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Ví dụ**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Gỡ đối tượng quan hệ, chỉ ngắt quan hệ chứ không xóa đối tượng quan hệ.

**Chữ ký**

- `async remove(options?: Transactionable): Promise<void>`

**Thông tin chi tiết**

- `transaction`: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.

**Ví dụ**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Xóa đối tượng quan hệ.

**Chữ ký**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Thông tin chi tiết**

- `transaction`: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.

**Ví dụ**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Đặt đối tượng quan hệ.

**Chữ ký**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Kiểu**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Thông tin chi tiết**

- tk: Đặt targetKey của đối tượng quan hệ.
- transaction: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.

**Ví dụ**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```
