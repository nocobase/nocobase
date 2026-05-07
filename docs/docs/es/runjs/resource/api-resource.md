:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/resource/api-resource).
:::

# APIResource

Un **recurso de API genérico** para realizar solicitudes basadas en URLs, adecuado para cualquier interfaz HTTP. Hereda de la clase base `FlowResource` y la extiende con configuración de solicitudes y el método `refresh()`. A diferencia de [MultiRecordResource](./multi-record-resource.md) y [SingleRecordResource](./single-record-resource.md), `APIResource` no depende de un nombre de recurso; realiza solicitudes directamente por URL, lo que lo hace ideal para interfaces personalizadas, APIs de terceros y otros escenarios.

**Método de creación**: `ctx.makeResource('APIResource')` o `ctx.initResource('APIResource')`. Debe llamar a `setURL()` antes de su uso. En el contexto de RunJS, `ctx.api` (APIClient) se inyecta automáticamente, por lo que no es necesario llamar a `setAPIClient` manualmente.

---

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **Interfaz personalizada** | Llamar a APIs de recursos no estándar (por ejemplo, `/api/custom/stats`, `/api/reports/summary`). |
| **API de terceros** | Solicitar servicios externos a través de una URL completa (requiere que el destino admita CORS). |
| **Consulta de un solo uso** | Obtención temporal de datos que son desechables y no necesitan estar vinculados a `ctx.resource`. |
| **Elección entre APIResource y ctx.request** | Utilice `APIResource` cuando se necesiten datos reactivos, eventos o estados de error; utilice `ctx.request()` para solicitudes simples y puntuales. |

---

## Capacidades de la clase base (FlowResource)

Todos los recursos poseen lo siguiente:

| Método | Descripción |
|------|------|
| `getData()` | Obtiene los datos actuales. |
| `setData(value)` | Establece los datos (solo localmente). |
| `hasData()` | Indica si existen datos. |
| `getMeta(key?)` / `setMeta(meta)` | Lee o escribe metadatos. |
| `getError()` / `setError(err)` / `clearError()` | Gestión del estado de error. |
| `on(event, callback)` / `once` / `off` / `emit` | Suscripción y activación de eventos. |

---

## Configuración de la solicitud

| Método | Descripción |
|------|------|
| `setAPIClient(api)` | Establece la instancia de APIClient (generalmente inyectada automáticamente en RunJS). |
| `getURL()` / `setURL(url)` | URL de la solicitud. |
| `loading` | Lee o escribe el estado de carga (get/set). |
| `clearRequestParameters()` | Limpia los parámetros de la solicitud. |
| `setRequestParameters(params)` | Fusiona y establece los parámetros de la solicitud. |
| `setRequestMethod(method)` | Establece el método de la solicitud (por ejemplo, `'get'`, `'post'`; el valor predeterminado es `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Encabezados de la solicitud. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Agrega, elimina o consulta un parámetro individual. |
| `setRequestBody(data)` | Cuerpo de la solicitud (utilizado para POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Opciones generales de la solicitud. |

---

## Formato de URL

- **Estilo de recurso**: Admite la abreviatura de recursos de NocoBase, como `users:list` o `posts:get`, que se concatenará con la `baseURL`.
- **Ruta relativa**: Por ejemplo, `/api/custom/endpoint`, concatenada con la `baseURL` de la aplicación.
- **URL completa**: Utilice direcciones completas para solicitudes de origen cruzado; el destino debe tener configurado CORS.

---

## Obtención de datos

| Método | Descripción |
|------|------|
| `refresh()` | Inicia una solicitud basada en la URL, método, parámetros, encabezados y datos actuales. Escribe la respuesta `data` en `setData(data)` y activa el evento `'refresh'`. En caso de fallo, establece `setError(err)` y lanza un `ResourceError`, sin activar el evento `refresh`. Requiere que `api` y la URL estén configurados. |

---

## Ejemplos

### Solicitud GET básica

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL con estilo de recurso

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Solicitud POST (con cuerpo de solicitud)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'prueba', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Escuchar el evento refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Estadísticas: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Manejo de errores

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'La solicitud ha fallado');
}
```

### Encabezados de solicitud personalizados

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'valor');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Consideraciones

- **Dependencia de ctx.api**: En RunJS, `ctx.api` es inyectado por el entorno; generalmente no es necesario llamar a `setAPIClient` manualmente. Si se utiliza en un escenario sin contexto, debe configurarlo usted mismo.
- **Refresh equivale a la solicitud**: `refresh()` inicia una solicitud basada en la configuración actual; el método, los parámetros, los datos, etc., deben configurarse antes de la llamada.
- **Los errores no actualizan los datos**: En caso de fallo, `getData()` mantiene su valor anterior; la información del error se puede recuperar a través de `getError()`.
- **Frente a ctx.request**: Utilice `ctx.request()` para solicitudes simples de una sola vez; utilice `APIResource` cuando se requiera gestión de datos reactivos, eventos y estado de error.

---

## Relacionado

- [ctx.resource](../context/resource.md) - La instancia de recurso en el contexto actual.
- [ctx.initResource()](../context/init-resource.md) - Inicializar y vincular a `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Crear una nueva instancia de recurso sin vincularla.
- [ctx.request()](../context/request.md) - Solicitud HTTP general, adecuada para llamadas simples y puntuales.
- [MultiRecordResource](./multi-record-resource.md) - Orientado a colecciones/listas, admite CRUD y paginación.
- [SingleRecordResource](./single-record-resource.md) - Orientado a registros individuales.