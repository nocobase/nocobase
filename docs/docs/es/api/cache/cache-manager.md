:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# CacheManager

## Resumen

CacheManager se basa en <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> y proporciona funcionalidades de gestión de módulos de caché para NocoBase. Los tipos de caché integrados son:

- memory - un lru-cache proporcionado por defecto por node-cache-manager
- redis - con soporte de node-cache-manager-redis-yet

Puede registrar y extender más tipos a través de la API.

### Conceptos clave

- **Store**: Define un método de almacenamiento en caché, que incluye un método de fábrica para crear cachés y otras configuraciones relacionadas. Cada método de caché tiene un identificador único que se proporciona durante el registro.
  Los identificadores únicos para los dos métodos de caché integrados son `memory` y `redis`.

- **Método de fábrica de Store**: Un método proporcionado por `node-cache-manager` y sus paquetes de extensión relacionados para crear cachés. Por ejemplo, `'memory'` (proporcionado por defecto por `node-cache-manager`) y `redisStore` (proporcionado por `node-cache-manager-redis-yet`). Este método corresponde al primer parámetro del método `caching` de `node-cache-manager`.

- **Cache**: Una clase encapsulada por NocoBase que proporciona métodos para utilizar la caché. Al usar la caché, usted opera sobre una instancia de `Cache`. Cada instancia de `Cache` tiene un identificador único que puede utilizarse como espacio de nombres para distinguir diferentes módulos.

## Métodos de clase

### `constructor()`

#### Firma

- `constructor(options?: CacheManagerOptions)`

#### Tipos

```ts
export type CacheManagerOptions = Partial<{
  defaultStore: string;
  stores: {
    [storeType: string]: StoreOptions;
  };
}>;

type StoreOptions = {
  store?: 'memory' | FactoryStore<Store, any>;
  close?: (store: Store) => Promise<void>;
  // global config
  [key: string]: any;
};
```

#### Detalles

##### CacheManagerOptions

| Propiedad      | Tipo                           | Descripción                                                                                                                                                                                                                           |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | El identificador único para el tipo de caché predeterminado.                                                                                                                                                                          |
| `stores`       | `Record<string, StoreOptions>` | Registra los tipos de caché. La clave es el identificador único para el tipo de caché, y el valor es un objeto que contiene el método de registro y la configuración global para el tipo de caché.<br />En `node-cache-manager`, el método para crear una caché es `await caching(store, config)`. El objeto que debe proporcionar aquí es [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Propiedad       | Tipo                                   | Descripción                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | El método de fábrica del store, que corresponde al primer parámetro de `caching`.                                                                                                                      |
| `close`         | `(store: Store) => Promise<void>`      | Opcional. Si se trata de un middleware como Redis que requiere una conexión, debe proporcionar un método de callback para cerrar la conexión. El parámetro de entrada es el objeto devuelto por el método de fábrica del store. |
| `[key: string]` | `any`                                  | Otras configuraciones globales del store, que corresponden al segundo parámetro de `caching`.                                                                                                          |

#### `options` predeterminadas

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // Configuración global
      max: 2000,
    },
    redis: {
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
    },
  },
};
```

El parámetro `options` se fusionará con las opciones predeterminadas. Las propiedades ya presentes en las opciones predeterminadas pueden omitirse. Por ejemplo:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore ya está proporcionado en las opciones predeterminadas, solo necesita proporcionar la configuración de redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registra un nuevo método de almacenamiento en caché. Por ejemplo:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // Identificador único para el store
  name: 'redis',
  // Método de fábrica para crear el store
  store: redisStore,
  // Cierra la conexión del store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // Configuración global
  url: 'xxx',
});
```

#### Firma

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Crea una caché. Por ejemplo:

```ts
await cacheManager.createCache({
  name: 'default', // Identificador único para la caché
  store: 'memory', // Identificador único para el store
  prefix: 'mycache', // Opcional, añade automáticamente el prefijo 'mycache:' a las claves de caché
  // Otras configuraciones del store, las configuraciones personalizadas se fusionarán con la configuración global del store
  max: 2000,
});
```

#### Firma

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Detalles

##### options

| Propiedad       | Tipo     | Descripción                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | Identificador único para la caché.                    |
| `store`         | `string` | Identificador único para el store.                    |
| `prefix`        | `string` | Opcional, prefijo para las claves de caché.           |
| `[key: string]` | `any`    | Otros elementos de configuración personalizada del store. |

Si se omite `store`, se utilizará `defaultStore`. En este caso, el método de almacenamiento en caché cambiará según el método de caché predeterminado del sistema.

Cuando no hay configuraciones personalizadas, se devuelve el espacio de caché predeterminado creado por la configuración global y compartido por el método de caché actual. Se recomienda añadir un `prefix` para evitar conflictos de claves.

```ts
// Utiliza la caché predeterminada con la configuración global
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Consulte [Cache](./cache.md)

### `getCache()`

Obtiene la caché correspondiente.

```ts
cacheManager.getCache('default');
```

#### Firma

- `getCache(name: string): Cache`

### `flushAll()`

Reinicia todas las cachés.

```ts
await cacheManager.flushAll();
```

### `close()`

Cierra todas las conexiones de middleware de caché.

```ts
await cacheManager.close();
```