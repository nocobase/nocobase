:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# CacheManager

## Översikt

CacheManager bygger på <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> och tillhandahåller funktioner för hantering av cachemoduler för NocoBase. De inbyggda cachetyperna är:

- memory - lru-cache som tillhandahålls som standard av node-cache-manager
- redis - stöds av node-cache-manager-redis-yet

Fler typer kan registreras och utökas via API:et.

### Konceptförklaringar

- **Store**: Definierar en cachningsmetod, inklusive en fabriksmetod för att skapa cacheminnen och andra relaterade konfigurationer. Varje cachningsmetod har en unik identifierare som anges vid registreringen.
  De unika identifierarna för de två inbyggda cachningsmetoderna är `memory` och `redis`.

- **Store fabriksmetod**: En metod som tillhandahålls av `node-cache-manager` och relaterade tilläggspaket för att skapa cacheminnen. Till exempel `'memory'` som tillhandahålls som standard av `node-cache-manager`, och `redisStore` som tillhandahålls av `node-cache-manager-redis-yet`. Detta motsvarar den första parametern i `caching`-metoden i `node-cache-manager`.

- **Cache**: En klass som NocoBase kapslar in och som tillhandahåller metoder för att använda cacheminnet. När ni faktiskt använder cacheminnet, arbetar ni med en instans av `Cache`. Varje `Cache`-instans har en unik identifierare, som kan användas som ett namnområde för att skilja mellan olika moduler.

## Klassmetoder

### `constructor()`

#### Signatur

- `constructor(options?: CacheManagerOptions)`

#### Typer

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

#### Detaljer

##### CacheManagerOptions

| Egenskap       | Typ                            | Beskrivning                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Den unika identifieraren för standard-cachetypen.                                                                                                                                                                                   |
| `stores`       | `Record<string, StoreOptions>` | Registrerar cachetyper. Nyckeln är den unika identifieraren för cachetypen, och värdet är ett objekt som innehåller registreringsmetoden och global konfiguration för cachetypen.<br />I `node-cache-manager` är metoden för att skapa ett cacheminne `await caching(store, config)`. Objektet som ska tillhandahållas här är [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Egenskap        | Typ                                   | Beskrivning                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Store fabriksmetod, motsvarande den första parametern i `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | Valfritt. För middleware som Redis, som kräver en anslutning, måste en callback-metod för att stänga anslutningen tillhandahållas. Indataparametern är objektet som returneras av store fabriksmetoden. |
| `[key: string]` | `any`                                  | Andra globala store-konfigurationer, motsvarande den andra parametern i `caching`.                                                                                                               |

#### Standard `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // global config
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

`options`-parametern kommer att slås samman med standardinställningarna. Egenskaper som redan finns i standardinställningarna kan utelämnas. Till exempel:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore tillhandahålls redan i standardinställningarna, så ni behöver bara ange konfigurationen för redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registrerar en ny cachningsmetod. Till exempel:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // unik identifierare för store
  name: 'redis',
  // fabriksmetod för att skapa store
  store: redisStore,
  // stäng store-anslutningen
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // global konfiguration
  url: 'xxx',
});
```

#### Signatur

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Skapar ett cacheminne. Till exempel:

```ts
await cacheManager.createCache({
  name: 'default', // unik identifierare för cacheminnet
  store: 'memory', // unik identifierare för store
  prefix: 'mycache', // lägger automatiskt till prefixet 'mycache:' till cache-nycklar, valfritt
  // andra store-konfigurationer, anpassade konfigurationer kommer att slås samman med den globala store-konfigurationen
  max: 2000,
});
```

#### Signatur

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Detaljer

##### options

| Egenskap        | Typ     | Beskrivning                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | Unik identifierare för cacheminnet.                      |
| `store`         | `string` | Unik identifierare för store.                      |
| `prefix`        | `string` | Valfritt, prefix för cache-nyckel.           |
| `[key: string]` | `any`    | Andra anpassade konfigurationsalternativ relaterade till store. |

Om `store` utelämnas kommer `defaultStore` att användas. I detta fall kommer cachningsmetoden att ändras beroende på systemets standardcachningsmetod.

När inga anpassade konfigurationer finns, returneras det standardcacheutrymme som skapats av den globala konfigurationen och delas av den aktuella cachningsmetoden. Det rekommenderas att lägga till ett `prefix` för att undvika nyckelkonflikter.

```ts
// Använd standardcacheminnet med global konfiguration
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Se [Cache](./cache.md)

### `getCache()`

Hämtar motsvarande cacheminne.

```ts
cacheManager.getCache('default');
```

#### Signatur

- `getCache(name: string): Cache`

### `flushAll()`

Återställer alla cacheminnen.

```ts
await cacheManager.flushAll();
```

### `close()`

Stänger alla anslutningar för cache-middleware.

```ts
await cacheManager.close();
```