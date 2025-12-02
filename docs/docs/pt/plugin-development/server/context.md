:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Contexto

No NocoBase, cada requisição gera um objeto `ctx`, que é uma instância de Contexto. O Contexto encapsula informações de requisição e resposta, e também oferece funcionalidades específicas do NocoBase, como acesso a banco de dados, operações de cache, gerenciamento de permissões, internacionalização e registro de logs.

A `Application` do NocoBase é implementada com base no Koa, portanto, `ctx` é essencialmente um Koa Context. No entanto, o NocoBase o estende com APIs ricas, permitindo que os desenvolvedores lidem convenientemente com a lógica de negócios em Middleware e Actions. Cada requisição tem um `ctx` independente, garantindo o isolamento e a segurança dos dados entre as requisições.

## ctx.action

`ctx.action` fornece acesso à Action sendo executada para a requisição atual. Inclui:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Exibe o nome da Action atual
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Suporte à internacionalização (i18n).

- `ctx.i18n` fornece informações de localidade
- `ctx.t()` é usado para traduzir strings com base no idioma

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Retorna a tradução com base no idioma da requisição
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` fornece uma interface para acesso ao banco de dados, permitindo que você opere diretamente em modelos e execute consultas.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` fornece operações de cache, suportando leitura e escrita no cache, comumente usado para acelerar o acesso a dados ou salvar estados temporários.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Armazena em cache por 60 segundos
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` é a instância da aplicação NocoBase, permitindo acesso à configuração global, plugins e serviços.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Verifique o console para a aplicação';
});
```

## ctx.auth.user

`ctx.auth.user` recupera as informações do usuário atualmente autenticado, adequado para uso em verificações de permissão ou lógica de negócios.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` é usado para compartilhar dados na cadeia de middleware.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` fornece capacidades de registro de logs, suportando saída de logs em múltiplos níveis.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` é usado para gerenciamento de permissões, e `ctx.can()` é usado para verificar se o usuário atual tem permissão para executar uma determinada operação.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Resumo

- Cada requisição corresponde a um objeto `ctx` independente
- `ctx` é uma extensão do Koa Context, integrando funcionalidades do NocoBase
- Propriedades comuns incluem: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, etc.
- Usar `ctx` em Middleware e Actions permite lidar convenientemente com requisições, respostas, permissões, logs e o banco de dados