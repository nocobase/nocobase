---
title: "Aide-mémoire pour le développement de plugins"
description: "Aide-mémoire NocoBase pour le développement de plugins : que faire → dans quel fichier → quelle API appeler, pour localiser rapidement où placer votre code."
keywords: "Aide-mémoire,Cheatsheet,modes d'enregistrement,emplacement des fichiers,NocoBase"
---

# Aide-mémoire pour le développement de plugins

Lorsque vous écrivez un plugin, vous vous demandez souvent « dans quel fichier dois-je écrire ceci, et quelle API appeler ? ». Cet aide-mémoire vous aide à vous repérer rapidement.

## Structure du répertoire d'un plugin

Créez un plugin avec `yarn pm create @my-project/plugin-name` : la structure de répertoire suivante sera générée automatiquement. Ne créez pas les répertoires à la main, vous risqueriez d'oublier des étapes d'enregistrement et le plugin ne fonctionnerait pas. Voir [Écrire votre premier plugin](../../write-your-first-plugin) pour plus de détails.

```bash
plugin-name/
├── src/
│   ├── client-v2/              # Code client (v2)
│   │   ├── plugin.tsx          # Point d'entrée du plugin client
│   │   ├── locale.ts           # Hooks de traduction useT / tExpr
│   │   ├── models/             # FlowModel (blocs, champs, actions)
│   │   └── pages/              # Composants de page
│   ├── client/                 # Code client (v1, compatibilité)
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # Code serveur
│   │   ├── plugin.ts           # Point d'entrée du plugin serveur
│   │   └── collections/        # Définitions de tables de données
│   └── locale/                 # Fichiers de traduction multilingue
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # Point d'entrée à la racine (cible du build)
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Côté client : ce que je veux faire → comment l'écrire

| Ce que je veux faire | Dans quel fichier | Quelle API appeler | Documentation |
| --- | --- | --- | --- |
| Enregistrer une route de page | `load()` de `plugin.tsx` | `this.router.add()` | [Router](../router) |
| Enregistrer une page de configuration de plugin | `load()` de `plugin.tsx` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Enregistrer un bloc personnalisé | `load()` de `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extension de bloc](../flow-engine/block) |
| Enregistrer un champ personnalisé | `load()` de `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extension de champ](../flow-engine/field) |
| Enregistrer une action personnalisée | `load()` de `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Extension d'action](../flow-engine/action) |
| Faire apparaître une table interne dans la sélection de tables des blocs | `load()` de `plugin.tsx` | `mainDS.addCollection()` | [Tables de données Collections](../../server/collections) |
| Traduire le contenu textuel du plugin | `locale/zh-CN.json` + `locale/en-US.json` | — | [Internationalisation i18n](../component/i18n) |

## Côté serveur : ce que je veux faire → comment l'écrire

| Ce que je veux faire | Dans quel fichier | Quelle API appeler | Documentation |
| --- | --- | --- | --- |
| Définir une table de données | `server/collections/xxx.ts` | `defineCollection()` | [Tables de données Collections](../../server/collections) |
| Étendre une table existante | `server/collections/xxx.ts` | `extendCollection()` | [Tables de données Collections](../../server/collections) |
| Enregistrer une API personnalisée | `load()` de `server/plugin.ts` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Configurer les permissions d'API | `load()` de `server/plugin.ts` | `this.app.acl.allow()` | [Contrôle d'accès ACL](../../server/acl) |
| Insérer des données initiales à l'installation | `install()` de `server/plugin.ts` | `this.db.getRepository().create()` | [Plugin](../../server/plugin) |

## Aide-mémoire FlowModel

| Ce que je veux faire | Classe parente à étendre | API clés |
| --- | --- | --- |
| Faire un bloc d'affichage simple | `BlockModel` | `renderComponent()` + `define()` |
| Faire un bloc lié à une table de données (rendu personnalisé) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Faire un bloc tableau complet (sur la base du tableau intégré) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Faire un composant d'affichage de champ | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Faire un bouton d'action | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Aide-mémoire des méthodes de traduction

| Scénario | Quoi utiliser | D'où l'importer |
| --- | --- | --- |
| Dans `load()` du Plugin | `this.t('key')` | Fournie par la classe Plugin |
| Dans un composant React | `const t = useT(); t('key')` | `locale.ts` |
| Définition statique d'un FlowModel (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Aide-mémoire des appels d'API courants

| Ce que je veux faire | Dans le Plugin | Dans un composant |
| --- | --- | --- |
| Envoyer une requête API | `this.context.api.request()` | `ctx.api.request()` |
| Obtenir une traduction | `this.t()` | `useT()` |
| Obtenir le logger | `this.context.logger` | `ctx.logger` |
| Enregistrer une route | `this.router.add()` | — |
| Naviguer entre les pages | — | `ctx.router.navigate()` |
| Ouvrir une boîte de dialogue | — | `ctx.viewer.dialog()` |

## Liens connexes

- [Aperçu du développement côté client](../index.md) — parcours d'apprentissage et index rapide
- [Plugin](../plugin) — point d'entrée et cycle de vie du plugin
- [FAQ & guide de dépannage](./faq) — résolution de problèmes courants
- [Router](../router) — enregistrement de routes de page
- [FlowEngine → Extension de bloc](../flow-engine/block) — classes parentes BlockModel
- [FlowEngine → Extension de champ](../flow-engine/field) — développement de FieldModel
- [FlowEngine → Extension d'action](../flow-engine/action) — développement d'ActionModel
- [Tables de données Collections](../../server/collections) — defineCollection et types de champs
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction
- [ResourceManager](../../server/resource-manager) — API REST personnalisées
- [Contrôle d'accès ACL](../../server/acl) — configuration des permissions
- [Plugin (côté serveur)](../../server/plugin) — cycle de vie du plugin serveur
- [Écrire votre premier plugin](../../write-your-first-plugin) — création du squelette de plugin
