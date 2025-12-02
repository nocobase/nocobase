:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Plugin

Dans NocoBase, un plugin offre une approche modulaire pour étendre et personnaliser les fonctionnalités côté serveur. Les développeurs peuvent étendre la classe `Plugin` de `@nocobase/server` pour enregistrer des événements, des interfaces, des configurations de permissions et d'autres logiques personnalisées à différentes étapes de leur cycle de vie.

## Classe de plugin

Voici la structure d'une classe de plugin de base :

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Cycle de vie

Les méthodes du cycle de vie d'un plugin s'exécutent dans l'ordre suivant. Chaque méthode a un moment d'exécution et un objectif spécifiques :

| Méthode de cycle de vie | Moment d'exécution | Description |
|-------------------------|--------------------|-------------|
| **staticImport()**        | Avant le chargement du plugin | Méthode de classe statique, exécutée pendant la phase d'initialisation indépendante de l'état de l'application ou du plugin. Elle est utilisée pour les tâches d'initialisation qui ne dépendent pas d'une instance de plugin. |
| **afterAdd()**            | Immédiatement après l'ajout du plugin au gestionnaire de plugins | L'instance du plugin est créée, mais tous les plugins ne sont pas encore initialisés. Permet d'effectuer des initialisations de base. |
| **beforeLoad()**          | Avant la méthode `load()` de tous les plugins | À ce stade, vous pouvez accéder à toutes les **instances de plugins activés**. Idéal pour enregistrer des modèles de base de données, écouter des événements de base de données, enregistrer des middlewares et d'autres travaux de préparation. |
| **load()**                | Lors du chargement du plugin | La méthode `load()` ne commence qu'après l'exécution de `beforeLoad()` de tous les plugins. Convient pour enregistrer des ressources, des interfaces API, des services et d'autres logiques métier essentielles. |
| **install()**             | Lors de la première activation du plugin | Cette méthode n'est exécutée qu'une seule fois, lors de la première activation du plugin. Elle est généralement utilisée pour initialiser les structures de tables de base de données, insérer des données initiales et d'autres logiques d'installation. |
| **afterEnable()**         | Après l'activation du plugin | Cette méthode est exécutée chaque fois qu'un plugin est activé. Elle peut être utilisée pour démarrer des tâches planifiées, enregistrer des tâches récurrentes, établir des connexions et d'autres actions post-activation. |
| **afterDisable()**        | Après la désactivation du plugin | Cette méthode est exécutée lorsqu'un plugin est désactivé. Elle peut être utilisée pour nettoyer les ressources, arrêter les tâches, fermer les connexions et d'autres travaux de nettoyage. |
| **remove()**              | Lors de la suppression du plugin | Cette méthode est exécutée lorsque le plugin est complètement supprimé. Elle est utilisée pour la logique de désinstallation, comme la suppression de tables de base de données, le nettoyage de fichiers, etc. |
| **handleSyncMessage(message)** | Synchronisation des messages en déploiement multi-nœuds | Lorsque l'application fonctionne en mode multi-nœuds, cette méthode est utilisée pour traiter les messages synchronisés depuis d'autres nœuds. |

### Ordre d'exécution

Voici le déroulement typique de l'exécution des méthodes de cycle de vie :

1.  **Phase d'initialisation statique** : `staticImport()`
2.  **Phase de démarrage de l'application** : `afterAdd()` → `beforeLoad()` → `load()`
3.  **Phase de première activation du plugin** : `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Phase de réactivation du plugin** : `afterAdd()` → `beforeLoad()` → `load()`
5.  **Phase de désactivation du plugin** : `afterDisable()` est exécuté lorsqu'un plugin est désactivé.
6.  **Phase de suppression du plugin** : `remove()` est exécuté lorsqu'un plugin est supprimé.

## L'objet `app` et ses membres

Lors du développement de plugins, vous pouvez accéder à diverses API fournies par l'instance de l'application via `this.app`. C'est l'interface principale pour étendre les fonctionnalités des plugins. L'objet `app` contient les différents modules fonctionnels du système. Les développeurs peuvent utiliser ces modules dans les méthodes de cycle de vie des plugins pour implémenter leurs besoins métier.

### Liste des membres de l'objet `app`

| Nom du membre | Type/Module | Objectif principal |
|---------------|-------------|--------------------|
| **logger** | `Logger` | Enregistre les logs système, prend en charge différents niveaux (info, warn, error, debug) de sortie de log, facilitant le débogage et la surveillance. Voir [Logs](./logger.md) |
| **db** | `Database` | Fournit des opérations de couche ORM, l'enregistrement de modèles, l'écoute d'événements, le contrôle des transactions et d'autres fonctions liées à la base de données. Voir [Base de données](./database.md). |
| **resourceManager** | `ResourceManager` | Utilisé pour enregistrer et gérer les ressources d'API REST et les gestionnaires d'opérations. Voir [Gestionnaire de ressources](./resource-manager.md). |
| **acl** | `ACL` | Couche de contrôle d'accès, utilisée pour définir les permissions, les rôles et les politiques d'accès aux ressources, implémentant un contrôle d'accès granulaire. Voir [Contrôle d'accès (ACL)](./acl.md). |
| **cacheManager** | `CacheManager` | Gère le cache au niveau du système, prend en charge Redis, le cache en mémoire et d'autres backends de cache pour améliorer les performances de l'application. Voir [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Utilisé pour enregistrer, démarrer et gérer les tâches planifiées, prend en charge la configuration d'expressions Cron. Voir [Tâches planifiées](./cron-job-manager.md) |
| **i18n** | `I18n` | Support de l'internationalisation, fournit des fonctionnalités de traduction multilingue et de localisation, facilitant le support multilingue pour les plugins. Voir [Internationalisation](./i18n.md) |
| **cli** | `CLI` | Gère l'interface de ligne de commande, enregistre et exécute des commandes personnalisées, étend les fonctionnalités de la CLI de NocoBase. Voir [Ligne de commande](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Gère plusieurs instances de **source de données** et leurs connexions, prend en charge les scénarios multi-sources de données. Voir [Gestion des sources de données](./collections.md) |
| **pm** | `PluginManager` | **Gestionnaire de plugins**, utilisé pour charger, activer, désactiver et supprimer dynamiquement les plugins, gérer les dépendances entre plugins. |

> Astuce : Pour une utilisation détaillée de chaque module, veuillez vous référer aux chapitres de documentation correspondants.