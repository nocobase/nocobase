:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Middleware

O middleware do NocoBase Server é essencialmente um **middleware Koa**. Você pode manipular o objeto `ctx` para lidar com requisições e respostas, assim como faria no Koa. No entanto, como o NocoBase precisa gerenciar a lógica em diferentes camadas de negócio, agrupar todo o middleware em um só lugar tornaria a manutenção e o gerenciamento muito difíceis.

Por isso, o NocoBase divide o middleware em **quatro níveis**:

1.  **Middleware de Nível de Fonte de Dados**: `app.dataSourceManager.use()`
    Afeta apenas requisições para **uma fonte de dados específica**, sendo comumente usado para lógica de conexão de banco de dados, validação de campos ou processamento de transações para essa fonte de dados.

2.  **Middleware de Nível de Recurso**: `app.resourceManager.use()`
    É eficaz apenas para recursos (Resource) definidos, sendo adequado para lidar com lógica de nível de recurso, como permissões de dados, formatação, etc.

3.  **Middleware de Nível de Permissão**: `app.acl.use()`
    Executa antes das verificações de permissão, usado para verificar permissões ou funções de usuário.

4.  **Middleware de Nível de Aplicação**: `app.use()`
    Executa para cada requisição, sendo adequado para registro de logs, tratamento geral de erros, processamento de respostas, etc.

## Registro de Middleware

O middleware é geralmente registrado no método `load` do **plugin**, por exemplo:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware de nível de aplicação
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware de fonte de dados
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware de permissão
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware de recurso
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Ordem de Execução

A ordem de execução do middleware é a seguinte:

1.  Primeiro, executa o middleware de permissão adicionado por `acl.use()`.
2.  Em seguida, executa o middleware de recurso adicionado por `resourceManager.use()`.
3.  Depois, executa o middleware de **fonte de dados** adicionado por `dataSourceManager.use()`.
4.  Por fim, executa o middleware de aplicação adicionado por `app.use()`.

## Mecanismo de Inserção before / after / tag

Para um controle mais flexível da ordem do middleware, o NocoBase oferece os parâmetros `before`, `after` e `tag`:

-   **tag**: Atribui uma marca a um middleware, para que possa ser referenciado por middleware subsequente.
-   **before**: Insere antes do middleware com a tag especificada.
-   **after**: Insere depois do middleware com a tag especificada.

Exemplo:

```ts
// Middleware comum
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 será posicionado antes de m1
app.use(m4, { before: 'restApi' });

// m5 será inserido entre m2 e m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Se nenhuma posição for especificada, a ordem de execução padrão para o middleware recém-adicionado é:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## Exemplo do Modelo de Camadas (Onion Model)

A ordem de execução do middleware segue o **Modelo de Camadas (Onion Model)** do Koa, ou seja, ele entra na pilha de middleware primeiro e sai por último.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Exemplos de ordem de saída ao acessar diferentes interfaces:

-   **Requisição comum**: `/api/hello`
    Saída: `[1,2]` (recurso não definido, não executa o middleware `resourceManager` e `acl`)

-   **Requisição de recurso**: `/api/test:list`
    Saída: `[5,3,7,1,2,8,4,6]`
    O middleware executa de acordo com a ordem das camadas e o Modelo de Camadas (Onion Model).

## Resumo

-   O Middleware do NocoBase é uma extensão do Middleware Koa.
-   Quatro níveis: Aplicação -> **Fonte de Dados** -> Recurso -> Permissão.
-   Você pode usar `before` / `after` / `tag` para controlar a ordem de execução de forma flexível.
-   Segue o Modelo de Camadas (Onion Model) do Koa, garantindo que o middleware seja combinável e aninhável.
-   O middleware de nível de **fonte de dados** afeta apenas requisições de **fontes de dados** especificadas, e o middleware de nível de recurso afeta apenas requisições de recursos definidos.