:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/route).
:::

# ctx.route

Información de coincidencia de la ruta actual, correspondiente al concepto `route` de React Router. Se utiliza para obtener la configuración de la ruta coincidente actual, parámetros, etc. Generalmente se usa en conjunto con `ctx.router` y `ctx.location`.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSField** | Realizar renderizado condicional o mostrar el identificador de la página actual basado en `route.pathname` o `route.params`. |
| **Reglas de vinculación / Flujo de eventos** | Leer parámetros de ruta (ej. `params.name`) para ramificaciones lógicas o para pasarlos a componentes hijos. |
| **Navegación de vistas** | Comparar internamente `ctx.route.pathname` con una ruta de destino para determinar si se debe activar `ctx.router.navigate`. |

> Nota: `ctx.route` solo está disponible en entornos RunJS que contienen un contexto de enrutamiento (como JSBlock dentro de una página, páginas de flujo, etc.); puede ser nulo en contextos puramente de backend o sin enrutamiento (como flujos de trabajo).

## Definición de tipos

```ts
type RouteOptions = {
  name?: string;   // Identificador único de la ruta
  path?: string;   // Plantilla de la ruta (ej. /admin/:name)
  params?: Record<string, any>;  // Parámetros de la ruta (ej. { name: 'users' })
  pathname?: string;  // Ruta completa de la ruta actual (ej. /admin/users)
};
```

## Campos comunes

| Campo | Tipo | Descripción |
|------|------|------|
| `pathname` | `string` | La ruta completa de la ruta actual, consistente con `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Parámetros dinámicos analizados desde la plantilla de la ruta, como `{ name: 'users' }`. |
| `path` | `string` | La plantilla de la ruta, como `/admin/:name`. |
| `name` | `string` | Identificador único de la ruta, comúnmente utilizado en escenarios de múltiples pestañas o vistas. |

## Relación con ctx.router y ctx.location

| Uso | Uso recomendado |
|------|----------|
| **Leer la ruta actual** | `ctx.route.pathname` o `ctx.location.pathname`; ambos son consistentes durante la coincidencia. |
| **Leer parámetros de ruta** | `ctx.route.params`, por ejemplo, `params.name` representa el UID de la página actual. |
| **Navegación** | `ctx.router.navigate(path)` |
| **Leer parámetros de consulta, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` se centra en la "configuración de la ruta coincidente", mientras que `ctx.location` se centra en la "ubicación de la URL actual". Juntos proporcionan una descripción completa del estado de enrutamiento actual.

## Ejemplos

### Leer pathname

```ts
// Mostrar la ruta actual
ctx.message.info('Página actual: ' + ctx.route.pathname);
```

### Ramificación basada en params

```ts
// params.name suele ser el UID de la página actual (ej. identificador de página de flujo)
if (ctx.route.params?.name === 'users') {
  // Ejecutar lógica específica en la página de gestión de usuarios
}
```

### Mostrar en una página de flujo (Flow)

```tsx
<div>
  <h1>Página actual - {ctx.route.pathname}</h1>
  <p>Identificador de ruta: {ctx.route.params?.name}</p>
</div>
```

## Relacionado

- [ctx.router](./router.md): Navegación de rutas. Cuando `ctx.router.navigate()` cambia la ruta, `ctx.route` se actualizará en consecuencia.
- [ctx.location](./location.md): Ubicación de la URL actual (pathname, search, hash, state), utilizado en conjunto con `ctx.route`.