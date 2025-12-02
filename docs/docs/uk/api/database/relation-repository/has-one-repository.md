:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# HasOneRepository

## Огляд

`HasOneRepository` — це репозиторій для асоціацій типу `HasOne`.

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

// Отримайте репозиторій асоціації
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Також можна ініціалізувати безпосередньо
new HasOneRepository(User, 'profile', user.get('id'));
```

## Методи класу

### `find()`

Знаходить пов'язаний об'єкт

**Підпис**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Тип**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Деталі**

Параметри запиту такі ж, як у [`Repository.find()`](../repository.md#find).

**Приклад**

```typescript
const profile = await UserProfileRepository.find();
// Повертає null, якщо пов'язаний об'єкт не існує
```

### `create()`

Створює пов'язаний об'єкт

**Підпис**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Приклад**

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

Оновлює пов'язаний об'єкт

**Підпис**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Приклад**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Видаляє пов'язаний об'єкт. Цей метод лише розриває зв'язок, але не видаляє сам пов'язаний об'єкт.

**Підпис**

- `async remove(options?: Transactionable): Promise<void>`

**Деталі**

- `transaction`: Об'єкт транзакції. Якщо параметр транзакції не передано, метод автоматично створить внутрішню транзакцію.

**Приклад**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Видаляє пов'язаний об'єкт

**Підпис**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Деталі**

- `transaction`: Об'єкт транзакції. Якщо параметр транзакції не передано, метод автоматично створить внутрішню транзакцію.

**Приклад**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Встановлює пов'язаний об'єкт

**Підпис**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Тип**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Деталі**

- `tk`: `targetKey` пов'язаного об'єкта, який потрібно встановити.
- `transaction`: Об'єкт транзакції. Якщо параметр транзакції не передано, метод автоматично створить внутрішню транзакцію.

**Приклад**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```