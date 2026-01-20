:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# HasOneRepository

## Overzicht

`HasOneRepository` is de repository voor `HasOne`-type associaties.

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

// Haal de associatie repository op
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// U kunt ook direct initialiseren
new HasOneRepository(User, 'profile', user.get('id'));
```

## Klasse Methoden

### `find()`

Vindt het geassocieerde object

**Handtekening**

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

**Details**

De queryparameters zijn hetzelfde als [`Repository.find()`](../repository.md#find).

**Voorbeeld**

```typescript
const profile = await UserProfileRepository.find();
// Retourneert null als het geassocieerde object niet bestaat
```

### `create()`

Maakt een geassocieerd object aan

**Handtekening**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Voorbeeld**

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

Werkt het geassocieerde object bij

**Handtekening**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Voorbeeld**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Verwijdert het geassocieerde object. Dit ontkoppelt alleen de associatie; het verwijdert het geassocieerde object niet.

**Handtekening**

- `async remove(options?: Transactionable): Promise<void>`

**Details**

- `transaction`: Transactieobject. Als er geen transactieparameter wordt meegegeven, maakt de methode automatisch een interne transactie aan.

**Voorbeeld**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Verwijdert het geassocieerde object

**Handtekening**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Details**

- `transaction`: Transactieobject. Als er geen transactieparameter wordt meegegeven, maakt de methode automatisch een interne transactie aan.

**Voorbeeld**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Stelt het geassocieerde object in

**Handtekening**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Type**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Details**

- `tk`: De `targetKey` van het in te stellen geassocieerde object.
- `transaction`: Transactieobject. Als er geen transactieparameter wordt meegegeven, maakt de methode automatisch een interne transactie aan.

**Voorbeeld**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```