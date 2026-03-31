:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Événements

Le serveur de NocoBase déclenche des événements tout au long du cycle de vie de l'application, du cycle de vie des `plugin`s et des opérations de base de données. Les développeurs de `plugin`s peuvent écouter ces événements pour implémenter des logiques d'extension, des opérations automatisées ou des comportements personnalisés.

Le système d'événements de NocoBase se divise principalement en deux niveaux :

- **`app.on()` - Événements au niveau de l'application** : Permettent d'écouter les événements liés au cycle de vie de l'application, tels que le démarrage, l'installation, l'activation de `plugin`s, etc.
- **`db.on()` - Événements au niveau de la base de données** : Permettent d'écouter les événements d'opération au niveau du modèle de données, comme la création, la mise à jour ou la suppression d'enregistrements.

Ces deux systèmes héritent de l'`EventEmitter` de Node.js et prennent en charge les interfaces standard `.on()`, `.off()` et `.emit()`. NocoBase étend également ce support avec `emitAsync`, qui permet de déclencher des événements de manière asynchrone et d'attendre que tous les écouteurs aient terminé leur exécution.

## Où enregistrer les écouteurs d'événements

Les écouteurs d'événements doivent généralement être enregistrés dans la méthode `beforeLoad()` du `plugin`. Cela garantit que les événements sont prêts dès la phase de chargement du `plugin` et que la logique ultérieure peut y répondre correctement.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Écouter les événements de l'application
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase a démarré');
    });

    // Écouter les événements de la base de données
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Nouveau post : ${model.get('title')}`);
      }
    });
  }
}
```

## Écouter les événements de l'application avec `app.on()`

Les événements de l'application sont utilisés pour capturer les changements de cycle de vie de l'application NocoBase et de ses `plugin`s. Ils sont idéaux pour la logique d'initialisation, l'enregistrement de ressources ou la détection de dépendances de `plugin`s.

### Types d'événements courants

| Nom de l'événement                  | Moment du déclenchement             | Usages typiques                                      |
|-------------------------------------|-------------------------------------|------------------------------------------------------|
| `beforeLoad` / `afterLoad`          | Avant / après le chargement de l'application | Enregistrer des ressources, initialiser la configuration |
| `beforeStart` / `afterStart`        | Avant / après le démarrage du service | Démarrer des tâches, afficher les logs de démarrage |
| `beforeInstall` / `afterInstall`    | Avant / après l'installation de l'application | Initialiser les données, importer des modèles        |
| `beforeStop` / `afterStop`          | Avant / après l'arrêt du service    | Nettoyer les ressources, sauvegarder l'état          |
| `beforeDestroy` / `afterDestroy`    | Avant / après la destruction de l'application | Supprimer le cache, déconnecter les connexions       |
| `beforeLoadPlugin` / `afterLoadPlugin` | Avant / après le chargement du `plugin` | Modifier la configuration du `plugin` ou étendre ses fonctionnalités |
| `beforeEnablePlugin` / `afterEnablePlugin` | Avant / après l'activation du `plugin` | Vérifier les dépendances, initialiser la logique du `plugin` |
| `beforeDisablePlugin` / `afterDisablePlugin` | Avant / après la désactivation du `plugin` | Nettoyer les ressources du `plugin`                  |
| `afterUpgrade`                      | Après la mise à niveau de l'application | Exécuter la migration de données ou des correctifs de compatibilité |

Exemple : Écouter l'événement de démarrage de l'application

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 Le service NocoBase a démarré !');
});
```

Exemple : Écouter l'événement de chargement d'un `plugin`

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Le plugin ${plugin.name} a été chargé`);
});
```

## Écouter les événements de la base de données avec `db.on()`

Les événements de la base de données permettent de capturer diverses modifications de données au niveau du modèle. Ils sont adaptés pour l'audit, la synchronisation, le remplissage automatique et d'autres opérations.

### Types d'événements courants

| Nom de l'événement                                                | Moment du déclenchement                                |
|-------------------------------------------------------------------|--------------------------------------------------------|
| `beforeSync` / `afterSync`                                        | Avant / après la synchronisation de la structure de la base de données |
| `beforeValidate` / `afterValidate`                                | Avant / après la validation des données                |
| `beforeCreate` / `afterCreate`                                    | Avant / après la création d'enregistrements            |
| `beforeUpdate` / `afterUpdate`                                    | Avant / après la mise à jour d'enregistrements         |
| `beforeSave` / `afterSave`                                        | Avant / après la sauvegarde (inclut la création et la mise à jour) |
| `beforeDestroy` / `afterDestroy`                                  | Avant / après la suppression d'enregistrements         |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Après les opérations incluant des données associées    |
| `beforeDefineCollection` / `afterDefineCollection`                | Avant / après la définition de `collection`s           |
| `beforeRemoveCollection` / `afterRemoveCollection`                | Avant / après la suppression de `collection`s          |

Exemple : Écouter l'événement après la création de données

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Les données ont été créées !');
});
```

Exemple : Écouter l'événement avant la mise à jour de données

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Les données sont sur le point d\'être mises à jour !');
});
```