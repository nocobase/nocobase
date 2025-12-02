:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# CacheManager

## Überblick

CacheManager basiert auf <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> und bietet NocoBase Funktionen zur Verwaltung von Cache-Modulen. Die integrierten Cache-Typen sind:

- memory – lru-cache, standardmäßig von node-cache-manager bereitgestellt
- redis – unterstützt durch node-cache-manager-redis-yet

Weitere Typen können über die API registriert und erweitert werden.

### Konzepte

- **Store**: Definiert eine Caching-Methode, einschließlich einer Factory-Methode zum Erstellen von Caches und anderer zugehöriger Konfigurationen. Jede Caching-Methode hat einen eindeutigen Bezeichner, der bei der Registrierung angegeben wird.
  Die eindeutigen Bezeichner für die beiden integrierten Caching-Methoden sind `memory` und `redis`.

- **Store Factory-Methode**: Eine Methode, die von `node-cache-manager` und zugehörigen Erweiterungspaketen zum Erstellen von Caches bereitgestellt wird. Zum Beispiel `'memory'`, standardmäßig von `node-cache-manager` bereitgestellt, und `redisStore`, bereitgestellt von `node-cache-manager-redis-yet`. Dies entspricht dem ersten Parameter der `caching`-Methode in `node-cache-manager`.

- **Cache**: Eine von NocoBase gekapselte Klasse, die Methoden zur Verwendung des Caches bereitstellt. Bei der tatsächlichen Verwendung des Caches arbeiten Sie mit einer Instanz von `Cache`. Jede `Cache`-Instanz hat einen eindeutigen Bezeichner, der als Namespace zur Unterscheidung verschiedener Module verwendet werden kann.

## Klassenmethoden

### `constructor()`

#### Signatur

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
  // global config
  [key: string]: any;
};
```

#### Details

##### CacheManagerOptions

| Eigenschaft    | Typ                            | Beschreibung                                                                                                                                                                                                                          |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Der eindeutige Bezeichner für den Standard-Cache-Typ.                                                                                                                                                                                 |
| `stores`       | `Record<string, StoreOptions>` | Registriert Cache-Typen. Der Schlüssel ist der eindeutige Bezeichner für den Cache-Typ, und der Wert ist ein Objekt, das die Registrierungsmethode und die globale Konfiguration für den Cache-Typ enthält.<br />In `node-cache-manager` ist die Methode zum Erstellen eines Caches `await caching(store, config)`. Das hier bereitzustellende Objekt ist [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Eigenschaft     | Typ                                   | Beschreibung                                                                                                                                                                                            |
| --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Die Store-Factory-Methode, entsprechend dem ersten Parameter von `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`     | Optional. Für Middleware wie Redis, die eine Verbindung erfordert, muss eine Callback-Methode zum Schließen der Verbindung bereitgestellt werden. Der Eingabeparameter ist das Objekt, das von der Store-Factory-Methode zurückgegeben wird. |
| `[key: string]` | `any`                                 | Andere globale Store-Konfigurationen, entsprechend dem zweiten Parameter von `caching`.                                                                                                               |

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

Der `options`-Parameter wird mit den Standardoptionen zusammengeführt. Eigenschaften, die bereits in den Standardoptionen vorhanden sind, können weggelassen werden. Zum Beispiel:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore ist bereits in den Standardoptionen enthalten, Sie müssen also nur die redisStore-Konfiguration angeben.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Registriert eine neue Caching-Methode. Zum Beispiel:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // eindeutiger Bezeichner für den Store
  name: 'redis',
  // Factory-Methode zum Erstellen des Stores
  store: redisStore,
  // Store-Verbindung schließen
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // globale Konfiguration
  url: 'xxx',
});
```

#### Signatur

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Erstellt einen Cache. Zum Beispiel:

```ts
await cacheManager.createCache({
  name: 'default', // eindeutiger Bezeichner für den Cache
  store: 'memory', // eindeutiger Bezeichner für den Store
  prefix: 'mycache', // fügt Cache-Schlüsseln automatisch das Präfix 'mycache:' hinzu, optional
  // andere Store-Konfigurationen, benutzerdefinierte Konfigurationen werden mit der globalen Store-Konfiguration zusammengeführt
  max: 2000,
});
```

#### Signatur

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Details

##### options

| Eigenschaft     | Typ      | Beschreibung                                           |
| --------------- | -------- | ------------------------------------------------------ |
| `name`          | `string` | Eindeutiger Bezeichner für den Cache.                  |
| `store`         | `string` | Eindeutiger Bezeichner für den Store.                  |
| `prefix`        | `string` | Optional, Präfix für Cache-Schlüssel.                  |
| `[key: string]` | `any`    | Andere benutzerdefinierte Konfigurationselemente, die sich auf den Store beziehen. |

Wenn `store` weggelassen wird, wird `defaultStore` verwendet. In diesem Fall ändert sich die Caching-Methode entsprechend der Standard-Caching-Methode des Systems.

Wenn keine benutzerdefinierten Konfigurationen vorhanden sind, wird der Standard-Cache-Bereich zurückgegeben, der von der globalen Konfiguration erstellt und von der aktuellen Caching-Methode gemeinsam genutzt wird. Es wird empfohlen, ein `prefix` hinzuzufügen, um Schlüsselkonflikte zu vermeiden.

```ts
// Verwenden Sie den Standard-Cache mit globaler Konfiguration
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Siehe [Cache](./cache.md)

### `getCache()`

Ruft den entsprechenden Cache ab.

```ts
cacheManager.getCache('default');
```

#### Signatur

- `getCache(name: string): Cache`

### `flushAll()`

Setzt alle Caches zurück.

```ts
await cacheManager.flushAll();
```

### `close()`

Schließt alle Cache-Middleware-Verbindungen.

```ts
await cacheManager.close();
```