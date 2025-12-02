:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Gerenciador de Recursos

A funcionalidade de gerenciamento de recursos do NocoBase pode converter automaticamente **coleções** e associações existentes em recursos, com tipos de operação integrados para ajudar desenvolvedores a construir rapidamente operações de recursos REST API. Um pouco diferente das REST APIs tradicionais, as operações de recurso do NocoBase não dependem de métodos de requisição HTTP, mas determinam a operação específica a ser executada através de definições explícitas de `:action`.

## Geração Automática de Recursos

NocoBase converte automaticamente `collection` e `association` definidas no banco de dados em recursos. Por exemplo, ao definir duas coleções, `posts` e `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Isso gerará automaticamente os seguintes recursos:

*   recurso `posts`
*   recurso `tags`
*   recurso de associação `posts.tags`

Exemplos de requisição:

| Método | Caminho                        | Operação                  |
| -------- | ------------------------------ | ------------------------- |
| `GET`    | `/api/posts:list`              | Consultar lista           |
| `GET`    | `/api/posts:get/1`             | Consultar item único      |
| `POST`   | `/api/posts:create`            | Adicionar novo            |
| `POST`   | `/api/posts:update/1`          | Atualizar                 |
| `POST`   | `/api/posts:destroy/1`         | Excluir                   |

| Método | Caminho                        | Operação                  |
| -------- | ------------------------------ | ------------------------- |
| `GET`    | `/api/tags:list`               | Consultar lista           |
| `GET`    | `/api/tags:get/1`              | Consultar item único      |
| `POST`   | `/api/tags:create`             | Adicionar novo            |
| `POST`   | `/api/tags:update/1`           | Atualizar                 |
| `POST`   | `/api/tags:destroy/1`          | Excluir                   |

| Método | Caminho                                | Operação                                     |
| -------- | -------------------------------------- | -------------------------------------------- |
| `GET`    | `/api/posts/1/tags:list`               | Consultar todas as `tags` associadas a um `post` |
| `GET`    | `/api/posts/1/tags:get/1`              | Consultar uma única `tag` de um `post`       |
| `POST`   | `/api/posts/1/tags:create`             | Criar uma única `tag` para um `post`         |
| `POST`   | `/api/posts/1/tags:update/1`           | Atualizar uma única `tag` de um `post`       |
| `POST`   | `/api/posts/1/tags:destroy/1`          | Excluir uma única `tag` de um `post`         |
| `POST`   | `/api/posts/1/tags:add`                | Adicionar `tags` associadas a um `post`      |
| `POST`   | `/api/posts/1/tags:remove`             | Remover `tags` associadas de um `post`       |
| `POST`   | `/api/posts/1/tags:set`                | Definir todas as `tags` associadas para um `post` |
| `POST`   | `/api/posts/1/tags:toggle`             | Alternar associação de `tags` para um `post` |

:::tip Dica

As operações de recurso do NocoBase não dependem diretamente dos métodos de requisição, mas determinam as operações através de definições explícitas de `:action`.

:::

## Operações de Recurso

NocoBase oferece diversos tipos de operações integradas para atender a várias necessidades de negócio.

### Operações CRUD Básicas

| Nome da Operação | Descrição                               | Tipos de Recurso Aplicáveis | Método de Requisição | Caminho de Exemplo                |
| ---------------- | --------------------------------------- | --------------------------- | -------------------- | --------------------------------- |
| `list`           | Consultar dados da lista                | Todos                       | GET/POST             | `/api/posts:list`                 |
| `get`            | Consultar dados de um item único        | Todos                       | GET/POST             | `/api/posts:get/1`                |
| `create`         | Criar novo registro                     | Todos                       | POST                 | `/api/posts:create`               |
| `update`         | Atualizar registro                      | Todos                       | POST                 | `/api/posts:update/1`             |
| `destroy`        | Excluir registro                        | Todos                       | POST                 | `/api/posts:destroy/1`            |
| `firstOrCreate`  | Encontrar o primeiro registro, criar se não existir | Todos                       | POST                 | `/api/users:firstOrCreate`        |
| `updateOrCreate` | Atualizar registro, criar se não existir | Todos                       | POST                 | `/api/users:updateOrCreate`       |

### Operações de Relacionamento

| Nome da Operação | Descrição                 | Tipos de Relacionamento Aplicáveis                | Caminho de Exemplo                   |
| ---------------- | ------------------------- | ------------------------------------------------- | ------------------------------------ |
| `add`            | Adicionar associação      | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`              |
| `remove`         | Remover associação        | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove`       |
| `set`            | Redefinir associação      | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`          |
| `toggle`         | Adicionar ou remover associação | `belongsToMany`                                   | `/api/posts/1/tags:toggle`           |

### Parâmetros de Operação

Os parâmetros de operação comuns incluem:

*   `filter`: Condições de consulta
*   `values`: Valores a serem definidos
*   `fields`: Campos a serem retornados
*   `appends`: Incluir dados associados
*   `except`: Excluir campos
*   `sort`: Regras de ordenação
*   `page`, `pageSize`: Parâmetros de paginação
*   `paginate`: Se deve habilitar a paginação
*   `tree`: Se deve retornar estrutura de árvore
*   `whitelist`, `blacklist`: Lista branca/negra de campos
*   `updateAssociationValues`: Se deve atualizar valores de associação

## Operações de Recurso Personalizadas

NocoBase permite registrar operações adicionais para recursos existentes. Você pode usar `registerActionHandlers` para personalizar operações para todos os recursos ou para recursos específicos.

### Registrar Operações Globais

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Registrar Operações Específicas de Recurso

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Exemplos de requisição:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Regra de nomenclatura: `resourceName:actionName`. Use a sintaxe de ponto (`posts.comments`) ao incluir associações.

## Recursos Personalizados

Se você precisar fornecer recursos não relacionados a **coleções**, pode usar o método `resourceManager.define` para defini-los:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Os métodos de requisição são consistentes com os recursos gerados automaticamente:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (suporta GET/POST por padrão)

## Middleware Personalizado

Use o método `resourceManager.use()` para registrar middleware global. Por exemplo:

Middleware de log global

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Propriedades Especiais do Contexto

Ser capaz de entrar no middleware ou action da camada `resourceManager` significa que o recurso deve existir.

### ctx.action

*   `ctx.action.actionName`: Nome da operação
*   `ctx.action.resourceName`: Pode ser uma **coleção** ou associação
*   `ctx.action.params`: Parâmetros da operação

### ctx.dataSource

O objeto da **fonte de dados** atual.

### ctx.getCurrentRepository()

O objeto de repositório atual.

## Como Obter Objetos resourceManager para Diferentes Fontes de Dados

`resourceManager` pertence a uma **fonte de dados**, e as operações podem ser registradas separadamente para diferentes **fontes de dados**.

### Fonte de Dados Principal

Para a **fonte de dados** principal, você pode usar diretamente `app.resourceManager` para operar:

```ts
app.resourceManager.registerActionHandlers();
```

### Outras Fontes de Dados

Para outras **fontes de dados**, você pode obter uma instância específica da **fonte de dados** através de `dataSourceManager` e usar o `resourceManager` dessa instância para operar:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterar Todas as Fontes de Dados

Se você precisar executar as mesmas operações em todas as **fontes de dados** adicionadas, pode usar o método `dataSourceManager.afterAddDataSource` para iterar, garantindo que o `resourceManager` de cada **fonte de dados** possa registrar as operações correspondentes:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```