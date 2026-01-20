:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# HasManyRepository

`HasManyRepository` é um `Relation Repository` usado para gerenciar relacionamentos `HasMany`.

## Métodos da Classe

### `find()`

Encontra objetos associados

**Assinatura**

- `async find(options?: FindOptions): Promise<M[]>`

**Detalhes**

Os parâmetros de consulta são os mesmos de [`Repository.find()`](../repository.md#find).

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

Consulta o banco de dados por um conjunto de dados e o número de resultados que correspondem a condições específicas.

**Assinatura**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Cria objetos associados

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

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Adiciona associações de objetos

**Assinatura**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipo**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Detalhes**

- `tk` - O valor `targetKey` do objeto associado, que pode ser um único valor ou um array.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Remove a associação com os objetos fornecidos

**Assinatura**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detalhes**

Os parâmetros são os mesmos do método [`add()`](#add).

### `set()`

Define os objetos associados para o relacionamento atual

**Assinatura**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detalhes**

Os parâmetros são os mesmos do método [`add()`](#add).