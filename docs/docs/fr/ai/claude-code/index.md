---
title: "Claude Code + NocoBase : le cerveau AI le plus puissant, votre architecte en chef NocoBase"
description: "Intégrez Claude Code, l'assistant officiel de programmation AI d'Anthropic, à NocoBase pour piloter votre système métier en langage naturel via les Skills et la CLI."
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,langage naturel"
sidebar: false
---

:::warning Attention

Le contenu de cette page est en cours de rédaction ; certaines sections peuvent être incomplètes ou sujettes à modification.

:::

# Claude Code + NocoBase : le cerveau AI le plus puissant, votre architecte en chef NocoBase

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) est l'assistant officiel de programmation AI lancé par Anthropic — il s'exécute directement dans votre terminal, comprend l'ensemble de votre code et vous aide à réaliser de nombreuses tâches, du codage à la construction de systèmes. En l'intégrant à NocoBase, vous pouvez utiliser le langage naturel pour créer des tables de données, construire des pages, configurer des workflows et bénéficier de l'expérience de construction offerte par les modèles AI les plus puissants.

<!-- Une capture d'écran de Claude Code pilotant NocoBase dans un terminal serait nécessaire -->

## Qu'est-ce que Claude Code

Claude Code est un AI Agent en CLI lancé par Anthropic, propulsé par les modèles de la série Claude. Il s'exécute directement dans le terminal, comprend le contexte de votre projet et exécute les opérations. Caractéristiques principales :

- **Capacités de modèle de premier plan** — basé sur Claude Opus / Sonnet, leader dans la compréhension et la génération de code
- **Natif du terminal** — s'exécute directement dans le terminal, parfaitement intégré au workflow des développeurs
- **Conscient du projet** — analyse automatiquement la structure du projet, les dépendances et les conventions de code
- **Collaboration multi-outils** — prend en charge la lecture/écriture de fichiers, l'exécution de commandes, la recherche de code, etc.

Claude Code prend également en charge les intégrations IDE telles que VS Code et JetBrains, et est aussi disponible en application bureautique et web autonomes.

## Pourquoi choisir Claude Code

Si vous hésitez entre plusieurs AI Agents pour piloter NocoBase, voici les scénarios où Claude Code excelle :

- **Recherche des capacités de modèle les plus puissantes** — la série Claude se distingue dans le raisonnement complexe et la génération de code
- **Workflow quotidien des développeurs** — natif du terminal, parfaitement intégré à votre IDE, Git, npm, etc.
- **Compréhension approfondie du projet** — Claude Code analyse automatiquement la structure du projet et fournit des suggestions adaptées au contexte
- **Construction et développement simultanés** — il peut à la fois construire votre application NocoBase et développer des plugins personnalisés

## Principe de connexion

Claude Code collabore avec NocoBase de la manière suivante :

```
Vous (terminal / VS Code / JetBrains / ...)
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills (permet à l'Agent de comprendre le système de configuration de NocoBase)
        │
        └── NocoBase CLI (exécute la création, la modification, le déploiement, etc.)
              │
              └─→ Service NocoBase (votre système métier)
```

- **NocoBase Skills** — packs de connaissances métier permettant à Claude Code de savoir comment piloter NocoBase
- **NocoBase CLI** — outil en ligne de commande qui exécute concrètement la modélisation des données, la construction des pages, etc.
- **Service NocoBase** — votre instance NocoBase en cours d'exécution

## Prérequis

Avant de commencer, assurez-vous de disposer de l'environnement suivant :

- Claude Code installé (`npm install -g @anthropic-ai/claude-code`)
- Node.js >= 22 (pour exécuter NocoBase CLI et Skills)
- Si vous disposez déjà d'une instance NocoBase, **en raison de l'évolution rapide des capacités AI, seule la dernière version beta offre actuellement une expérience complète, avec une version minimale requise >= 2.1.0-beta.20. Nous recommandons fortement la mise à jour vers la dernière version.**

## Démarrage rapide

### Installation AI en un clic

Copiez le prompt ci-dessous à Claude Code, il prendra automatiquement en charge l'installation, l'initialisation et la configuration de l'environnement de NocoBase CLI :

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

<!-- TODO : compiler 5-8 questions fréquentes. Par exemple : comment configurer la clé API, quels modèles Claude Code prend-il en charge, comment l'utiliser dans VS Code, que faire si l'installation des Skills échoue, etc. -->

## Liens connexes

- [NocoBase CLI](../quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — packs de connaissances métier installables dans un AI Agent
- [Démarrage rapide pour la construction AI](../../ai-builder/index.md) — construire une application NocoBase à partir de zéro avec l'AI
- [Documentation officielle Claude Code](https://docs.anthropic.com/en/docs/claude-code) — guide d'utilisation complet de Claude Code
- [OpenClaw + NocoBase](../openclaw/index.md) — l'AI Agent open source le plus populaire au monde, déploiement Lark en un clic
- [Codex + NocoBase](../codex/index.md) — l'assistant officiel de programmation AI d'OpenAI
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent terminal open source, prend en charge plus de 75 modèles
