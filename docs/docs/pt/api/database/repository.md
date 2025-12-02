:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Repositório

## Visão Geral

Em um objeto de `coleção` específico, você pode obter seu objeto `Repository` para realizar operações de leitura e escrita na coleção.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### Consulta

#### Consulta Básica

No objeto `Repository`, você pode chamar os métodos relacionados a `find*` para realizar operações de consulta. Todos os métodos de consulta aceitam o parâmetro `filter` para filtrar os dados.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operadores

O parâmetro `filter` no `Repository` também oferece uma variedade de operadores para realizar operações de consulta mais diversas.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

Para mais detalhes sobre os operadores, consulte [Operadores de Filtro](/api/database/operators).

#### Controle de Campos

Ao realizar uma operação de consulta, você pode controlar os campos de saída usando os parâmetros `fields`, `except` e `appends`.

- `fields`: Especifica os campos a serem incluídos na saída.
- `except`: Exclui campos da saída.
- `appends`: Adiciona campos associados à saída.

```javascript
// O resultado incluirá apenas os campos id e name
userRepository.find({
  fields: ['id', 'name'],
});

// O resultado não incluirá o campo password
userRepository.find({
  except: ['password'],
});

// O resultado incluirá dados do objeto associado posts
userRepository.find({
  appends: ['posts'],
});
```

#### Consultando Campos de Associação

O parâmetro `filter` permite filtrar por campos de associação, por exemplo:

```javascript
// Consulta objetos de usuário cujos posts associados possuem um objeto com o título 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Campos de associação também podem ser aninhados.

```javascript
// Consulta objetos de usuário onde os comentários de seus posts contêm palavras-chave
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Ordenação

Você pode ordenar os resultados da consulta usando o parâmetro `sort`.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

Você também pode ordenar pelos campos de objetos associados.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Criação

#### Criação Básica

Crie novos objetos de dados através do `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Suporta criação em massa
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### Criando Associações

Ao criar, você também pode criar objetos associados simultaneamente. Assim como nas consultas, o uso aninhado de objetos associados também é suportado, por exemplo:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// Cria o usuário, cria o post associado ao usuário e cria as tags associadas ao post.
```

Se o objeto associado já existir no banco de dados, você pode passar seu ID para estabelecer uma associação com ele durante a criação.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Estabelece uma associação com um objeto associado existente
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Atualização

#### Atualização Básica

Após obter um objeto de dados, você pode modificar suas propriedades diretamente no objeto de dados (`Model`) e, em seguida, chamar o método `save` para salvar as alterações.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

O objeto de dados `Model` herda do Sequelize Model. Para operações no `Model`, consulte [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Você também pode atualizar dados através do `Repository`:

```javascript
// Modifica os registros de dados que atendem aos critérios de filtro
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Ao atualizar, você pode controlar quais campos são atualizados usando os parâmetros `whitelist` e `blacklist`, por exemplo:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Atualiza apenas o campo age
});
```

#### Atualizando Campos de Associação

Ao atualizar, você pode definir objetos associados, por exemplo:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // Estabelece uma associação com tag1
      },
      {
        name: 'tag2', // Cria uma nova tag e estabelece uma associação
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Desassocia o post das tags
  },
});
```

### Exclusão

Você pode chamar o método `destroy()` no `Repository` para realizar uma operação de exclusão. Ao excluir, você precisa especificar os critérios de filtro:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Construtor

Normalmente, não é chamado diretamente pelos desenvolvedores. Ele é principalmente instanciado após registrar o tipo através de `db.registerRepositories()` e especificar o tipo de repositório registrado correspondente nos parâmetros de `db.collection()`.

**Assinatura**

- `constructor(collection: coleção)`

**Exemplo**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // aqui, link para o repositório registrado
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Membros da Instância

### `database`

A instância de gerenciamento de banco de dados do contexto.

### `collection`

A instância de gerenciamento de `coleção` correspondente.

### `model`

A classe de modelo de dados correspondente.

## Métodos de Instância

### `find()`

Consulta um conjunto de dados no banco de dados, permitindo especificar condições de filtro, ordenação, etc.

**Assinatura**

- `async find(options?: FindOptions): Promise<Model[]>`

**Tipo**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**Detalhes**

#### `filter: Filter`

Condição de consulta, usada para filtrar os resultados dos dados. Nos parâmetros de consulta passados, `key` é o nome do campo a ser consultado, e `value` pode ser o valor a ser consultado ou usado em conjunto com operadores para outras filtragens condicionais de dados.

```typescript
// Consulta registros onde o nome é 'foo' e a idade é maior que 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Para mais operadores, consulte [Operadores de Consulta](./operators.md).

#### `filterByTk: TargetKey`

Consulta dados por `TargetKey`, que é um método conveniente para o parâmetro `filter`. O campo específico para `TargetKey` pode ser [configurado](./collection.md#filtertargetkey) na `coleção`, com padrão para `primaryKey`.

```typescript
// Por padrão, encontra o registro com id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Colunas de consulta, usadas para controlar os resultados dos campos de dados. Após passar este parâmetro, apenas os campos especificados serão retornados.

#### `except: string[]`

Colunas excluídas, usadas para controlar os resultados dos campos de dados. Após passar este parâmetro, os campos passados não serão exibidos.

#### `appends: string[]`

Colunas anexadas, usadas para carregar dados associados. Após passar este parâmetro, os campos de associação especificados também serão exibidos.

#### `sort: string[] | string`

Especifica o método de ordenação para os resultados da consulta. O parâmetro é o nome do campo, que por padrão é ordenado em ordem crescente (`asc`). Para ordem decrescente (`desc`), adicione um símbolo `-` antes do nome do campo, por exemplo: `['-id', 'name']`, o que significa ordenar por `id desc, name asc`.

#### `limit: number`

Limita o número de resultados, o mesmo que `limit` em `SQL`.

#### `offset: number`

Deslocamento da consulta, o mesmo que `offset` em `SQL`.

**Exemplo**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Consulta um único dado do banco de dados que atenda a critérios específicos. Equivalente a `Model.findOne()` no Sequelize.

**Assinatura**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Exemplo**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Consulta o número total de entradas de dados que atendem a critérios específicos no banco de dados. Equivalente a `Model.count()` no Sequelize.

**Assinatura**

- `count(options?: CountOptions): Promise<number>`

**Tipo**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Exemplo**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Consulta um conjunto de dados e o número total de resultados que atendem a critérios específicos no banco de dados. Equivalente a `Model.findAndCountAll()` no Sequelize.

**Assinatura**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Detalhes**

Os parâmetros de consulta são os mesmos de `find()`. O valor de retorno é um array onde o primeiro elemento é o resultado da consulta e o segundo elemento é a contagem total.

### `create()`

Insere um novo registro na `coleção`. Equivalente a `Model.create()` no Sequelize. Quando o objeto de dados a ser criado contém informações sobre campos de relacionamento, os registros de dados de relacionamento correspondentes serão criados ou atualizados.

**Assinatura**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Exemplo**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Quando o valor da chave primária da tabela de relacionamento existe, ele atualiza os dados
      { id: 1 },
      // Quando não há valor de chave primária, ele cria novos dados
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Insere múltiplos novos registros na `coleção`. Equivalente a chamar o método `create()` várias vezes.

**Assinatura**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Tipo**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Detalhes**

- `records`: Um array de objetos de dados para os registros a serem criados.
- `transaction`: Objeto de transação. Se nenhum parâmetro de transação for passado, o método criará automaticamente uma transação interna.

**Exemplo**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Quando o valor da chave primária da tabela de relacionamento existe, ele atualiza os dados
        { id: 1 },
        // Quando não há valor de chave primária, ele cria novos dados
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Atualiza dados na `coleção`. Equivalente a `Model.update()` no Sequelize. Quando o objeto de dados a ser atualizado contém informações sobre campos de relacionamento, os registros de dados de relacionamento correspondentes serão criados ou atualizados.

**Assinatura**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Exemplo**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Quando o valor da chave primária da tabela de relacionamento existe, ele atualiza os dados
      { id: 1 },
      // Quando não há valor de chave primária, ele cria novos dados
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Exclui dados da `coleção`. Equivalente a `Model.destroy()` no Sequelize.

**Assinatura**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Tipo**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detalhes**

- `filter`: Especifica as condições de filtro para os registros a serem excluídos. Para uso detalhado de `Filter`, consulte o método [`find()`](#find).
- `filterByTk`: Especifica as condições de filtro para os registros a serem excluídos por `TargetKey`.
- `truncate`: Indica se os dados da `coleção` devem ser truncados, sendo eficaz quando nenhum parâmetro `filter` ou `filterByTk` é passado.
- `transaction`: Objeto de transação. Se nenhum parâmetro de transação for passado, o método criará automaticamente uma transação interna.