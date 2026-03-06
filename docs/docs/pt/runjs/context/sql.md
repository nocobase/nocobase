:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` fornece capacidades de execução e gerenciamento de SQL, comumente usado em RunJS (como JSBlock e fluxos de eventos) para acessar o banco de dados diretamente. Suporta execução de SQL temporário, execução de modelos SQL salvos por ID, vinculação de parâmetros (binding), variáveis de modelo (`{{ctx.xxx}}`) e controle do tipo de resultado.

## Cenários de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock** | Relatórios estatísticos personalizados, listas de filtros complexos e consultas de agregação entre tabelas. |
| **Bloco de Gráfico** | Salvamento de modelos SQL para alimentar fontes de dados de gráficos. |
| **Fluxo de Trabalho / Ligação** | Execução de SQL predefinido para obter dados e participar da lógica subsequente. |
| **SQLResource** | Usado em conjunto com `ctx.initResource('SQLResource')` para cenários como listas paginadas. |

> Nota: `ctx.sql` acessa o banco de dados via API `flowSql`. Certifique-se de que o usuário atual tenha permissões de execução para a fonte de dados correspondente.

## Permissões

| Permissão | Método | Descrição |
|------|------|------|
| **Usuário Logado** | `runById` | Executa com base em um ID de modelo SQL configurado. |
| **Permissão de Configuração SQL** | `run`, `save`, `destroy` | Executa SQL temporário, ou salva/atualiza/exclui modelos SQL. |

A lógica de frontend destinada a usuários comuns deve usar `ctx.sql.runById(uid, options)`. Quando for necessário SQL dinâmico ou gerenciamento de modelos, certifique-se de que a função (role) atual possua permissões de configuração SQL.

## Definição de Tipo

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Métodos Comuns

| Método | Descrição | Requisito de Permissão |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Executa SQL temporário; suporta vinculação de parâmetros e variáveis de modelo. | Permissão de Configuração SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Salva ou atualiza um modelo SQL por ID para reutilização. | Permissão de Configuração SQL |
| `ctx.sql.runById(uid, options?)` | Executa um modelo SQL salvo anteriormente pelo seu ID. | Qualquer usuário logado |
| `ctx.sql.destroy(uid)` | Exclui um modelo SQL especificado por ID. | Permissão de Configuração SQL |

Nota:

- `run` é usado para depuração de SQL e requer permissões de configuração.
- `save` e `destroy` são usados para gerenciar modelos SQL e requerem permissões de configuração.
- `runById` é aberto a usuários comuns; ele só pode executar modelos salvos e não permite depurar ou modificar o SQL.
- Quando um modelo SQL é modificado, `save` deve ser chamado para persistir as alterações.

## Parâmetros

### options para run / runById

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Variáveis de vinculação. Use um objeto para marcadores `:name` ou um array para marcadores `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Tipo de resultado: múltiplas linhas, linha única ou valor único. O padrão é `selectRows`. |
| `dataSourceKey` | `string` | Identificador da fonte de dados. O padrão é a fonte de dados principal. |
| `filter` | `Record<string, any>` | Condições de filtro adicionais (dependendo do suporte da interface). |

### options para save

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `uid` | `string` | Identificador único para o modelo. Uma vez salvo, pode ser executado via `runById(uid, ...)`. |
| `sql` | `string` | Conteúdo SQL. Suporta variáveis de modelo `{{ctx.xxx}}` e marcadores `:name` / `?`. |
| `dataSourceKey` | `string` | Opcional. Identificador da fonte de dados. |

## Variáveis de Modelo SQL e Vinculação de Parâmetros

### Variáveis de Modelo `{{ctx.xxx}}`

Você pode usar `{{ctx.xxx}}` no SQL para referenciar variáveis de contexto. Elas são resolvidas em valores reais antes da execução:

```js
// Referenciar ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

As fontes para variáveis referenciáveis são as mesmas de `ctx.getVar()` (ex: `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` personalizado, etc.).

### Vinculação de Parâmetros (Parameter Binding)

- **Parâmetros Nomeados**: Use `:name` no SQL e passe um objeto `{ name: value }` em `bind`.
- **Parâmetros Posicionais**: Use `?` no SQL e passe um array `[value1, value2]` em `bind`.

```js
// Parâmetros nomeados
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Parâmetros posicionais
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['São Paulo', 'active'], type: 'selectVar' }
);
```

## Exemplos

### Executando SQL Temporário (Requer Permissão de Configuração SQL)

```js
// Múltiplas linhas (padrão)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Linha única
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Valor único (ex: COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Usando Variáveis de Modelo

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Salvando e Reutilizando Modelos

```js
// Salvar (Requer Permissão de Configuração SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Qualquer usuário logado pode executar isso
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Excluir modelo (Requer Permissão de Configuração SQL)
await ctx.sql.destroy('active-users-report');
```

### Lista Paginada (SQLResource)

```js
// Use SQLResource quando for necessária paginação ou filtragem
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID do modelo SQL salvo
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Inclui page, pageSize, etc.
```

## Relacionamento com ctx.resource e ctx.request

| Finalidade | Uso Recomendado |
|------|----------|
| **Executar consulta SQL** | `ctx.sql.run()` ou `ctx.sql.runById()` |
| **Lista paginada SQL (Bloco)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Requisição HTTP geral** | `ctx.request()` |

`ctx.sql` encapsula a API `flowSql` e é especializado para cenários SQL; `ctx.request` pode ser usado para chamar qualquer API.

## Observações

- Use vinculação de parâmetros (`:name` / `?`) em vez de concatenação de strings para evitar injeção de SQL (SQL injection).
- `type: 'selectVar'` retorna um valor escalar, normalmente usado para `COUNT`, `SUM`, etc.
- Variáveis de modelo `{{ctx.xxx}}` são resolvidas antes da execução; certifique-se de que as variáveis correspondentes estejam definidas no contexto.

## Relacionado

- [ctx.resource](./resource.md): Recursos de dados; o SQLResource chama a API `flowSql` internamente.
- [ctx.initResource()](./init-resource.md): Inicializa o SQLResource para listas paginadas, etc.
- [ctx.request()](./request.md): Requisições HTTP gerais.