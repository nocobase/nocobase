:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Verzoek

NocoBase biedt een `APIClient` aan die gebaseerd is op [Axios](https://axios-http.com/). U kunt deze gebruiken om HTTP-verzoeken te doen vanuit elke plek waar u toegang heeft tot een `Context`.

Veelvoorkomende locaties waar u een `Context` kunt verkrijgen, zijn:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` is de meest gebruikte methode om verzoeken te initiëren. De parameters en retourwaarden zijn volledig identiek aan die van [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Basisgebruik

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

U kunt direct de standaard Axios-verzoekconfiguraties gebruiken:

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

`ctx.api.axios` is een `AxiosInstance`-instantie waarmee u globale standaardconfiguraties kunt aanpassen of verzoek-interceptors kunt toevoegen.

Standaardconfiguratie aanpassen

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Voor meer beschikbare configuraties, zie de [standaardconfiguratie van Axios](https://axios-http.com/docs/config_defaults).

## Verzoek- en respons-interceptors

Interceptors maken het mogelijk om verzoeken te verwerken voordat ze worden verzonden, of reacties nadat ze zijn ontvangen. Denk hierbij aan het uniform toevoegen van verzoekheaders, het serialiseren van parameters, of het weergeven van consistente foutmeldingen.

### Voorbeeld van een verzoek-interceptor

```ts
// Gebruik qs om params-parameters te serialiseren
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Aangepaste verzoekheaders
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

### Voorbeeld van een respons-interceptor

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Toon een uniforme melding wanneer het verzoek mislukt
    ctx.notification.error({
      message: 'Fout bij verzoekrespons',
    });
    return Promise.reject(error);
  },
);
```

## Aangepaste verzoekheaders voor NocoBase Server

Hieronder vindt u de aangepaste verzoekheaders die NocoBase Server ondersteunt. Deze zijn handig voor scenario's met meerdere applicaties, internationalisering, meerdere rollen of meerdere authenticatiemethoden.

| Header | Beschrijving |
|--------|--------------|
| `X-App` | Specificeert de huidige bezochte applicatie in scenario's met meerdere applicaties |
| `X-Locale` | Huidige taal (bijv. `zh-CN`, `en-US`) |
| `X-Hostname` | Hostnaam van de client |
| `X-Timezone` | Tijdzone van de client (bijv. `+08:00`) |
| `X-Role` | Huidige rol |
| `X-Authenticator` | Huidige authenticatiemethode van de gebruiker |

> 💡 **Tip**  
> Deze verzoekheaders worden meestal automatisch geïnjecteerd door interceptors en hoeven niet handmatig te worden ingesteld. Alleen in speciale scenario's (zoals testomgevingen of multi-instantie scenario's) moet u ze handmatig toevoegen.

## Gebruik in componenten

In React-componenten kunt u het contextobject verkrijgen via `useFlowContext()` en vervolgens `ctx.api` aanroepen om verzoeken te initiëren.

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

  return <div>Laden...</div>;
};
```

### Gebruik in combinatie met `useRequest` van ahooks

In de praktijk kunt u de `useRequest`-hook van [ahooks](https://ahooks.js.org/hooks/use-request/index) gebruiken om de levenscyclus en status van verzoeken gemakkelijker te beheren.

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

  if (loading) return <div>Laden...</div>;
  if (error) return <div>Fout bij verzoek: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Vernieuwen</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Deze aanpak maakt de verzoeklogica declaratiever, beheert automatisch laadstatussen, foutmeldingen en vernieuwingslogica, en is daardoor zeer geschikt voor gebruik in componenten.