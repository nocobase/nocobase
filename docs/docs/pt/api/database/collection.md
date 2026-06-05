:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Coleção

## Visão Geral

A `coleção` é usada para definir modelos de dados no sistema, como nomes de modelos, campos, índices, associações e outras informações. Geralmente, ela é chamada através do método `collection` de uma instância de `Database` como um ponto de entrada proxy.

```javascript
const { Database } = require('@nocobase/database')

// Cria uma instância de banco de dados
const db = new Database({...});

// Define um modelo de dados
db.collection({
  name: 'users',
  // Define os campos do modelo
  fields: [
    // Campo escalar
    {
      name: 'name',
      type: 'string',
    },

    // Campo de associação
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Para mais tipos de campos, consulte [Campos](/api/database/field).

## Construtor

**Assinatura**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parâmetros**

| Parâmetro             | Tipo                                                        | Padrão | Descrição                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | Identificador da coleção                                                                    |
| `options.tableName?`  | `string`                                                    | -      | Nome da tabela no banco de dados. Se não for fornecido, o valor de `options.name` será usado. |
| `options.fields?`     | `FieldOptions[]`                                            | -      | Definições de campo. Veja [Campo](./field) para mais detalhes.                              |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Tipo de Model do Sequelize. Se uma `string` for usada, o nome do modelo deve ter sido registrado previamente no db. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | Tipo de repositório. Se uma `string` for usada, o tipo de repositório deve ter sido registrado previamente no db. |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | Configuração de campo ordenável. Não é ordenável por padrão.                                |
| `options.autoGenId?`  | `boolean`                                                   | `true` | Se deve gerar automaticamente uma chave primária única. O padrão é `true`.                  |
| `context.database`    | `Database`                                                  | -      | O banco de dados no contexto atual.                                                         |

**Exemplo**

Crie uma coleção de posts:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Instância de banco de dados existente
    database: db,
  },
);
```

## Membros da Instância

### `options`

Parâmetros de configuração inicial para a coleção. Idêntico ao parâmetro `options` do construtor.

### `context`

O contexto ao qual a coleção atual pertence, atualmente sendo principalmente a instância do banco de dados.

### `name`

Nome da coleção.

### `db`

A instância do banco de dados à qual pertence.

### `filterTargetKey`

O nome do campo usado como chave primária.

### `isThrough`

Se é uma coleção intermediária.

### `model`

Corresponde ao tipo de Model do Sequelize.

### `repository`

Instância do repositório.

## Métodos de Configuração de Campo

### `getField()`

Obtém o objeto de campo com o nome correspondente definido na coleção.

**Assinatura**

- `getField(name: string): Field`

**Parâmetros**

| Parâmetro | Tipo     | Padrão | Descrição    |
| --------- | -------- | ------ | ------------ |
| `name`    | `string` | -      | Nome do campo |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

Define um campo para a coleção.

**Assinatura**

- `setField(name: string, options: FieldOptions): Field`

**Parâmetros**

| Parâmetro | Tipo           | Padrão | Descrição                                   |
| --------- | -------------- | ------ | ------------------------------------------- |
| `name`    | `string`       | -      | Nome do campo                               |
| `options` | `FieldOptions` | -      | Configuração do campo. Veja [Campo](./field) para mais detalhes. |

**Exemplo**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Define múltiplos campos para a coleção em lote.

**Assinatura**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parâmetros**

| Parâmetro     | Tipo             | Padrão | Descrição                                   |
| ------------- | ---------------- | ------ | ------------------------------------------- |
| `fields`      | `FieldOptions[]` | -      | Configuração do campo. Veja [Campo](./field) para mais detalhes. |
| `resetFields` | `boolean`        | `true` | Se deve redefinir os campos existentes.     |

**Exemplo**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Remove o objeto de campo com o nome correspondente definido na coleção.

**Assinatura**

- `removeField(name: string): void | Field`

**Parâmetros**

| Parâmetro | Tipo     | Padrão | Descrição    |
| --------- | -------- | ------ | ------------ |
| `name`    | `string` | -      | Nome do campo |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

Redefine (limpa) os campos da coleção.

**Assinatura**

- `resetFields(): void`

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

Verifica se um objeto de campo com o nome correspondente está definido na coleção.

**Assinatura**

- `hasField(name: string): boolean`

**Parâmetros**

| Parâmetro | Tipo     | Padrão | Descrição    |
| --------- | -------- | ------ | ------------ |
| `name`    | `string` | -      | Nome do campo |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

Encontra um objeto de campo na coleção que atende aos critérios.

**Assinatura**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parâmetros**

| Parâmetro   | Tipo                        | Padrão | Descrição        |
| ----------- | --------------------------- | ------ | ---------------- |
| `predicate` | `(field: Field) => boolean` | -      | Critério de busca |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

Itera sobre os objetos de campo na coleção.

**Assinatura**

- `forEachField(callback: (field: Field) => void): void`

**Parâmetros**

| Parâmetro  | Tipo                     | Padrão | Descrição       |
| ---------- | ------------------------ | ------ | --------------- |
| `callback` | `(field: Field) => void` | -      | Função de callback |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## Métodos de Configuração de Índice

### `addIndex()`

Adiciona um índice à coleção.

**Assinatura**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parâmetros**

| Parâmetro | Tipo                                                         | Padrão | Descrição                                   |
| --------- | ------------------------------------------------------------ | ------ | ------------------------------------------- |
| `index`   | `string \| string[]`                                         | -      | Nome(s) do(s) campo(s) a ser(em) indexado(s). |
| `index`   | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | Configuração completa.                      |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

Remove um índice da coleção.

**Assinatura**

- `removeIndex(fields: string[])`

**Parâmetros**

| Parâmetro | Tipo       | Padrão | Descrição                                       |
| --------- | ---------- | ------ | ----------------------------------------------- |
| `fields`  | `string[]` | -      | Combinação de nomes de campos para o índice a ser removido. |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## Métodos de Configuração da Coleção

### `remove()`

Exclui a coleção.

**Assinatura**

- `remove(): void`

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Métodos de Operação de Banco de Dados

### `sync()`

Sincroniza a definição da coleção com o banco de dados. Além da lógica padrão de `Model.sync` no Sequelize, ele também processa as coleções correspondentes aos campos de associação.

**Assinatura**

- `sync(): Promise<void>`

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

Verifica se a coleção existe no banco de dados.

**Assinatura**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parâmetros**

| Parâmetro              | Tipo          | Padrão | Descrição           |
| ---------------------- | ------------- | ------ | ------------------- |
| `options?.transaction` | `Transaction` | -      | Instância de transação |

**Exemplo**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Assinatura**

- `removeFromDb(): Promise<void>`

**Exemplo**

```ts
const books = db.collection({
  name: 'books',
});

// Sincroniza a coleção de livros com o banco de dados
await db.sync();

// Remove a coleção de livros do banco de dados
await books.removeFromDb();
```