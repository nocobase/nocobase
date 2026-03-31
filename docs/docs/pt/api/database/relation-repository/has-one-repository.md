:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# HasOneRepository

## Visão Geral

`HasOneRepository` é o repositório para associações do tipo `HasOne`.

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

// Obtenha o repositório de associação
const userProfileRepository = User.repository
  .relation('profile')
  .of(user.get('id'));

// Também pode ser inicializado diretamente
new HasOneRepository(User, 'profile', user.get('id'));
```

## Métodos da Classe

### `find()`

Encontra o objeto associado

**Assinatura**

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

**Detalhes**

Os parâmetros de consulta são os mesmos que em [`Repository.find()`](../repository.md#find).

**Exemplo**

```typescript
const profile = await UserProfileRepository.find();
// Retorna null se o objeto associado não existir
```

### `create()`

Cria um objeto associado

**Assinatura**

- `async create(options?: CreateOptions): Promise<Model>`

<embed src="../shared/create-options.md"></embed>

**Exemplo**

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

Atualiza o objeto associado

**Assinatura**

- `async update(options: UpdateOptions): Promise<Model>`

<embed src="../shared/update-options.md"></embed>

**Exemplo**

```typescript
const profile = await UserProfileRepository.update({
  values: { avatar: 'avatar2' },
});

profile.get('avatar'); // 'avatar2'
```

### `remove()`

Remove o objeto associado. Isso apenas desvincula a associação, não exclui o objeto associado.

**Assinatura**

- `async remove(options?: Transactionable): Promise<void>`

**Detalhes**

- `transaction`: Objeto de transação. Se nenhum parâmetro de transação for passado, o método criará automaticamente uma transação interna.

**Exemplo**

```typescript
await UserProfileRepository.remove();
(await UserProfileRepository.find()) == null; // true

(await Profile.repository.count()) === 1; // true
```

### `destroy()`

Exclui o objeto associado

**Assinatura**

- `async destroy(options?: Transactionable): Promise<Boolean>`

**Detalhes**

- `transaction`: Objeto de transação. Se nenhum parâmetro de transação for passado, o método criará automaticamente uma transação interna.

**Exemplo**

```typescript
await UserProfileRepository.destroy();
(await UserProfileRepository.find()) == null; // true
(await Profile.repository.count()) === 0; // true
```

### `set()`

Define o objeto associado

**Assinatura**

- `async set(options: TargetKey | SetOption): Promise<void>`

**Tipo**

```typescript
interface SetOption extends Transactionable {
  tk?: TargetKey;
}
```

**Detalhes**

- `tk`: O `targetKey` do objeto associado a ser definido.
- `transaction`: Objeto de transação. Se nenhum parâmetro de transação for passado, o método criará automaticamente uma transação interna.

**Exemplo**

```typescript
const newProfile = await Profile.repository.create({
  values: { avatar: 'avatar2' },
});

await UserProfileRepository.set(newProfile.get('id'));

(await UserProfileRepository.find()).get('id') === newProfile.get('id'); // true
```