:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# HasOneRepository

## Przegląd

`HasOneRepository` to repozytorium dla powiązań typu `HasOne`.

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

// Pobieranie repozytorium powiązania
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Można również zainicjalizować bezpośrednio
new HasOneRepository(User, 'profile', user.get('id'));
```

## Metody klasy

### `find()`

Znajduje powiązany obiekt.

**Sygnatura**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Typ**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Szczegóły**

Parametry zapytania są takie same jak w [`Repository.find()`](../repository.md#find).

**Przykład**

```typescript
const profile = await UserProfileRepository.find();
// Zwraca null, jeśli powiązany obiekt nie istnieje
```

### `create()`

Tworzy powiązany obiekt.

**Sygnatura**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Przykład**

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

Aktualizuje powiązany obiekt.

**Sygnatura**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Przykład**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Usuwa powiązany obiekt. Ta operacja jedynie rozłącza powiązanie, nie usuwa samego obiektu.

**Sygnatura**

- `async remove(options?: Transactionable): Promise<void>`

**Szczegóły**

- `transaction`: Obiekt transakcji. Jeśli parametr transakcji nie zostanie przekazany, metoda automatycznie utworzy wewnętrzną transakcję.

**Przykład**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Usuwa powiązany obiekt.

**Sygnatura**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Szczegóły**

- `transaction`: Obiekt transakcji. Jeśli parametr transakcji nie zostanie przekazany, metoda automatycznie utworzy wewnętrzną transakcję.

**Przykład**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Ustawia powiązany obiekt.

**Sygnatura**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Typ**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Szczegóły**

- `tk`: `targetKey` powiązanego obiektu, który ma zostać ustawiony.
- `transaction`: Obiekt transakcji. Jeśli parametr transakcji nie zostanie przekazany, metoda automatycznie utworzy wewnętrzną transakcję.

**Przykład**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```