:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Żądania

NocoBase udostępnia `APIClient` oparty na bibliotece [Axios](https://axios-http.com/), który umożliwia wysyłanie żądań HTTP z każdego miejsca, gdzie dostępny jest obiekt `Context`.

Obiekt `Context` jest często dostępny w następujących miejscach:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` to najczęściej używana metoda do wysyłania żądań. Jej parametry i wartości zwracane są identyczne z tymi, które znajdą Państwo w [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Podstawowe użycie

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Mogą Państwo bezpośrednio używać standardowych konfiguracji żądań Axios:

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

`ctx.api.axios` to instancja `AxiosInstance`, za pomocą której mogą Państwo modyfikować globalne konfiguracje domyślne lub dodawać interceptory żądań.

Modyfikacja konfiguracji domyślnej

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Więcej dostępnych konfiguracji znajdą Państwo w [Axios Default Config](https://axios-http.com/docs/config_defaults).

## Interceptory żądań i odpowiedzi

Interceptory pozwalają przetwarzać żądania przed ich wysłaniem lub odpowiedzi po ich otrzymaniu. Na przykład, mogą Państwo w ten sposób jednolicie dodawać nagłówki żądań, serializować parametry lub wyświetlać ujednolicone komunikaty o błędach.

### Przykład interceptora żądań

```ts
// Użycie qs do serializacji parametrów params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Niestandardowe nagłówki żądań
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

### Przykład interceptora odpowiedzi

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // W przypadku błędu żądania, wyświetl ujednolicony komunikat
    ctx.notification.error({
      message: 'Błąd odpowiedzi na żądanie',
    });
    return Promise.reject(error);
  },
);
```

## Niestandardowe nagłówki żądań serwera NocoBase

Poniżej przedstawiono niestandardowe nagłówki żądań obsługiwane przez serwer NocoBase, które mogą być używane w scenariuszach obejmujących wiele aplikacji, internacjonalizację, wiele ról lub różne metody uwierzytelniania.

| Nagłówek | Opis |
|--------|------|
| `X-App` | Określa aktualnie używaną aplikację w scenariuszach wieloaplikacyjnych |
| `X-Locale` | Bieżący język (np. `zh-CN`, `en-US`) |
| `X-Hostname` | Nazwa hosta klienta |
| `X-Timezone` | Strefa czasowa klienta (np. `+08:00`) |
| `X-Role` | Bieżąca rola |
| `X-Authenticator` | Bieżąca metoda uwierzytelniania użytkownika |

> 💡 **Wskazówka**  
> Te nagłówki żądań są zazwyczaj automatycznie wstrzykiwane przez interceptory i nie wymagają ręcznego ustawiania. Ręczne dodawanie jest konieczne tylko w specjalnych scenariuszach (takich jak środowiska testowe lub scenariusze z wieloma instancjami).

## Użycie w komponentach

W komponentach React mogą Państwo uzyskać obiekt kontekstu za pomocą `useFlowContext()` i następnie wywołać `ctx.api` w celu wysłania żądania.

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

  return <div>Ładowanie...</div>;
};
```

### Użycie z `useRequest` z biblioteki ahooks

W praktyce deweloperskiej mogą Państwo skorzystać z Hooka `useRequest` dostarczanego przez bibliotekę [ahooks](https://ahooks.js.org/hooks/use-request/index), aby wygodniej zarządzać cyklem życia i stanem żądań.

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

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd żądania: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Odśwież</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Takie podejście sprawia, że logika żądań staje się bardziej deklaratywna, automatycznie zarządzając stanami ładowania, obsługą błędów i logiką odświeżania, co jest bardzo wygodne do wykorzystania w komponentach.