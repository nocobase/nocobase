:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# HasOneRepository

## Обзор

`HasOneRepository` — это репозиторий для ассоциаций типа `HasOne`.

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

// Получаем репозиторий ассоциации
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Также можно инициализировать напрямую
new HasOneRepository(User, 'profile', user.get('id'));
```

## Методы класса

### `find()`

Находит связанный объект.

**Сигнатура**

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

**Подробности**

Параметры запроса совпадают с параметрами [`Repository.find()`](../repository.md#find).

**Пример**

```typescript
const profile = await UserProfileRepository.find();
// Возвращает null, если связанный объект не существует
```

### `create()`

Создает связанный объект.

**Сигнатура**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Пример**

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

Обновляет связанный объект.

**Сигнатура**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Пример**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Удаляет связанный объект. Эта операция только разрывает связь, но не удаляет сам связанный объект.

**Сигнатура**

- `async remove(options?: Transactionable): Promise<void>`

**Подробности**

- `transaction`: Объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.

**Пример**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Удаляет связанный объект.

**Сигнатура**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Подробности**

- `transaction`: Объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.

**Пример**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Устанавливает связанный объект.

**Сигнатура**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Тип**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Подробности**

- `tk`: `targetKey` связанного объекта, который нужно установить.
- `transaction`: Объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.

**Пример**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```