# Запросы

NocoBase предоставляет `APIClient` на базе [Axios](https://axios-http.com/), который можно использовать для выполнения HTTP-запросов из любого места, где доступен `Context`.

Типичные места, где можно получить `Context`:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` — наиболее часто используемый метод для выполнения запросов. Его параметры и возвращаемые значения совпадают с [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Базовое использование

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Можно напрямую использовать стандартные конфигурации запросов Axios:

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

`ctx.api.axios` — это экземпляр `AxiosInstance`, через который можно изменять глобальные конфигурации по умолчанию и добавлять перехватчики запросов.

Изменение конфигурации по умолчанию

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Полный список доступных настроек см. в [Конфигурация по умолчанию Axios](https://axios-http.com/docs/config_defaults).

## Перехватчики запросов и ответов

Перехватчики позволяют обрабатывать запросы до отправки и ответы после получения. Например: единообразно добавлять заголовки, сериализовать параметры или показывать унифицированные сообщения об ошибках.

### Пример перехватчика запроса

```ts
// Используем qs для сериализации params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Пользовательские заголовки запроса
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

### Пример перехватчика ответа

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Показываем единое уведомление при ошибке запроса
    ctx.notification.error({
      message: 'Request response error',
    });
    return Promise.reject(error);
  },
);
```

## Пользовательские заголовки запроса на сервере NocoBase

Ниже перечислены пользовательские заголовки запроса, поддерживаемые сервером NocoBase. Они используются в сценариях с несколькими приложениями, интернационализацией, несколькими ролями и несколькими способами аутентификации.

| Заголовок            | Описание |
| -------------------- | -------- |
| `X-App`           | Указывает текущее приложение в сценариях с несколькими приложениями |
| `X-Locale`         | Текущий язык (например, `zh-CN`, `en-US`) |
| `X-Hostname`       | Имя хоста клиента |
| `X-Timezone`       | Часовой пояс клиента (например, `+08:00`) |
| `X-Role`           | Текущая роль |
| `X-Authenticator`  | Текущий способ аутентификации пользователя |

> 💡 **Подсказка**  
> Обычно эти заголовки автоматически добавляются перехватчиками и не требуют ручной установки. Вручную их добавляют только в специальных сценариях (например, в тестовых окружениях или конфигурациях с несколькими экземплярами).

## Использование в компонентах

В React-компонентах можно получить объект контекста через `useFlowContext()`, а затем вызывать `ctx.api` для выполнения запросов.

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

  return <div>Loading...</div>;
};
```

### Использование вместе с `useRequest` из ahooks

В реальной разработке можно использовать хук `useRequest` из [ahooks](https://ahooks.js.org/hooks/use-request/index), чтобы удобнее управлять жизненным циклом запроса и состоянием.

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Request error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Этот подход делает логику запросов более декларативной и автоматически управляет состояниями загрузки, обработкой ошибок и обновлением данных, что отлично подходит для использования в компонентах.