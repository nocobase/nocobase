---
title: "OpenCode + NocoBase : la voie open source, libre et sans verrouillage pour construire NocoBase"
description: "Intégrez OpenCode, l'assistant de programmation AI open source, à NocoBase ; choisissez librement votre modèle et pilotez votre système métier en langage naturel."
keywords: "OpenCode,NocoBase,AI Agent,open source,multi-modèles,Skills,CLI,langage naturel"
sidebar: false
---

:::warning Attention

Le contenu de cette page est en cours de rédaction ; certaines sections peuvent être incomplètes ou sujettes à modification.

:::

# OpenCode + NocoBase : la voie open source, libre et sans verrouillage pour construire NocoBase

[OpenCode](https://github.com/opencode-ai/opencode) est un AI Agent terminal open source — il prend en charge plus de 75 modèles (Claude, GPT, Gemini, DeepSeek, etc.), sans verrouillage sur un fournisseur, vous laissant libre de choisir le modèle qui vous convient le mieux. En l'intégrant à NocoBase, vous pouvez utiliser le langage naturel pour créer des tables de données, construire des pages, configurer des workflows, tout en gardant un contrôle total sur le choix du modèle et les coûts.

<!-- Une capture d'écran d'OpenCode pilotant NocoBase dans un terminal serait nécessaire -->

## Qu'est-ce que OpenCode

OpenCode est développé par Anomaly Innovations (140k+ étoiles sur GitHub), positionné comme « un AI Agent terminal sans verrouillage fournisseur ». Écrit en Go, il offre une interface TUI soignée. Caractéristiques principales :

- **Prise en charge de plus de 75 modèles** — Claude, GPT, Gemini, DeepSeek, modèles locaux, etc., changement libre
- **Aucun verrouillage fournisseur** — apportez votre propre clé API, paiement à l'usage réel, sans abonnement supplémentaire
- **Architecture multi-Agent** — cinq rôles d'Agent intégrés : Build, Plan, Review, Debug, Docs
- **Vie privée d'abord** — ne stocke ni le code ni le contexte, toutes les données restent en local

OpenCode prend également en charge les intégrations d'éditeurs comme VS Code, JetBrains, Zed et Neovim, et propose aussi une application bureautique autonome.

## Pourquoi choisir OpenCode

Si vous hésitez entre plusieurs AI Agents pour piloter NocoBase, voici les scénarios où OpenCode excelle :

- **Vous ne voulez pas dépendre d'un seul modèle** — Claude aujourd'hui, GPT demain, DeepSeek après-demain, le tout dans un seul outil
- **Vous attachez de l'importance à la maîtrise des coûts** — votre propre clé API en paiement à l'usage, prend en charge votre abonnement ChatGPT Plus existant
- **Vous avez des exigences en matière de vie privée** — le code et le contexte ne passent pas par un tiers, prend en charge les modèles locaux
- **Vous appréciez la personnalisation poussée** — configuration YAML pour personnaliser le comportement des Agents, adaptée aux besoins spécifiques d'une équipe

## Principe de connexion

OpenCode collabore avec NocoBase de la manière suivante :

```
Vous (terminal / VS Code / JetBrains / ...)
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills (permet à l'Agent de comprendre le système de configuration de NocoBase)
        │
        └── NocoBase CLI (exécute la création, la modification, le déploiement, etc.)
              │
              └─→ Service NocoBase (votre système métier)
```

- **NocoBase Skills** — packs de connaissances métier permettant à OpenCode de savoir comment piloter NocoBase
- **NocoBase CLI** — outil en ligne de commande qui exécute concrètement la modélisation des données, la construction des pages, etc.
- **Service NocoBase** — votre instance NocoBase en cours d'exécution

## Prérequis

Avant de commencer, assurez-vous de disposer de l'environnement suivant :

- OpenCode installé ([guide d'installation](https://opencode.ai/docs/))
- Node.js >= 22 (pour exécuter NocoBase CLI et Skills)
- Si vous disposez déjà d'une instance NocoBase, **en raison de l'évolution rapide des capacités AI, seule la dernière version beta offre actuellement une expérience complète, avec une version minimale requise >= 2.1.0-beta.20. Nous recommandons fortement la mise à jour vers la dernière version.**

## Démarrage rapide

### Installation AI en un clic

Copiez le prompt ci-dessous à OpenCode, il prendra automatiquement en charge l'installation, l'initialisation et la configuration de l'environnement de NocoBase CLI :

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

<!-- TODO : compiler 5-8 questions fréquentes. Par exemple : comment configurer les clés API des différents modèles, comment changer de modèle, comment utiliser un modèle local, que faire si l'installation des Skills échoue, etc. -->

## Liens connexes

- [NocoBase CLI](../quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — packs de connaissances métier installables dans un AI Agent
- [Démarrage rapide pour la construction AI](../../ai-builder/index.md) — construire une application NocoBase à partir de zéro avec l'AI
- [Documentation officielle d'OpenCode](https://opencode.ai/docs/) — guide d'utilisation complet d'OpenCode
- [Claude Code + NocoBase](../claude-code/index.md) — l'assistant officiel de programmation AI d'Anthropic
- [Codex + NocoBase](../codex/index.md) — l'assistant officiel de programmation AI d'OpenAI
