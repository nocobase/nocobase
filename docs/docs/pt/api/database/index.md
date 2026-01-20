:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Banco de Dados

## Visão Geral

O `Database` é a ferramenta de interação com banco de dados fornecida pelo NocoBase, que oferece funcionalidades muito convenientes para aplicações no-code e low-code. Atualmente, os bancos de dados suportados são:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Conectar ao Banco de Dados

No construtor de `Database`, você pode configurar a conexão do banco de dados passando o parâmetro `options`.

```javascript
const { Database } = require('@nocobase/database');

// Parâmetros de configuração para banco de dados SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Parâmetros de configuração para banco de dados MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' ou 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Para parâmetros de configuração detalhados, consulte [Construtor](#construtor).

### Definição de Modelo de Dados

O `Database` define a estrutura do banco de dados através de `coleção`. Um objeto `coleção` representa uma tabela no banco de dados.

```javascript
// Define a coleção
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

Após definir a estrutura do banco de dados, você pode usar o método `sync()` para sincronizá-la.

```javascript
await database.sync();
```

Para um uso mais detalhado de `coleção`, consulte [Coleção](/api/database/collection).

### Leitura e Escrita de Dados

O `Database` opera nos dados através de `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Criar
await UserRepository.create({
  name: 'João',
  age: 18,
});

// Consultar
const user = await UserRepository.findOne({
  filter: {
    name: 'João',
  },
});

// Atualizar
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Excluir
await UserRepository.destroy(user.id);
```

Para um uso mais detalhado das operações CRUD de dados, consulte [Repository](/api/database/repository).

## Construtor

**Assinatura**

- `constructor(options: DatabaseOptions)`

Cria uma instância de banco de dados.

**Parâmetros**

| Parâmetro              | Tipo           | Valor Padrão  | Descrição                                                                                                           |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Host do banco de dados                                                                                              |
| `options.port`         | `number`       | -             | Porta do serviço de banco de dados, com uma porta padrão correspondente ao banco de dados utilizado.                |
| `options.username`     | `string`       | -             | Nome de usuário do banco de dados                                                                                   |
| `options.password`     | `string`       | -             | Senha do banco de dados                                                                                             |
| `options.database`     | `string`       | -             | Nome do banco de dados                                                                                              |
| `options.dialect`      | `string`       | `'mysql'`     | Tipo de banco de dados                                                                                              |
| `options.storage?`     | `string`       | `':memory:'`  | Modo de armazenamento para SQLite                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | Se deve habilitar o registro de logs                                                                                |
| `options.define?`      | `Object`       | `{}`          | Parâmetros de definição de tabela padrão                                                                            |
| `options.tablePrefix?` | `string`       | `''`          | Extensão NocoBase, prefixo do nome da tabela                                                                        |
| `options.migrator?`    | `UmzugOptions` | `{}`          | Extensão NocoBase, parâmetros relacionados ao gerenciador de migrações, consulte a implementação [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15). |

## Métodos Relacionados a Migrações

### `addMigration()`

Adiciona um único arquivo de migração.

**Assinatura**

- `addMigration(options: MigrationItem)`

**Parâmetros**

| Parâmetro              | Tipo               | Valor Padrão | Descrição                          |
| -------------------- | ------------------ | ------ | ---------------------------------- |
| `options.name`       | `string`           | -      | Nome do arquivo de migração        |
| `options.context?`   | `string`           | -      | Contexto do arquivo de migração    |
| `options.migration?` | `typeof Migration` | -      | Classe personalizada para a migração |
| `options.up`         | `Function`         | -      | Método `up` do arquivo de migração |
| `options.down`       | `Function`         | -      | Método `down` do arquivo de migração |

**Exemplo**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* seus SQLs de migração */);
  },
});
```

### `addMigrations()`

Adiciona arquivos de migração de um diretório especificado.

**Assinatura**

- `addMigrations(options: AddMigrationsOptions): void`

**Parâmetros**

| Parâmetro              | Tipo       | Valor Padrão   | Descrição                          |
| -------------------- | ---------- | -------------- | ---------------------------------- |
| `options.directory`  | `string`   | `''`           | Diretório onde os arquivos de migração estão localizados |
| `options.extensions` | `string[]` | `['js', 'ts']` | Extensões de arquivo               |
| `options.namespace?` | `string`   | `''`           | Namespace                          |
| `options.context?`   | `Object`   | `{ db }`       | Contexto do arquivo de migração    |

**Exemplo**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Métodos Utilitários

### `inDialect()`

Verifica se o tipo de banco de dados atual é um dos tipos especificados.

**Assinatura**

- `inDialect(dialect: string[]): boolean`

**Parâmetros**

| Parâmetro | Tipo       | Valor Padrão | Descrição                                             |
| --------- | ---------- | ------ | ----------------------------------------------------- |
| `dialect` | `string[]` | -      | Tipo de banco de dados, valores possíveis são `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Obtém o prefixo do nome da tabela da configuração.

**Assinatura**

- `getTablePrefix(): string`

## Configuração de Coleção

### `collection()`

Define uma `coleção`. Esta chamada é semelhante ao método `define` do Sequelize, criando a estrutura da tabela apenas em memória. Para persistir no banco de dados, você precisa chamar o método `sync`.

**Assinatura**

- `collection(options: CollectionOptions): Collection`

**Parâmetros**

Todos os parâmetros de configuração de `options` são consistentes com o construtor da classe `coleção`, consulte [Coleção](/api/database/collection#construtor).

**Eventos**

- `'beforeDefineCollection'`: Acionado antes de definir uma `coleção`.
- `'afterDefineCollection'`: Acionado após definir uma `coleção`.

**Exemplo**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// sincroniza a coleção como tabela no banco de dados
await db.sync();
```

### `getCollection()`

Obtém uma `coleção` definida.

**Assinatura**

- `getCollection(name: string): Collection`

**Parâmetros**

| Parâmetro | Tipo     | Valor Padrão | Descrição        |
| ------ | -------- | ------ | ---------------- |
| `name` | `string` | -      | Nome da `coleção` |

**Exemplo**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Verifica se uma `coleção` especificada foi definida.

**Assinatura**

- `hasCollection(name: string): boolean`

**Parâmetros**

| Parâmetro | Tipo     | Valor Padrão | Descrição        |
| ------ | -------- | ------ | ---------------- |
| `name` | `string` | -      | Nome da `coleção` |

**Exemplo**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Remove uma `coleção` definida. É removida apenas da memória; para persistir a alteração, você precisa chamar o método `sync`.

**Assinatura**

- `removeCollection(name: string): void`

**Parâmetros**

| Parâmetro | Tipo     | Valor Padrão | Descrição        |
| ------ | -------- | ------ | ---------------- |
| `name` | `string` | -      | Nome da `coleção` |

**Eventos**

- `'beforeRemoveCollection'`: Acionado antes de remover uma `coleção`.
- `'afterRemoveCollection'`: Acionado após remover uma `coleção`.

**Exemplo**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importa todos os arquivos em um diretório como configurações de `coleção` para a memória.

**Assinatura**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parâmetros**

| Parâmetro              | Tipo       | Valor Padrão   | Descrição                          |
| -------------------- | ---------- | -------------- | ---------------------------------- |
| `options.directory`  | `string`   | -              | Caminho do diretório a ser importado |
| `options.extensions` | `string[]` | `['ts', 'js']` | Escaneia por sufixos específicos    |

**Exemplo**

A `coleção` definida no arquivo `./collections/books.ts` é a seguinte:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

Importe a configuração relevante quando o `plugin` carregar:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Registro e Recuperação de Extensões

### `registerFieldTypes()`

Registra tipos de campo personalizados.

**Assinatura**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parâmetros**

`fieldTypes` é um par chave-valor onde a chave é o nome do tipo de campo e o valor é a classe do tipo de campo.

**Exemplo**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

Registra classes de modelo de dados personalizadas.

**Assinatura**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parâmetros**

`models` é um par chave-valor onde a chave é o nome do modelo de dados e o valor é a classe do modelo de dados.

**Exemplo**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

Registra classes de `Repository` personalizadas.

**Assinatura**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parâmetros**

`repositories` é um par chave-valor onde a chave é o nome do `Repository` e o valor é a classe do `Repository`.

**Exemplo**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

Registra operadores de consulta de dados personalizados.

**Assinatura**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parâmetros**

`operators` é um par chave-valor onde a chave é o nome do operador e o valor é a função que gera a instrução de comparação.

**Exemplo**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // operador registrado
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Obtém uma classe de modelo de dados definida. Se nenhuma classe de modelo personalizada foi registrada anteriormente, ele retornará a classe de modelo padrão do Sequelize. O nome padrão é o mesmo que o nome da `coleção`.

**Assinatura**

- `getModel(name: string): Model`

**Parâmetros**

| Parâmetro | Tipo     | Valor Padrão | Descrição             |
| ------ | -------- | ------ | --------------------- |
| `name` | `string` | -      | Nome do modelo registrado |

**Exemplo**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Nota: A classe de modelo obtida de uma `coleção` não é estritamente igual à classe de modelo registrada, mas herda dela. Como as propriedades da classe de modelo do Sequelize são modificadas durante a inicialização, o NocoBase lida automaticamente com essa relação de herança. Exceto pela desigualdade da classe, todas as outras definições podem ser usadas normalmente.

### `getRepository()`

Obtém uma classe de `Repository` personalizada. Se nenhuma classe de `Repository` personalizada foi registrada anteriormente, ele retornará a classe de `Repository` padrão do NocoBase. O nome padrão é o mesmo que o nome da `coleção`.

As classes de `Repository` são usadas principalmente para operações CRUD baseadas em modelos de dados, consulte [Repository](/api/database/repository).

**Assinatura**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parâmetros**

| Parâmetro    | Tipo                 | Valor Padrão | Descrição                   |
| ------------ | -------------------- | ------ | --------------------------- |
| `name`       | `string`             | -      | Nome do `Repository` registrado |
| `relationId` | `string` \| `number` | -      | Valor da chave estrangeira para dados relacionais |

Quando o nome é um nome de associação como `'tables.relations'`, ele retornará a classe de `Repository` associada. Se o segundo parâmetro for fornecido, o `Repository` será baseado no valor da chave estrangeira dos dados relacionais ao ser usado (consultar, atualizar, etc.).

**Exemplo**

Suponha que existam duas `coleções`, *posts* e *authors*, e a `coleção` de posts tem uma chave estrangeira apontando para a `coleção` de authors:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Eventos do Banco de Dados

### `on()`

Escuta por eventos do banco de dados.

**Assinatura**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parâmetros**

| Parâmetro | Tipo     | Valor Padrão | Descrição        |
| -------- | -------- | ------ | ---------------- |
| event    | string   | -      | Nome do evento   |
| listener | Function | -      | Listener de evento |

Os nomes dos eventos suportam os eventos de `Model` do Sequelize por padrão. Para eventos globais, escute usando o formato `<sequelize_model_global_event>`, e para eventos de `Model` único, use o formato `<model_name>.<sequelize_model_event>`.

Para descrições de parâmetros e exemplos detalhados de todos os tipos de eventos integrados, consulte a seção [Eventos Integrados](#eventos-integrados).

### `off()`

Remove uma função de listener de evento.

**Assinatura**

- `off(name: string, listener: Function)`

**Parâmetros**

| Parâmetro | Tipo     | Valor Padrão | Descrição        |
| -------- | -------- | ------ | ---------------- |
| name     | string   | -      | Nome do evento   |
| listener | Function | -      | Listener de evento |

**Exemplo**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Operações do Banco de Dados

### `auth()`

Autenticação da conexão do banco de dados. Pode ser usada para garantir que a aplicação estabeleceu uma conexão com os dados.

**Assinatura**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parâmetros**

| Parâmetro              | Tipo                  | Valor Padrão | Descrição                |
| ---------------------- | --------------------- | ------- | ------------------------ |
| `options?`             | `Object`              | -       | Opções de autenticação   |
| `options.retry?`       | `number`              | `10`    | Número de tentativas em caso de falha na autenticação |
| `options.transaction?` | `Transaction`         | -       | Objeto de transação      |
| `options.logging?`     | `boolean \| Function` | `false` | Se deve imprimir logs    |

**Exemplo**

```ts
await db.auth();
```

### `reconnect()`

Reconecta ao banco de dados.

**Exemplo**

```ts
await db.reconnect();
```

### `closed()`

Verifica se a conexão do banco de dados está fechada.

**Assinatura**

- `closed(): boolean`

### `close()`

Fecha a conexão do banco de dados. Equivalente a `sequelize.close()`.

### `sync()`

Sincroniza a estrutura da `coleção` do banco de dados. Equivalente a `sequelize.sync()`, para parâmetros consulte a [documentação do Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Limpa o banco de dados, excluindo todas as `coleções`.

**Assinatura**

- `clean(options: CleanOptions): Promise<void>`

**Parâmetros**

| Parâmetro             | Tipo          | Valor Padrão | Descrição                       |
| --------------------- | ------------- | ------- | ------------------------------- |
| `options.drop`        | `boolean`     | `false` | Se deve remover todas as `coleções` |
| `options.skip`        | `string[]`    | -       | Configuração dos nomes das `coleções` a serem ignoradas |
| `options.transaction` | `Transaction` | -       | Objeto de transação             |

**Exemplo**

Remove todas as `coleções`, exceto a `coleção` `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Exportações em Nível de Pacote

### `defineCollection()`

Cria o conteúdo de configuração para uma `coleção`.

**Assinatura**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parâmetros**

| Parâmetro           | Tipo                | Valor Padrão | Descrição                               |
| ------------------- | ------------------- | ------ | --------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | O mesmo que todos os parâmetros de `db.collection()` |

**Exemplo**

Para um arquivo de configuração de `coleção` a ser importado por `db.import()`:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

Estende o conteúdo da configuração de estrutura de `coleção` já em memória, usado principalmente para o conteúdo de arquivos importados pelo método `import()`. Este método é um método de nível superior exportado pelo pacote `@nocobase/database` e não é chamado através de uma instância `db`. O alias `extend` também pode ser usado.

**Assinatura**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parâmetros**

| Parâmetro           | Tipo                | Valor Padrão | Descrição                                                           |
| ------------------- | ------------------- | ------ | ------------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | O mesmo que todos os parâmetros de `db.collection()`                |
| `mergeOptions?`     | `MergeOptions`      | -      | Parâmetros para o pacote npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Exemplo**

Definição original da `coleção` de livros (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Definição estendida da `coleção` de livros (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// estender novamente
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Se os dois arquivos acima forem importados ao chamar `import()`, após serem estendidos novamente com `extend()`, a `coleção` de livros terá os campos `title` e `price`.

Este método é muito útil para estender estruturas de `coleção` já definidas por `plugins` existentes.

## Eventos Integrados

O banco de dados aciona os eventos correspondentes a seguir em diferentes estágios de seu ciclo de vida. Ao se inscrever neles com o método `on()`, você pode realizar processamentos específicos para atender a certas necessidades de negócio.

### `'beforeSync'` / `'afterSync'`

Acionado antes e depois que uma nova configuração de estrutura de `coleção` (campos, índices, etc.) é sincronizada com o banco de dados. Geralmente é acionado quando `collection.sync()` (chamada interna) é executado e é usado para lidar com a lógica de extensões de campo especiais.

**Assinatura**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Tipo**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Exemplo**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // faça algo
});

db.on('users.afterSync', async (options) => {
  // faça algo
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Antes de criar ou atualizar dados, há um processo de validação baseado nas regras definidas na `coleção`. Eventos correspondentes são acionados antes e depois da validação. Isso é acionado quando `repository.create()` ou `repository.update()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Tipo**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Exemplo**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// todos os modelos
db.on('beforeValidate', async (model, options) => {
  // faça algo
});
// modelo tests
db.on('tests.beforeValidate', async (model, options) => {
  // faça algo
});

// todos os modelos
db.on('afterValidate', async (model, options) => {
  // faça algo
});
// modelo tests
db.on('tests.afterValidate', async (model, options) => {
  // faça algo
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // verifica o formato do e-mail
  },
});
// ou
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // verifica o formato do e-mail
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Eventos correspondentes são acionados antes e depois de criar um registro. Isso é acionado quando `repository.create()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Tipo**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Exemplo**

```ts
db.on('beforeCreate', async (model, options) => {
  // faça algo
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Eventos correspondentes são acionados antes e depois de atualizar um registro. Isso é acionado quando `repository.update()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Tipo**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Exemplo**

```ts
db.on('beforeUpdate', async (model, options) => {
  // faça algo
});

db.on('books.afterUpdate', async (model, options) => {
  // faça algo
});
```

### `'beforeSave'` / `'afterSave'`

Eventos correspondentes são acionados antes e depois de criar ou atualizar um registro. Isso é acionado quando `repository.create()` ou `repository.update()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Tipo**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Exemplo**

```ts
db.on('beforeSave', async (model, options) => {
  // faça algo
});

db.on('books.afterSave', async (model, options) => {
  // faça algo
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Eventos correspondentes são acionados antes e depois de excluir um registro. Isso é acionado quando `repository.destroy()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Tipo**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Exemplo**

```ts
db.on('beforeDestroy', async (model, options) => {
  // faça algo
});

db.on('books.afterDestroy', async (model, options) => {
  // faça algo
});
```

### `'afterCreateWithAssociations'`

Este evento é acionado após criar um registro com dados de associação hierárquica. É acionado quando `repository.create()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipo**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Exemplo**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // faça algo
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // faça algo
});
```

### `'afterUpdateWithAssociations'`

Este evento é acionado após atualizar um registro com dados de associação hierárquica. É acionado quando `repository.update()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipo**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Exemplo**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // faça algo
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // faça algo
});
```

### `'afterSaveWithAssociations'`

Este evento é acionado após criar ou atualizar um registro com dados de associação hierárquica. É acionado quando `repository.create()` ou `repository.update()` é chamado.

**Assinatura**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Tipo**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Exemplo**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // faça algo
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // faça algo
});
```

### `'beforeDefineCollection'`

Acionado antes que uma `coleção` seja definida, por exemplo, quando `db.collection()` é chamado.

Nota: Este é um evento síncrono.

**Assinatura**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Tipo**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Exemplo**

```ts
db.on('beforeDefineCollection', (options) => {
  // faça algo
});
```

### `'afterDefineCollection'`

Acionado depois que uma `coleção` é definida, por exemplo, quando `db.collection()` é chamado.

Nota: Este é um evento síncrono.

**Assinatura**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Tipo**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Exemplo**

```ts
db.on('afterDefineCollection', (collection) => {
  // faça algo
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Acionado antes e depois que uma `coleção` é removida da memória, por exemplo, quando `db.removeCollection()` é chamado.

Nota: Este é um evento síncrono.

**Assinatura**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Tipo**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Exemplo**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // faça algo
});

db.on('afterRemoveCollection', (collection) => {
  // faça algo
});
```