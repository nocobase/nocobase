---
title: "FlowContext"
description: "API FlowContext de NocoBase : référence complète des propriétés et méthodes de l'objet ctx dans les handlers registerFlow."
keywords: "FlowContext,FlowRuntimeContext,ctx,registerFlow,handler,FlowEngine,NocoBase"
---

# FlowContext

Dans le step handler de `registerFlow`, le paramètre `ctx` est une instance de `FlowRuntimeContext`. Grâce à la chaîne de délégation, il peut accéder à toutes les propriétés et méthodes au niveau du modèle et au niveau du moteur.

La chaîne de délégation est la suivante :

```
FlowRuntimeContext (contexte d'exécution du flow courant)
  → FlowModelContext (model.context, niveau modèle)
    → FlowEngineContext (engine.context, niveau global)
```

## Propriétés courantes

Les propriétés `ctx` les plus utilisées dans le développement de plugins :

| Propriété | Type | Description |
|-----------|------|-------------|
| `ctx.model` | `FlowModel` | Instance FlowModel courante |
| `ctx.api` | `APIClient` | Client de requêtes HTTP, provenant de `@nocobase/sdk` |
| `ctx.viewer` | `FlowViewer` | Gestionnaire de popup/drawer, fournit des méthodes comme `dialog()`, `drawer()` |
| `ctx.message` | `MessageInstance` | Instance message d' Antd, par exemple `ctx.message.success('OK')` |
| `ctx.notification` | `NotificationInstance` | Instance notification d' Antd |
| `ctx.modal` | `HookAPI` | Instance Modal.useModal d' Antd |
| `ctx.t(key, options?)` | `(string, object?) => string` | Méthode de traduction i18n |
| `ctx.router` | `Router` | Instance de routeur react-router |
| `ctx.route` | `RouteOptions` | Informations de la route courante (observable) |
| `ctx.location` | `Location` | Objet location de l'URL courante (observable) |
| `ctx.ref` | `React.RefObject` | Référence DOM du conteneur de vue du modèle courant |
| `ctx.flowKey` | `string` | Clé du flow courant |
| `ctx.mode` | `'runtime' \| 'settings'` | Mode d'exécution courant : `runtime` à l'exécution, `settings` dans le panneau de configuration |
| `ctx.token` | `string` | Token d'authentification de l'utilisateur courant |
| `ctx.role` | `string` | Rôle de l'utilisateur courant |
| `ctx.auth` | `object` | Informations d'authentification : `{ roleName, locale, token, user }` |
| `ctx.themeToken` | `object` | Token de thème Antd, utilisé pour récupérer les couleurs du thème, etc. |
| `ctx.dataSourceManager` | `DataSourceManager` | Gestionnaire de sources de données |
| `ctx.engine` | `FlowEngine` | Instance FlowEngine |
| `ctx.app` | `Application` | Instance Application de NocoBase |
| `ctx.i18n` | `i18n` | Instance i18next |

## Méthodes courantes

### Requêtes

| Méthode | Description |
|---------|-------------|
| `ctx.request(options)` | Émet une requête HTTP : URL interne via `APIClient`, URL externe via `axios` |
| `ctx.makeResource(ResourceClass)` | Crée une instance de Resource (par exemple `MultiRecordResource`, `SingleRecordResource`) |
| `ctx.initResource(className)` | Initialise une resource sur le model context |

### Popups

| Méthode | Description |
|---------|-------------|
| `ctx.viewer.dialog(options)` | Ouvre une boîte de dialogue ; `options.content` reçoit `(view) => JSX`, fermez avec `view.close()` |
| `ctx.viewer.drawer(options)` | Ouvre un drawer |
| `ctx.openView(uid, options)` | Ouvre une vue déjà enregistrée (popup / drawer / dialog) |

### Contrôle d'exécution du flow

| Méthode | Description |
|---------|-------------|
| `ctx.exit()` | Interrompt l'exécution du flow courant |
| `ctx.exitAll()` | Interrompt l'exécution de tous les flows |
| `ctx.getStepParams(stepKey)` | Récupère les paramètres enregistrés d'un step donné |
| `ctx.setStepParams(stepKey, params)` | Définit les paramètres d'un step donné |
| `ctx.getStepResults(stepKey)` | Récupère le résultat d'exécution d'un step antérieur |

### Action et Event

| Méthode | Description |
|---------|-------------|
| `ctx.runAction(actionName, params?)` | Exécute une action enregistrée |
| `ctx.getAction(name)` | Récupère la définition d'une action enregistrée |
| `ctx.getActions()` | Récupère toutes les actions enregistrées |
| `ctx.getEvents()` | Récupère tous les events enregistrés |

### Permissions

| Méthode | Description |
|---------|-------------|
| `ctx.aclCheck(params)` | Vérifie les permissions ACL |
| `ctx.acl` | Instance ACL |

### Autres

| Méthode | Description |
|---------|-------------|
| `ctx.resolveJsonTemplate(template)` | Résout un template d'expression `{{ ctx.xxx }}` |
| `ctx.getVar(path)` | Résout un chemin d'expression unique `ctx.xxx.yyy` |
| `ctx.runjs(code, variables?, options?)` | Exécute dynamiquement du code JavaScript |
| `ctx.requireAsync(url)` | Charge dynamiquement un module (style CommonJS) |
| `ctx.importAsync(url)` | Charge dynamiquement un module (style ESM) |
| `ctx.loadCSS(href)` | Charge dynamiquement un fichier CSS |
| `ctx.onRefReady(ref, callback, timeout)` | Attend qu'un ref React soit prêt avant d'exécuter le callback |
| `ctx.defineProperty(key, options)` | Enregistre dynamiquement une nouvelle propriété |
| `ctx.defineMethod(name, fn, info?)` | Enregistre dynamiquement une nouvelle méthode |

## Cas d'usage typiques en développement de plugins

### Afficher un message dans un click handler

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Opération réussie'));
      },
    },
  },
});
```

### Créer un enregistrement via une dialog

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    openDialog: {
      async handler(ctx) {
        ctx.viewer.dialog({
          title: ctx.t('Nouvel enregistrement'),
          content: (view) => <MyForm onClose={() => view.close()} />,
        });
      },
    },
  },
});
```

### Récupérer les données de la ligne courante (action sur enregistrement)

```ts
MyRecordAction.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showRecord: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        ctx.message.info(`Ligne ${index} : ${record.title}`);
      },
    },
  },
});
```

### Manipuler des données via une resource

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource;
  // Créer un enregistrement
  await resource.create({ title: 'New item', completed: false });
  // Rafraîchir les données
  await resource.refresh();
}
```

## Liens connexes

- [Vue d'ensemble de FlowEngine (développement de plugin)](../../plugin-development/client/flow-engine/index.md) — Utilisation de base de FlowModel et registerFlow
- [FlowDefinition - définition de flux](../../flow-engine/definitions/flow-definition.md) — Référence complète des paramètres de registerFlow
- [Documentation complète de FlowEngine](../../flow-engine/index.md) — Référence complète de FlowModel et Flow
