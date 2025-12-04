:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# CacheManager

## Overzicht

CacheManager is gebaseerd op <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> en biedt NocoBase functionaliteit voor het beheer van cachemodules. De ingebouwde cachetypen zijn:

- memory - lru-cache standaard geleverd door node-cache-manager
- redis - ondersteund door node-cache-manager-redis-yet

Meer typen kunnen via de API worden geregistreerd en uitgebreid.

### Concepten

- **Store**: Definieert een cachingmethode, inclusief een factory-methode voor het aanmaken van caches en andere gerelateerde configuraties. Elke cachingmethode heeft een unieke identificatie die wordt opgegeven tijdens de registratie.
  De unieke identificaties voor de twee ingebouwde cachingmethoden zijn `memory` en `redis`.

- **Store Factory Methode**: Een methode die wordt geleverd door `node-cache-manager` en gerelateerde extensiepakketten voor het aanmaken van caches. Bijvoorbeeld `'memory'` standaard geleverd door `node-cache-manager`, en `redisStore` geleverd door `node-cache-manager-redis-yet`. Dit komt overeen met de eerste parameter van de `caching`-methode in `node-cache-manager`.

- **Cache**: Een door NocoBase ingekapselde klasse die methoden biedt voor het gebruik van de cache. Wanneer u de cache daadwerkelijk gebruikt, werkt u met een instantie van `Cache`. Elke `Cache`-instantie heeft een unieke identificatie, die kan worden gebruikt als een namespace om verschillende modules te onderscheiden.

## Klassemethoden

### `constructor()`

#### Signatuur

- `constructor(options?: CacheManagerOptions)`

#### Typen

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
  // globale configuratie
  [key: string]: any;
};
```

#### Details

##### CacheManagerOptions

| Eigenschap     | Type                           | Beschrijving                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `defaultStore` | `string`                       | De unieke identificatie voor het standaard cachetype.                                                                                                                                                                                |
| `stores`       | `Record<string, StoreOptions>` | Registreert cachetypen. De sleutel is de unieke identificatie voor het cachetype, en de waarde is een object dat de registratiemethode en globale configuratie voor het cachetype bevat.<br />In `node-cache-manager` is de methode om een cache aan te maken `await caching(store, config)`. Het hier te leveren object is [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Eigenschap      | Type                                   | Beschrijving                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`         | `memory` \| `FactoryStore<Store, any>` | De store factory-methode, overeenkomend met de eerste parameter van `caching`.                                                                                                                          |
| `close`         | `(store: Store) => Promise<void>`      | Optioneel. Voor middleware zoals Redis die een verbinding vereist, moet een callback-methode worden opgegeven om de verbinding te sluiten. De invoerparameter is het object dat wordt geretourneerd door de store factory-methode. |
| `[key: string]` | `any`                                  | Andere globale store-configuraties, overeenkomend met de tweede parameter van `caching`.                                                                                                                |

#### Standaard `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // globale configuratie
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

De `options`-parameter wordt samengevoegd met de standaardopties. Eigenschappen die al aanwezig zijn in de standaardopties kunnen worden weggelaten. Bijvoorbeeld:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore is al aanwezig in de standaardopties, dus u hoeft alleen de redisStore-configuratie op te geven.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registreert een nieuwe cachingmethode. Bijvoorbeeld:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // unieke identificatie voor de store
  name: 'redis',
  // factory-methode om de store aan te maken
  store: redisStore,
  // sluit de store-verbinding
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // globale configuratie
  url: 'xxx',
});
```

#### Signatuur

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Maakt een cache aan. Bijvoorbeeld:

```ts
await cacheManager.createCache({
  name: 'default', // unieke identificatie voor de cache
  store: 'memory', // unieke identificatie voor de store
  prefix: 'mycache', // voegt automatisch 'mycache:' prefix toe aan cache-sleutels, optioneel
  // andere store-configuraties, aangepaste configuraties worden samengevoegd met de globale store-configuratie
  max: 2000,
});
```

#### Signatuur

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Details

##### options

| Eigenschap      | Type     | Beschrijving                                           |
| --------------- | -------- | ------------------------------------------------------ |
| `name`          | `string` | Unieke identificatie voor de cache.                    |
| `store`         | `string` | Unieke identificatie voor de store.                    |
| `prefix`        | `string` | Optioneel, prefix voor cache-sleutels.                 |
| `[key: string]` | `any`    | Andere aangepaste configuratie-items gerelateerd aan de store. |

Als `store` wordt weggelaten, wordt `defaultStore` gebruikt. In dit geval zal de cachingmethode veranderen afhankelijk van de standaard cachingmethode van het systeem.

Wanneer er geen aangepaste configuraties zijn, retourneert het de standaard cache-ruimte die is aangemaakt door de globale configuratie en wordt gedeeld door de huidige cachingmethode. Het wordt aanbevolen om een `prefix` toe te voegen om sleutelconflicten te voorkomen.

```ts
// Gebruik de standaard cache met globale configuratie
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Zie [Cache](./cache.md)

### `getCache()`

Haalt de corresponderende cache op.

```ts
cacheManager.getCache('default');
```

#### Signatuur

- `getCache(name: string): Cache`

### `flushAll()`

Reset alle caches.

```ts
await cacheManager.flushAll();
```

### `close()`

Sluit alle cache-middleware verbindingen.

```ts
await cacheManager.close();
```