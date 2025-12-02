:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# HasOneRepository

## Panoramica

`HasOneRepository` è il repository per le associazioni di tipo `HasOne`.

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

// Ottiene il repository dell'associazione
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Può essere inizializzato anche direttamente
new HasOneRepository(User, 'profile', user.get('id'));
```

## Metodi di Classe

### `find()`

Trova l'oggetto associato

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

**Dettagli**

I parametri di query sono gli stessi di [`Repository.find()`](../repository.md#find).

**Esempio**

```typescript
const profile = await UserProfileRepository.find();
// Restituisce null se l'oggetto associato non esiste
```

### `create()`

Crea un oggetto associato

**Signature**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Esempio**

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

Aggiorna l'oggetto associato

**Signature**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Esempio**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Rimuove l'oggetto associato. Questa operazione scollega solamente l'associazione, senza eliminare l'oggetto associato.

**Signature**

- `async remove(options?: Transactionable): Promise<void>`

**Dettagli**

- `transaction`: Oggetto transazione. Se non viene passato alcun parametro di transazione, il metodo creerà automaticamente una transazione interna.

**Esempio**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Elimina l'oggetto associato

**Signature**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Dettagli**

- `transaction`: Oggetto transazione. Se non viene passato alcun parametro di transazione, il metodo creerà automaticamente una transazione interna.

**Esempio**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Imposta l'oggetto associato

**Signature**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Type**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Dettagli**

- `tk`: Il `targetKey` dell'oggetto associato da impostare.
- `transaction`: Oggetto transazione. Se non viene passato alcun parametro di transazione, il metodo creerà automaticamente una transazione interna.

**Esempio**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```