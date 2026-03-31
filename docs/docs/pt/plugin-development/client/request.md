:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Requisição

O NocoBase oferece um `APIClient` baseado no [Axios](https://axios-http.com/) que você pode usar para fazer requisições HTTP em qualquer lugar onde seja possível obter um `Context`.

Locais comuns onde você pode obter um `Context` incluem:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` é o método mais comum para fazer requisições. Seus parâmetros e valores de retorno são idênticos aos de [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

### Uso Básico

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Você pode usar as configurações padrão de requisição do Axios diretamente:

```ts
await ctx.api.request({
  url: 'users:create',
  method: 'post',
  data: {
    name: 'Tao Tao',
  },
});
```

## ctx.api.axios

`ctx.api.axios` é uma instância de `AxiosInstance` através da qual você pode modificar as configurações padrão globais ou adicionar interceptores de requisição.

### Modificar Configuração Padrão

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Para mais configurações disponíveis, consulte [Configurações Padrão do Axios](https://axios-http.com/docs/config_defaults).

## Interceptores de Requisição e Resposta

Os interceptores permitem processar requisições antes de serem enviadas ou respostas após serem recebidas. Por exemplo, você pode adicionar cabeçalhos de requisição de forma consistente, serializar parâmetros ou exibir mensagens de erro unificadas.

### Exemplo de Interceptor de Requisição

```ts
// Usa qs para serializar os parâmetros
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Cabeçalhos de requisição personalizados
axios.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer token123`;
  config.headers['X-Hostname'] = 'localhost';
  config.headers['X-Timezone'] = '+08:00';
  config.headers['X-Locale'] = 'zh-CN';
  config.headers['X-Role'] = 'admin';
  config.headers['X-Authenticator'] = 'basic';
  config.headers['X-App'] = 'sub1';
  return config;
});
```

### Exemplo de Interceptor de Resposta

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Exibe uma notificação unificada quando a requisição falha
    ctx.notification.error({
      message: 'Erro na resposta da requisição',
    });
    return Promise.reject(error);
  },
);
```

## Cabeçalhos de Requisição Personalizados do NocoBase Server

A seguir, estão os cabeçalhos de requisição personalizados suportados pelo NocoBase Server, que podem ser usados em cenários de múltiplos aplicativos, internacionalização, múltiplos papéis ou múltiplas autenticações.

| Header | Descrição |
|--------|-----------|
| `X-App` | Especifica o aplicativo atualmente acessado em cenários de múltiplos aplicativos |
| `X-Locale` | Idioma atual (ex: `zh-CN`, `en-US`) |
| `X-Hostname` | Nome do host do cliente |
| `X-Timezone` | Fuso horário do cliente (ex: `+08:00`) |
| `X-Role` | Papel atual |
| `X-Authenticator` | Método de autenticação do usuário atual |

> 💡 **Dica**  
> Esses cabeçalhos de requisição geralmente são injetados automaticamente pelos interceptores e não precisam ser definidos manualmente. Apenas em cenários especiais (como ambientes de teste ou cenários de múltiplas instâncias) você precisará adicioná-los manualmente.

## Uso em Componentes

Em componentes React, você pode obter o objeto de contexto através de `useFlowContext()` e, em seguida, chamar `ctx.api` para fazer requisições.

```ts
import { useFlowContext } from '@nocobase/client';

const MyComponent = () => {
  const ctx = useFlowContext();

  const fetchData = async () => {
    const response = await ctx.api.request({
      url: '/api/posts',
      method: 'get',
    });
    console.log(response.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>Carregando...</div>;
};
```

### Usando com o `useRequest` do ahooks

No desenvolvimento real, você pode usar o Hook `useRequest` fornecido pelo [ahooks](https://ahooks.js.org/hooks/use-request/index) para lidar de forma mais conveniente com o ciclo de vida e o estado das requisições.

```ts
import { useFlowContext } from '@nocobase/client';
import { useRequest } from 'ahooks';

const MyComponent = () => {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro na requisição: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Atualizar</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Essa abordagem torna a lógica de requisição mais declarativa, gerenciando automaticamente os estados de carregamento, tratamento de erros e lógica de atualização, sendo muito adequada para uso em componentes.