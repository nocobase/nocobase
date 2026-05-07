:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/location).
:::

# ctx.location

Información de la ubicación de la ruta actual, equivalente al objeto `location` de React Router. Se utiliza habitualmente en conjunto con `ctx.router` y `ctx.route` para leer la ruta actual, la cadena de consulta (query string), el hash y el estado (state) pasado a través de la ruta.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSField** | Realizar renderizado condicional o ramificación lógica basada en la ruta actual, los parámetros de consulta o el hash. |
| **Reglas de vinculación / Flujo de eventos** | Leer parámetros de consulta de la URL para filtrado de vinculación, o determinar el origen basándose en `location.state`. |
| **Procesamiento post-navegación** | Recibir datos enviados desde la página anterior a través de `ctx.router.navigate` utilizando `ctx.location.state` en la página de destino. |

> Nota: `ctx.location` solo está disponible en entornos RunJS que cuenten con un contexto de enrutamiento (por ejemplo, JSBlock dentro de una página, flujos de eventos, etc.); puede estar vacío en contextos puramente de backend o sin enrutamiento (como en los flujos de trabajo).

## Definición de tipo

```ts
location: Location;
```

`Location` proviene de `react-router-dom`, y es consistente con el valor de retorno de `useLocation()` de React Router.

## Campos comunes

| Campo | Tipo | Descripción |
|------|------|------|
| `pathname` | `string` | La ruta actual, comenzando con `/` (por ejemplo, `/admin/users`). |
| `search` | `string` | La cadena de consulta, comenzando con `?` (por ejemplo, `?page=1&status=active`). |
| `hash` | `string` | El fragmento hash, comenzando con `#` (por ejemplo, `#section-1`). |
| `state` | `any` | Datos arbitrarios pasados a través de `ctx.router.navigate(path, { state })`, no se reflejan en la URL. |
| `key` | `string` | Un identificador único para esta ubicación; la página inicial es `"default"`. |

## Relación con ctx.router y ctx.urlSearchParams

| Propósito | Uso recomendado |
|------|----------|
| **Leer ruta, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Leer parámetros de consulta (como objeto)** | `ctx.urlSearchParams`, que proporciona directamente el objeto analizado. |
| **Analizar la cadena search** | `new URLSearchParams(ctx.location.search)` o utilice directamente `ctx.urlSearchParams`. |

`ctx.urlSearchParams` se analiza a partir de `ctx.location.search`. Si solo necesita los parámetros de consulta, usar `ctx.urlSearchParams` es más conveniente.

## Ejemplos

### Ramificación basada en la ruta

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Se encuentra actualmente en la página de gestión de usuarios');
}
```

### Análisis de parámetros de consulta

```ts
// Método 1: Usando ctx.urlSearchParams (Recomendado)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Método 2: Usando URLSearchParams para analizar search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Recibir el estado pasado mediante la navegación de ruta

```ts
// Al navegar desde la página anterior: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navegado desde el tablero (dashboard)');
}
```

### Localizar anclas mediante hash

```ts
const hash = ctx.location.hash; // p. ej., "#edit"
if (hash === '#edit') {
  // Desplazarse al área de edición o ejecutar la lógica correspondiente
}
```

## Relacionado

- [ctx.router](./router.md): Navegación de rutas; el `state` de `ctx.router.navigate` puede recuperarse a través de `ctx.location.state` en la página de destino.
- [ctx.route](./route.md): Información de coincidencia de la ruta actual (parámetros, configuración, etc.), frecuentemente utilizado en conjunto con `ctx.location`.