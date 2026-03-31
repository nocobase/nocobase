:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# HasOneRepository

## Descripción general

`HasOneRepository` es el repositorio para las asociaciones de tipo `HasOne`.

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

// Obtener el repositorio de la asociación
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// También se puede inicializar directamente
new HasOneRepository(User, 'profile', user.get('id'));
```

## Métodos de clase

### `find()`

Busca el objeto asociado.

**Firma**

- `async find(options?: SingleRelationFindOption): Promise<Model<any> | null>`

**Tipo**

```typescript
interface SingleRelationFindOption extends Transactionable {
  fields?: Fields;
  except?: Except;
  appends?: Appends;
  filter?: Filter;
}
```

**Detalles**

Los parámetros de consulta son los mismos que en [`Repository.find()`](../repository.md#find).

**Ejemplo**

```typescript
const profile = await UserProfileRepository.find();
// Si el objeto asociado no existe, devuelve null
```

### `create()`

Crea un objeto asociado.

**Firma**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Ejemplo**

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

Actualiza el objeto asociado.

**Firma**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Ejemplo**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Remueve el objeto asociado. Esto solo desvincula la asociación, no elimina el objeto asociado.

**Firma**

- `async remove(options?: Transactionable): Promise<void>`

**Detalles**

- `transaction`: Objeto de transacción. Si no se pasa un parámetro de transacción, el método creará automáticamente una transacción interna.

**Ejemplo**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Elimina el objeto asociado.

**Firma**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Detalles**

- `transaction`: Objeto de transacción. Si no se pasa un parámetro de transacción, el método creará automáticamente una transacción interna.

**Ejemplo**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Establece el objeto asociado.

**Firma**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Tipo**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Detalles**

- `tk`: El `targetKey` del objeto asociado que se va a establecer.
- `transaction`: Objeto de transacción. Si no se pasa un parámetro de transacción, el método creará automáticamente una transacción interna.

**Ejemplo**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```