:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/init-resource).
:::

# ctx.initResource()

**Inicializa** o recurso (resource) para o contexto atual. Se `ctx.resource` ainda não existir, ele cria um do tipo especificado e o vincula ao contexto; se já existir, ele é usado diretamente. Depois disso, ele pode ser acessado via `ctx.resource`.

## Cenários de uso

Geralmente usado em cenários de **JSBlock** (bloco independente). A maioria dos blocos, popups e outros componentes já possuem o `ctx.resource` pré-vinculado e não exigem chamadas manuais. O JSBlock não possui recurso por padrão, portanto, você deve chamar `ctx.initResource(type)` antes de carregar dados via `ctx.resource`.

## Definição de Tipo

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parâmetro | Tipo | Descrição |
|-----------|------|-------------|
| `type` | `string` | Tipo de recurso: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Retorno**: A instância do recurso no contexto atual (ou seja, `ctx.resource`).

## Diferença de ctx.makeResource()

| Método | Comportamento |
|--------|----------|
| `ctx.initResource(type)` | Cria e vincula se `ctx.resource` não existir; retorna o existente se já houver um. Garante que `ctx.resource` esteja disponível. |
| `ctx.makeResource(type)` | Apenas cria e retorna uma nova instância, **não** escreve em `ctx.resource`. Adequado para cenários que exigem múltiplos recursos independentes ou uso temporário. |

## Exemplos

### Dados de Lista (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Registro Único (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Especifica a chave primária
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Especificar Fonte de Dados

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Observações

- Na maioria dos cenários de blocos (Formulários, Tabelas, Detalhes, etc.) e popups, o `ctx.resource` já é pré-vinculado pelo ambiente de execução, portanto, chamar `ctx.initResource` é desnecessário.
- A inicialização manual é necessária apenas em contextos como o JSBlock, onde não há recurso padrão.
- Após a inicialização, você deve chamar `setResourceName(name)` para especificar a coleção e, em seguida, chamar `refresh()` para carregar os dados.

## Relacionado

- [ctx.resource](./resource.md) — A instância do recurso no contexto atual
- [ctx.makeResource()](./make-resource.md) — Cria uma nova instância de recurso sem vinculá-la ao `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Múltiplos registros/Lista
- [SingleRecordResource](../resource/single-record-resource.md) — Registro único
- [APIResource](../resource/api-resource.md) — Recurso de API geral
- [SQLResource](../resource/sql-resource.md) — Recurso de consulta SQL