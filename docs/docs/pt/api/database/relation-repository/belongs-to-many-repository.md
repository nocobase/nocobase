:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# BelongsToManyRepository

`BelongsToManyRepository` é um `Relation Repository` usado para gerenciar relacionamentos `BelongsToMany`.

Diferente de outros tipos de relacionamento, os relacionamentos `BelongsToMany` precisam ser registrados através de uma tabela intermediária. Ao definir um relacionamento de associação no NocoBase, você pode criar uma tabela intermediária automaticamente ou especificá-la explicitamente.

## Métodos da Classe

### `find()`

Encontra objetos associados

**Assinatura**

- `async find(options?: FindOptions): Promise<M[]>`

**Detalhes**

Os parâmetros de consulta são consistentes com [`Repository.find()`](../repository.md#find).

### `findOne()`

Encontra um objeto associado, retornando apenas um registro

**Assinatura**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Retorna o número de registros que correspondem às condições da consulta

**Assinatura**

- `async count(options?: CountOptions)`

**Tipo**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Consulta o banco de dados para um conjunto de dados e a contagem total sob condições específicas.

**Assinatura**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Cria um objeto associado

**Assinatura**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Atualiza objetos associados que atendem às condições

**Assinatura**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Exclui objetos associados que atendem às condições

**Assinatura**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Adiciona novos objetos associados

**Assinatura**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Tipo**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**Detalhes**

Você pode passar diretamente o `targetKey` do objeto associado, ou passar o `targetKey` junto com os valores dos campos da tabela intermediária.

**Exemplo**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// Passa o targetKey
PostTagRepository.add([t1.id, t2.id]);

// Passa os campos da tabela intermediária
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Define objetos associados

**Assinatura**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Detalhes**

Os parâmetros são os mesmos de [add()](#add)

### `remove()`

Remove a associação com os objetos fornecidos

**Assinatura**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipo**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Alterna objetos associados.

Em alguns cenários de negócio, é comum precisar alternar objetos associados. Por exemplo, um usuário pode favoritar um produto, desfavoritá-lo e favoritá-lo novamente. O método `toggle` pode ser usado para implementar essa funcionalidade rapidamente.

**Assinatura**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Detalhes**

O método `toggle` verifica automaticamente se o objeto associado já existe. Se existir, ele é removido; caso contrário, é adicionado.