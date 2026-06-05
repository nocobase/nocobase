:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Solicitudes

NocoBase le ofrece un `APIClient` basado en [Axios](https://axios-http.com/), que puede utilizar para realizar solicitudes HTTP desde cualquier lugar donde pueda acceder a un `Context`.

Los lugares comunes donde puede obtener un `Context` incluyen:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()` es el método más utilizado para realizar solicitudes. Sus parámetros y valores de retorno son idénticos a los de [axios.request()](https://axios-http.com/docs/req_config).

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

Uso básico

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

Puede utilizar directamente las configuraciones de solicitud estándar de Axios:

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

`ctx.api.axios` es una instancia de `AxiosInstance` a través de la cual puede modificar las configuraciones predeterminadas globales o añadir interceptores de solicitud.

Modificar la configuración predeterminada

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

Para más configuraciones disponibles, consulte la [Configuración predeterminada de Axios](https://axios-http.com/docs/config_defaults).

## Interceptores de solicitud y respuesta

Los interceptores le permiten procesar las solicitudes antes de que se envíen o las respuestas después de que se reciban. Por ejemplo, puede añadir encabezados de solicitud de forma consistente, serializar parámetros o mostrar mensajes de error unificados.

### Ejemplo de interceptor de solicitud

```ts
// Usar qs para serializar los parámetros params
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// Encabezados de solicitud personalizados
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

### Ejemplo de interceptor de respuesta

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Mostrar una notificación unificada cuando la solicitud falla
    ctx.notification.error({
      message: 'Error en la respuesta de la solicitud',
    });
    return Promise.reject(error);
  },
);
```

## Encabezados de solicitud personalizados del servidor NocoBase

A continuación, se muestran los encabezados de solicitud personalizados compatibles con el servidor NocoBase, que pueden utilizarse para escenarios de múltiples aplicaciones, internacionalización, múltiples roles o múltiples autenticaciones.

| Header | Descripción |
|--------|-------------|
| `X-App` | Especifica la aplicación actual a la que se accede en escenarios de múltiples aplicaciones |
| `X-Locale` | Idioma actual (ej.: `zh-CN`, `en-US`) |
| `X-Hostname` | Nombre de host del cliente |
| `X-Timezone` | Zona horaria del cliente (ej.: `+08:00`) |
| `X-Role` | Rol actual |
| `X-Authenticator` | Método de autenticación del usuario actual |

> 💡 **Consejo**  
> Estos encabezados de solicitud suelen ser inyectados automáticamente por los interceptores y no necesitan ser configurados manualmente. Solo en escenarios especiales (como entornos de prueba o escenarios de múltiples instancias) es necesario añadirlos manualmente.

## Uso en componentes

En los componentes de React, puede obtener el objeto de contexto a través de `useFlowContext()` y luego llamar a `ctx.api` para realizar solicitudes.

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

  return <div>Cargando...</div>;
};
```

### Uso con `useRequest` de ahooks

En el desarrollo real, puede utilizar el Hook `useRequest` proporcionado por [ahooks](https://ahooks.js.org/hooks/use-request/index) para manejar de forma más conveniente el ciclo de vida y el estado de las solicitudes.

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

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error en la solicitud: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Actualizar</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

Este enfoque hace que la lógica de las solicitudes sea más declarativa, gestionando automáticamente los estados de carga, el manejo de errores y la lógica de actualización, lo cual es muy adecuado para su uso en componentes.