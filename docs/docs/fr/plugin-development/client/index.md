---
title: "Vue d'ensemble du développement de plugin client"
description: "Vue d'ensemble du développement de plugin client NocoBase : fil conducteur Plugin → Router → Component → Context → FlowEngine, table d'index rapide pour localiser les chapitres."
keywords: "plugin client,Plugin,Router,Component,Context,FlowEngine,FlowModel,NocoBase"
---

# Vue d'ensemble

Les plugins client de NocoBase peuvent faire beaucoup de choses : enregistrer de nouvelles pages, écrire des composants personnalisés, appeler les API du back-end, ajouter des blocs et des champs, voire étendre les boutons d'action. Toutes ces capacités s'organisent autour d'un point d'entrée de plugin unifié.

Si vous avez déjà de l'expérience React, vous prendrez vite vos marques — la majorité des scénarios consiste à écrire des composants React classiques, en s'appuyant sur les capacités contextuelles fournies par NocoBase (envoi de requêtes, i18n) pour s'intégrer avec NocoBase. C'est uniquement quand vous avez besoin que votre composant apparaisse dans l'interface de configuration visuelle de NocoBase qu'il faut comprendre [FlowEngine](./flow-engine/index.md).

:::warning Attention

NocoBase est en train de migrer de `client` (v1) vers `client-v2` ; `client-v2` est encore en développement actif. Le contenu présenté ici est destiné à être expérimenté ; il n'est pas recommandé pour la production. Pour les nouveaux plugins, utilisez le répertoire `src/client-v2/` et l'API de `@nocobase/client-v2`.

:::

## Parcours d'apprentissage

Nous vous recommandons d'aborder le développement de plugin client dans l'ordre suivant, du plus simple au plus complexe :

```
Plugin (entrée) → Router (page) → Component (composant) → Context (contexte) → FlowEngine (extension UI)
```

Notamment :

1. **[Plugin](./plugin)** : la classe d'entrée du plugin, où vous enregistrez routes, modèles et autres ressources dans les méthodes du cycle de vie comme `load()`.
2. **[Router](./router)** : enregistrer des routes de page via `router.add()`, et enregistrer des pages de configuration de plugin via `pluginSettingsManager`.
3. **[Component](./component/index.md)** : ce qui est monté sur une route est un composant React. Par défaut, on écrit en React + Antd ; ce n'est pas différent du développement front-end classique.
4. **[Context](./ctx/index.md)** : dans le plugin, on récupère le contexte via `this.context` ; dans un composant, via `useFlowContext()`. Le contexte permet d'accéder aux capacités fournies par NocoBase — envoi de requêtes (`ctx.api`), i18n (`ctx.t`), logging (`ctx.logger`), etc.
5. **[FlowEngine](./flow-engine/index.md)** : si votre composant doit apparaître dans les menus « Ajouter un bloc / champ / action » et permettre une configuration visuelle par l'utilisateur, vous devez l'envelopper avec un FlowModel.

Les quatre premières étapes couvrent la majorité des cas. Vous n'avez besoin de la cinquième que pour une intégration profonde avec le système de configuration UI de NocoBase. Si vous hésitez sur l'approche à utiliser, voir [Component vs FlowModel](./component-vs-flow-model).

## Index rapide

| Je veux…                                                  | Aller voir                                              |
| --------------------------------------------------------- | ------------------------------------------------------- |
| Comprendre la structure de base d'un plugin client        | [Plugin](./plugin)                                      |
| Ajouter une page indépendante                             | [Router - routage](./router)                            |
| Ajouter une page de configuration de plugin               | [Router - routage](./router)                            |
| Écrire un composant React classique                       | [Développement de Component](./component/index.md)      |
| Appeler l'API back-end, utiliser les capacités intégrées de NocoBase | [Context → Capacités courantes](./ctx/common-capabilities) |
| Personnaliser le style des composants                     | [Styles et thèmes](./component/styles-themes)           |
| Ajouter un nouveau bloc                                   | [FlowEngine → Extensions de bloc](./flow-engine/block)  |
| Ajouter un nouveau composant de champ                     | [FlowEngine → Extensions de champ](./flow-engine/field) |
| Ajouter un nouveau bouton d'action                        | [FlowEngine → Extensions d'action](./flow-engine/action) |
| Hésiter entre Component et FlowModel                      | [Component vs FlowModel](./component-vs-flow-model)     |
| Voir un plugin complet en action                          | [Exemples pratiques](./examples/index.md)               |

## Liens connexes

- [Écrire votre premier plugin](../write-your-first-plugin) — Créer un plugin fonctionnel à partir de zéro
- [Vue d'ensemble du développement serveur](../server) — Un plugin client a en général besoin d'un complément côté serveur
- [Documentation complète de FlowEngine](../../flow-engine/index.md) — Référence complète de FlowModel, Flow et Context
- [Structure du projet](../project-structure) — Où placer les fichiers du plugin
