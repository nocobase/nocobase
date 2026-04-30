---
title: "Exemples pratiques de plugins"
description: "Cas pratiques complets de plugins client NocoBase : page de configuration, bloc personnalisé, intégration front-back, champ personnalisé, du début à la fin."
keywords: "exemples de plugin,cas pratiques,plugin complet,NocoBase"
---

# Exemples pratiques de plugins

Les chapitres précédents ont présenté individuellement [Plugin](../plugin), [Router](../router), [Component](../component/index.md), [Context](../ctx/index.md), [FlowEngine](../flow-engine/index.md) et autres capacités. Ce chapitre les rassemble — à travers plusieurs exemples pratiques complets, il montre le processus de développement d'un plugin de la création à l'achèvement.

Chaque exemple correspond à un plugin d'exemple exécutable : vous pouvez en consulter le code source ou le faire tourner localement.

## Liste des exemples

| Exemple | Capacités impliquées | Difficulté |
| --- | --- | --- |
| [Faire une page de configuration de plugin](./settings-page) | Plugin + Router + Component + Context + serveur | Débutant |
| [Faire un bloc d'affichage personnalisé](./custom-block) | Plugin + FlowEngine (BlockModel) | Débutant |
| [Faire un composant de champ personnalisé](./custom-field) | Plugin + FlowEngine (FieldModel) | Débutant |
| [Faire un bouton d'action personnalisé](./custom-action) | Plugin + FlowEngine (ActionModel) | Débutant |
| [Faire un plugin de gestion de données front+back](./fullstack-plugin) | Plugin + FlowEngine (TableBlockModel + FieldModel + ActionModel) + serveur | Avancé |

Il est recommandé de les lire dans l'ordre. Le premier exemple utilise des composants React + une simple API serveur, sans FlowEngine ; les trois suivants illustrent respectivement les classes parentes BlockModel, FieldModel et ActionModel de FlowEngine ; le dernier rassemble les notions de bloc, champ et action des exemples précédents avec une table de données serveur, pour former un plugin complet à intégration front-back. Si vous hésitez entre composants React et FlowModel, consultez d'abord [Component vs FlowModel](../component-vs-flow-model).

## Liens connexes

- [Écrire votre premier plugin](../../write-your-first-plugin) — créer un plugin exécutable de zéro
- [Aperçu du développement côté client](../index.md) — parcours d'apprentissage et index rapide
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel et registerFlow
- [Documentation complète FlowEngine](../../flow-engine/index.md) — référence complète FlowModel, Flow, Context
- [Component vs FlowModel](../component-vs-flow-model) — choisir entre composant et FlowModel
