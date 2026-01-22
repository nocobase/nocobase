:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Cache

Modul Cache v NocoBase je postaven na knihovně <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> a poskytuje funkcionalitu cachování pro vývoj pluginů. Systém obsahuje dva vestavěné typy cache:

- **memory** – Mezipaměť v paměti založená na lru-cache, standardně poskytovaná knihovnou node-cache-manager.
- **redis** – Redis cache založená na node-cache-manager-redis-yet.

Další typy cache můžete rozšířit a zaregistrovat pomocí API.

## Základní použití

### app.cache

`app.cache` je výchozí instance cache na úrovni aplikace a můžete ji přímo používat.

```ts
// Nastavení cache
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL jednotka: sekundy

// Získání hodnoty z cache
const value = await app.cache.get('key');

// Smazání z cache
await this.app.cache.del('key');
```

### ctx.cache

V middleware nebo při operacích s prostředky můžete přistupovat k cache pomocí `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache miss (data nenalezena v cache), získejte z databáze
    data = await this.getDataFromDatabase();
    // Uložte do cache s platností 1 hodinu
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Vytvoření vlastní cache

Pokud potřebujete vytvořit nezávislou instanci cache (například pro různé jmenné prostory nebo konfigurace), můžete použít metodu `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Vytvoření instance cache s předponou
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Všechny klíče automaticky získají tuto předponu
      store: 'memory', // Použít paměťovou cache, volitelné, výchozí je defaultStore
      max: 1000, // Maximální počet položek v cache
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Popis parametrů `createCache`

| Parametr | Typ | Popis |
| -------- | ---- | ----- |
| `name` | `string` | Jedinečný identifikátor cache, povinné |
| `prefix` | `string` | Volitelné, předpona pro klíče cache, slouží k zamezení konfliktů klíčů |
| `store` | `string` | Volitelné, identifikátor typu úložiště (např. `'memory'`, `'redis'`), výchozí je `defaultStore` |
| `[key: string]` | `any` | Další vlastní konfigurační položky související s úložištěm |

### Získání vytvořené cache

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Základní metody cache

Instance cache poskytují bohatou sadu metod pro práci s cache, většina z nich je zděděna z node-cache-manager.

### get / set

```ts
// Nastavení cache s dobou platnosti (jednotka: sekundy)
await cache.set('key', 'value', { ttl: 3600 });

// Získání hodnoty z cache
const value = await cache.get('key');
```

### del / reset

```ts
// Smazání jednoho klíče
await cache.del('key');

// Vyprázdnění celé cache
await cache.reset();
```

### wrap

Metoda `wrap()` je velmi užitečný nástroj, který se nejprve pokusí získat data z cache. Pokud data v cache nejsou (cache miss), provede funkci a její výsledek uloží do cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // Tato funkce se spustí pouze v případě, že data nejsou v cache
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Dávkové operace

```ts
// Dávkové nastavení
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Dávkové získání
const values = await cache.mget(['key1', 'key2', 'key3']);

// Dávkové smazání
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Získání všech klíčů (poznámka: některé typy úložišť to nemusí podporovat)
const allKeys = await cache.keys();

// Získání zbývající doby platnosti klíče (jednotka: sekundy)
const remainingTTL = await cache.ttl('key');
```

## Pokročilé použití

### wrapWithCondition

Metoda `wrapWithCondition()` je podobná `wrap()`, ale umožňuje na základě podmínek rozhodnout, zda se má použít cache.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Externí parametry řídí, zda se má použít výsledek z cache
    useCache: true, // Pokud je nastaveno na false, funkce se provede znovu, i když cache existuje

    // Rozhodnutí o cachování na základě výsledku dat
    isCacheable: (value) => {
      // Například: cachovat pouze úspěšné výsledky
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Operace s objekty v cache

Pokud je obsah cache objekt, můžete použít následující metody k přímé manipulaci s jeho vlastnostmi, aniž byste museli získávat celý objekt.

```ts
// Nastavení konkrétní vlastnosti objektu
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Získání konkrétní vlastnosti objektu
const name = await cache.getValueInObject('user:1', 'name');

// Smazání konkrétní vlastnosti objektu
await cache.delValueInObject('user:1', 'age');
```

## Registrace vlastního úložiště (Store)

Pokud potřebujete použít jiné typy cache (například Memcached, MongoDB atd.), můžete je zaregistrovat pomocí `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Registrace Redis úložiště (pokud systém již není registrován)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Konfigurace připojení k Redis
      url: 'redis://localhost:6379',
    });

    // Vytvoření cache pomocí nově registrovaného úložiště
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Důležité poznámky

1. **Limity paměťové cache**: Při použití paměťového úložiště (memory store) dbejte na nastavení rozumného parametru `max`, abyste předešli přetečení paměti.
2. **Strategie zneplatnění cache**: Při aktualizaci dat nezapomeňte vyčistit související záznamy v cache, abyste předešli nekonzistentním datům.
3. **Konvence pojmenování klíčů**: Doporučuje se používat smysluplné jmenné prostory a předpony, například `modul:zdroj:id`.
4. **Nastavení TTL**: Nastavte TTL (Time To Live) rozumně na základě frekvence aktualizace dat, abyste vyvážili výkon a konzistenci.
5. **Připojení k Redis**: Při použití Redis se ujistěte, že jsou v produkčním prostředí správně nakonfigurovány parametry připojení a hesla.