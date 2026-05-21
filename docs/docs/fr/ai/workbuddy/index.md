---
title: "Libérez vos mains, pilotez NocoBase avec WorkBuddy"
description: "Pilotez NocoBase à distance via WorkBuddy de Tencent ; prend en charge l'intégration multi-plateforme : WeCom, Lark, DingTalk, etc."
keywords: "WorkBuddy,NocoBase,AI Agent,Tencent,WeCom,Lark,DingTalk,pilotage à distance"
sidebar: false
---

:::warning Attention

Le contenu de cette page est en cours de rédaction ; certaines sections peuvent être incomplètes ou sujettes à modification.

:::

# Libérez vos mains, pilotez NocoBase avec WorkBuddy

[WorkBuddy](https://www.codebuddy.cn) est un agent AI tout-terrain pour le travail lancé par Tencent — décrivez votre besoin en une phrase, il planifie ses étapes en autonomie et les exécute. En l'intégrant à NocoBase, vous pouvez piloter à distance votre système métier depuis WeCom, Lark, DingTalk et d'autres plateformes, et accomplir vos opérations de gestion quotidiennes sans même ouvrir de navigateur.

<!-- Une capture d'écran de WorkBuddy pilotant NocoBase dans WeCom serait nécessaire -->

## Qu'est-ce que WorkBuddy

WorkBuddy est le « bureau de travail d'agent AI tout-terrain pour le travail » lancé par Tencent. Contrairement aux outils de conversation AI classiques, WorkBuddy, après avoir reçu une tâche, la décompose, la planifie et l'exécute automatiquement, pour livrer un résultat directement vérifiable — sans avoir à le guider étape par étape.

Caractéristiques principales :

- **Planification et exécution autonomes** — décompose automatiquement les étapes après réception d'une tâche, les exécute une par une, livre un résultat complet
- **Intégration multi-plateforme** — prend en charge les principales plateformes de travail chinoises : WeCom, Lark, DingTalk, QQ, etc.
- **20+ compétences intégrées** — génération de documents, analyse de données, création de PPT, rédaction d'e-mails, etc., prêts à l'emploi
- **Manipulation de fichiers locaux** — peut lire et traiter les fichiers locaux que vous autorisez

En résumé, les outils AI traditionnels vous donnent des suggestions et vous laissent agir, alors que WorkBuddy fait directement le travail à votre place.

| Conversation AI traditionnelle | WorkBuddy |
| ---------------- | ---------------------- |
| Ne fait que dialoguer, donne des suggestions | Exécute réellement les tâches |
| Manipulation manuelle des fichiers | Manipulation automatique des fichiers locaux |
| Tâches simples en une étape | Décomposition automatique des tâches complexes multi-étapes |
| Sortie : réponse textuelle | Livraison : résultat vérifiable |

## Pourquoi choisir WorkBuddy

Si vous hésitez entre plusieurs AI Agents pour piloter NocoBase, voici les scénarios où WorkBuddy excelle :

- **L'équipe utilise WeCom / Lark / DingTalk** — WorkBuddy prend en charge la couverture la plus large des plateformes de travail chinoises
- **Besoin de piloter NocoBase depuis mobile** — gérez votre système n'importe où, sans contrainte d'appareil
- **Recherche d'une expérience clé en main** — édité par Tencent, 20+ compétences intégrées, faible barrière de configuration
- **Accent sur l'automatisation des tâches** — WorkBuddy excelle dans la décomposition et l'exécution automatique de tâches multi-étapes, idéal pour l'exploitation et la gestion quotidiennes

## Principe de connexion

WorkBuddy collabore avec NocoBase de la manière suivante :

```
Vous (WeCom / Lark / DingTalk / ...)
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills (permet à l'Agent de comprendre le système de configuration de NocoBase)
        │
        └── NocoBase CLI (exécute la création, la modification, le déploiement, etc.)
              │
              └─→ Service NocoBase (votre système métier)
```

Vous envoyez des instructions sur n'importe quelle plateforme prise en charge, WorkBuddy effectue les opérations sur NocoBase en arrière-plan via les Skills et la CLI, et les résultats sont renvoyés en temps réel dans votre fenêtre de conversation.

## Prérequis

Avant de commencer, assurez-vous de disposer de l'environnement suivant :

- Un compte WorkBuddy ([page d'inscription](https://www.codebuddy.cn))
- Node.js >= 22 (pour exécuter NocoBase CLI et Skills)
- Si vous disposez déjà d'une instance NocoBase, **en raison de l'évolution rapide des capacités AI, seule la dernière version beta offre actuellement une expérience complète, avec une version minimale requise >= 2.1.0-beta.20. Nous recommandons fortement la mise à jour vers la dernière version.**

:::warning Attention

WorkBuddy est actuellement en évolution rapide ; certaines fonctionnalités peuvent changer. Nous recommandons de suivre la [documentation officielle WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) pour obtenir les informations les plus récentes.

:::

## Démarrage rapide

### Installation AI en un clic

Copiez le prompt ci-dessous à WorkBuddy, il prendra automatiquement en charge l'installation, l'initialisation et la configuration de l'environnement de NocoBase CLI :

```
Aide-moi à installer NocoBase CLI et à terminer l'initialisation : https://docs.nocobase.com/cn/ai/ai-quick-start.md (consulte directement le contenu du lien)
```

### Installation manuelle

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Le navigateur ouvre automatiquement la page de configuration visuelle qui vous guide dans l'installation des NocoBase Skills, la configuration de la base de données et le démarrage de l'application. Pour les étapes détaillées, consultez le [Démarrage rapide](../quick-start.md).

Une fois l'installation terminée, exécutez `nb env list` pour vérifier l'état d'exécution de l'environnement :

```bash
nb env list
```

Confirmez que la sortie contient l'environnement configuré ainsi que son statut d'exécution.

## Questions fréquentes

<!-- TODO : compiler 5-8 questions fréquentes. Par exemple : quelles plateformes WorkBuddy prend-il en charge, quel est le quota gratuit, comment gérer les erreurs d'opération, plusieurs personnes peuvent-elles partager le même WorkBuddy pour piloter la même instance NocoBase, etc. -->

## Liens connexes

- [NocoBase CLI](../quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — packs de connaissances métier installables dans un AI Agent
- [Démarrage rapide pour la construction AI](../../ai-builder/index.md) — construire une application NocoBase à partir de zéro avec l'AI
- [Documentation officielle WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) — guide d'utilisation complet de WorkBuddy
- [OpenClaw + NocoBase](../openclaw/index.md) — l'AI Agent open source le plus populaire au monde, déploiement Lark en un clic
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — capitalise automatiquement les compétences, comprend de mieux en mieux votre système métier
