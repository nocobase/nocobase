:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Richiesta

NocoBase mette a disposizione un `APIClient`, basato su [Axios](https://axios-http.com/), che Le permette di effettuare richieste HTTP da qualsiasi punto in cui sia possibile accedere a un `Context`.

Ecco alcuni dei luoghi più comuni in cui può ottenere il `Context`:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` è il metodo più utilizzato per effettuare richieste. I suoi parametri e valori di ritorno sono identici a quelli di [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Utilizzo di base

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Può utilizzare direttamente le configurazioni di richiesta Axios standard:

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

`ctx.api.axios` è un'istanza di `AxiosInstance` tramite la quale può modificare le configurazioni predefinite globali o aggiungere degli intercettori di richiesta.

Modifica della configurazione predefinita

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Per maggiori configurazioni disponibili, consulti la [Configurazione predefinita di Axios](https://axios-http.com/docs/config_defaults).

## Intercettori di richiesta e risposta

Gli intercettori Le permettono di elaborare le richieste prima che vengano inviate o le risposte dopo che sono state ricevute. Ad esempio, può aggiungere intestazioni di richiesta in modo uniforme, serializzare i parametri o visualizzare messaggi di errore standardizzati.

### Esempio di intercettore di richiesta

```ts
// Utilizza qs per serializzare i parametri
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Intestazioni di richiesta personalizzate
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

### Esempio di intercettore di risposta

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // In caso di errore della richiesta, mostra una notifica unificata
    ctx.notification.error({
      message: 'Errore di risposta della richiesta',
    });
    return Promise.reject(error);
  },
);
```

## Intestazioni di richiesta personalizzate di NocoBase Server

Di seguito sono elencate le intestazioni di richiesta personalizzate supportate da NocoBase Server, utilizzabili in scenari multi-applicazione, di internazionalizzazione, multi-ruolo o multi-autenticazione.

| Header | Descrizione |
|--------|-------------|
| `X-App` | Specifica l'applicazione attualmente acceduta in scenari multi-applicazione |
| `X-Locale` | Lingua attuale (es. `zh-CN`, `en-US`) |
| `X-Hostname` | Nome host del client |
| `X-Timezone` | Fuso orario del client (es. `+08:00`) |
| `X-Role` | Ruolo attuale |
| `X-Authenticator` | Metodo di autenticazione dell'utente attuale |

> 💡 **Suggerimento**  
> Queste intestazioni di richiesta vengono solitamente iniettate automaticamente dagli intercettori e non richiedono una configurazione manuale. È necessario aggiungerle manualmente solo in scenari particolari (come ambienti di test o scenari multi-istanza).

## Utilizzo nei componenti

Nei componenti React, può ottenere l'oggetto `context` tramite `useFlowContext()` e quindi chiamare `ctx.api` per effettuare le richieste.

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

  return <div>Caricamento in corso...</div>;
};
```

### Utilizzo con `useRequest` di ahooks

Nello sviluppo reale, può utilizzare l'Hook `useRequest` fornito da [ahooks](https://ahooks.js.org/hooks/use-request/index) per gestire in modo più pratico il ciclo di vita e lo stato delle richieste.

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

  if (loading) return <div>Caricamento in corso...</div>;
  if (error) return <div>Errore di richiesta: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Aggiorna</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Questo approccio rende la logica delle richieste più dichiarativa, gestendo automaticamente gli stati di caricamento, la gestione degli errori e la logica di aggiornamento, rendendolo molto adatto all'uso nei componenti.