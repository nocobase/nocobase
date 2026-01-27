:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Požadavky

NocoBase poskytuje `APIClient` založený na knihovně [Axios](https://axios-http.com/), který můžete použít k odesílání HTTP požadavků z jakéhokoli místa, kde je dostupný `Context`.

Mezi běžná místa, kde můžete získat `Context`, patří:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` je nejpoužívanější metoda pro odesílání požadavků. Její parametry a návratové hodnoty jsou zcela shodné s metodou [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Základní použití

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Můžete přímo použít standardní konfiguraci požadavků Axios:

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

`ctx.api.axios` je instance `AxiosInstance`, pomocí které můžete upravovat globální výchozí konfigurace nebo přidávat interceptory požadavků.

Úprava výchozí konfigurace

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Více dostupných konfigurací naleznete v [Axios Default Config](https://axios-http.com/docs/config_defaults).

## Interceptory požadavků a odpovědí

Pomocí interceptorů můžete zpracovávat požadavky před jejich odesláním nebo odpovědi po jejich přijetí. Například můžete jednotně přidávat hlavičky požadavků, serializovat parametry nebo zobrazovat jednotná chybová hlášení.

### Příklad interceptoru požadavků

```ts
// Použití qs pro serializaci parametrů
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Vlastní hlavičky požadavků
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

### Příklad interceptoru odpovědí

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Při chybě požadavku zobrazte jednotné oznámení
    ctx.notification.error({
      message: 'Chyba odpovědi na požadavek',
    });
    return Promise.reject(error);
  },
);
```

## Vlastní hlavičky požadavků NocoBase Serveru

Níže jsou uvedeny vlastní hlavičky požadavků podporované NocoBase Serverem, které lze použít pro scénáře s více aplikacemi, internacionalizací, více rolemi nebo více způsoby autentizace.

| Header | Popis |
|--------|------|
| `X-App` | Určuje aktuálně přístupnou aplikaci ve scénářích s více aplikacemi |
| `X-Locale` | Aktuální jazyk (např. `zh-CN`, `en-US`) |
| `X-Hostname` | Název hostitele klienta |
| `X-Timezone` | Časové pásmo klienta (např. `+08:00`) |
| `X-Role` | Aktuální role |
| `X-Authenticator` | Aktuální metoda autentizace uživatele |

> 💡 **Tip**  
> Tyto hlavičky požadavků jsou obvykle automaticky vkládány interceptory a není třeba je nastavovat ručně. Ruční přidání je nutné pouze ve speciálních scénářích (například v testovacích prostředích nebo ve scénářích s více instancemi).

## Použití v komponentách

V React komponentách můžete získat objekt kontextu pomocí `useFlowContext()` a následně volat `ctx.api` pro odesílání požadavků.

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

  return <div>Načítám...</div>;
};
```

### Použití s `useRequest` z ahooks

V praxi můžete pro pohodlnější správu životního cyklu a stavu požadavků využít Hook `useRequest` z knihovny [ahooks](https://ahooks.js.org/hooks/use-request/index).

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

  if (loading) return <div>Načítám...</div>;
  if (error) return <div>Chyba požadavku: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Obnovit</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Tento přístup umožňuje deklarativnější logiku požadavků, automaticky spravuje stavy načítání, zpracování chyb a logiku obnovení, což je velmi vhodné pro použití v komponentách.