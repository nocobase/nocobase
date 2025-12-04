:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# HasOneRepository

## Tổng quan

`HasOneRepository` là repository cho các liên kết kiểu `HasOne`.

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

// Lấy repository liên kết
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Cũng có thể khởi tạo trực tiếp
new HasOneRepository(User, 'profile', user.get('id'));
```

## Phương thức lớp

### `find()`

Tìm đối tượng liên kết

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

**Chi tiết**

Các tham số truy vấn tương tự như [`Repository.find()`](../repository.md#find).

**Ví dụ**

```typescript
const profile = await UserProfileRepository.find();
// Trả về null nếu đối tượng liên kết không tồn tại
```

### `create()`

Tạo đối tượng liên kết

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

Cập nhật đối tượng liên kết

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

Xóa liên kết đối tượng. Thao tác này chỉ gỡ bỏ liên kết, không xóa đối tượng liên kết.

**Chữ ký**

- `async remove(options?: Transactionable): Promise<void>`

**Chi tiết**

- `transaction`: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.

**Ví dụ**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Xóa đối tượng liên kết

**Chữ ký**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Chi tiết**

- `transaction`: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.

**Ví dụ**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Thiết lập đối tượng liên kết

**Chữ ký**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Kiểu**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Chi tiết**

- `tk`: `targetKey` của đối tượng liên kết cần thiết lập.
- `transaction`: Đối tượng giao dịch. Nếu không truyền tham số giao dịch, phương thức này sẽ tự động tạo một giao dịch nội bộ.

**Ví dụ**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```