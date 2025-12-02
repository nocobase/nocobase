:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Contexto

En NocoBase, cada solicitud genera un objeto `ctx`, que es una instancia de `Contexto`. Este `Contexto` encapsula la información de la solicitud y la respuesta, a la vez que le proporciona funcionalidades específicas de NocoBase, como el acceso a la base de datos, operaciones de caché, gestión de permisos, internacionalización y registro de eventos (logging).

La `Application` de NocoBase se basa en Koa, por lo que `ctx` es esencialmente un `Contexto` de Koa. Sin embargo, NocoBase lo extiende con una gran cantidad de APIs, lo que permite a los desarrolladores manejar la lógica de negocio de manera conveniente en los `Middleware` y `Actions`. Cada solicitud tiene su propio `ctx` independiente, lo que garantiza el aislamiento y la seguridad de los datos entre las solicitudes.

## ctx.action

`ctx.action` le proporciona acceso a la `Action` que se está ejecutando para la solicitud actual. Incluye:

- `ctx.action.params`
- `ctx.action.actionName`
- `ctx.action.resourceName`

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Muestra el nombre de la Action actual
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n y ctx.t()

Soporte para internacionalización (i18n).

- `ctx.i18n` le proporciona información sobre la configuración regional (locale).
- `ctx.t()` se utiliza para traducir cadenas de texto según el idioma.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Devuelve la traducción según el idioma de la solicitud
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` le proporciona una interfaz para acceder a la base de datos, lo que le permite operar directamente con modelos y ejecutar consultas.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` le permite realizar operaciones de caché, soportando la lectura y escritura en la caché. Se utiliza comúnmente para acelerar el acceso a los datos o para guardar estados temporales.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Almacena en caché durante 60 segundos
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` es la instancia de la aplicación NocoBase, lo que le permite acceder a la configuración global, los `plugins` y los servicios.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Verifique la consola para la aplicación';
});
```

## ctx.auth.user

`ctx.auth.user` recupera la información del usuario actualmente autenticado, lo cual es útil para usar en verificaciones de permisos o en la lógica de negocio.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` se utiliza para compartir datos en la cadena de `middleware`.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` le proporciona capacidades de registro de eventos (logging), soportando la salida de logs en múltiples niveles.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission y ctx.can()

`ctx.permission` se utiliza para la gestión de permisos, y `ctx.can()` para verificar si el usuario actual tiene permiso para ejecutar una operación específica.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Resumen

- Cada solicitud corresponde a un objeto `ctx` independiente.
- `ctx` es una extensión del `Contexto` de Koa, que integra las funcionalidades de NocoBase.
- Las propiedades comunes incluyen: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()`, entre otras.
- Utilizar `ctx` en los `Middleware` y `Actions` le permite manejar convenientemente las solicitudes, respuestas, permisos, registros de eventos y la base de datos.