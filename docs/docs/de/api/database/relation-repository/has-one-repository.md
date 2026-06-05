:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# HasOneRepository

## Übersicht

`HasOneRepository` ist das Repository für `HasOne`-Beziehungen.

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

// Das zugehörige Repository abrufen
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Kann auch direkt initialisiert werden
new HasOneRepository(User, 'profile', user.get('id'));
```

## Klassenmethoden

### `find()`

Sucht das zugehörige Objekt.

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

**Details**

Die Abfrageparameter entsprechen denen von [`Repository.find()`](../repository.md#find).

**Beispiel**

```typescript
const profile = await UserProfileRepository.find();
// Gibt null zurück, wenn das zugehörige Objekt nicht existiert
```

### `create()`

Erstellt ein zugehöriges Objekt.

**Signatur**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Beispiel**

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

Aktualisiert das zugehörige Objekt.

**Signatur**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Beispiel**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Entfernt das zugehörige Objekt. Dies löst lediglich die Verknüpfung auf, ohne das zugehörige Objekt zu löschen.

**Signatur**

- `async remove(options?: Transactionable): Promise<void>`

**Details**

- `transaction`: Transaktionsobjekt. Wird kein Transaktionsparameter übergeben, erstellt die Methode automatisch eine interne Transaktion.

**Beispiel**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Löscht das zugehörige Objekt.

**Signatur**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Details**

- `transaction`: Transaktionsobjekt. Wird kein Transaktionsparameter übergeben, erstellt die Methode automatisch eine interne Transaktion.

**Beispiel**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Setzt das zugehörige Objekt.

**Signatur**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Typ**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Details**

- `tk`: Der `targetKey` des zu setzenden zugehörigen Objekts.
- `transaction`: Transaktionsobjekt. Wird kein Transaktionsparameter übergeben, erstellt die Methode automatisch eine interne Transaktion.

**Beispiel**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```