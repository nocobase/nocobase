:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Cache

De Cache-module van NocoBase is gebaseerd op <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> en biedt cachefunctionaliteit voor de ontwikkeling van plugins. Het systeem heeft twee ingebouwde cachetypen:

- **memory** - Geheugencache gebaseerd op lru-cache, standaard geleverd door node-cache-manager.
- **redis** - Redis-cache gebaseerd op node-cache-manager-redis-yet.

Meer cachetypen kunnen via de API worden uitgebreid en geregistreerd.

## Basisgebruik

### app.cache

`app.cache` is de standaard cache-instantie op applicatieniveau en kunt u direct gebruiken.

```ts
// Cache instellen
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL-eenheid: seconden

// Cache ophalen
const value = await app.cache.get('key');

// Cache verwijderen
await this.app.cache.del('key');
```

### ctx.cache

In middleware of resource-bewerkingen kunt u via `ctx.cache` toegang krijgen tot de cache.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache-miss, ophalen uit database
    data = await this.getDataFromDatabase();
    // Opslaan in cache, geldig voor 1 uur
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Aangepaste cache aanmaken

Als u een onafhankelijke cache-instantie wilt aanmaken (bijvoorbeeld met verschillende namespaces of configuraties), kunt u de `app.cacheManager.createCache()` methode gebruiken.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Een cache-instantie met voorvoegsel aanmaken
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Alle keys krijgen automatisch dit voorvoegsel
      store: 'memory', // Geheugencache gebruiken, optioneel, standaard wordt defaultStore gebruikt
      max: 1000, // Maximaal aantal cache-items
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache Parameterbeschrijving

| Parameter | Type | Beschrijving |
| ---- | ---- | ---- |
| `name` | `string` | Unieke identificatie voor de cache, verplicht |
| `prefix` | `string` | Optioneel, voorvoegsel voor cache keys, om conflicten te voorkomen |
| `store` | `string` | Optioneel, identificatie van het store-type (zoals `'memory'`, `'redis'`), standaard wordt `defaultStore` gebruikt |
| `[key: string]` | `any` | Andere store-gerelateerde aangepaste configuratie-items |

### Ophalen van aangemaakte cache

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Basis cachemethoden

Cache-instanties bieden uitgebreide methoden voor cache-bewerkingen, waarvan de meeste zijn geërfd van node-cache-manager.

### get / set

```ts
// Cache instellen, met vervaltijd (eenheid: seconden)
await cache.set('key', 'value', { ttl: 3600 });

// Cache ophalen
const value = await cache.get('key');
```

### del / reset

```ts
// Enkele key verwijderen
await cache.del('key');

// Alle cache wissen
await cache.reset();
```

### wrap

De `wrap()` methode is een zeer nuttig hulpmiddel dat eerst probeert gegevens uit de cache op te halen. Als de cache niet gevonden wordt (cache-miss), wordt de functie uitgevoerd en het resultaat in de cache opgeslagen.

```ts
const data = await cache.wrap('user:1', async () => {
  // Deze functie wordt alleen uitgevoerd bij een cache-miss
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Batchbewerkingen

```ts
// Batch instellen
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Batch ophalen
const values = await cache.mget(['key1', 'key2', 'key3']);

// Batch verwijderen
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Alle keys ophalen (let op: sommige stores ondersteunen dit mogelijk niet)
const allKeys = await cache.keys();

// Resterende vervaltijd van de key ophalen (eenheid: seconden)
const remainingTTL = await cache.ttl('key');
```

## Geavanceerd gebruik

### wrapWithCondition

`wrapWithCondition()` is vergelijkbaar met `wrap()`, maar u kunt via voorwaarden bepalen of de cache gebruikt moet worden.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Externe parameters bepalen of het cache-resultaat gebruikt wordt
    useCache: true, // Indien ingesteld op false, wordt de functie opnieuw uitgevoerd, zelfs als er cache bestaat

    // Bepalen of er gecachet moet worden op basis van het dataresultaat
    isCacheable: (value) => {
      // Bijvoorbeeld: alleen succesvolle resultaten cachen
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Object cache-bewerkingen

Wanneer de gecachete inhoud een object is, kunt u de volgende methoden gebruiken om direct de eigenschappen van het object te bewerken, zonder het hele object op te halen.

```ts
// Een eigenschap van een object instellen
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Een eigenschap van een object ophalen
const name = await cache.getValueInObject('user:1', 'name');

// Een eigenschap van een object verwijderen
await cache.delValueInObject('user:1', 'age');
```

## Aangepaste Store registreren

Als u andere cachetypen wilt gebruiken (zoals Memcached, MongoDB, enz.), kunt u deze registreren via `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Redis store registreren (indien het systeem deze nog niet heeft geregistreerd)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis verbindingsconfiguratie
      url: 'redis://localhost:6379',
    });

    // Cache aanmaken met de nieuw geregistreerde store
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Aandachtspunten

1.  **Limieten voor geheugencache**: Wanneer u de memory store gebruikt, let dan op het instellen van een redelijke `max` parameter om geheugenoverloop te voorkomen.
2.  **Cache-invalidatiestrategie**: Vergeet niet gerelateerde cache te wissen bij het bijwerken van gegevens om 'dirty data' te voorkomen.
3.  **Key-naamgevingsconventies**: Het wordt aanbevolen om betekenisvolle namespaces en voorvoegsels te gebruiken, zoals `module:resource:id`.
4.  **TTL-instellingen**: Stel de TTL redelijk in op basis van de frequentie van gegevensupdates om prestaties en consistentie in balans te houden.
5.  **Redis-verbinding**: Wanneer u Redis gebruikt, zorg er dan voor dat verbindingsparameters en wachtwoorden correct zijn geconfigureerd in de productieomgeving.