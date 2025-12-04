:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# CacheManager

## Přehled

CacheManager je založen na <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> a poskytuje pro NocoBase správu modulů mezipaměti (cache). Vestavěné typy mezipaměti jsou:

- memory - lru-cache, kterou standardně poskytuje node-cache-manager
- redis - podporovaná balíčkem node-cache-manager-redis-yet

Další typy lze registrovat a rozšiřovat prostřednictvím API.

### Vysvětlení pojmů

- **Store**: Definuje metodu cachování, včetně tovární metody pro vytváření mezipamětí a dalších souvisejících konfigurací. Každá metoda cachování má jedinečný identifikátor, který se zadává při registraci.
  Jedinečné identifikátory pro dva vestavěné způsoby cachování jsou `memory` a `redis`.

- **Tovární metoda Store**: Metoda poskytovaná `node-cache-manager` a souvisejícími rozšiřujícími balíčky pro vytváření mezipamětí. Například `'memory'` poskytovaná standardně `node-cache-manager` nebo `redisStore` poskytovaná `node-cache-manager-redis-yet`. Odpovídá prvnímu parametru metody `caching` v `node-cache-manager`.

- **Cache**: Třída zapouzdřená v NocoBase, která poskytuje metody pro používání mezipaměti. Při skutečném používání mezipaměti pracujete s instancí `Cache`. Každá instance `Cache` má jedinečný identifikátor, který může sloužit jako jmenný prostor pro odlišení různých modulů.

## Metody třídy

### `constructor()`

#### Podpis

- `constructor(options?: CacheManagerOptions)`

#### Typy

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

#### Podrobnosti

##### CacheManagerOptions

| Vlastnost      | Typ                            | Popis                                                                                                                                                                                                                               |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Jedinečný identifikátor pro výchozí typ mezipaměti.                                                                                                                                                                                   |
| `stores`       | `Record<string, StoreOptions>` | Registruje typy mezipaměti. Klíč je jedinečný identifikátor typu mezipaměti a hodnota je objekt obsahující registrační metodu a globální konfiguraci pro daný typ.<br />V `node-cache-manager` je metoda pro vytvoření mezipaměti `await caching(store, config)`. Zde je třeba poskytnout objekt [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Vlastnost       | Typ                                    | Popis                                                                                                                                                                                          |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Tovární metoda pro store, odpovídá prvnímu parametru `caching`.                                                                                                                                  |
| `close`         | `(store: Store) => Promise<void>`      | Volitelné. Pro middleware jako Redis, který vyžaduje připojení, musí být poskytnuta zpětná metoda (callback) pro uzavření připojení. Vstupním parametrem je objekt vrácený tovární metodou store. |
| `[key: string]` | `any`                                  | Ostatní globální konfigurace pro store, odpovídá druhému parametru `caching`.                                                                                                                  |

#### Výchozí `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // globální konfigurace
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

Parametr `options` bude sloučen s výchozími možnostmi. Vlastnosti, které jsou již přítomny ve výchozích možnostech, lze vynechat. Například:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore je již poskytnut ve výchozích možnostech, stačí tedy poskytnout pouze konfiguraci pro redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registruje novou metodu cachování. Například:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // jedinečný identifikátor pro store
  name: 'redis',
  // tovární metoda pro vytvoření store
  store: redisStore,
  // ukončení připojení ke store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // globální konfigurace
  url: 'xxx',
});
```

#### Podpis

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Vytvoří mezipaměť. Například:

```ts
await cacheManager.createCache({
  name: 'default', // jedinečný identifikátor mezipaměti
  store: 'memory', // jedinečný identifikátor pro store
  prefix: 'mycache', // volitelně automaticky přidá prefix 'mycache:' ke klíčům mezipaměti
  // další konfigurace pro store, vlastní konfigurace budou sloučeny s globální konfigurací store
  max: 2000,
});
```

#### Podpis

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Podrobnosti

##### options

| Vlastnost       | Typ      | Popis                                                  |
| --------------- | -------- | ------------------------------------------------------ |
| `name`          | `string` | Jedinečný identifikátor mezipaměti.                      |
| `store`         | `string` | Jedinečný identifikátor pro store.                     |
| `prefix`        | `string` | Volitelné, prefix klíče mezipaměti.                    |
| `[key: string]` | `any`    | Ostatní vlastní konfigurační položky související se store. |

Pokud je `store` vynechán, použije se `defaultStore`. V tomto případě se metoda cachování bude měnit podle výchozí systémové metody cachování.

Pokud neexistují žádné vlastní konfigurace, vrátí se výchozí prostor mezipaměti vytvořený globální konfigurací a sdílený aktuální metodou cachování. Doporučuje se přidat `prefix`, aby se předešlo konfliktům klíčů.

```ts
// Použít výchozí mezipaměť s globální konfigurací
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Viz [Cache](./cache.md)

### `getCache()`

Získá odpovídající mezipaměť.

```ts
cacheManager.getCache('default');
```

#### Podpis

- `getCache(name: string): Cache`

### `flushAll()`

Resetuje všechny mezipaměti.

```ts
await cacheManager.flushAll();
```

### `close()`

Ukončí všechna připojení middleware mezipaměti.

```ts
await cacheManager.close();
```