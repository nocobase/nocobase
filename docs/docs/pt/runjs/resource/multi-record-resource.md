:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Um Resource voltado para coleções (tabelas de dados): as requisições retornam um array e suportam paginação, filtragem, ordenação e operações CRUD. É adequado para cenários de "múltiplos registros", como tabelas e listas. Diferente do [APIResource](./api-resource.md), o MultiRecordResource especifica o nome do recurso via `setResourceName()`, constrói automaticamente URLs como `users:list` e `users:create`, e possui capacidades integradas de paginação, filtragem e seleção de linhas.

**Herança**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Formas de criação**: `ctx.makeResource('MultiRecordResource')` ou `ctx.initResource('MultiRecordResource')`. Antes de usar, você deve chamar `setResourceName('nome_da_coleção')` (ex: `'users'`); no RunJS, o `ctx.api` é injetado pelo ambiente de execução.

---

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **Blocos de Tabela** | Blocos de tabela e lista usam MultiRecordResource por padrão, suportando paginação, filtragem e ordenação. |
| **Listas em JSBlock** | Carrega dados de coleções como usuários ou pedidos em um JSBlock para renderização personalizada. |
| **Operações em lote** | Usa `getSelectedRows()` para obter as linhas selecionadas e `destroySelectedRows()` para exclusão em massa. |
| **Recursos de associação** | Carrega coleções associadas usando formatos como `users.tags`, o que requer o uso de `setSourceId(ID_do_registro_pai)`. |

---

## Formato de dados

- `getData()` retorna um **array de registros**, que corresponde ao campo `data` da resposta da API de listagem.
- `getMeta()` retorna metadados de paginação e outros: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Nome do recurso e fonte de dados

| Método | Descrição |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nome do recurso, ex: `'users'`, `'users.tags'` (recurso de associação). |
| `setSourceId(id)` / `getSourceId()` | ID do registro pai para recursos de associação (ex: para `users.tags`, passe a chave primária do usuário). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identificador da fonte de dados (usado em cenários de múltiplas fontes de dados). |

---

## Parâmetros de requisição (Filtro / Campos / Ordenação)

| Método | Descrição |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filtrar pela chave primária (para `get` de registro único, etc.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Condições de filtro, suportando operadores como `$eq`, `$ne`, `$in`, etc. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Grupos de filtros (para combinar múltiplas condições). |
| `setFields(fields)` / `getFields()` | Campos solicitados (whitelist). |
| `setSort(sort)` / `getSort()` | Ordenação, ex: `['-createdAt']` para ordem decrescente por data de criação. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Carregamento de associações (ex: `['user', 'tags']`). |

---

## Paginação

| Método | Descrição |
|------|------|
| `setPage(page)` / `getPage()` | Página atual (começando em 1). |
| `setPageSize(size)` / `getPageSize()` | Número de itens por página, o padrão é 20. |
| `getTotalPage()` | Número total de páginas. |
| `getCount()` | Número total de registros (vindo do meta do servidor). |
| `next()` / `previous()` / `goto(page)` | Altera a página e aciona o `refresh`. |

---

## Linhas selecionadas (Cenários de tabela)

| Método | Descrição |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Dados das linhas atualmente selecionadas, usados para exclusão em massa e outras operações. |

---

## CRUD e operações de lista

| Método | Descrição |
|------|------|
| `refresh()` | Solicita a lista com os parâmetros atuais, atualiza o `getData()` e o meta de paginação, e aciona o evento `'refresh'`. |
| `get(filterByTk)` | Solicita um único registro e o retorna (não grava no `getData`). |
| `create(data, options?)` | Cria um registro. Opcional `{ refresh: false }` evita a atualização automática. Aciona `'saved'`. |
| `update(filterByTk, data, options?)` | Atualiza um registro pela sua chave primária. |
| `destroy(target)` | Exclui registros; `target` pode ser uma chave primária, um objeto de linha ou um array de chaves primárias/objetos de linha (exclusão em lote). |
| `destroySelectedRows()` | Exclui as linhas atualmente selecionadas (lança um erro se nenhuma estiver selecionada). |
| `setItem(index, item)` | Substitui localmente uma linha específica de dados (não inicia uma requisição). |
| `runAction(actionName, options)` | Chama qualquer ação do recurso (ex: ações personalizadas). |

---

## Configuração e eventos

| Método | Descrição |
|------|------|
| `setRefreshAction(name)` | A ação chamada durante o refresh, o padrão é `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Configuração da requisição para create/update. |
| `on('refresh', fn)` / `on('saved', fn)` | Acionado após a conclusão do refresh ou após salvar. |

---

## Exemplos

### Lista básica

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtragem e ordenação

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Carregamento de associações

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Criação e paginação

```js
await ctx.resource.create({ name: 'João Silva', email: 'joao.silva@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Excluir linhas selecionadas em massa

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Por favor, selecione os dados primeiro');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Excluído'));
```

### Ouvindo o evento refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Recurso de associação (Subtabela)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Notas

- **setResourceName é obrigatório**: Você deve chamar `setResourceName('nome_da_coleção')` antes do uso, caso contrário, a URL da requisição não poderá ser construída.
- **Recursos de associação**: Quando o nome do recurso está no formato `pai.filho` (ex: `users.tags`), você deve chamar `setSourceId(chave_primaria_do_pai)` primeiro.
- **Debounce no refresh**: Múltiplas chamadas para `refresh()` dentro do mesmo loop de eventos executarão apenas a última para evitar requisições redundantes.
- **getData retorna um Array**: O `data` retornado pela API de listagem é um array de registros, e `getData()` retorna este array diretamente.

---

## Relacionado

- [ctx.resource](../context/resource.md) - A instância de recurso no contexto atual
- [ctx.initResource()](../context/init-resource.md) - Inicializa e vincula ao ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Cria uma nova instância de recurso sem vincular
- [APIResource](./api-resource.md) - Recurso de API genérico solicitado por URL
- [SingleRecordResource](./single-record-resource.md) - Voltado para um único registro