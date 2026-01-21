:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Cache

NocoBase's cache-modul bygger på <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> och tillhandahåller cache-funktionalitet för plugin-utveckling. Systemet har två inbyggda cache-typer:

- **memory** – Minnescache baserad på lru-cache, som tillhandahålls som standard av node-cache-manager.
- **redis** – Redis-cache baserad på node-cache-manager-redis-yet.

Fler cache-typer kan utökas och registreras via API:et.

## Grundläggande användning

### app.cache

`app.cache` är den standardinstans för cache som finns på applikationsnivå och kan användas direkt.

```ts
// Ställ in cache
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL-enhet: sekunder

// Hämta cache
const value = await app.cache.get('key');

// Ta bort cache
await this.app.cache.del('key');
```

### ctx.cache

I middleware eller resursoperationer kan ni komma åt cachen via `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss, hämta från databasen
    data = await this.getDataFromDatabase();
    // Lagra i cache, giltigt i 1 timme
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Skapa anpassad cache

Om ni behöver skapa en oberoende cache-instans (till exempel för olika namnrymder eller konfigurationer), kan ni använda metoden `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Skapa en cache-instans med prefix
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Alla nycklar får automatiskt detta prefix
      store: 'memory', // Använd minnescache, valfritt, standard är defaultStore
      max: 1000, // Maximalt antal cache-objekt
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache – Parameterbeskrivning

| Parameter | Typ | Beskrivning |
| -------- | ---- | ---------- |
| `name` | `string` | Unik identifierare för cachen, obligatorisk |
| `prefix` | `string` | Valfritt, prefix för cache-nycklar, används för att undvika nyckelkonflikter |
| `store` | `string` | Valfritt, identifierare för lagringstyp (t.ex. `'memory'`, `'redis'`), standard är `defaultStore` |
| `[key: string]` | `any` | Andra anpassade konfigurationsalternativ relaterade till lagringen |

### Hämta skapad cache

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Grundläggande cache-metoder

Cache-instanser erbjuder en mängd cache-operationsmetoder, varav de flesta ärvts från node-cache-manager.

### get / set

```ts
// Ställ in cache med utgångstid (enhet: sekunder)
await cache.set('key', 'value', { ttl: 3600 });

// Hämta cache
const value = await cache.get('key');
```

### del / reset

```ts
// Ta bort en enskild nyckel
await cache.del('key');

// Rensa all cache
await cache.reset();
```

### wrap

Metoden `wrap()` är ett mycket användbart verktyg som först försöker hämta data från cachen. Om cachen inte hittar data (cache miss), körs funktionen och resultatet lagras i cachen.

```ts
const data = await cache.wrap('user:1', async () => {
  // Denna funktion körs endast vid cache miss
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Batch-operationer

```ts
// Batch-inställning
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Batch-hämtning
const values = await cache.mget(['key1', 'key2', 'key3']);

// Batch-borttagning
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Hämta alla nycklar (obs: vissa lagringstyper kanske inte stöder detta)
const allKeys = await cache.keys();

// Hämta nyckelns återstående utgångstid (enhet: sekunder)
const remainingTTL = await cache.ttl('key');
```

## Avancerad användning

### wrapWithCondition

`wrapWithCondition()` liknar `wrap()`, men låter er besluta om cachen ska användas baserat på specifika villkor.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Externa parametrar styr om cache-resultatet ska användas
    useCache: true, // Om satt till false, kommer funktionen att köras igen även om cache finns

    // Bestäm om data ska cachas baserat på resultatet
    isCacheable: (value) => {
      // Till exempel: cacha endast lyckade resultat
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Objekt-cache-operationer

När det cachade innehållet är ett objekt kan ni använda följande metoder för att direkt manipulera objektets egenskaper, utan att behöva hämta hela objektet.

```ts
// Ställ in en egenskap för ett objekt
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Hämta en egenskap för ett objekt
const name = await cache.getValueInObject('user:1', 'name');

// Ta bort en egenskap från ett objekt
await cache.delValueInObject('user:1', 'age');
```

## Registrera anpassad lagring (Store)

Om ni behöver använda andra cache-typer (som Memcached, MongoDB, etc.), kan ni registrera dem via `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Registrera Redis-lagring (store) (om systemet inte redan har registrerat den)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis-anslutningskonfiguration
      url: 'redis://localhost:6379',
    });

    // Skapa cache med den nyligen registrerade lagringen
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Att tänka på

1.  **Begränsningar för minnescache**: När ni använder minneslagring (memory store), se till att ställa in en rimlig `max`-parameter för att undvika minnesöverflöde.
2.  **Strategi för cache-invalidering**: Kom ihåg att rensa relaterad cache när ni uppdaterar data för att undvika inaktuell data.
3.  **Namngivningskonventioner för nycklar**: Vi rekommenderar att ni använder meningsfulla namnrymder och prefix, till exempel `module:resource:id`.
4.  **TTL-inställningar**: Ställ in TTL på ett rimligt sätt baserat på hur ofta data uppdateras, för att balansera prestanda och konsistens.
5.  **Redis-anslutning**: När ni använder Redis, se till att anslutningsparametrar och lösenord är korrekt konfigurerade i produktionsmiljön.