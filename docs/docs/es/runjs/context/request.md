:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/request).
:::

# ctx.request()

Inicie una solicitud HTTP con autenticación en RunJS. La solicitud incluirá automáticamente el `baseURL`, `Token`, `locale`, `role`, etc., de la aplicación actual, y seguirá la lógica de interceptación de solicitudes y manejo de errores de la aplicación.

## Escenarios de uso

Aplicable a cualquier escenario en RunJS donde sea necesario iniciar una solicitud HTTP remota, como JSBlock, JSField, JSItem, JSColumn, flujo de trabajo, vinculación (linkage), JSAction, etc.

## Definición de tipos

```typescript
request(options: RequestOptions): Promise<AxiosResponse<any>>;
```

`RequestOptions` extiende `AxiosRequestConfig` de Axios:

```typescript
type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);  // Indica si se deben omitir los avisos de error globales cuando la solicitud falla
  skipAuth?: boolean;                                 // Indica si se debe omitir la redirección de autenticación (por ejemplo, no redirigir a la página de inicio de sesión en un error 401)
};
```

## Parámetros comunes

| Parámetro | Tipo | Descripción |
|------|------|------|
| `url` | string | URL de la solicitud. Admite el estilo de recurso (por ejemplo, `users:list`, `posts:create`) o una URL completa |
| `method` | 'get' \| 'post' \| 'put' \| 'patch' \| 'delete' | Método HTTP, por defecto es `'get'` |
| `params` | object | Parámetros de consulta, serializados en la URL |
| `data` | any | Cuerpo de la solicitud, utilizado para post/put/patch |
| `headers` | object | Encabezados de solicitud personalizados |
| `skipNotify` | boolean \| (error) => boolean | Si es true o la función devuelve true, no aparecerán avisos de error globales al fallar |
| `skipAuth` | boolean | Si es true, los errores 401, etc., no activarán la redirección de autenticación (por ejemplo, redirigir a la página de inicio de sesión) |

## URL de estilo de recurso

La API de recursos de NocoBase admite un formato abreviado `recurso:acción`:

| Formato | Descripción | Ejemplo |
|------|------|------|
| `colección:acción` | CRUD de una sola colección | `users:list`, `users:get`, `users:create`, `posts:update` |
| `colección.relación:acción` | Recursos asociados (requiere pasar la clave primaria a través de `resourceOf` o la URL) | `posts.comments:list` |

Las rutas relativas se concatenarán con el `baseURL` de la aplicación (normalmente `/api`); las solicitudes de origen cruzado (cross-origin) deben usar una URL completa, y el servicio de destino debe estar configurado con CORS.

## Estructura de la respuesta

El valor de retorno es un objeto de respuesta de Axios. Los campos comunes incluyen:

- `response.data`: Cuerpo de la respuesta
- Las interfaces de lista suelen devolver `data.data` (matriz de registros) + `data.meta` (paginación, etc.)
- Las interfaces de registro único/creación/actualización suelen devolver el registro en `data.data`

## Ejemplos

### Consulta de lista

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 10, page: 1 },
});

const rows = Array.isArray(data?.data) ? data.data : [];
const meta = data?.meta; // Información de paginación y otros datos
```

### Enviar datos

```javascript
const res = await ctx.request({
  url: 'users:create',
  method: 'post',
  data: { nickname: 'Juan Pérez', email: 'juanperez@example.com' },
});

const newRecord = res?.data?.data;
```

### Con filtrado y ordenamiento

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

### Omitir notificación de error

```javascript
const res = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: true,  // No mostrar el mensaje global al fallar
});

// O decidir si omitir según el tipo de error
const res2 = await ctx.request({
  url: 'some:action',
  method: 'get',
  skipNotify: (err) => err?.name === 'CanceledError',
});
```

### Solicitud de origen cruzado (Cross-Origin)

Al usar una URL completa para solicitar otros dominios, el servicio de destino debe estar configurado con CORS para permitir el origen de la aplicación actual. Si la interfaz de destino requiere su propio token, este puede pasarse a través de los encabezados:

```javascript
const res = await ctx.request({
  url: 'https://api.example.com/v1/data',
  method: 'get',
});

const res2 = await ctx.request({
  url: 'https://api.other.com/items',
  method: 'get',
  headers: {
    Authorization: 'Bearer <token_del_servicio_destino>',
  },
});
```

### Visualización con ctx.render

```javascript
const { data } = await ctx.request({
  url: 'users:list',
  method: 'get',
  params: { pageSize: 5 },
});
const rows = Array.isArray(data?.data) ? data.data : [];

ctx.render([
  '<div style="padding:12px">',
  '<h4>' + ctx.t('Lista de usuarios') + '</h4>',
  '<ul>',
  ...rows.map((r) => '<li>' + (r.nickname ?? r.username ?? '') + '</li>'),
  '</ul>',
  '</div>',
].join(''));
```

## Notas

- **Manejo de errores**: El fallo de la solicitud lanzará una excepción y, por defecto, aparecerá un aviso de error global. Utilice `skipNotify: true` para capturarlo y manejarlo usted mismo.
- **Autenticación**: Las solicitudes al mismo origen llevarán automáticamente el Token, el idioma (locale) y el rol del usuario actual; las solicitudes de origen cruzado requieren que el destino admita CORS y que se pase el token en los encabezados según sea necesario.
- **Permisos de recursos**: Las solicitudes están sujetas a las restricciones de ACL y solo pueden acceder a los recursos para los que el usuario actual tiene permiso.

## Relacionado

- [ctx.message](./message.md) - Mostrar avisos ligeros después de completar la solicitud
- [ctx.notification](./notification.md) - Mostrar notificaciones después de completar la solicitud
- [ctx.render](./render.md) - Renderizar los resultados de la solicitud en la interfaz
- [ctx.makeResource](./make-resource.md) - Construir un objeto de recurso para la carga de datos encadenada (alternativa a `ctx.request`)