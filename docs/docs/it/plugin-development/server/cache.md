:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Cache

Il modulo Cache di NocoBase si basa su <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> e offre funzionalità di caching per lo sviluppo di **plugin**. Il sistema include due tipi di cache predefiniti:

-   **memory** - Una cache in memoria basata su lru-cache, fornita di default da node-cache-manager.
-   **redis** - Una cache Redis basata su node-cache-manager-redis-yet.

È possibile estendere e registrare ulteriori tipi di cache tramite API.

## Utilizzo di Base

### app.cache

`app.cache` è l'istanza di cache predefinita a livello di applicazione e può essere utilizzata direttamente.

```ts
// Imposta la cache
await app.cache.set('key', 'value', { ttl: 3600 }); // Unità TTL: secondi

// Recupera dalla cache
const value = await app.cache.get('key');

// Elimina dalla cache
await this.app.cache.del('key');
```

### ctx.cache

Nei middleware o nelle operazioni sulle risorse, può accedere alla cache tramite `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss, recupera dal database
    data = await this.getDataFromDatabase();
    // Memorizza nella cache, valido per 1 ora
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Creare una Cache Personalizzata

Se ha bisogno di creare un'istanza di cache indipendente (ad esempio, con namespace o configurazioni diverse), può utilizzare il metodo `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Crea un'istanza di cache con prefisso
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Tutte le chiavi aggiungeranno automaticamente questo prefisso
      store: 'memory', // Utilizza la cache in memoria (opzionale, per default usa defaultStore)
      max: 1000, // Numero massimo di elementi nella cache
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Descrizione dei Parametri di `createCache`

| Parametro      | Tipo     | Descrizione                                                              |
| :------------- | :------- | :----------------------------------------------------------------------- |
| `name`         | `string` | Identificatore univoco per la cache, obbligatorio                        |
| `prefix`       | `string` | Opzionale, prefisso per le chiavi della cache, utilizzato per evitare conflitti di chiavi. |
| `store`        | `string` | Opzionale, identificatore del tipo di store (ad esempio `'memory'`, `'redis'`), per default usa `defaultStore`. |
| `[key: string]` | `any`    | Altre opzioni di configurazione personalizzate relative allo store.      |

### Recuperare una Cache Esistente

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Metodi Base della Cache

Le istanze di Cache offrono numerosi metodi per le operazioni di caching, la maggior parte dei quali ereditati da node-cache-manager.

### get / set

```ts
// Imposta la cache con tempo di scadenza (unità: secondi)
await cache.set('key', 'value', { ttl: 3600 });

// Recupera dalla cache
const value = await cache.get('key');
```

### del / reset

```ts
// Elimina una singola chiave
await cache.del('key');

// Svuota tutta la cache
await cache.reset();
```

### wrap

Il metodo `wrap()` è uno strumento molto utile: tenta prima di recuperare i dati dalla cache e, in caso di cache miss, esegue la funzione e memorizza il risultato nella cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // Questa funzione viene eseguita solo in caso di cache miss
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Operazioni Batch

```ts
// Impostazione batch
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Recupero batch
const values = await cache.mget(['key1', 'key2', 'key3']);

// Eliminazione batch
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Recupera tutte le chiavi (nota: alcuni store potrebbero non supportarlo)
const allKeys = await cache.keys();

// Recupera il tempo di scadenza rimanente per la chiave (unità: secondi)
const remainingTTL = await cache.ttl('key');
```

## Utilizzo Avanzato

### wrapWithCondition

`wrapWithCondition()` è simile a `wrap()`, ma permette di decidere se utilizzare la cache tramite condizioni.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Parametri esterni controllano se utilizzare il risultato della cache
    useCache: true, // Se impostato su false, la funzione verrà rieseguita anche se la cache esiste

    // Decide se memorizzare nella cache in base al risultato dei dati
    isCacheable: (value) => {
      // Ad esempio: memorizza nella cache solo i risultati di successo
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Operazioni di Cache su Oggetti

Quando il contenuto della cache è un oggetto, può utilizzare i seguenti metodi per operare direttamente sulle proprietà dell'oggetto, senza dover recuperare l'intero oggetto.

```ts
// Imposta una proprietà di un oggetto
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Recupera una proprietà di un oggetto
const name = await cache.getValueInObject('user:1', 'name');

// Elimina una proprietà di un oggetto
await cache.delValueInObject('user:1', 'age');
```

## Registrare uno Store Personalizzato

Se ha bisogno di utilizzare altri tipi di cache (come Memcached, MongoDB, ecc.), può registrarli tramite `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Registra lo store Redis (se non è già stato registrato dal sistema)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Configurazione della connessione Redis
      url: 'redis://localhost:6379',
    });

    // Crea una cache utilizzando lo store appena registrato
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Note Importanti

1.  **Limiti della Cache in Memoria**: Quando utilizza lo store `memory`, presti attenzione a impostare un parametro `max` ragionevole per evitare l'overflow di memoria.
2.  **Strategia di Invalidazione della Cache**: Quando aggiorna i dati, si ricordi di cancellare la cache correlata per evitare dati obsoleti.
3.  **Convenzioni di Nomenclatura delle Chiavi**: Si consiglia di utilizzare namespace e prefissi significativi, come `module:resource:id`.
4.  **Impostazioni TTL**: Imposti il TTL in modo ragionevole in base alla frequenza di aggiornamento dei dati, bilanciando prestazioni e coerenza.
5.  **Connessione Redis**: Quando utilizza Redis, si assicuri che i parametri di connessione e le password siano configurati correttamente nell'ambiente di produzione.