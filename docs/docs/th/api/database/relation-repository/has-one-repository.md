:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# HasOneRepository

## ภาพรวม

`HasOneRepository` คือ Repository สำหรับการเชื่อมโยง (association) แบบ `HasOne` ครับ/ค่ะ

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

// ดึง Repository ของการเชื่อมโยง
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// หรือจะสร้าง (initialize) โดยตรงก็ได้ครับ/ค่ะ
new HasOneRepository(User, 'profile', user.get('id'));
```

## เมธอดของคลาส

### `find()`

ค้นหาอ็อบเจกต์ที่เชื่อมโยง

**Signature**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Type**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**รายละเอียด**

พารามิเตอร์สำหรับการคิวรีจะเหมือนกับ [`Repository.find()`](../repository.md#find) ครับ/ค่ะ

**ตัวอย่าง**

```typescript
const profile = await UserProfileRepository.find();
// หากอ็อบเจกต์ที่เชื่อมโยงไม่มีอยู่จริง จะคืนค่าเป็น null
```

### `create()`

สร้างอ็อบเจกต์ที่เชื่อมโยง

**Signature**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**ตัวอย่าง**

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

อัปเดตอ็อบเจกต์ที่เชื่อมโยง

**Signature**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**ตัวอย่าง**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

ลบการเชื่อมโยงของอ็อบเจกต์ โดยจะยกเลิกความสัมพันธ์เท่านั้น ไม่ได้ลบตัวอ็อบเจกต์ที่เชื่อมโยงออกไปครับ/ค่ะ

**Signature**

- `async remove(options?: Transactionable): Promise<void>`

**รายละเอียด**

- `transaction`: อ็อบเจกต์ Transaction หากไม่ได้ส่งพารามิเตอร์ Transaction มาให้ เมธอดนี้จะสร้าง Transaction ภายในขึ้นมาโดยอัตโนมัติครับ/ค่ะ

**ตัวอย่าง**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

ลบอ็อบเจกต์ที่เชื่อมโยง

**Signature**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**รายละเอียด**

- `transaction`: อ็อบเจกต์ Transaction หากไม่ได้ส่งพารามิเตอร์ Transaction มาให้ เมธอดนี้จะสร้าง Transaction ภายในขึ้นมาโดยอัตโนมัติครับ/ค่ะ

**ตัวอย่าง**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

กำหนดอ็อบเจกต์ที่เชื่อมโยง

**Signature**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Type**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**รายละเอียด**

- `tk`: `targetKey` ของอ็อบเจกต์ที่เชื่อมโยงที่จะกำหนด
- `transaction`: อ็อบเจกต์ Transaction หากไม่ได้ส่งพารามิเตอร์ Transaction มาให้ เมธอดนี้จะสร้าง Transaction ภายในขึ้นมาโดยอัตโนมัติครับ/ค่ะ

**ตัวอย่าง**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```