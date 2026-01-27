:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Förfrågningar

NocoBase tillhandahåller en `APIClient` som är baserad på [Axios](https://axios-http.com/). Den kan användas för att skicka HTTP-förfrågningar från alla platser där ni har tillgång till ett `Context`.

Vanliga platser där ni kan få tillgång till `Context` är:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` är den mest använda metoden för att skicka förfrågningar. Dess parametrar och returvärden är exakt desamma som för [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Grundläggande användning

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Ni kan direkt använda standardkonfigurationer för Axios-förfrågningar:

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

`ctx.api.axios` är en instans av `AxiosInstance` genom vilken ni kan ändra globala standardkonfigurationer eller lägga till förfrågningsinterceptor.

Ändra standardkonfiguration

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

För fler tillgängliga konfigurationer, se [Axios standardkonfiguration](https://axios-http.com/docs/config_defaults).

## Förfrågnings- och svarsinterceptor

Interceptor kan bearbeta förfrågningar innan de skickas eller svar efter att de har returnerats. Ni kan till exempel enhetligt lägga till förfrågningshuvuden, serialisera parametrar eller visa enhetliga felmeddelanden.

### Exempel på förfrågningsinterceptor

```ts
// Använd qs för att serialisera params-parametrar
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Anpassade förfrågningshuvuden
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

### Exempel på svarsinterceptor

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Visa en enhetlig felnotis när förfrågan misslyckas
    ctx.notification.error({
      message: 'Fel vid förfrågningssvar',
    });
    return Promise.reject(error);
  },
);
```

## Anpassade förfrågningshuvuden för NocoBase Server

Följande är anpassade förfrågningshuvuden som stöds av NocoBase Server och som kan användas i scenarier med flera applikationer, internationalisering, flera roller eller flera autentiseringsmetoder.

| Header | Beskrivning |
|--------|-------------|
| `X-App` | Anger den aktuella applikationen vid scenarier med flera applikationer |
| `X-Locale` | Aktuellt språk (t.ex. `zh-CN`, `en-US`) |
| `X-Hostname` | Klientens värdnamn |
| `X-Timezone` | Klientens tidszon (t.ex. `+08:00`) |
| `X-Role` | Aktuell roll |
| `X-Authenticator` | Aktuell användarautentiseringsmetod |

> 💡 **Tips**  
> Dessa förfrågningshuvuden injiceras vanligtvis automatiskt av interceptor och behöver inte ställas in manuellt. Ni behöver bara lägga till dem manuellt i speciella scenarier (som testmiljöer eller miljöer med flera instanser).

## Användning i komponenter

I React-komponenter kan ni hämta kontextobjektet via `useFlowContext()` och sedan anropa `ctx.api` för att skicka förfrågningar.

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

  return <div>Laddar...</div>;
};
```

### Använda med ahooks' useRequest

I praktisk utveckling kan ni använda `useRequest`-hooken från [ahooks](https://ahooks.js.org/hooks/use-request/index) för att smidigare hantera förfrågningars livscykel och status.

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

  if (loading) return <div>Laddar...</div>;
  if (error) return <div>Förfrågan misslyckades: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Uppdatera</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Detta tillvägagångssätt gör förfrågningslogiken mer deklarativ och hanterar automatiskt laddningsstatus, felmeddelanden och uppdateringslogik, vilket gör den mycket lämplig för användning i komponenter.