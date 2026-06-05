:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Caché

El módulo de caché de NocoBase se basa en <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> y ofrece funcionalidades de caché para el desarrollo de plugins. El sistema incluye dos tipos de caché integrados:

-   **memory** - Caché en memoria basado en lru-cache, proporcionado por `node-cache-manager` por defecto.
-   **redis** - Caché de Redis basado en `node-cache-manager-redis-yet`.

Puede extender y registrar más tipos de caché a través de la API.

## Uso básico

### app.cache

`app.cache` es la instancia de caché predeterminada a nivel de aplicación y puede usarla directamente.

```ts
// Establecer caché
await app.cache.set('key', 'value', { ttl: 3600 }); // Unidad TTL: segundos

// Obtener caché
const value = await app.cache.get('key');

// Eliminar caché
await this.app.cache.del('key');
```

### ctx.cache

En operaciones de middleware o de recursos, puede acceder al caché a través de `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Caché no encontrado, obtener de la base de datos
    data = await this.getDataFromDatabase();
    // Almacenar en caché, válido por 1 hora
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Crear caché personalizado

Si necesita crear una instancia de caché independiente (por ejemplo, con diferentes espacios de nombres o configuraciones), puede usar el método `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Crear una instancia de caché con prefijo
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Todas las claves añadirán automáticamente este prefijo
      store: 'memory', // Usar caché en memoria, opcional, por defecto usa defaultStore
      max: 1000, // Número máximo de elementos en caché
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Descripción de los parámetros de createCache

| Parámetro | Tipo | Descripción |
| -------- | ---- | ----------- |
| `name` | `string` | Identificador único para el caché, obligatorio |
| `prefix` | `string` | Opcional, prefijo para las claves de caché, usado para evitar conflictos de claves |
| `store` | `string` | Opcional, identificador del tipo de *store* (como `'memory'`, `'redis'`), por defecto usa `defaultStore` |
| `[key: string]` | `any` | Otros elementos de configuración personalizados relacionados con el *store* |

### Obtener caché creado

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Métodos básicos de caché

Las instancias de caché ofrecen una amplia variedad de métodos para operar con el caché, la mayoría de los cuales se heredan de `node-cache-manager`.

### get / set

```ts
// Establecer caché, con tiempo de expiración (unidad: segundos)
await cache.set('key', 'value', { ttl: 3600 });

// Obtener caché
const value = await cache.get('key');
```

### del / reset

```ts
// Eliminar una única clave
await cache.del('key');

// Vaciar todo el caché
await cache.reset();
```

### wrap

El método `wrap()` es una herramienta muy útil que primero intenta obtener datos del caché. Si el caché no se encuentra (cache miss), ejecuta la función y almacena el resultado en el caché.

```ts
const data = await cache.wrap('user:1', async () => {
  // Esta función solo se ejecuta si el caché no se encuentra
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Operaciones en lote

```ts
// Establecer en lote
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Obtener en lote
const values = await cache.mget(['key1', 'key2', 'key3']);

// Eliminar en lote
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Obtener todas las claves (nota: algunos stores podrían no soportarlo)
const allKeys = await cache.keys();

// Obtener el tiempo de vida restante (TTL) de una clave (unidad: segundos)
const remainingTTL = await cache.ttl('key');
```

## Uso avanzado

### wrapWithCondition

`wrapWithCondition()` es similar a `wrap()`, pero le permite decidir si usar el caché mediante condiciones.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Los parámetros externos controlan si se usa el resultado del caché
    useCache: true, // Si se establece en false, la función se ejecutará de nuevo incluso si existe caché

    // Decide si se debe almacenar en caché basándose en el resultado de los datos
    isCacheable: (value) => {
      // Por ejemplo: solo almacenar en caché los resultados exitosos
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Operaciones de caché de objetos

Cuando el contenido almacenado en caché es un objeto, puede usar los siguientes métodos para operar directamente con las propiedades del objeto, sin necesidad de obtener el objeto completo.

```ts
// Establecer una propiedad de un objeto
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Obtener una propiedad de un objeto
const name = await cache.getValueInObject('user:1', 'name');

// Eliminar una propiedad de un objeto
await cache.delValueInObject('user:1', 'age');
```

## Registrar un Store personalizado

Si necesita usar otros tipos de caché (como Memcached, MongoDB, etc.), puede registrarlos a través de `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Registrar el store de Redis (si el sistema aún no lo ha registrado)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Configuración de conexión de Redis
      url: 'redis://localhost:6379',
    });

    // Crear caché usando el store recién registrado
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Consideraciones

1.  **Límites del caché en memoria**: Al usar un *store* de memoria, preste atención a configurar un parámetro `max` razonable para evitar desbordamientos de memoria.
2.  **Estrategia de invalidación de caché**: Al actualizar datos, recuerde limpiar el caché relacionado para evitar datos obsoletos.
3.  **Convenciones de nombres para claves**: Se recomienda usar espacios de nombres y prefijos significativos, como `module:resource:id`.
4.  **Configuración de TTL**: Establezca el TTL de manera razonable según la frecuencia de actualización de los datos para equilibrar el rendimiento y la consistencia.
5.  **Conexión a Redis**: Al usar Redis, asegúrese de configurar correctamente los parámetros de conexión y las contraseñas en el entorno de producción.