:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/request).
:::

# ctx.request()

Inicie uma requisição HTTP autenticada dentro do RunJS. A requisição carrega automaticamente o `baseURL`, `Token`, `locale`, `role`, etc., da aplicação atual, e segue a lógica de interceptação de requisições e tratamento de erros da aplicação.

## Casos de Uso

Aplicável a qualquer cenário no RunJS onde uma requisição HTTP remota precise ser iniciada, como JSBlock, JSField, JSItem, JSColumn, fluxo de trabalho, vinculação (linkage), JSAction, etc.

## Definição de Tipo

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` estende o `AxiosRequestConfig` do Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Se deve pular avisos de erro globais quando a requisição falhar
  skipAuth?: boolean;                                 // Se deve pular o redirecionamento de autenticação (ex: não redirecionar para a página de login em caso de 401)
};
```

## Parâmetros Comuns

| Parâmetro | Tipo | Descrição |
|------|------|------|
| `url` | string | URL da requisição. Suporta estilo de recurso (ex: `users:list`, `posts:create`) ou uma URL completa |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Método HTTP, o padrão é `'get'` |
| `params` | object | Parâmetros de consulta (query parameters), serializados na URL |
| `data` | any | Corpo da requisição, usado para post/put/patch |
| `headers` | object | Cabeçalhos de requisição personalizados |
| `skipNotify` | boolean \| (error) => boolean | Se for true ou a função retornar true, os avisos de erro globais não aparecerão em caso de falha |
| `skipAuth` | boolean | Se for true, erros 401 etc. não dispararão o redirecionamento de autenticação (ex: redirecionar para a página de login) |

## URL em Estilo de Recurso

A API de Recursos do NocoBase suporta um formato abreviado `recurso:ação`:

| Formato | Descrição | Exemplo |
|------|------|------|
| `coleção:ação` | CRUD de coleção única | `users:list`, `users:get`, `users:create`, `posts:update` |
| `coleção.relação:ação` | Recursos associados (requer passar a chave primária via `resourceOf` ou URL) | `posts.comments:list` |

Caminhos relativos serão concatenados com o `baseURL` da aplicação (geralmente `/api`); requisições de origem cruzada (cross-origin) devem usar uma URL completa, e o serviço de destino deve estar configurado com CORS.

## Estrutura da Resposta

O valor de retorno é um objeto de resposta do Axios. Campos comuns incluem:

- `response.data`: Corpo da resposta
- Interfaces de lista geralmente retornam `data.data` (array de registros) + `data.meta` (paginação, etc.)
- Interfaces de registro único/criação/atualização geralmente retornam o registro em `data.data`

## Exemplos

### Consulta de Lista

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Informações de paginação e outras
```

### Enviar Dados

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'João Silva', email: 'joaosilva@example.com' },
});

const newRecord = res?.data?.data;
```

### Com Filtragem e Ordenação

```javascript
const res = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 20,
    sort: ['-createdAt'],
    filter: { status: 'active' },
  },
});
```

### Pular Notificação de Erro

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // Não exibe mensagem global em caso de falha
});

// Ou decidir se deve pular com base no tipo de erro
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Requisição de Origem Cruzada (Cross-Origin)

Ao usar uma URL completa para solicitar outros domínios, o serviço de destino deve estar configurado com CORS para permitir a origem da aplicação atual. Se a interface de destino exigir seu próprio token, ele pode ser passado via headers:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_do_serviço_de_destino>',
  },
});
```

### Exibindo com ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Lista de Usuários') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Observações

- **Tratamento de Erros**: A falha na requisição lançará uma exceção e um aviso de erro global aparecerá por padrão. Use `skipNotify: true` para capturar e tratar o erro você mesmo.
- **Autenticação**: Requisições de mesma origem carregarão automaticamente o Token, locale e role do usuário atual; requisições de origem cruzada exigem que o destino suporte CORS e que você passe o token nos cabeçalhos conforme necessário.
- **Permissões de Recurso**: As requisições estão sujeitas às restrições de ACL e só podem acessar recursos para os quais o usuário atual tem permissão.

## Relacionados

- [ctx.message](./message.md) - Exibir avisos leves após a conclusão da requisição
- [ctx.notification](./notification.md) - Exibir notificações após a conclusão da requisição
- [ctx.render](./render.md) - Renderizar os resultados da requisição na interface
- [ctx.makeResource](./make-resource.md) - Construir um objeto de recurso para carregamento de dados encadeado (alternativa ao uso direto de `ctx.request`)