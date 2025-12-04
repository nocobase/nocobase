:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# CacheManager

## Przegląd

CacheManager bazuje na <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> i zapewnia NocoBase funkcje zarządzania modułami pamięci podręcznej. Wbudowane typy pamięci podręcznej to:

- memory – lru-cache domyślnie dostarczany przez node-cache-manager
- redis – wspierany przez node-cache-manager-redis-yet

Więcej typów można zarejestrować i rozszerzyć za pomocą API.

### Kluczowe pojęcia

- **Store**: Definiuje metodę buforowania, w tym metodę fabryczną do tworzenia pamięci podręcznych i inne powiązane konfiguracje. Każda metoda buforowania ma unikalny identyfikator, który jest podawany podczas rejestracji.
  Unikalne identyfikatory dla dwóch wbudowanych metod buforowania to `memory` i `redis`.

- **Metoda fabryczna Store**: Metoda dostarczana przez `node-cache-manager` i powiązane pakiety rozszerzeń do tworzenia pamięci podręcznych. Na przykład, `'memory'` domyślnie dostarczany przez `node-cache-manager` oraz `redisStore` dostarczany przez `node-cache-manager-redis-yet`. Odpowiada to pierwszemu parametrowi metody `caching` w `node-cache-manager`.

- **Cache**: Klasa hermetyzowana przez NocoBase, która udostępnia metody do korzystania z pamięci podręcznej. Podczas faktycznego używania pamięci podręcznej, operuje się na instancji `Cache`. Każda instancja `Cache` ma unikalny identyfikator, który może być używany jako przestrzeń nazw do rozróżniania różnych modułów.

## Metody klasy

### `constructor()`

#### Sygnatura

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

#### Szczegóły

##### CacheManagerOptions

| Właściwość     | Typ                            | Opis                                                                                                                                                                                                                                  |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Unikalny identyfikator domyślnego typu pamięci podręcznej.                                                                                                                                                                              |
| `stores`       | `Record<string, StoreOptions>` | Rejestruje typy pamięci podręcznej. Kluczem jest unikalny identyfikator typu pamięci podręcznej, a wartością jest obiekt zawierający metodę rejestracji i globalną konfigurację dla danego typu pamięci podręcznej.<br />W `node-cache-manager` metoda tworzenia pamięci podręcznej to `await caching(store, config)`. Obiekt, który należy tutaj dostarczyć, to [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Właściwość      | Typ                                    | Opis                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Metoda fabryczna store, odpowiadająca pierwszemu parametrowi `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | Opcjonalne. Dla oprogramowania pośredniczącego, takiego jak Redis, które wymaga połączenia, należy podać metodę zwrotną do zamknięcia połączenia. Parametrem wejściowym jest obiekt zwrócony przez metodę fabryczną store. |
| `[key: string]` | `any`                                  | Inne globalne konfiguracje store, odpowiadające drugiemu parametrowi `caching`.                                                                                                               |

#### Domyślne `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // konfiguracja globalna
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

Parametr `options` zostanie połączony z domyślnymi opcjami. Właściwości już obecne w domyślnych opcjach można pominąć. Na przykład:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore jest już dostarczony w domyślnych opcjach, więc wystarczy podać tylko konfigurację redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Rejestruje nową metodę buforowania. Na przykład:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // unikalny identyfikator dla store
  name: 'redis',
  // metoda fabryczna do tworzenia store
  store: redisStore,
  // zamknięcie połączenia store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // konfiguracja globalna
  url: 'xxx',
});
```

#### Sygnatura

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Tworzy pamięć podręczną. Na przykład:

```ts
await cacheManager.createCache({
  name: 'default', // unikalny identyfikator dla pamięci podręcznej
  store: 'memory', // unikalny identyfikator dla store
  prefix: 'mycache', // automatycznie dodaje prefiks 'mycache:' do kluczy pamięci podręcznej, opcjonalnie
  // inne konfiguracje store, niestandardowe konfiguracje zostaną połączone z globalną konfiguracją store
  max: 2000,
});
```

#### Sygnatura

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Szczegóły

##### options

| Właściwość      | Typ      | Opis                                                      |
| --------------- | -------- | --------------------------------------------------------- |
| `name`          | `string` | Unikalny identyfikator dla pamięci podręcznej.            |
| `store`         | `string` | Unikalny identyfikator dla store.                         |
| `prefix`        | `string` | Opcjonalny, prefiks klucza pamięci podręcznej.            |
| `[key: string]` | `any`    | Inne niestandardowe elementy konfiguracji związane ze store. |

Jeśli `store` zostanie pominięty, zostanie użyty `defaultStore`. W takim przypadku metoda buforowania zmieni się zgodnie z domyślną metodą buforowania systemu.

Gdy nie ma niestandardowych konfiguracji, zwracana jest domyślna przestrzeń pamięci podręcznej utworzona przez konfigurację globalną i współdzielona przez bieżącą metodę buforowania. Zaleca się dodanie `prefixu`, aby uniknąć konfliktów kluczy.

```ts
// Użyj domyślnej pamięci podręcznej z konfiguracją globalną
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Zobacz [Cache](./cache.md)

### `getCache()`

Pobiera odpowiednią pamięć podręczną.

```ts
cacheManager.getCache('default');
```

#### Sygnatura

- `getCache(name: string): Cache`

### `flushAll()`

Resetuje wszystkie pamięci podręczne.

```ts
await cacheManager.flushAll();
```

### `close()`

Zamyka wszystkie połączenia oprogramowania pośredniczącego pamięci podręcznej.

```ts
await cacheManager.close();
```