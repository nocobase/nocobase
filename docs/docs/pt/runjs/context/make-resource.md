:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Cria** e retorna uma nova instância de recurso (resource) **sem** gravar ou modificar `ctx.resource`. É adequado para cenários que exigem múltiplos recursos independentes ou uso temporário.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **Múltiplos recursos** | Carregar múltiplas fontes de dados simultaneamente (ex: lista de usuários + lista de pedidos), cada uma usando um recurso independente. |
| **Consultas temporárias** | Consultas únicas que são descartadas após o uso, sem necessidade de vincular ao `ctx.resource`. |
| **Dados auxiliares** | Use `ctx.resource` para os dados principais e `makeResource` para criar instâncias para dados adicionais. |

Se você precisar de apenas um único recurso e quiser vinculá-lo ao `ctx.resource`, usar [ctx.initResource()](./init-resource.md) é mais apropriado.

## Definição de Tipo

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `resourceType` | `string` | Tipo de recurso: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Retorno**: A instância de recurso recém-criada.

## Diferença em relação ao ctx.initResource()

| Método | Comportamento |
|------|------|
| `ctx.makeResource(type)` | Apenas cria e retorna uma nova instância, **não** gravando em `ctx.resource`. Pode ser chamado várias vezes para obter múltiplos recursos independentes. |
| `ctx.initResource(type)` | Cria e vincula se `ctx.resource` não existir; retorna-o diretamente se já existir. Garante que `ctx.resource` esteja disponível. |

## Exemplos

### Recurso único

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource permanece com seu valor original (se houver)
```

### Múltiplos recursos

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Contagem de usuários: {usersRes.getData().length}</p>
    <p>Contagem de pedidos: {ordersRes.getData().length}</p>
  </div>
);
```

### Consulta temporária

```ts
// Consulta única, não polui o ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Observações

- O recurso recém-criado precisa chamar `setResourceName(name)` para especificar a coleção e, em seguida, carregar os dados via `refresh()`.
- Cada instância de recurso é independente e não afeta as outras; adequado para carregar múltiplas fontes de dados em paralelo.

## Relacionados

- [ctx.initResource()](./init-resource.md): Inicializa e vincula ao `ctx.resource`
- [ctx.resource](./resource.md): A instância de recurso no contexto atual
- [MultiRecordResource](../resource/multi-record-resource) — Múltiplos registros/Lista
- [SingleRecordResource](../resource/single-record-resource) — Registro único
- [APIResource](../resource/api-resource) — Recurso de API geral
- [SQLResource](../resource/sql-resource) — Recurso de consulta SQL