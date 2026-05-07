:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Resource voltado para um **único registro**: os dados são um único objeto, suportando busca por chave primária, criação/atualização (save) e exclusão. É adequado para cenários de "registro único", como detalhes e formulários. Diferente do [MultiRecordResource](./multi-record-resource.md), o método `getData()` do `SingleRecordResource` retorna um único objeto. Você especifica a chave primária via `setFilterByTk(id)`, e o `save()` chamará automaticamente `create` ou `update` com base no estado de `isNewRecord`.

**Herança**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Formas de criação**: `ctx.makeResource('SingleRecordResource')` ou `ctx.initResource('SingleRecordResource')`. Antes de usar, é necessário chamar `setResourceName('nome_da_coleção')`; ao realizar operações por chave primária, chame `setFilterByTk(id)`. No RunJS, o `ctx.api` é injetado pelo ambiente de execução.

---

## Cenários de Uso

| Cenário | Descrição |
|------|------|
| **Bloco de detalhes** | O bloco de detalhes usa o `SingleRecordResource` por padrão para carregar um único registro por sua chave primária. |
| **Bloco de formulário** | Formulários de criação/edição usam o `SingleRecordResource`, onde o `save()` distingue automaticamente entre `create` e `update`. |
| **Detalhes no JSBlock** | Carregue um único usuário, pedido, etc., em um JSBlock e personalize a exibição. |
| **Recursos de associação** | Carregue registros únicos associados usando o formato `users.profile`, exigindo o uso de `setSourceId(ID_do_registro_pai)`. |

---

## Formato dos Dados

- `getData()` retorna um **único objeto de registro**, que corresponde ao campo `data` da resposta da API `get`.
- `getMeta()` retorna metadados (se disponíveis).

---

## Nome do Recurso e Chave Primária

| Método | Descrição |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nome do recurso, ex: `'users'`, `'users.profile'` (recurso de associação). |
| `setSourceId(id)` / `getSourceId()` | ID do registro pai para recursos de associação (ex: `users.profile` requer a chave primária de `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identificador da fonte de dados (usado em ambientes com múltiplas fontes de dados). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Chave primária do registro atual; uma vez definida, `isNewRecord` torna-se `false`. |

---

## Estado

| Propriedade/Método | Descrição |
|----------|------|
| `isNewRecord` | Se está no estado de "novo registro" (true se o `filterByTk` não estiver definido ou se o registro acabou de ser criado). |

---

## Parâmetros da Requisição (Filtro / Campos)

| Método | Descrição |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtro (disponível quando não estiver no estado de novo registro). |
| `setFields(fields)` / `getFields()` | Campos da requisição. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Carregamento de associações (appends). |

---

## CRUD

| Método | Descrição |
|------|------|
| `refresh()` | Solicita um `get` com base no `filterByTk` atual e atualiza o `getData()`; não faz a requisição no estado de novo registro. |
| `save(data, options?)` | Chama `create` ao criar um novo, caso contrário, chama `update`; o opcional `{ refresh: false }` evita a atualização automática. |
| `destroy(options?)` | Exclui o registro com base no `filterByTk` atual e limpa os dados locais. |
| `runAction(actionName, options)` | Chama qualquer ação (action) do recurso. |

---

## Configurações e Eventos

| Método | Descrição |
|------|------|
| `setSaveActionOptions(options)` | Configuração da requisição para a ação `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Disparado após a conclusão da atualização ou após salvar. |

---

## Exemplos

### Busca básica e atualização

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Atualização
await ctx.resource.save({ name: 'João Silva' });
```

### Criar novo registro

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Maria Souza', email: 'maria@example.com' });
```

### Excluir registro

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Após o destroy, o getData() retorna null
```

### Carregamento de associações e campos

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Recursos de associação (ex: users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Chave primária do registro pai
res.setFilterByTk(profileId);    // se profile for um relacionamento hasOne, o filterByTk pode ser omitido
await res.refresh();
const profile = res.getData();
```

### save sem atualização automática

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// o getData() mantém o valor antigo, pois a atualização (refresh) não é disparada após salvar
```

### Ouvir eventos refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Usuário: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Salvo com sucesso');
});
await ctx.resource?.refresh?.();
```

---

## Observações

- **setResourceName é obrigatório**: Você deve chamar `setResourceName('nome_da_coleção')` antes de usar, caso contrário, a URL da requisição não poderá ser construída.
- **filterByTk e isNewRecord**: Se o `setFilterByTk` não for chamado, `isNewRecord` será `true` e o `refresh()` não iniciará uma requisição; o `save()` executará uma ação `create`.
- **Recursos de associação**: Quando o nome do recurso estiver no formato `pai.filho` (ex: `users.profile`), você deve chamar `setSourceId(chave_primária_do_pai)` primeiro.
- **getData retorna um objeto**: O `data` retornado pelas APIs de registro único é um objeto de registro; o `getData()` retorna esse objeto diretamente. Ele se torna `null` após o `destroy()`.

---

## Relacionados

- [ctx.resource](../context/resource.md) - A instância de resource no contexto atual
- [ctx.initResource()](../context/init-resource.md) - Inicializa e vincula ao `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Cria uma nova instância de resource sem vincular
- [APIResource](./api-resource.md) - Recurso de API geral solicitado por URL
- [MultiRecordResource](./multi-record-resource.md) - Voltado para coleções/listas, suporta CRUD e paginação