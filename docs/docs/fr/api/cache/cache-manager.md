:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# CacheManager

## Vue d'ensemble

`CacheManager` est basé sur <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> et offre des fonctionnalités de gestion des modules de cache pour NocoBase. Les types de cache intégrés sont :

- `memory` : un `lru-cache` fourni par défaut par `node-cache-manager`.
- `redis` : supporté par `node-cache-manager-redis-yet`.

D'autres types peuvent être enregistrés et étendus via l'API.

### Concepts clés

- **Store** : Définit une méthode de mise en cache, incluant une méthode de fabrique pour créer des caches, ainsi que d'autres configurations associées. Chaque méthode de mise en cache possède un identifiant unique, fourni lors de l'enregistrement.
  Les identifiants uniques pour les deux méthodes de cache intégrées sont `memory` et `redis`.

- **Méthode de fabrique de Store** : Une méthode fournie par `node-cache-manager` et ses packages d'extension, utilisée pour créer des caches. Par exemple, `'memory'` fourni par défaut par `node-cache-manager`, ou `redisStore` fourni par `node-cache-manager-redis-yet`. Il s'agit du premier paramètre de la méthode `caching` de `node-cache-manager`.

- **Cache** : Une classe encapsulée par NocoBase qui fournit des méthodes pour utiliser le cache. Lors de l'utilisation effective du cache, vous interagissez avec une instance de `Cache`. Chaque instance de `Cache` possède un identifiant unique, qui peut servir d'espace de noms pour distinguer différents modules.

## Méthodes de classe

### `constructor()`

#### Signature

- `constructor(options?: CacheManagerOptions)`

#### Types

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

#### Détails

##### CacheManagerOptions

| Propriété      | Type                           | Description                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | L'identifiant unique du type de cache par défaut.                                                                                                                                                                                   |
| `stores`       | `Record<string, StoreOptions>` | Enregistre les types de cache. La clé est l'identifiant unique du type de cache, et la valeur est un objet contenant la méthode d'enregistrement et la configuration globale pour ce type de cache.<br />Dans `node-cache-manager`, la méthode pour créer un cache est `await caching(store, config)`. L'objet à fournir ici est [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Propriété       | Type                                   | Description                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | La méthode de fabrique du store, correspondant au premier paramètre de `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | Optionnel. Pour les middlewares comme Redis qui nécessitent une connexion, une méthode de rappel pour fermer la connexion doit être fournie. Le paramètre d'entrée est l'objet retourné par la méthode de fabrique du store. |
| `[key: string]` | `any`                                  | Autres configurations globales du store, correspondant au deuxième paramètre de `caching`.                                                                                                               |

#### `options` par défaut

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // Configuration globale
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

Le paramètre `options` sera fusionné avec les options par défaut. Les propriétés déjà présentes dans les options par défaut peuvent être omises. Par exemple :

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore est déjà fourni dans les options par défaut, vous n'avez donc qu'à fournir la configuration de redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Enregistre une nouvelle méthode de mise en cache. Par exemple :

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // Identifiant unique du store
  name: 'redis',
  // Méthode de fabrique pour créer le store
  store: redisStore,
  // Fermer la connexion du store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // Configuration globale
  url: 'xxx',
});
```

#### Signature

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Crée un cache. Par exemple :

```ts
await cacheManager.createCache({
  name: 'default', // Identifiant unique du cache
  store: 'memory', // Identifiant unique du store
  prefix: 'mycache', // Ajoute automatiquement le préfixe 'mycache:' aux clés de cache (optionnel)
  // Autres configurations du store, les configurations personnalisées seront fusionnées avec la configuration globale du store
  max: 2000,
});
```

#### Signature

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Détails

##### options

| Propriété       | Type     | Description                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | Identifiant unique du cache.                      |
| `store`         | `string` | Identifiant unique du store.                      |
| `prefix`        | `string` | Optionnel, préfixe pour les clés de cache.                           |
| `[key: string]` | `any`    | Autres éléments de configuration personnalisée liés au store. |

Si `store` est omis, `defaultStore` sera utilisé. Dans ce cas, la méthode de mise en cache changera en fonction de la méthode de cache par défaut du système.

S'il n'y a pas de configurations personnalisées, un espace de cache par défaut est retourné, créé à partir de la configuration globale et partagé par la méthode de cache actuelle. Il est recommandé d'ajouter un `prefix` pour éviter les conflits de clés.

```ts
// Utilise le cache par défaut avec la configuration globale
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Voir [Cache](./cache.md)

### `getCache()`

Récupère le cache correspondant.

```ts
cacheManager.getCache('default');
```

#### Signature

- `getCache(name: string): Cache`

### `flushAll()`

Réinitialise tous les caches.

```ts
await cacheManager.flushAll();
```

### `close()`

Ferme toutes les connexions des middlewares de cache.

```ts
await cacheManager.close();
```