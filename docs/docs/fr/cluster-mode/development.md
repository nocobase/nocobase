:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Développement de plugins

## Contexte

Dans un environnement à nœud unique, les plugins peuvent généralement répondre aux besoins via des états, des événements ou des tâches au sein du processus. Cependant, en mode cluster, le même plugin peut s'exécuter simultanément sur plusieurs instances, ce qui soulève les problèmes typiques suivants :

- **Cohérence de l'état** : Si les données de configuration ou d'exécution ne sont stockées qu'en mémoire, leur synchronisation entre les instances est difficile, ce qui peut entraîner des lectures incohérentes ou des exécutions en double.
- **Ordonnancement des tâches** : Sans un mécanisme clair de mise en file d'attente et de confirmation, les tâches de longue durée peuvent être exécutées simultanément par plusieurs instances.
- **Conditions de concurrence** : Les opérations impliquant des modifications de schéma ou l'allocation de ressources nécessitent une sérialisation pour éviter les conflits causés par des écritures concurrentes.

Le cœur de NocoBase intègre diverses interfaces middleware au niveau de la couche applicative pour aider les plugins à réutiliser des fonctionnalités unifiées dans un environnement cluster. Les sections suivantes présenteront l'utilisation et les meilleures pratiques en matière de mise en cache, de messagerie synchrone, de files d'attente de messages et de verrous distribués, avec des références au code source.

## Solutions

### Composant de cache (Cache)

Pour les données qui doivent être stockées en mémoire, il est recommandé d'utiliser le composant de cache intégré au système pour leur gestion.

- Récupérez l'instance de cache par défaut via `app.cache`.
- Le `Cache` offre des opérations de base comme `set/get/del/reset`, et prend également en charge `wrap` et `wrapWithCondition` pour encapsuler la logique de mise en cache, ainsi que des méthodes de traitement par lots comme `mset/mget/mdel`.
- Lors d'un déploiement en cluster, il est recommandé de placer les données partagées dans un stockage persistant (comme Redis) et de définir un `ttl` (durée de vie) raisonnable pour éviter la perte de cache en cas de redémarrage de l'instance.

Exemple : [Initialisation et utilisation du cache dans le `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Créer et utiliser un cache dans un plugin"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### Gestionnaire de messages synchrones (SyncMessageManager)

Si l'état en mémoire ne peut pas être géré avec un cache distribué (par exemple, s'il ne peut pas être sérialisé), alors lorsque l'état change suite à des actions utilisateur, cette modification doit être notifiée aux autres instances via un signal synchrone pour maintenir la cohérence de l'état.

- La classe de base des plugins a implémenté `sendSyncMessage`, qui appelle en interne `app.syncMessageManager.publish` et ajoute automatiquement un préfixe au niveau de l'application au canal pour éviter les conflits.
- `publish` peut spécifier une `transaction` ; le message sera alors envoyé après la validation de la transaction de base de données, garantissant ainsi la synchronisation de l'état et du message.
- Utilisez `handleSyncMessage` pour traiter les messages provenant d'autres instances. La souscription pendant la phase `beforeLoad` est très appropriée pour des scénarios tels que les modifications de configuration et la synchronisation de schéma.

Exemple : [`plugin-data-source-main` utilise des messages synchrones pour maintenir la cohérence du schéma sur plusieurs nœuds](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Synchroniser les mises à jour de schéma au sein d'un plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Appelle automatiquement app.syncMessageManager.publish
  }
}
```

### Gestionnaire de publication/souscription (PubSubManager)

La diffusion de messages est le composant sous-jacent des signaux synchrones et peut également être utilisée directement. Lorsque vous avez besoin de diffuser des messages entre les instances, vous pouvez le faire via ce composant.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` permet de s'abonner à un canal entre les instances ; l'option `debounce` est utilisée pour éviter les rappels fréquents causés par des diffusions répétées.
- `publish` prend en charge `skipSelf` (vrai par défaut) et `onlySelf` pour contrôler si le message est renvoyé à l'instance actuelle.
- Un adaptateur (tel que Redis, RabbitMQ, etc.) doit être configuré avant le démarrage de l'application ; sinon, elle ne se connectera pas à un système de messagerie externe par défaut.

Exemple : [`plugin-async-task-manager` utilise PubSub pour diffuser les événements d'annulation de tâche](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Diffuser un signal d'annulation de tâche"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Composant de file d'attente d'événements (EventQueue)

La file d'attente de messages est utilisée pour planifier des tâches asynchrones, ce qui convient aux opérations de longue durée ou aux opérations pouvant être retentées.

- Déclarez un consommateur avec `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` renvoie une `Promise`, et vous pouvez utiliser `AbortSignal.timeout` pour contrôler les délais d'attente.
- `publish` ajoute automatiquement le préfixe du nom de l'application et prend en charge des options comme `timeout` et `maxRetries`. Il utilise par défaut un adaptateur de file d'attente en mémoire, mais peut être basculé vers des adaptateurs étendus comme RabbitMQ si nécessaire.
- Dans un cluster, assurez-vous que tous les nœuds utilisent le même adaptateur pour éviter la fragmentation des tâches entre les nœuds.

Exemple : [`plugin-async-task-manager` utilise EventQueue pour planifier des tâches](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Distribuer des tâches asynchrones dans une file d'attente"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Gestionnaire de verrous distribués (LockManager)

Lorsque vous devez éviter les conditions de concurrence, vous pouvez utiliser un verrou distribué pour sérialiser l'accès à une ressource.

- Par défaut, un adaptateur `local` basé sur le processus est fourni. Vous pouvez enregistrer des implémentations distribuées comme Redis. Utilisez `app.lockManager.runExclusive(key, fn, ttl)` ou `acquire`/`tryAcquire` pour contrôler la concurrence.
- Le `ttl` (durée de vie) est utilisé comme mesure de sécurité pour libérer le verrou, l'empêchant d'être détenu indéfiniment dans des cas exceptionnels.
- Les scénarios courants incluent : les modifications de schéma, la prévention des tâches en double, la limitation de débit, etc.

Exemple : [`plugin-data-source-main` utilise un verrou distribué pour protéger le processus de suppression de champ](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Sérialiser l'opération de suppression de champ"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Recommandations de développement

- **Cohérence de l'état en mémoire** : Essayez d'éviter d'utiliser l'état en mémoire pendant le développement. Utilisez plutôt la mise en cache ou les messages synchrones pour maintenir la cohérence de l'état.
- **Priorisez la réutilisation des interfaces intégrées** : Utilisez des fonctionnalités unifiées comme `app.cache` et `app.syncMessageManager` pour éviter de réimplémenter la logique de communication inter-nœuds dans vos plugins.
- **Portez attention aux limites des transactions** : Les opérations transactionnelles doivent utiliser `transaction.afterCommit` (intégré à `syncMessageManager.publish`) pour garantir la cohérence des données et des messages.
- **Établissez une stratégie de repli** : Pour les tâches de file d'attente et de diffusion, définissez des valeurs raisonnables pour `timeout`, `maxRetries` et `debounce` afin d'éviter de nouveaux pics de trafic dans des situations exceptionnelles.
- **Utilisez la surveillance et la journalisation complémentaires** : Tirez parti des journaux d'application pour enregistrer des informations telles que les noms de canaux, les charges utiles des messages, les clés de verrouillage, etc., afin de faciliter le dépannage des problèmes intermittents dans un cluster.

Grâce à ces capacités, les plugins peuvent partager en toute sécurité l'état, synchroniser les configurations et planifier les tâches entre différentes instances, répondant ainsi aux exigences de stabilité et de cohérence des scénarios de déploiement en cluster.