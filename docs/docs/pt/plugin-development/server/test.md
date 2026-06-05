:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Testes

NocoBase oferece um conjunto completo de ferramentas de teste para ajudar desenvolvedores a verificar rapidamente a correção da lógica do banco de dados, interfaces de API e implementações de funcionalidades durante o desenvolvimento de **plugins**. Este guia mostrará como escrever, executar e organizar esses testes.

## Por que escrever testes

Benefícios de escrever testes automatizados no desenvolvimento de **plugins**:

- Verificar rapidamente se os modelos de banco de dados, APIs e lógica de negócios estão corretos
- Evitar erros de regressão (detectar automaticamente a compatibilidade do **plugin** após atualizações do core)
- Suportar ambientes de integração contínua (CI) para executar testes automaticamente
- Suportar o teste de funcionalidades de **plugins** sem iniciar o serviço completo

## Fundamentos do Ambiente de Teste

NocoBase oferece duas ferramentas de teste essenciais:

| Ferramenta | Descrição | Finalidade |
|---|---|---|
| `createMockDatabase` | Cria uma instância de banco de dados em memória | Testa modelos e lógica de banco de dados |
| `createMockServer` | Cria uma instância completa da aplicação (inclui banco de dados, **plugins**, APIs, etc.) | Testa processos de negócios e comportamento de interfaces |

## Usando `createMockDatabase` para Testes de Banco de Dados

`createMockDatabase` é ideal para testar funcionalidades diretamente relacionadas a bancos de dados, como definições de modelos, tipos de campo, relacionamentos, operações CRUD, etc.

### Exemplo Básico

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### Testando Operações CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Criar
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Atualizar
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### Testando Associações de Modelos

```ts
const Users = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## Usando `createMockServer` para Testes de API

`createMockServer` cria automaticamente uma instância completa da aplicação, incluindo banco de dados, **plugins** e rotas de API, tornando-o ideal para testar interfaces de **plugins**.

### Exemplo Básico

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### Testando Consultas e Atualizações de API

```ts
// Consultar lista de usuários
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Atualizar usuário
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Simulando Status de Login ou Teste de Permissões

Você pode habilitar o **plugin** `auth` ao criar o `MockServer`, e então usar a interface de login para obter o token ou a sessão:

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

Você também pode usar o método `login()` mais simples

```ts
await app.agent().login(userOrId);
```

## Organizando Arquivos de Teste em **Plugins**

Recomendamos armazenar os arquivos de teste relacionados à lógica do lado do servidor na pasta `./src/server/__tests__` do **plugin**.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Diretório do código-fonte
│   └── server/              # Código do lado do servidor
│       ├── __tests__/       # Diretório de arquivos de teste
│       │   ├── db.test.ts   # Testes relacionados ao banco de dados (usando createMockDatabase)
│       │   └── api.test.ts  # Testes relacionados à API
```

## Executando Testes

```bash
# Especificar diretório
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Especificar arquivo
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```