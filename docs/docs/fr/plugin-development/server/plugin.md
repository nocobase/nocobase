---
title: "Server Plugin Plugin serveur"
description: "Plugin serveur NocoBase : hériter de la classe Plugin, cycles de vie afterAdd, beforeLoad, load, install, enregistrer des ressources et événements."
keywords: "Server Plugin, classe Plugin, afterAdd, beforeLoad, load, install, plugin serveur, NocoBase"
---

# Plugin

Dans NocoBase, le **plugin serveur (Server Plugin)** est le principal moyen d'étendre les fonctionnalités côté serveur. Vous pouvez hériter de la classe de base `Plugin` fournie par `@nocobase/server` dans `src/server/plugin.ts` du répertoire du plugin, puis enregistrer à différentes étapes du cycle de vie des événements, des interfaces, des autorisations et d'autres logiques personnalisées.

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

Les méthodes du cycle de vie du plugin s'exécutent dans l'ordre suivant ; chaque méthode a un moment d'exécution et un objectif spécifiques :

| Méthode du cycle de vie | Moment d'exécution | Description |
|--------------|----------|------|
| **staticImport()** | Avant le chargement du plugin | Méthode statique de la classe, exécutée lors de la phase d'initialisation indépendante de l'état de l'application ou du plugin ; sert aux travaux d'initialisation qui ne dépendent pas de l'instance du plugin. |
| **afterAdd()** | Immédiatement après l'ajout du plugin au PluginManager | À ce stade, l'instance du plugin est créée, mais tous les plugins ne sont pas encore complètement initialisés ; vous pouvez effectuer quelques initialisations de base. |
| **beforeLoad()** | Avant le `load()` de tous les plugins | À ce stade, vous pouvez accéder à toutes les **instances de plugins activés**. Idéal pour enregistrer des modèles de base de données, écouter des événements de base de données, enregistrer des middlewares et autres travaux de préparation. |
| **load()** | Lors du chargement du plugin | `load()` ne commence à s'exécuter qu'une fois que tous les `beforeLoad()` des plugins ont fini de s'exécuter. Idéal pour enregistrer la logique métier centrale comme les ressources, les interfaces API, etc. — par exemple en enregistrant une [API REST personnalisée](./resource-manager.md) via `resourceManager`. **Attention :** durant la phase `load()`, la base de données n'a pas encore terminé sa synchronisation et ne permet pas d'effectuer des requêtes ou des écritures — les opérations de base de données doivent être placées dans `install()` ou dans les fonctions de traitement des requêtes. |
| **install()** | Lors de la première activation du plugin | S'exécute une seule fois, lors de la première activation du plugin ; généralement utilisé pour la logique d'installation comme l'initialisation des structures de tables de la base de données, l'insertion des données initiales, etc. `install()` ne s'exécute qu'à la première activation — si une version ultérieure doit modifier la structure des tables ou migrer les données, utilisez les [Migrations de mise à niveau](./migration.md). |
| **afterEnable()** | Après l'activation du plugin | S'exécute chaque fois que le plugin est activé ; permet de démarrer des tâches planifiées, d'établir des connexions, etc. |
| **afterDisable()** | Après la désactivation du plugin | Permet de nettoyer les ressources, d'arrêter les tâches, de fermer les connexions, etc. |
| **remove()** | Lors de la suppression du plugin | Sert à écrire la logique de désinstallation, par exemple supprimer les tables de la base de données, nettoyer les fichiers, etc. |
| **handleSyncMessage(message)** | Synchronisation des messages en déploiement multi-nœuds | Lorsque l'application fonctionne en mode multi-nœuds, traite les messages synchronisés depuis d'autres nœuds. |

### Description de l'ordre d'exécution

Flux d'exécution typique des méthodes du cycle de vie :

1. **Phase d'initialisation statique** : `staticImport()`
2. **Phase de démarrage de l'application** : `afterAdd()` → `beforeLoad()` → `load()`
3. **Phase de première activation du plugin** : `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Phase de réactivation du plugin** : `afterAdd()` → `beforeLoad()` → `load()`
5. **Phase de désactivation du plugin** : `afterDisable()` est exécuté lors de la désactivation du plugin
6. **Phase de suppression du plugin** : `remove()` est exécuté lors de la suppression du plugin

## app et ses membres associés

Lors du développement de plugins, `this.app` permet d'accéder aux différentes API fournies par l'instance de l'application — c'est le point d'entrée central pour étendre les fonctionnalités via les plugins. L'objet `app` contient les différents modules fonctionnels du système, et vous pouvez les utiliser dans les méthodes du cycle de vie du plugin.

### Liste des membres de app

| Nom du membre | Type / Module | Usage principal |
|-----------|------------|-----------|
| **logger** | `Logger` | Enregistre les journaux système ; prend en charge les niveaux info, warn, error, debug, etc. Voir [Logger](./logger.md). |
| **db** | `Database` | Opérations de la couche ORM, enregistrement de modèles, écoute d'événements, contrôle des transactions, etc. Voir [Database](./database.md). |
| **resourceManager** | `ResourceManager` | Enregistre et gère les ressources d'API REST et leurs handlers d'opérations. Voir [ResourceManager](./resource-manager.md). |
| **acl** | `ACL` | Définit les autorisations, les rôles et les politiques d'accès aux ressources. Voir [ACL](./acl.md). |
| **cacheManager** | `CacheManager` | Gère le cache au niveau du système, prend en charge plusieurs backends comme Redis, le cache en mémoire, etc. Voir [Cache](./cache.md). |
| **cronJobManager** | `CronJobManager` | Enregistre et gère les tâches planifiées, prend en charge les expressions Cron. Voir [CronJobManager](./cron-job-manager.md). |
| **i18n** | `I18n` | Traduction multilingue et localisation. Voir [I18n](./i18n.md). |
| **cli** | `CLI` | Enregistre des commandes personnalisées, étend la CLI NocoBase. Voir [Command](./command.md). |
| **dataSourceManager** | `DataSourceManager` | Gère plusieurs instances de sources de données et leurs connexions. Voir [DataSourceManager](./data-source-manager.md). |
| **pm** | `PluginManager` | Charge dynamiquement, active, désactive, supprime des plugins ; gère les dépendances inter-plugins. |

:::tip Astuce

Pour l'utilisation détaillée de chaque module, veuillez vous référer aux chapitres de documentation correspondants.

:::

## Liens connexes

- [Aperçu du développement serveur](./index.md) — vue d'ensemble et navigation des modules serveur
- [Collections](./collections.md) — définir ou étendre la structure des collections via du code
- [Database](./database.md) — CRUD, Repository, transactions et événements de base de données
- [Migration](./migration.md) — scripts de migration de données lors des mises à niveau de plugin
- [Event](./event.md) — écoute et traitement des événements au niveau de l'application et de la base de données
- [ResourceManager](./resource-manager.md) — enregistrer des API REST et opérations personnalisées
- [Écrire votre premier plugin](../write-your-first-plugin.md) — créer un plugin complet de zéro
- [Logger](./logger.md) — enregistrer des journaux système
- [ACL](./acl.md) — définir des autorisations et politiques d'accès
- [Cache](./cache.md) — gérer le cache au niveau du système
- [CronJobManager](./cron-job-manager.md) — enregistrer et gérer des tâches planifiées
- [I18n](./i18n.md) — traduction multilingue
- [Command](./command.md) — enregistrer des commandes CLI personnalisées
- [DataSourceManager](./data-source-manager.md) — gérer plusieurs sources de données
