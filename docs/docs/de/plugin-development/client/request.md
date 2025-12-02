:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Anfragen

NocoBase stellt einen `APIClient` zur Verfügung, der auf [Axios](https://axios-http.com/) basiert und es Ihnen ermöglicht, HTTP-Anfragen von überall dort zu senden, wo Sie einen `Context` erhalten können.

Häufige Orte, an denen Sie einen `Context` erhalten können, sind:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` ist die am häufigsten verwendete Methode, um Anfragen zu senden. Ihre Parameter und Rückgabewerte sind identisch mit denen von [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Grundlegende Verwendung

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Sie können standardmäßige Axios-Anfragenkonfigurationen direkt verwenden:

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

`ctx.api.axios` ist eine `AxiosInstance`, über die Sie globale Standardkonfigurationen ändern oder Anfragen-Interceptors hinzufügen können.

Standardkonfiguration ändern

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Weitere verfügbare Konfigurationen finden Sie unter [Axios-Standardkonfiguration](https://axios-http.com/docs/config_defaults).

## Anfragen- und Antwort-Interceptors

Interceptors können Anfragen verarbeiten, bevor sie gesendet werden, oder Antworten, nachdem sie zurückgegeben wurden. Zum Beispiel können Sie damit Anfragen-Header einheitlich hinzufügen, Parameter serialisieren oder eine einheitliche Fehleranzeige bereitstellen.

### Beispiel für einen Anfragen-Interceptor

```ts
// params-Parameter mit qs serialisieren
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Benutzerdefinierte Anfragen-Header
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

### Beispiel für einen Antwort-Interceptor

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Bei Anfragen-Fehlern eine einheitliche Benachrichtigung anzeigen
    ctx.notification.error({
      message: 'Anfragen-Antwortfehler',
    });
    return Promise.reject(error);
  },
);
```

## Benutzerdefinierte Anfragen-Header des NocoBase Servers

Im Folgenden sind die vom NocoBase Server unterstützten benutzerdefinierten Anfragen-Header aufgeführt, die für Multi-App-, Internationalisierungs-, Multi-Rollen- oder Multi-Authentifizierungs-Szenarien verwendet werden können.

| Header | Beschreibung |
|--------|--------------|
| `X-App` | Gibt die aktuell aufgerufene App in Multi-App-Szenarien an |
| `X-Locale` | Aktuelle Sprache (z. B. `zh-CN`, `en-US`) |
| `X-Hostname` | Hostname des Clients |
| `X-Timezone` | Zeitzone des Clients (z. B. `+08:00`) |
| `X-Role` | Aktuelle Rolle |
| `X-Authenticator` | Aktuelle Benutzerauthentifizierungsmethode |

> 💡 **Tipp**  
> Diese Anfragen-Header werden normalerweise automatisch von Interceptors injiziert und müssen nicht manuell gesetzt werden. Nur in speziellen Szenarien (wie Testumgebungen oder Multi-Instanz-Szenarien) müssen Sie sie manuell hinzufügen.

## Verwendung in Komponenten

In React-Komponenten können Sie das Context-Objekt über `useFlowContext()` abrufen und dann `ctx.api` aufrufen, um Anfragen zu senden.

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

  return <div>Wird geladen...</div>;
};
```

### Verwendung mit `useRequest` von ahooks

In der Praxis können Sie den von [ahooks](https://ahooks.js.org/hooks/use-request/index) bereitgestellten `useRequest`-Hook verwenden, um den Lebenszyklus und den Status von Anfragen bequemer zu verwalten.

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

  if (loading) return <div>Wird geladen...</div>;
  if (error) return <div>Anfragen-Fehler: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Aktualisieren</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Dieser Ansatz macht die Anfragen-Logik deklarativer und verwaltet Ladezustände, Fehlerbehandlung und Aktualisierungslogik automatisch, was sich sehr gut für die Verwendung in Komponenten eignet.