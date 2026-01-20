:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Cache

Le module de cache de NocoBase est basé sur <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> et offre des fonctionnalités de mise en cache pour le développement de plugins. Le système intègre deux types de cache :

- **memory** - Un cache en mémoire basé sur `lru-cache`, fourni par défaut par `node-cache-manager`.
- **redis** - Un cache Redis basé sur `node-cache-manager-redis-yet`.

D'autres types de cache peuvent être étendus et enregistrés via l'API.

## Utilisation de base

### app.cache

`app.cache` est l'instance de cache par défaut au niveau de l'application et peut être utilisée directement.

```ts
// Définir le cache
await app.cache.set('key', 'value', { ttl: 3600 }); // Unité TTL : secondes

// Récupérer le cache
const value = await app.cache.get('key');

// Supprimer le cache
await this.app.cache.del('key');
```

### ctx.cache

Dans les middlewares ou les opérations de ressources, vous pouvez accéder au cache via `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Cache manqué, récupérer depuis la base de données
    data = await this.getDataFromDatabase();
    // Stocker dans le cache, valide pendant 1 heure
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Créer un cache personnalisé

Si vous avez besoin de créer une instance de cache indépendante (par exemple, avec des espaces de noms ou des configurations différents), vous pouvez utiliser la méthode `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Créer une instance de cache avec un préfixe
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Toutes les clés se verront ajouter ce préfixe automatiquement
      store: 'memory', // Utiliser le cache en mémoire, facultatif, utilise `defaultStore` par défaut
      max: 1000, // Nombre maximal d'éléments en cache
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Description des paramètres de `createCache`

| Paramètre | Type | Description |
| ---- | ---- | ---- |
| `name` | `string` | Identifiant unique du cache, obligatoire |
| `prefix` | `string` | Facultatif, préfixe pour les clés de cache, utilisé pour éviter les conflits de clés |
| `store` | `string` | Facultatif, identifiant du type de store (par exemple, `'memory'`, `'redis'`), utilise `defaultStore` par défaut |
| `[key: string]` | `any` | Autres options de configuration personnalisées liées au store |

### Récupérer un cache existant

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Méthodes de base du cache

Les instances de cache offrent de nombreuses méthodes d'opération, la plupart étant héritées de `node-cache-manager`.

### get / set

```ts
// Définir le cache, avec un temps d'expiration (unité : secondes)
await cache.set('key', 'value', { ttl: 3600 });

// Récupérer le cache
const value = await cache.get('key');
```

### del / reset

```ts
// Supprimer une seule clé
await cache.del('key');

// Vider tout le cache
await cache.reset();
```

### wrap

La méthode `wrap()` est un outil très utile : elle tente d'abord de récupérer les données du cache. Si le cache est manqué, elle exécute la fonction et stocke le résultat dans le cache.

```ts
const data = await cache.wrap('user:1', async () => {
  // Cette fonction s'exécute uniquement si le cache est manqué
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Opérations par lots

```ts
// Définir par lots
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Récupérer par lots
const values = await cache.mget(['key1', 'key2', 'key3']);

// Supprimer par lots
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Récupérer toutes les clés (attention : certains stores peuvent ne pas prendre en charge cette fonction)
const allKeys = await cache.keys();

// Récupérer le temps d'expiration restant pour une clé (unité : secondes)
const remainingTTL = await cache.ttl('key');
```

## Utilisation avancée

### wrapWithCondition

`wrapWithCondition()` est similaire à `wrap()`, mais permet de décider d'utiliser ou non le cache en fonction de conditions.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Les paramètres externes contrôlent l'utilisation du résultat du cache
    useCache: true, // Si défini sur `false`, la fonction sera réexécutée même si le cache existe

    // Décider de mettre en cache en fonction du résultat des données
    isCacheable: (value) => {
      // Par exemple : ne mettre en cache que les résultats réussis
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Opérations sur les objets en cache

Lorsque le contenu mis en cache est un objet, vous pouvez utiliser les méthodes suivantes pour manipuler directement les propriétés de l'objet, sans avoir à récupérer l'objet entier.

```ts
// Définir une propriété d'un objet
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Récupérer une propriété d'un objet
const name = await cache.getValueInObject('user:1', 'name');

// Supprimer une propriété d'un objet
await cache.delValueInObject('user:1', 'age');
```

## Enregistrer un store personnalisé

Si vous avez besoin d'utiliser d'autres types de cache (comme Memcached, MongoDB, etc.), vous pouvez les enregistrer via `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Enregistrer le store Redis (si le système ne l'a pas déjà fait)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Configuration de la connexion Redis
      url: 'redis://localhost:6379',
    });

    // Créer un cache en utilisant le store nouvellement enregistré
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Points à noter

1.  **Limites du cache en mémoire** : Lorsque vous utilisez le store `memory`, veillez à définir un paramètre `max` raisonnable pour éviter les débordements de mémoire.
2.  **Stratégie d'invalidation du cache** : Lors de la mise à jour des données, n'oubliez pas de vider le cache pertinent pour éviter les données obsolètes.
3.  **Conventions de nommage des clés** : Il est recommandé d'utiliser des espaces de noms et des préfixes significatifs, tels que `module:resource:id`.
4.  **Paramètres TTL** : Définissez le TTL de manière appropriée en fonction de la fréquence de mise à jour des données, afin d'équilibrer performance et cohérence.
5.  **Connexion Redis** : Lorsque vous utilisez Redis, assurez-vous que les paramètres de connexion et les mots de passe sont correctement configurés dans l'environnement de production.