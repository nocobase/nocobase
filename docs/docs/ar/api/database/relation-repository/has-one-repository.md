:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# HasOneRepository

## نظرة عامة

`HasOneRepository` هو المستودع (repository) الخاص بالارتباطات من نوع `HasOne`.

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

// الحصول على المستودع المرتبط
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// يمكن تهيئته مباشرة أيضًا
new HasOneRepository(User, 'profile', user.get('id'));
```

## توابع الفئة (Class Methods)

### `find()`

البحث عن الكائن المرتبط

**التوقيع**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**النوع**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**التفاصيل**

تتوافق معلمات الاستعلام مع [`Repository.find()`](../repository.md#find).

**مثال**

```typescript
const profile = await UserProfileRepository.find();
// يعيد null إذا لم يكن الكائن المرتبط موجودًا
```

### `create()`

إنشاء كائن مرتبط

**التوقيع**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**مثال**

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

تحديث الكائن المرتبط

**التوقيع**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**مثال**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

إزالة الكائن المرتبط، حيث يؤدي هذا إلى فك الارتباط فقط ولا يحذف الكائن المرتبط.

**التوقيع**

- `async remove(options?: Transactionable): Promise<void>`

**التفاصيل**

- `transaction`: كائن المعاملة (transaction). إذا لم يتم تمرير معاملة، فسيقوم التابع بإنشاء معاملة داخلية تلقائيًا.

**مثال**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

حذف الكائن المرتبط

**التوقيع**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**التفاصيل**

- `transaction`: كائن المعاملة (transaction). إذا لم يتم تمرير معاملة، فسيقوم التابع بإنشاء معاملة داخلية تلقائيًا.

**مثال**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

تعيين الكائن المرتبط

**التوقيع**

- `async set(options: TargetKey | SetOption): Promise<void>`

**النوع**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**التفاصيل**

- `tk`: مفتاح الهدف (`targetKey`) للكائن المرتبط الذي سيتم تعيينه.
- `transaction`: كائن المعاملة (transaction). إذا لم يتم تمرير معاملة، فسيقوم التابع بإنشاء معاملة داخلية تلقائيًا.

**مثال**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```