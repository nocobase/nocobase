:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# HasOneRepository

## סקירה כללית

`HasOneRepository` הוא ה-Repository עבור אסוציאציות מסוג `HasOne`.

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

// קבלת ה-Repository המקושר
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// ניתן גם לאתחל ישירות
new HasOneRepository(User, 'profile', user.get('id'));
```

## מתודות מחלקה

### `find()`

מוצא את האובייקט המקושר

**חתימה**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**סוג**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**פרטים**

פרמטרי השאילתה זהים ל-[`Repository.find()`](../repository.md#find).

**דוגמה**

```typescript
const profile = await UserProfileRepository.find();
// מחזיר null אם האובייקט המקושר אינו קיים
```

### `create()`

יוצר אובייקט מקושר

**חתימה**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**דוגמה**

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

מעדכן את האובייקט המקושר

**חתימה**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**דוגמה**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

מסיר את האובייקט המקושר. פעולה זו רק מנתקת את הקשר, היא אינה מוחקת את האובייקט המקושר.

**חתימה**

- `async remove(options?: Transactionable): Promise<void>`

**פרטים**

- `transaction`: אובייקט טרנזקציה. אם לא מועבר פרמטר טרנזקציה, המתודה תיצור באופן אוטומטי טרנזקציה פנימית.

**דוגמה**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

מוחק את האובייקט המקושר

**חתימה**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**פרטים**

- `transaction`: אובייקט טרנזקציה. אם לא מועבר פרמטר טרנזקציה, המתודה תיצור באופן אוטומטי טרנזקציה פנימית.

**דוגמה**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

מגדיר את האובייקט המקושר

**חתימה**

- `async set(options: TargetKey | SetOption): Promise<void>`

**סוג**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**פרטים**

- `tk`: ה-`targetKey` של האובייקט המקושר שיוגדר.
- `transaction`: אובייקט טרנזקציה. אם לא מועבר פרמטר טרנזקציה, המתודה תיצור באופן אוטומטי טרנזקציה פנימית.

**דוגמה**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```