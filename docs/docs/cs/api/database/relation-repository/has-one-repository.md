:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# HasOneRepository

## Přehled

`HasOneRepository` představuje repozitář pro asociace typu `HasOne`.

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

// Získání repozitáře asociace
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Lze také inicializovat přímo
new HasOneRepository(User, 'profile', user.get('id'));
```

## Metody třídy

### `find()`

Vyhledá asociovaný objekt.

**Podpis**

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

**Podrobnosti**

Parametry dotazu jsou stejné jako u [`Repository.find()`](../repository.md#find).

**Příklad**

```typescript
const profile = await UserProfileRepository.find();
// Vrátí null, pokud asociovaný objekt neexistuje
```

### `create()`

Vytvoří asociovaný objekt.

**Podpis**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Příklad**

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

Aktualizuje asociovaný objekt.

**Podpis**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Příklad**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Odebere asociovaný objekt. Tímto se pouze zruší propojení asociace, ale asociovaný objekt se nesmaže.

**Podpis**

- `async remove(options?: Transactionable): Promise<void>`

**Podrobnosti**

- `transaction`: Objekt transakce. Pokud není předán žádný parametr transakce, metoda automaticky vytvoří interní transakci.

**Příklad**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Smaže asociovaný objekt.

**Podpis**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Podrobnosti**

- `transaction`: Objekt transakce. Pokud není předán žádný parametr transakce, metoda automaticky vytvoří interní transakci.

**Příklad**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Nastaví asociovaný objekt.

**Podpis**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Typ**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Podrobnosti**

- `tk`: `targetKey` asociovaného objektu, který má být nastaven.
- `transaction`: Objekt transakce. Pokud není předán žádný parametr transakce, metoda automaticky vytvoří interní transakci.

**Příklad**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```