:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/resource/api-resource).
:::

# APIResource

Um **recurso de API genérico** baseado em URL para fazer solicitações, adequado para qualquer interface HTTP. Ele herda da classe base `FlowResource` e a estende com configurações de solicitação e o método `refresh()`. Diferente do [MultiRecordResource](./multi-record-resource.md) e do [SingleRecordResource](./single-record-resource.md), o `APIResource` não depende de um nome de recurso; ele faz a solicitação diretamente pela URL, sendo ideal para interfaces personalizadas, APIs de terceiros e outros cenários.

**Formas de criação**: `ctx.makeResource('APIResource')` ou `ctx.initResource('APIResource')`. Você deve configurar a URL com `setURL()` antes de usar. No contexto do RunJS, o `ctx.api` (APIClient) é injetado automaticamente, portanto, não é necessário chamar `setAPIClient` manualmente.

---

## Cenários de Uso

| Cenário | Descrição |
|------|------|
| **Interface Personalizada** | Chamar APIs de recursos não padronizados (ex: `/api/custom/stats`, `/api/reports/summary`). |
| **API de Terceiros** | Solicitar serviços externos via URL completa (requer suporte a CORS pelo destino). |
| **Consulta Única** | Busca temporária de dados que é descartável e não precisa ser vinculada ao `ctx.resource`. |
| **Escolha entre APIResource e ctx.request** | Use `APIResource` quando precisar de dados reativos, eventos ou estados de erro; use `ctx.request()` para solicitações simples e pontuais. |

---

## Capacidades da Classe Base (FlowResource)

Todos os Resources possuem:

| Método | Descrição |
|------|------|
| `getData()` | Obtém os dados atuais. |
| `setData(value)` | Define os dados (apenas localmente). |
| `hasData()` | Verifica se existem dados. |
| `getMeta(key?)` / `setMeta(meta)` | Lê/escreve metadados. |
| `getError()` / `setError(err)` / `clearError()` | Gerenciamento do estado de erro. |
| `on(event, callback)` / `once` / `off` / `emit` | Inscrição e disparo de eventos. |

---

## Configuração da Solicitação

| Método | Descrição |
|------|------|
| `setAPIClient(api)` | Define a instância do APIClient (geralmente injetada automaticamente no RunJS). |
| `getURL()` / `setURL(url)` | URL da solicitação. |
| `loading` | Lê/escreve o estado de carregamento (get/set). |
| `clearRequestParameters()` | Limpa os parâmetros da solicitação. |
| `setRequestParameters(params)` | Mescla e define os parâmetros da solicitação. |
| `setRequestMethod(method)` | Define o método da solicitação (ex: `'get'`, `'post'`, o padrão é `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Cabeçalhos da solicitação. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Adiciona, remove ou consulta um único parâmetro. |
| `setRequestBody(data)` | Corpo da solicitação (usado em POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Opções gerais de solicitação. |

---

## Formato da URL

- **Estilo de Recurso**: Suporta a abreviação de recursos do NocoBase, como `users:list` ou `posts:get`, que será concatenada com a `baseURL`.
- **Caminho Relativo**: Ex: `/api/custom/endpoint`, concatenado com a `baseURL` da aplicação.
- **URL Completa**: Use endereços completos para solicitações de origem cruzada (cross-origin); o destino deve ter o CORS configurado.

---

## Busca de Dados

| Método | Descrição |
|------|------|
| `refresh()` | Inicia uma solicitação baseada na URL, método, parâmetros, cabeçalhos e dados atuais. Ele grava os dados da resposta em `setData(data)` e dispara o evento `'refresh'`. Em caso de falha, define o erro com `setError(err)` e lança um `ResourceError`, sem disparar o evento `refresh`. Requer que o `api` e a URL estejam configurados. |

---

## Exemplos

### Solicitação GET Básica

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL em Estilo de Recurso

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Solicitação POST (com Corpo da Solicitação)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'teste', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Ouvindo o Evento refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Estatísticas: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Tratamento de Erros

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Falha na solicitação');
}
```

### Cabeçalhos de Solicitação Personalizados

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'valor');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Observações

- **Dependência de ctx.api**: No RunJS, o `ctx.api` é injetado pelo ambiente; o `setAPIClient` manual geralmente é desnecessário. Se usado em um cenário sem contexto, você mesmo deve configurá-lo.
- **Refresh é uma Solicitação**: O método `refresh()` inicia uma solicitação baseada na configuração atual; o método, parâmetros, dados, etc., devem ser configurados antes da chamada.
- **Erros não Atualizam os Dados**: Em caso de falha, o `getData()` mantém seu valor anterior; as informações de erro podem ser obtidas via `getError()`.
- **Comparação com ctx.request**: Use `ctx.request()` para solicitações simples e únicas; use `APIResource` quando for necessário gerenciamento de dados reativos, eventos e estado de erro.

---

## Relacionados

- [ctx.resource](../context/resource.md) - A instância de recurso no contexto atual
- [ctx.initResource()](../context/init-resource.md) - Inicializa e vincula ao `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Cria uma nova instância de recurso sem vincular
- [ctx.request()](../context/request.md) - Solicitação HTTP geral, adequada para chamadas simples e únicas
- [MultiRecordResource](./multi-record-resource.md) - Voltado para coleções/listas, suporta CRUD e paginação
- [SingleRecordResource](./single-record-resource.md) - Voltado para registros únicos