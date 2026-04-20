:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/resource/sql-resource).
:::

# SQLResource

Um Resource para executar consultas baseadas em **configurações SQL salvas** ou **SQL dinâmico**, com dados originados de interfaces como `flowSql:run` / `flowSql:runById`. É adequado para cenários como relatórios, estatísticas, listas SQL personalizadas, entre outros. Diferente do [MultiRecordResource](./multi-record-resource.md), o SQLResource não depende de coleções; ele executa consultas SQL diretamente e suporta paginação, vinculação de parâmetros (binding), variáveis de template (`{{ctx.xxx}}`) e controle do tipo de resultado.

**Relação de herança**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Formas de criação**: `ctx.makeResource('SQLResource')` ou `ctx.initResource('SQLResource')`. Para executar com base em uma configuração salva, use `setFilterByTk(uid)` (o UID do template SQL); para depuração, você pode usar `setDebug(true)` + `setSQL(sql)` para executar o SQL diretamente. No RunJS, o `ctx.api` é injetado pelo ambiente de execução.

---

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **Relatórios / Estatísticas** | Agregações complexas, consultas entre tabelas e métricas estatísticas personalizadas. |
| **Listas personalizadas JSBlock** | Implementação de filtragem, ordenação ou associações especiais usando SQL com renderização personalizada. |
| **Blocos de gráfico** | Uso de templates SQL salvos para alimentar fontes de dados de gráficos, com suporte a paginação. |
| **SQLResource vs ctx.sql** | Use SQLResource quando houver necessidade de paginação, eventos ou dados reativos; use `ctx.sql.run()` / `ctx.sql.runById()` para consultas simples e pontuais. |

---

## Formato de dados

- `getData()` retorna diferentes formatos com base em `setSQLType()`:
  - `selectRows` (padrão): **Array**, resultados de múltiplas linhas.
  - `selectRow`: **Objeto único**.
  - `selectVar`: **Valor escalar** (ex: COUNT, SUM).
- `getMeta()` retorna metadados como paginação: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Configuração SQL e modos de execução

| Método | Descrição |
|------|------|
| `setFilterByTk(uid)` | Define o UID do template SQL a ser executado (corresponde ao `runById`; deve ser salvo previamente na interface de administração). |
| `setSQL(sql)` | Define o SQL bruto (usado para `runBySQL` apenas quando o modo debug `setDebug(true)` está ativado). |
| `setSQLType(type)` | Tipo de resultado: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Quando `true`, o `refresh` executa `runBySQL()`; caso contrário, executa `runById()`. |
| `run()` | Chama `runBySQL()` ou `runById()` dependendo do estado do debug. |
| `runBySQL()` | Executa usando o SQL definido em `setSQL` (requer `setDebug(true)`). |
| `runById()` | Executa o template SQL salvo usando o UID atual. |

---

## Parâmetros e Contexto

| Método | Descrição |
|------|------|
| `setBind(bind)` | Vincula variáveis. Use um objeto para placeholders `:name` ou um array para placeholders `?`. |
| `setLiquidContext(ctx)` | Contexto do template (Liquid), usado para processar `{{ctx.xxx}}`. |
| `setFilter(filter)` | Condições de filtragem adicionais (passadas nos dados da requisição). |
| `setDataSourceKey(key)` | Identificador da fonte de dados (usado em ambientes com múltiplas fontes de dados). |

---

## Paginação

| Método | Descrição |
|------|------|
| `setPage(page)` / `getPage()` | Página atual (padrão é 1). |
| `setPageSize(size)` / `getPageSize()` | Itens por página (padrão é 20). |
| `next()` / `previous()` / `goto(page)` | Navega pelas páginas e aciona o `refresh`. |

No SQL, você pode usar `{{ctx.limit}}` e `{{ctx.offset}}` para referenciar os parâmetros de paginação. O SQLResource injeta automaticamente `limit` e `offset` no contexto.

---

## Busca de dados e eventos

| Método | Descrição |
|------|------|
| `refresh()` | Executa o SQL (`runById` ou `runBySQL`), escreve o resultado em `setData(data)`, atualiza o meta e aciona o evento `'refresh'`. |
| `runAction(actionName, options)` | Chama ações subjacentes (ex: `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Acionado quando a atualização é concluída ou quando o carregamento inicia. |

---

## Exemplos

### Executando via template salvo (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID do template SQL salvo
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, etc.
```

### Modo Debug: Executando SQL diretamente (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Paginação e Navegação

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navegação
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Tipos de resultado

```js
// Múltiplas linhas (padrão)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Linha única
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Valor único (ex: COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Usando variáveis de template

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Ouvindo o evento refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Observações

- **runById requer salvar o template primeiro**: O UID usado em `setFilterByTk(uid)` deve ser um ID de template SQL já salvo na interface de administração. Você pode salvá-lo via `ctx.sql.save({ uid, sql })`.
- **Modo debug requer permissões**: `setDebug(true)` utiliza `flowSql:run`, o que exige que o cargo atual tenha permissões de configuração SQL. O `runById` exige apenas que o usuário esteja logado.
- **Debounce de refresh**: Múltiplas chamadas para `refresh()` dentro do mesmo loop de eventos executarão apenas a última para evitar requisições redundantes.
- **Vinculação de parâmetros para prevenção de injeção**: Use `setBind()` com placeholders `:name` ou `?` em vez de concatenação de strings para evitar injeção de SQL.

---

## Relacionados

- [ctx.sql](../context/sql.md) - Execução e gerenciamento de SQL; `ctx.sql.runById` é adequado para consultas simples e pontuais.
- [ctx.resource](../context/resource.md) - A instância de resource no contexto atual.
- [ctx.initResource()](../context/init-resource.md) - Inicializa e vincula ao `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Cria uma nova instância de resource sem vincular.
- [APIResource](./api-resource.md) - Recurso de API geral.
- [MultiRecordResource](./multi-record-resource.md) - Voltado para coleções e listas.