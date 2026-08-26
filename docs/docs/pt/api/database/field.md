# Campo

## Visão Geral

Classe de gerenciamento de campos de **coleção** (classe abstrata). É também a classe base para todos os tipos de campo. Qualquer outro tipo de campo é implementado herdando esta classe.

Para saber como personalizar campos, consulte [Estender Tipos de Campo](#)

## Construtor

Geralmente, não é chamado diretamente por desenvolvedores, mas principalmente através do método `db.collection({ fields: [] })` como um ponto de entrada proxy.

Ao estender um campo, a implementação principal é feita herdando a classe abstrata `Field` e, em seguida, registrando-a na instância do Database.

**Assinatura**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parâmetros**

| Parâmetro            | Tipo           | Padrão | Descrição                                     |
| -------------------- | -------------- | ------ | ---------------------------------------- |
| `options`            | `FieldOptions` | -      | Objeto de configuração do campo                             |
| `options.name`       | `string`       | -      | Nome do campo                                 |
| `options.type`       | `string`       | -      | Tipo do campo, correspondendo ao nome do tipo de campo registrado no db |
| `context`            | `FieldContext` | -      | Objeto de contexto do campo                           |
| `context.database`   | `Database`     | -      | Instância do Database                               |
| `context.collection` | `Collection`   | -      | Instância da **coleção**                               |

## Membros da Instância

### `name`

Nome do campo.

### `type`

Tipo do campo.

### `dataType`

Tipo de armazenamento do campo no banco de dados.

### `options`

Parâmetros de configuração de inicialização do campo.

### `context`

Objeto de contexto do campo.

## Métodos de Configuração

### `on()`

Um método de definição de atalho baseado em eventos de **coleção**. Equivalente a `db.on(this.collection.name + '.' + eventName, listener)`.

Geralmente, não é necessário sobrescrever este método ao herdar.

**Assinatura**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parâmetros**

| Parâmetro   | Tipo                       | Padrão | Descrição       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | Nome do evento   |
| `listener`  | `(...args: any[]) => void` | -      | Ouvinte de evento |

### `off()`

Um método de remoção de atalho baseado em eventos de **coleção**. Equivalente a `db.off(this.collection.name + '.' + eventName, listener)`.

Geralmente, não é necessário sobrescrever este método ao herdar.

**Assinatura**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parâmetros**

| Parâmetro   | Tipo                       | Padrão | Descrição       |
| ----------- | -------------------------- | ------ | ---------- |
| `eventName` | `string`                   | -      | Nome do evento   |
| `listener`  | `(...args: any[]) => void` | -      | Ouvinte de evento |

### `bind()`

O conteúdo a ser executado quando um campo é adicionado a uma **coleção**. Geralmente, é usado para adicionar ouvintes de eventos da **coleção** e outros processamentos.

Ao herdar, você precisa chamar o método `super.bind()` correspondente primeiro.

**Assinatura**

- `bind()`

### `unbind()`

O conteúdo a ser executado quando um campo é removido de uma **coleção**. Geralmente, é usado para remover ouvintes de eventos da **coleção** e outros processamentos.

Ao herdar, você precisa chamar o método `super.unbind()` correspondente primeiro.

**Assinatura**

- `unbind()`

### `get()`

Obtém o valor de um item de configuração de um campo.

**Assinatura**

- `get(key: string): any`

**Parâmetros**

| Parâmetro | Tipo     | Padrão | Descrição       |
| ------ | -------- | ------ | ---------- |
| `key`  | `string` | -      | Nome do item de configuração |

**Exemplo**

```ts
const field = db.collection('users').getField('name');

// Obtém o valor do item de configuração do nome do campo, retorna 'name'
console.log(field.get('name'));
```

### `merge()`

Mescla os valores dos itens de configuração de um campo.

**Assinatura**

- `merge(options: { [key: string]: any }): void`

**Parâmetros**

| Parâmetro | Tipo                     | Padrão | Descrição               |
| --------- | ------------------------ | ------ | ------------------ |
| `options` | `{ [key: string]: any }` | -      | O objeto de item de configuração a ser mesclado |

**Exemplo**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Adiciona uma configuração de índice
  index: true,
});
```

### `remove()`

Remove o campo da **coleção** (apenas da memória).

**Exemplo**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// realmente remover do banco de dados
await books.sync();
```

## Métodos do Banco de Dados

### `removeFromDb()`

Remove o campo do banco de dados.

**Assinatura**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parâmetros**

| Parâmetro              | Tipo          | Padrão | Descrição     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | Instância de transação |

### `existsInDb()`

Verifica se o campo existe no banco de dados.

**Assinatura**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parâmetros**

| Parâmetro              | Tipo          | Padrão | Descrição     |
| ---------------------- | ------------- | ------ | -------- |
| `options.transaction?` | `Transaction` | -      | Instância de transação |

## Lista de Tipos de Campo Integrados

O NocoBase possui alguns tipos de campo comumente usados já integrados, e você pode usar diretamente o nome do tipo correspondente para especificar o tipo ao definir campos para uma **coleção**. Diferentes tipos de campo possuem configurações de parâmetros distintas; consulte a lista abaixo para mais detalhes.

Todos os itens de configuração para os tipos de campo, exceto aqueles introduzidos abaixo, serão repassados para o Sequelize. Assim, todos os itens de configuração de campo suportados pelo Sequelize podem ser usados aqui (como `allowNull`, `defaultValue`, etc.).

Além disso, os tipos de campo do lado do servidor resolvem principalmente os problemas de armazenamento de banco de dados e alguns algoritmos, e são basicamente independentes dos tipos de exibição de campo e componentes usados no frontend. Para os tipos de campo do frontend, consulte as instruções do tutorial correspondente.

### `'boolean'`

Tipo de valor booleano.

**Exemplo**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Tipo inteiro (32 bits).

**Exemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Tipo inteiro longo (64 bits).

**Exemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Tipo de ponto flutuante de dupla precisão (64 bits).

**Exemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Tipo de número real (apenas para PG).

### `'decimal'`

Tipo de número decimal.

### `'string'`

Tipo string. Equivalente ao tipo `VARCHAR` na maioria dos bancos de dados.

**Exemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Tipo texto. Equivalente ao tipo `TEXT` na maioria dos bancos de dados.

**Exemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Tipo senha (extensão NocoBase). Criptografa senhas com base no método `scrypt` do pacote nativo `crypto` do Node.js.

**Exemplo**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Comprimento, padrão 64
      randomBytesSize: 8, // Comprimento do byte aleatório, padrão 8
    },
  ],
});
```

**Parâmetros**

| Parâmetro         | Tipo     | Padrão | Descrição         |
| ----------------- | -------- | ------ | ------------ |
| `length`          | `number` | 64     | Comprimento do caractere     |
| `randomBytesSize` | `number` | 8      | Tamanho do byte aleatório |

### `'date'`

Tipo data.

### `'time'`

Tipo hora.

### `'array'`

Tipo array (apenas para PG).

### `'json'`

Tipo JSON.

### `'jsonb'`

Tipo JSONB (apenas para PG, outros serão compatíveis como tipo `'json'` ).

### `'uuid'`

Tipo UUID.

### `'uid'`

Tipo UID (extensão NocoBase). Tipo de identificador de string aleatória curta.

### `'formula'`

Tipo fórmula (extensão NocoBase). Permite configurar cálculos de fórmulas matemáticas baseados em [mathjs](https://www.npmjs.com/package/mathjs). A fórmula pode referenciar os valores de outras colunas no mesmo registro para o cálculo.

**Exemplo**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Tipo rádio (extensão NocoBase). No máximo uma linha de dados em toda a **coleção** pode ter o valor deste campo como `true`; todos os outros serão `false` ou `null`.

**Exemplo**

Existe apenas um usuário marcado como root em todo o sistema. Depois que o valor `root` de qualquer outro usuário for alterado para `true`, todos os outros registros com `root` como `true` serão alterados para `false`:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Tipo ordenação (extensão NocoBase). Ordena com base em números inteiros, gera automaticamente um novo número de sequência para novos registros e reordena os números de sequência quando os dados são movidos.

Se uma **coleção** definir a opção `sortable`, um campo correspondente também será gerado automaticamente.

**Exemplo**

As publicações podem ser ordenadas com base no usuário ao qual pertencem:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Ordena dados agrupados pelo mesmo valor de userId
    },
  ],
});
```

### `'virtual'`

Tipo virtual. Não armazena dados de fato, usado apenas para definições especiais de getter/setter.

### `'belongsTo'`

Tipo de associação muitos-para-um. A chave estrangeira é armazenada em sua própria tabela, ao contrário de hasOne/hasMany.

**Exemplo**

Qualquer publicação pertence a um autor:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Se não configurado, o padrão é o nome da coleção no plural do nome
      foreignKey: 'authorId', // Se não configurado, o padrão é o formato <name> + Id
      sourceKey: 'id', // Se não configurado, o padrão é o id da coleção de destino
    },
  ],
});
```

### `'hasOne'`

Tipo de associação um-para-um. A chave estrangeira é armazenada na **coleção** associada, ao contrário de belongsTo.

**Exemplo**

Cada usuário tem um perfil:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Pode ser omitido
    },
  ],
});
```

### `'hasMany'`

Tipo de associação um-para-muitos. A chave estrangeira é armazenada na **coleção** associada, ao contrário de belongsTo.

**Exemplo**

Qualquer usuário pode ter múltiplas publicações:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Tipo de associação muitos-para-muitos. Usa uma **coleção** intermediária para armazenar as chaves estrangeiras de ambos os lados. Se uma **coleção** existente não for especificada como a **coleção** intermediária, uma **coleção** intermediária será criada automaticamente.

**Exemplo**

Qualquer publicação pode ter múltiplas tags, e qualquer tag pode ser adicionada a múltiplas publicações:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Pode ser omitido se o nome for o mesmo
      through: 'postsTags', // A coleção intermediária será gerada automaticamente se não configurada
      foreignKey: 'postId', // A chave estrangeira da coleção de origem na coleção intermediária
      sourceKey: 'id', // A chave primária da coleção de origem
      otherKey: 'tagId', // A chave estrangeira da coleção de destino na coleção intermediária
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // O mesmo grupo de relacionamentos aponta para a mesma coleção intermediária
    },
  ],
});
```