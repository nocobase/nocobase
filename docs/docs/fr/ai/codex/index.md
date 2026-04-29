---
title: "Pilotez NocoBase avec Codex, construction et développement réunis"
description: "Intégrez Codex, l'assistant officiel de programmation AI d'OpenAI, à NocoBase pour piloter votre système métier en langage naturel via les Skills et la CLI."
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,langage naturel"
sidebar: false
---

:::warning Attention

Le contenu de cette page est en cours de rédaction ; certaines sections peuvent être incomplètes ou sujettes à modification.

:::

# Pilotez NocoBase avec Codex, construction et développement réunis

[Codex](https://github.com/openai/codex) est l'assistant officiel de programmation AI lancé par OpenAI — il s'exécute dans votre terminal, peut lire et écrire du code, exécuter des commandes et vous aider à réaliser de nombreuses tâches, du codage à la construction de systèmes. En l'intégrant à NocoBase, vous pouvez utiliser le langage naturel pour créer des tables de données, construire des pages, configurer des workflows et construire rapidement votre système métier grâce à la puissance des modèles GPT.

<!-- Une capture d'écran de Codex pilotant NocoBase dans un terminal serait nécessaire -->

## Qu'est-ce que Codex

Codex est un AI Agent en CLI lancé par OpenAI, propulsé par les modèles de la série GPT (incluant o3, o4-mini, etc.). Il s'exécute dans un sandbox local, où il peut exécuter du code et des commandes en toute sécurité. Caractéristiques principales :

- **Propulsé par les modèles GPT** — basé sur les derniers modèles d'OpenAI, excellents en génération de code et planification de tâches
- **Exécution en sandbox** — exécute les commandes dans un sandbox isolé, sécurisé et contrôlable
- **Compréhension multimodale** — prend en charge plusieurs types d'entrées (texte, images, etc.) et peut comprendre la mise en page d'une UI à partir d'une capture d'écran
- **Niveaux d'autonomie flexibles** — du mode suggestion au mode entièrement automatique, vous décidez du degré d'autonomie de l'AI

## Pourquoi choisir Codex

Si vous hésitez entre plusieurs AI Agents pour piloter NocoBase, voici les scénarios où Codex excelle :

- **Vous utilisez déjà l'écosystème OpenAI** — si vous disposez d'un abonnement ChatGPT Plus/Pro ou d'une clé API OpenAI, Codex est le choix le plus naturel
- **Vous accordez de l'importance à la sécurité** — le mécanisme d'exécution en sandbox garantit que les actions de l'AI n'affectent pas accidentellement votre système
- **Vous avez besoin d'un contrôle flexible** — vous pouvez basculer entre les niveaux d'autonomie selon la complexité de la tâche : tout automatique pour les tâches simples, confirmation requise pour les actions sensibles
- **Vous appréciez le style des modèles OpenAI** — la série GPT a ses propres atouts en planification de tâches et exécution étape par étape

## Principe de connexion

Codex collabore avec NocoBase de la manière suivante :

```
Vous (terminal / ...)
  │
  └─→ Codex
        │
        ├── NocoBase Skills (permet à l'Agent de comprendre le système de configuration de NocoBase)
        │
        └── NocoBase CLI (exécute la création, la modification, le déploiement, etc.)
              │
              └─→ Service NocoBase (votre système métier)
```

- **NocoBase Skills** — packs de connaissances métier permettant à Codex de savoir comment piloter NocoBase
- **NocoBase CLI** — outil en ligne de commande qui exécute concrètement la modélisation des données, la construction des pages, etc.
- **Service NocoBase** — votre instance NocoBase en cours d'exécution

## Prérequis

Avant de commencer, assurez-vous de disposer de l'environnement suivant :

- Codex installé (`npm install -g @openai/codex`)
- Node.js >= 22 (pour exécuter NocoBase CLI et Skills)
- Si vous disposez déjà d'une instance NocoBase, **en raison de l'évolution rapide des capacités AI, seule la dernière version beta offre actuellement une expérience complète, avec une version minimale requise >= 2.1.0-beta.20. Nous recommandons fortement la mise à jour vers la dernière version.**

## Démarrage rapide

### Installation AI en un clic

Copiez le prompt ci-dessous à Codex, il prendra automatiquement en charge l'installation, l'initialisation et la configuration de l'environnement de NocoBase CLI :

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

<!-- TODO : compiler 5-8 questions fréquentes. Par exemple : comment configurer la clé API OpenAI, quels modèles Codex prend-il en charge, comment choisir le niveau d'autonomie, que faire si l'installation des Skills échoue, etc. -->

## Liens connexes

- [NocoBase CLI](../quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — packs de connaissances métier installables dans un AI Agent
- [Démarrage rapide pour la construction AI](../../ai-builder/index.md) — construire une application NocoBase à partir de zéro avec l'AI
- [Codex GitHub](https://github.com/openai/codex) — code source et documentation de Codex
- [Claude Code + NocoBase](../claude-code/index.md) — l'assistant officiel de programmation AI d'Anthropic
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent terminal open source, prend en charge plus de 75 modèles
