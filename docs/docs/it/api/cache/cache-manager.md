:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# CacheManager

## Panoramica

CacheManager si basa su <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> e fornisce a NocoBase funzionalità di gestione dei moduli di cache. I tipi di cache integrati sono:

-   memory - lru-cache fornita di default da node-cache-manager
-   redis - supportata da node-cache-manager-redis-yet

È possibile registrare ed estendere ulteriori tipi tramite API.

### Concetti

-   **Store**: Definisce un metodo di caching, che include un metodo factory per la creazione delle cache e altre configurazioni correlate. Ogni metodo di caching ha un identificatore univoco, fornito durante la registrazione. Gli identificatori univoci per i due metodi di caching integrati sono `memory` e `redis`.

-   **Metodo Factory dello Store**: Un metodo fornito da `node-cache-manager` e dai pacchetti di estensione correlati per la creazione delle cache. Ad esempio, `'memory'` fornito di default da `node-cache-manager`, e `redisStore` fornito da `node-cache-manager-redis-yet`. Questo corrisponde al primo parametro del metodo `caching` in `node-cache-manager`.

-   **Cache**: Una classe incapsulata da NocoBase che fornisce metodi per l'utilizzo della cache. Quando si utilizza effettivamente la cache, si opera su un'istanza di `Cache`. Ogni istanza di `Cache` ha un identificatore univoco, che può essere utilizzato come namespace per distinguere i diversi moduli.

## Metodi di Classe

### `constructor()`

#### Firma

-   `constructor(options?: CacheManagerOptions)`

#### Tipi

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
  // configurazione globale
  [key: string]: any;
};
```

#### Dettagli

##### CacheManagerOptions

| Proprietà      | Tipo                           | Descrizione                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | L'identificatore univoco per il tipo di cache predefinito.                                                                                                                                                                          |
| `stores`       | `Record<string, StoreOptions>` | Registra i tipi di cache. La chiave è l'identificatore univoco per il tipo di cache, e il valore è un oggetto contenente il metodo di registrazione e la configurazione globale per il tipo di cache.<br />In `node-cache-manager`, il metodo per creare una cache è `await caching(store, config)`. L'oggetto da fornire qui è [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Proprietà       | Tipo                                   | Descrizione                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Il metodo factory dello store, corrispondente al primo parametro di `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | Opzionale. Per middleware come Redis che richiedono una connessione, è necessario fornire un metodo di callback per chiudere la connessione. Il parametro di input è l'oggetto restituito dal metodo factory dello store. |
| `[key: string]` | `any`                                  | Altre configurazioni globali dello store, corrispondenti al secondo parametro di `caching`.                                                                                                               |

#### `options` predefinite

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // configurazione globale
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

Il parametro `options` verrà unito con le opzioni predefinite. Le proprietà già presenti nelle opzioni predefinite possono essere omesse. Ad esempio:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore è già fornito nelle opzioni predefinite, quindi è sufficiente fornire la configurazione di redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registra un nuovo metodo di caching. Ad esempio:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // identificatore univoco per lo store
  name: 'redis',
  // metodo factory per creare lo store
  store: redisStore,
  // chiude la connessione dello store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // configurazione globale
  url: 'xxx',
});
```

#### Firma

-   `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Crea una cache. Ad esempio:

```ts
await cacheManager.createCache({
  name: 'default', // identificatore univoco per la cache
  store: 'memory', // identificatore univoco per lo store
  prefix: 'mycache', // aggiunge automaticamente il prefisso 'mycache:' alle chiavi della cache, opzionale
  // altre configurazioni dello store, le configurazioni personalizzate verranno unite con la configurazione globale dello store
  max: 2000,
});
```

#### Firma

-   `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Dettagli

##### options

| Proprietà       | Tipo     | Descrizione                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | Identificatore univoco per la cache.                  |
| `store`         | `string` | Identificatore univoco per lo store.                  |
| `prefix`        | `string` | Opzionale, prefisso per le chiavi della cache.        |
| `[key: string]` | `any`    | Altri elementi di configurazione personalizzati relativi allo store. |

Se `store` viene omesso, verrà utilizzato `defaultStore`. In questo caso, il metodo di caching cambierà in base al metodo di caching predefinito del sistema.

Quando non ci sono configurazioni personalizzate, viene restituito lo spazio cache predefinito creato dalla configurazione globale e condiviso dal metodo di caching corrente. Si raccomanda di aggiungere un `prefix` per evitare conflitti di chiavi.

```ts
// Utilizza la cache predefinita con configurazione globale
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Vedere [Cache](./cache.md)

### `getCache()`

Recupera la cache corrispondente.

```ts
cacheManager.getCache('default');
```

#### Firma

-   `getCache(name: string): Cache`

### `flushAll()`

Reimposta tutte le cache.

```ts
await cacheManager.flushAll();
```

### `close()`

Chiude tutte le connessioni middleware della cache.

```ts
await cacheManager.close();
```