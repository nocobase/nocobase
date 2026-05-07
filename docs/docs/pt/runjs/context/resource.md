:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/resource).
:::

# ctx.resource

A instância **FlowResource** no contexto atual, usada para acessar e operar dados. Na maioria dos blocos (Formulários, Tabelas, Detalhes, etc.) e cenários de pop-up, o ambiente de execução pré-vincula o `ctx.resource`. Em cenários como JSBlock, onde não há um recurso por padrão, você deve primeiro chamar [ctx.initResource()](./init-resource.md) para inicializá-lo antes de usá-lo via `ctx.resource`.

## Cenários de Uso

O `ctx.resource` pode ser usado em qualquer cenário RunJS que exija acesso a dados estruturados (listas, registros únicos, APIs personalizadas, SQL). Blocos de Formulário, Tabela, Detalhes e pop-ups geralmente já estão pré-vinculados. Para JSBlock, JSField, JSItem, JSColumn, etc., se o carregamento de dados for necessário, você pode chamar `ctx.initResource(type)` primeiro e depois acessar `ctx.resource`.

## Definição de Tipo

```ts
resource: FlowResource | undefined;
```

- Em contextos com pré-vinculação, `ctx.resource` é a instância do recurso correspondente.
- Em cenários como JSBlock, onde não há recurso por padrão, ele é `undefined` até que `ctx.initResource(type)` seja chamado.

## Métodos Comuns

Os métodos expostos por diferentes tipos de recursos (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) variam ligeiramente. Abaixo estão os métodos universais ou comumente usados:

| Método | Descrição |
|------|------|
| `getData()` | Obtém os dados atuais (lista ou registro único) |
| `setData(value)` | Define dados locais |
| `refresh()` | Inicia uma requisição com os parâmetros atuais para atualizar os dados |
| `setResourceName(name)` | Define o nome do recurso (ex: `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Define o filtro por chave primária (para `get` de registro único, etc.) |
| `runAction(actionName, options)` | Chama qualquer ação do recurso (ex: `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Inscreve/cancela a inscrição em eventos (ex: `refresh`, `saved`) |

**Específicos de MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, etc.

## Exemplos

### Dados de Lista (requer initResource primeiro)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Cenário de Tabela (pré-vinculado)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Excluído'));
```

### Registro Único

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Chamando uma Ação Personalizada

```js
await ctx.resource.runAction('create', { data: { name: 'João Silva' } });
```

## Relação com ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Se `ctx.resource` não existir, ele cria e vincula um; se já existir, retorna a instância existente. Isso garante que o `ctx.resource` esteja disponível.
- **ctx.makeResource(type)**: Cria uma nova instância de recurso e a retorna, mas **não** a escreve em `ctx.resource`. Isso é adequado para cenários que exigem múltiplos recursos independentes ou uso temporário.
- **ctx.resource**: Acessa o recurso já vinculado ao contexto atual. A maioria dos blocos/pop-ups já está pré-vinculada; caso contrário, será `undefined` e exigirá `ctx.initResource`.

## Observações

- Recomenda-se realizar uma verificação de valor nulo antes do uso: `ctx.resource?.refresh()`, especialmente em cenários como JSBlock onde a pré-vinculação pode não existir.
- Após a inicialização, você deve chamar `setResourceName(name)` para especificar a coleção antes de carregar os dados via `refresh()`.
- Para a API completa de cada tipo de Recurso, consulte os links abaixo.

## Relacionados

- [ctx.initResource()](./init-resource.md) - Inicializa e vincula um recurso ao contexto atual
- [ctx.makeResource()](./make-resource.md) - Cria uma nova instância de recurso sem vinculá-la ao `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Múltiplos registros/Listas
- [SingleRecordResource](../resource/single-record-resource.md) - Registro único
- [APIResource](../resource/api-resource.md) - Recurso de API geral
- [SQLResource](../resource/sql-resource.md) - Recurso de consulta SQL