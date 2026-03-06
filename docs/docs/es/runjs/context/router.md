:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/router).
:::

# ctx.router

Instancia de enrutador basada en React Router, utilizada para la navegación mediante código dentro de RunJS. Generalmente se utiliza en conjunto con `ctx.route` y `ctx.location`.

## Casos de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSField** | Navegar a páginas de detalles, páginas de lista o enlaces externos tras hacer clic en un botón. |
| **Reglas de enlace / Flujo de eventos** | Ejecutar `navigate` hacia una lista o detalle después de un envío exitoso, o pasar un `state` a la página de destino. |
| **JSAction / Manejo de eventos** | Ejecutar la navegación de rutas dentro de la lógica de envíos de formularios o clics en enlaces. |
| **Navegación de vistas** | Actualizar la URL a través de `navigate` durante el cambio de la pila de vistas internas. |

> Nota: `ctx.router` solo está disponible en entornos RunJS que cuenten con un contexto de enrutamiento (por ejemplo, JSBlock dentro de una página, páginas de flujo, flujos de eventos, etc.); puede ser nulo en contextos puramente de backend o sin enrutamiento (como los flujos de trabajo).

## Definición de tipo

```typescript
router: Router
```

`Router` proviene de `@remix-run/router`. En RunJS, las operaciones de navegación como saltar, retroceder y actualizar se implementan a través de `ctx.router.navigate()`.

## Métodos

### ctx.router.navigate()

Navega hacia una ruta de destino o ejecuta una acción de retroceso/actualización.

**Firma:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parámetros:**

- `to`: Ruta de destino (string), posición relativa en el historial (number, por ejemplo, `-1` para retroceder) o `null` (para actualizar la página actual).
- `options`: Configuración opcional.
  - `replace?: boolean`: Indica si se debe reemplazar la entrada actual en el historial (el valor predeterminado es `false`, lo que añade una nueva entrada).
  - `state?: any`: Estado que se pasará a la ruta de destino. Estos datos no aparecen en la URL y se puede acceder a ellos mediante `ctx.location.state` en la página de destino. Es adecuado para información sensible, datos temporales o información que no deba colocarse en la URL.

## Ejemplos

### Navegación básica

```ts
// Navegar a la lista de usuarios (añade una nueva entrada al historial, permite retroceder)
ctx.router.navigate('/admin/users');

// Navegar a una página de detalles
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Reemplazar el historial (sin nueva entrada)

```ts
// Redirigir a la página de inicio tras el inicio de sesión; el usuario no volverá a la página de inicio de sesión al retroceder
ctx.router.navigate('/admin', { replace: true });

// Reemplazar la página actual con la página de detalles tras un envío de formulario exitoso
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Pasar un state

```ts
// Llevar datos durante la navegación; la página de destino los recupera mediante ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Retroceder y actualizar

```ts
// Retroceder una página
ctx.router.navigate(-1);

// Retroceder dos páginas
ctx.router.navigate(-2);

// Actualizar la página actual
ctx.router.navigate(null);
```

## Relación con ctx.route y ctx.location

| Propósito | Uso recomendado |
|------|----------|
| **Navegación / Salto** | `ctx.router.navigate(path)` |
| **Leer la ruta actual** | `ctx.route.pathname` o `ctx.location.pathname` |
| **Leer el state pasado durante la navegación** | `ctx.location.state` |
| **Leer los parámetros de la ruta** | `ctx.route.params` |

`ctx.router` es responsable de las "acciones de navegación", mientras que `ctx.route` y `ctx.location` son responsables del "estado de la ruta actual".

## Notas

- `navigate(path)` añade una nueva entrada al historial por defecto, permitiendo a los usuarios regresar mediante el botón de retroceso del navegador.
- `replace: true` reemplaza la entrada actual del historial sin añadir una nueva, lo cual es adecuado para escenarios como la redirección tras el inicio de sesión o la navegación tras un envío exitoso.
- **Sobre el parámetro `state`**:
  - Los datos pasados a través de `state` no aparecen en la URL, lo que los hace adecuados para datos sensibles o temporales.
  - Se puede acceder a ellos mediante `ctx.location.state` en la página de destino.
  - `state` se guarda en el historial del navegador y permanece accesible durante la navegación hacia adelante o hacia atrás.
  - El `state` se perderá tras una actualización completa de la página.

## Relacionado

- [ctx.route](./route.md): Información de coincidencia de la ruta actual (pathname, params, etc.).
- [ctx.location](./location.md): Ubicación actual de la URL (pathname, search, hash, state); el `state` se lee aquí después de la navegación.