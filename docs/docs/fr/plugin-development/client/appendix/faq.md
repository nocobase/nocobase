---
title: "FAQ & guide de dépannage"
description: "Questions fréquentes lors du développement de plugins client NocoBase : plugin invisible, bloc absent, traduction inactive, route introuvable, hot reload inopérant, erreurs de build/packaging, échecs de démarrage après déploiement, etc."
keywords: "FAQ,questions fréquentes,dépannage,Troubleshooting,NocoBase,build,déploiement,tar,axios"
---

# FAQ & guide de dépannage

Cette page rassemble les pièges les plus courants lors du développement de plugins côté client. Si vous rencontrez le cas « j'ai pourtant tout écrit correctement mais rien ne fonctionne », commencez par chercher ici.

## Plugin

### Le plugin n'apparaît pas dans le gestionnaire après création

Vérifiez que vous avez bien exécuté `yarn pm create` plutôt que créé les répertoires à la main. En plus de générer les fichiers, `yarn pm create` enregistre le plugin dans la table `applicationPlugins` de la base de données. Si vous avez créé les répertoires manuellement, exécutez `yarn nocobase upgrade` pour relancer le scan.

### La page ne change pas après l'activation du plugin

Vérifiez dans cet ordre :

1. Confirmez que vous avez exécuté `yarn pm enable <pluginName>`
2. Rafraîchissez le navigateur (parfois un rafraîchissement forcé `Ctrl+Shift+R` est nécessaire)
3. Vérifiez la console du navigateur pour les erreurs

### La page ne se met pas à jour après modification du code

Le comportement du hot reload diffère selon le type de fichier :

| Type de fichier | Action requise après modification |
| --- | --- |
| tsx/ts sous `src/client-v2/` | Hot reload automatique, aucune action requise |
| Fichiers de traduction sous `src/locale/` | **Redémarrer l'application** |
| Ajout/modification d'une collection sous `src/server/collections/` | Exécuter `yarn nocobase upgrade` |

Si le code client a été modifié mais le hot reload ne s'est pas déclenché, essayez d'abord de rafraîchir le navigateur.

## Routes

### Impossible d'accéder à une route de page enregistrée

Les routes de NocoBase v2 sont préfixées par `/v2` par défaut. Par exemple, si vous enregistrez `path: '/hello'`, l'adresse réelle est `/v2/hello` :

```ts
this.router.add('hello', {
  path: '/hello', // accès réel -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

Voir [Router](../router) pour plus de détails.

### La page de configuration du plugin est blanche en y entrant

Si le menu de la page de configuration apparaît mais le contenu est vide, c'est généralement pour l'une de ces deux raisons :

**Raison 1 : v1 client utilisé avec `componentLoader`**

`componentLoader` est une syntaxe pour client-v2 ; pour v1 client, il faut utiliser `Component` et passer le composant directement :

```ts
// ❌ v1 client ne supporte pas componentLoader
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ v1 client utilise Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**Raison 2 : le composant de page n'est pas exporté avec `export default`**

`componentLoader` exige que le module ait un export par défaut. L'omission de `default` empêche le chargement.

## Blocs

### Mon bloc personnalisé n'apparaît pas dans le menu « Ajouter un bloc »

Vérifiez que le modèle est bien enregistré dans `load()` :

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

Si vous utilisez `registerModels` (sans chargement à la demande), vérifiez que le modèle est correctement exporté dans `models/index.ts`.

### Après avoir ajouté un bloc, ma table n'apparaît pas dans la liste de sélection des tables

Les tables définies via `defineCollection` sont des tables internes côté serveur et n'apparaissent pas par défaut dans la liste des tables de l'UI.

**Approche recommandée** : ajoutez la table correspondante depuis « [Gestion des sources de données](../../../data-sources/data-source-main/index.md) » de l'interface NocoBase. Une fois les champs et les types d'interface configurés, la table apparaîtra automatiquement dans la liste de sélection des blocs.

Si vous devez vraiment l'enregistrer dans le code du plugin (par exemple pour une démonstration), vous pouvez l'enregistrer manuellement via `addCollection`. Voir [Faire un plugin de gestion de données front+back](../examples/fullstack-plugin) pour les détails. Notez que vous devez l'enregistrer via le mode `eventBus` et ne pouvez pas l'appeler directement dans `load()` — `ensureLoaded()` s'exécute après `load()` et vide puis réinitialise toutes les collections.

### Mon bloc personnalisé ne doit être lié qu'à une table spécifique

Surchargez `static filterCollection` sur le modèle : seules les collections renvoyant `true` apparaîtront dans la liste de sélection :

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## Champs

### Mon composant de champ personnalisé n'apparaît pas dans le menu déroulant « Composant de champ »

Vérifiez dans cet ordre :

1. Confirmez que vous avez bien appelé `DisplayItemModel.bindModelToInterface('ModelName', ['input'])` et que le type d'interface correspond — par exemple, `input` pour les champs texte sur une ligne, `checkbox` pour les cases à cocher
2. Confirmez que le modèle est enregistré dans `load()` (`registerModels` ou `registerModelLoaders`)
3. Confirmez que le modèle de champ a bien appelé `define({ label })`

### Le menu déroulant des composants de champ affiche le nom de la classe

Vous avez oublié d'appeler `define({ label })` sur le modèle de champ. Ajoutez-le :

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

Assurez-vous également que la clé correspondante existe dans les fichiers de traduction sous `src/locale/`, sinon l'environnement chinois affichera tout de même le texte anglais.

## Actions

### Mon bouton d'action personnalisé n'apparaît pas dans « Configurer les actions »

Vérifiez que le `static scene` est correctement défini sur le modèle :

| Valeur | Emplacement |
| --- | --- |
| `ActionSceneEnum.collection` | Barre d'actions en haut du bloc (par exemple à côté de « Nouveau ») |
| `ActionSceneEnum.record` | Colonne d'actions de chaque ligne du tableau (par exemple à côté de « Modifier » et « Supprimer ») |
| `ActionSceneEnum.both` | Apparaît dans les deux scénarios |

### Le clic sur le bouton d'action n'a aucun effet

Vérifiez que `on` dans `registerFlow` est bien défini sur `'click'` :

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // Écoute le clic du bouton
  steps: {
    doSomething: {
      async handler(ctx) {
        // Votre logique
      },
    },
  },
});
```

:::warning Attention

Le `uiSchema` dans `registerFlow` est l'UI du panneau de configuration (état de configuration), pas une boîte de dialogue d'exécution. Si vous voulez afficher un formulaire après un clic de bouton, utilisez `ctx.viewer.dialog()` dans le `handler` pour ouvrir la boîte de dialogue.

:::

## Internationalisation

### La traduction ne fonctionne pas

Causes les plus fréquentes :

- **Premier ajout** du répertoire ou des fichiers `src/locale/` — il faut redémarrer l'application pour que cela prenne effet
- **Clés de traduction non concordantes** — vérifiez que la clé correspond exactement à la chaîne dans le code, en faisant attention aux espaces et à la casse
- **Utilisation directe de `ctx.t()` dans un composant** — `ctx.t()` n'injecte pas automatiquement le namespace du plugin ; dans un composant, vous devriez utiliser le hook `useT()` (importé depuis `locale.ts`)

### `tExpr()`, `useT()` et `this.t()` utilisés dans le mauvais contexte

Ces trois méthodes de traduction ont des contextes d'utilisation différents ; en mélanger une produira soit une erreur, soit une traduction inactive :

| Méthode | À utiliser où | Description |
| --- | --- | --- |
| `tExpr()` | Définitions statiques telles que `define()`, `registerFlow()` | Au moment du chargement du module, i18n n'est pas encore initialisé : utilisez la traduction différée |
| `useT()` | À l'intérieur d'un composant React | Renvoie une fonction de traduction liée au namespace du plugin |
| `this.t()` | Dans `load()` du Plugin | Injecte automatiquement le nom du package du plugin comme namespace |

Voir [Internationalisation i18n](../component/i18n) pour plus de détails.

## Requêtes API

### La requête renvoie 403 Forbidden

C'est généralement parce que l'ACL côté serveur n'est pas configurée. Par exemple, si votre collection s'appelle `todoItems`, vous devez autoriser les opérations correspondantes dans `load()` du plugin serveur :

```ts
// Autorise uniquement la lecture
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// Autorise les opérations CRUD complètes
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` signifie que tout utilisateur connecté peut accéder. Sans `acl.allow`, seul l'administrateur peut effectuer les opérations par défaut.

### La requête renvoie 404 Not Found

Vérifiez dans cet ordre :

- Si vous utilisez `defineCollection`, vérifiez l'orthographe du nom de la collection
- Si vous utilisez `resourceManager.define`, vérifiez le nom de la ressource et celui de l'action
- Vérifiez le format de l'URL de la requête — le format d'API NocoBase est `resourceName:actionName`, par exemple `todoItems:list` ou `externalApi:get`

## Build et déploiement

### `yarn build --tar` lève l'erreur « no paths specified to add to archive »

Lors de l'exécution de `yarn build <pluginName> --tar`, l'erreur :

```bash
TypeError: no paths specified to add to archive
```

apparaît, alors que `yarn build <pluginName>` (sans `--tar`) fonctionne correctement.

Ce problème vient généralement du fait que le `.npmignore` du plugin **utilise la syntaxe de négation** (préfixe `!` de npm). Lors du packaging avec `--tar`, NocoBase lit chaque ligne de `.npmignore` et y ajoute un `!` pour la transformer en motif d'exclusion `fast-glob`. Si votre `.npmignore` utilise déjà la négation, par exemple :

```
*
!dist
!package.json
```

Après transformation, on obtient `['!*', '!!dist', '!!package.json', '**/*']`. Or `!*` exclut tous les fichiers de la racine (y compris `package.json`), et `!!dist` n'est pas reconnu par `fast-glob` comme « réinclure dist » — la négation ne fonctionne pas. Si le répertoire `dist/` est vide ou si le build n'a rien produit, la liste finale collectée est vide et `tar` lève cette erreur.

**Solution :** n'utilisez pas la syntaxe de négation dans `.npmignore`, listez seulement les répertoires à exclure :

```
/node_modules
/src
```

La logique de packaging convertira ces lignes en motifs d'exclusion (`!./node_modules`, `!./src`) puis ajoutera `**/*` pour matcher tous les autres fichiers. C'est plus simple et évite les problèmes liés à la négation.

### Le plugin échoue à l'activation après upload en production (fonctionne en local)

Le plugin fonctionne sans souci en développement local, mais échoue à l'activation après upload en production via le « Gestionnaire de plugins », avec un log d'erreur similaire à :

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

Ce problème vient généralement du fait que **le plugin a empaqueté des dépendances internes de NocoBase dans son propre `node_modules/`**. Le système de build de NocoBase maintient une [liste d'externals](../../dependency-management) ; les packages qu'elle contient (comme `react`, `antd`, `axios`, `lodash`, etc.) sont fournis par l'hôte NocoBase et ne devraient pas être empaquetés dans le plugin. Si le plugin embarque une copie privée, des conflits avec la version déjà chargée par l'hôte peuvent survenir à l'exécution, provoquant des erreurs étranges.

**Pourquoi cela fonctionne en local :** en développement local, le plugin se trouve sous `packages/plugins/` et n'a pas de `node_modules/` privé ; les dépendances se résolvent vers les versions déjà chargées à la racine du projet, sans conflit possible.

**Solution :** déplacez toutes les `dependencies` de `package.json` du plugin vers `devDependencies` — le système de build NocoBase gère automatiquement les dépendances :

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

Reconstruisez et empaquetez à nouveau. Ainsi, `dist/node_modules/` du plugin ne contiendra plus ces packages, et la version fournie par l'hôte NocoBase sera utilisée au runtime.

:::tip Principe général

Le système de build de NocoBase maintient une [liste d'externals](../../dependency-management) ; les packages qu'elle contient (comme `react`, `antd`, `axios`, `lodash`, etc.) sont fournis par l'hôte NocoBase et ne devraient pas être empaquetés par les plugins. Toutes les dépendances du plugin devraient être placées dans `devDependencies` ; le système de build décidera automatiquement lesquelles empaqueter dans `dist/node_modules/` et lesquelles laisser à la charge de l'hôte.

:::

## Liens connexes

- [Plugin](../plugin) — point d'entrée et cycle de vie du plugin
- [Router](../router) — enregistrement de routes et préfixe `/v2`
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel
- [FlowEngine → Extension de bloc](../flow-engine/block) — BlockModel, TableBlockModel, filterCollection
- [FlowEngine → Extension de champ](../flow-engine/field) — FieldModel, bindModelToInterface
- [FlowEngine → Extension d'action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Internationalisation i18n](../component/i18n) — fichiers de traduction, useT, tExpr
- [Context → Capacités courantes](../ctx/common-capabilities) — ctx.api, ctx.viewer, etc.
- [Serveur → Tables de données Collections](../../server/collections) — defineCollection et addCollection
- [Serveur → Contrôle d'accès ACL](../../server/acl) — configuration des permissions d'API
- [Build du plugin](../../build) — configuration de build, liste d'externals, processus de packaging
