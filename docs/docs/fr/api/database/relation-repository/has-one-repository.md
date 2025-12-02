:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# HasOneRepository

## Aperçu

Le `HasOneRepository` gère les associations de type `HasOne`.

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

// Récupérer le repository d'association
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Peut aussi être initialisé directement
new HasOneRepository(User, 'profile', user.get('id'));
```

## Méthodes de classe

### `find()`

Recherche l'objet associé.

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

**Détails**

Les paramètres de requête sont identiques à ceux de [`Repository.find()`](../repository.md#find).

**Exemple**

```typescript
const profile = await UserProfileRepository.find();
// Retourne null si l'objet associé n'existe pas
```

### `create()`

Crée un objet associé.

**Signature**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Exemple**

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

Met à jour l'objet associé.

**Signature**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Exemple**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Supprime l'association avec l'objet. Cette méthode ne fait que dissocier l'objet, elle ne le supprime pas.

**Signature**

- `async remove(options?: Transactionable): Promise<void>`

**Détails**

- `transaction` : L'objet de transaction. Si aucun paramètre de transaction n'est fourni, la méthode créera automatiquement une transaction interne.

**Exemple**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Supprime l'objet associé.

**Signature**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Détails**

- `transaction` : L'objet de transaction. Si aucun paramètre de transaction n'est fourni, la méthode créera automatiquement une transaction interne.

**Exemple**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Définit l'objet associé.

**Signature**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Type**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Détails**

- `tk` : La `targetKey` de l'objet associé à définir.
- `transaction` : L'objet de transaction. Si aucun paramètre de transaction n'est fourni, la méthode créera automatiquement une transaction interne.

**Exemple**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```