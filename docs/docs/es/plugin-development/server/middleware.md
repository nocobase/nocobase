:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Middleware

El middleware del servidor de NocoBase es esencialmente **middleware de Koa**. Usted puede operar el objeto `ctx` para manejar las solicitudes y respuestas, tal como lo haría en Koa. Sin embargo, dado que NocoBase necesita gestionar la lógica en diferentes capas de negocio, si todo el middleware se agrupa, su mantenimiento y gestión se vuelven muy complejos.

Por esta razón, NocoBase divide el middleware en **cuatro niveles**:

1.  **Middleware a nivel de fuente de datos**: `app.dataSourceManager.use()`
    Solo afecta a las solicitudes de **una fuente de datos específica**, y se utiliza comúnmente para la lógica de conexión a la base de datos, validación de campos o procesamiento de transacciones de esa fuente de datos.

2.  **Middleware a nivel de recurso**: `app.resourceManager.use()`
    Solo es efectivo para los recursos definidos, y es adecuado para manejar lógica a nivel de recurso, como permisos de datos, formateo, etc.

3.  **Middleware a nivel de permisos**: `app.acl.use()`
    Se ejecuta antes de las comprobaciones de permisos, y se utiliza para verificar los permisos o roles del usuario.

4.  **Middleware a nivel de aplicación**: `app.use()`
    Se ejecuta para cada solicitud, y es adecuado para el registro de logs, el manejo general de errores, el procesamiento de respuestas, etc.

## Registro de Middleware

El middleware se registra habitualmente en el método `load` del plugin, por ejemplo:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware a nivel de aplicación
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware a nivel de fuente de datos
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware a nivel de permisos
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware a nivel de recurso
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Orden de ejecución

El orden de ejecución del middleware es el siguiente:

1.  Primero se ejecuta el middleware de permisos añadido con `acl.use()`.
2.  Luego se ejecuta el middleware de recurso añadido con `resourceManager.use()`.
3.  Después se ejecuta el middleware de fuente de datos añadido con `dataSourceManager.use()`.
4.  Finalmente se ejecuta el middleware de aplicación añadido con `app.use()`.

## Mecanismo de inserción before / after / tag

Para un control más flexible del orden del middleware, NocoBase proporciona los parámetros `before`, `after` y `tag`:

-   **tag**: Asigna una etiqueta al middleware para que pueda ser referenciado por middleware posterior.
-   **before**: Inserta antes del middleware con la etiqueta especificada.
-   **after**: Inserta después del middleware con la etiqueta especificada.

Ejemplo:

```ts
// Middleware regular
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 se colocará antes de m1
app.use(m4, { before: 'restApi' });

// m5 se insertará entre m2 y m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Si no se especifica una posición, el orden de ejecución predeterminado para el middleware recién añadido es:
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`

:::

## Ejemplo del Modelo de Capas (Cebolla)

El orden de ejecución del middleware sigue el **modelo de capas (cebolla)** de Koa, lo que significa que primero entra en la pila de middleware y sale al final.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Ejemplos de orden de salida al acceder a diferentes interfaces:

-   **Solicitud regular**: `/api/hello`
    Salida: `[1,2]` (recurso no definido, no se ejecuta el middleware de `resourceManager` y `acl`)

-   **Solicitud de recurso**: `/api/test:list`
    Salida: `[5,3,7,1,2,8,4,6]`
    El middleware se ejecuta según el orden de las capas y el modelo de cebolla.

## Resumen

-   El Middleware de NocoBase es una extensión del Middleware de Koa.
-   Cuatro niveles: Aplicación -> Fuente de datos -> Recurso -> Permiso.
-   Usted puede usar `before` / `after` / `tag` para controlar de forma flexible el orden de ejecución.
-   Sigue el modelo de capas (cebolla) de Koa, asegurando que el middleware sea componible y anidable.
-   El middleware a nivel de fuente de datos solo afecta a las solicitudes de la fuente de datos especificada, y el middleware a nivel de recurso solo afecta a las solicitudes de recursos definidos.