:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# HasOneRepository

## Översikt

`HasOneRepository` är repositoryt för associationer av typen `HasOne`.

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

// Hämta associations-repositoryt
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Kan även initieras direkt
new HasOneRepository(User, 'profile', user.get('id'));
```

## Klassmetoder

### `find()`

Hittar det associerade objektet

**Signatur**

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

**Detaljer**

Frågeparametrarna är desamma som för [`Repository.find()`](../repository.md#find).

**Exempel**

```typescript
const profile = await UserProfileRepository.find();
// Returnerar null om det associerade objektet inte finns
```

### `create()`

Skapar ett associerat objekt

**Signatur**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Exempel**

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

Uppdaterar det associerade objektet

**Signatur**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Exempel**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Tar bort det associerade objektet. Detta kopplar endast bort associationen, det raderar inte det associerade objektet.

**Signatur**

- `async remove(options?: Transactionable): Promise<void>`

**Detaljer**

- `transaction`: Transaktionsobjekt. Om ingen transaktionsparameter skickas med, skapar metoden automatiskt en intern transaktion.

**Exempel**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Raderar det associerade objektet

**Signatur**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Detaljer**

- `transaction`: Transaktionsobjekt. Om ingen transaktionsparameter skickas med, skapar metoden automatiskt en intern transaktion.

**Exempel**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Ställer in det associerade objektet

**Signatur**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Typ**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Detaljer**

- `tk`: `targetKey` för det associerade objekt som ska ställas in.
- `transaction`: Transaktionsobjekt. Om ingen transaktionsparameter skickas med, skapar metoden automatiskt en intern transaktion.

**Exempel**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```