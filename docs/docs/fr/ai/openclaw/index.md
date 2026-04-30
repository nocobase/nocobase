---
title: "OpenClaw + NocoBase : l'AI Agent le plus populaire travaille pour vous"
description: "Intégrez OpenClaw, l'AI Agent open source le plus populaire au monde, à NocoBase pour piloter votre système métier en langage naturel via les Skills et la CLI."
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,langage naturel"
sidebar: false
---

:::warning Attention

Le contenu de cette page est en cours de rédaction ; certaines sections peuvent être incomplètes ou sujettes à modification.

:::

# OpenClaw + NocoBase : l'AI Agent le plus populaire travaille pour vous

[OpenClaw](https://github.com/openclaw/openclaw) est le framework d'AI Agent open source le plus populaire au monde — il ne se contente pas de discuter, il passe à l'action pour exécuter de vraies tâches. En l'intégrant à NocoBase, vous pouvez utiliser le langage naturel pour créer des tables de données, construire des pages, configurer des workflows, et même le faire fonctionner 24h/24 et 7j/7 en autonomie pour entretenir continuellement votre système métier.

<!-- Une capture d'écran d'OpenClaw pilotant NocoBase dans Lark serait nécessaire -->

## Qu'est-ce que OpenClaw

OpenClaw est un framework d'AI Agent open source créé par le développeur Peter Steinberger ; c'est l'un des projets d'AI Agent les plus populaires actuellement (300k+ étoiles sur GitHub). Il se positionne comme « un assistant AI capable de passer à l'action ». Contrairement aux outils conversationnels comme ChatGPT ou Claude, OpenClaw possède quatre caractéristiques principales :

- **Capacité d'exécution** — exécute automatiquement les tâches après avoir reçu des instructions en langage naturel, ne se contente pas de donner des suggestions
- **Mémoire inter-sessions** — mémorise vos préférences et habitudes d'utilisation, devient de plus en plus pratique au fil du temps
- **Écosystème de Skills** — étend ses capacités via l'installation de Skills, comme « apprendre de nouvelles compétences » à un assistant
- **Fonctionnement 24h/24, 7j/7** — prend en charge les tâches planifiées et les rapports proactifs, sans avoir besoin de votre surveillance constante

OpenClaw prend en charge plus de 26 plateformes (Lark, Telegram, Discord, etc.) et vous permet de discuter avec lui directement dans vos outils de travail quotidiens. Les utilisateurs de Lark peuvent également profiter d'un déploiement en un clic, sans aucune compétence technique requise.

## Pourquoi choisir OpenClaw

Si vous hésitez entre plusieurs AI Agents pour piloter NocoBase, voici les scénarios où OpenClaw excelle :

- **Besoin d'une prise en main sans friction** — les utilisateurs de Lark peuvent déployer en un clic, sans avoir à monter un serveur
- **L'équipe travaille avec Lark** — OpenClaw est profondément intégré à Lark, avec une expérience fluide : génération de messages en streaming, mention @bot dans les groupes, etc.
- **Besoin d'une disponibilité 24h/24, 7j/7** — OpenClaw est déployé dans le cloud, indépendant de l'état de votre ordinateur local
- **Importance accordée à l'écosystème communautaire** — OpenClaw possède la plus grande communauté de Skills, avec de nombreuses autres compétences disponibles en plus de NocoBase

## Principe de connexion

OpenClaw collabore avec NocoBase de la manière suivante :

```
Vous (Lark / Telegram / ...)
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills (permet à l'Agent de comprendre le système de configuration de NocoBase)
        │
        └── NocoBase CLI (exécute la création, la modification, le déploiement, etc.)
              │
              └─→ Service NocoBase (votre système métier)
```

- **NocoBase Skills** — packs de connaissances métier permettant à OpenClaw de savoir comment piloter NocoBase
- **NocoBase CLI** — outil en ligne de commande qui exécute concrètement la modélisation des données, la construction des pages, etc.
- **Service NocoBase** — votre instance NocoBase en cours d'exécution

## Prérequis

Avant de commencer, assurez-vous de disposer de l'environnement suivant :

- OpenClaw Agent déployé ([déploiement Lark en un clic](https://openclaw.feishu.cn) ou déploiement local)
- Node.js >= 22 (pour exécuter NocoBase CLI et Skills)
- Si vous disposez déjà d'une instance NocoBase, **en raison de l'évolution rapide des capacités AI, seule la dernière version beta offre actuellement une expérience complète, avec une version minimale requise >= 2.1.0-beta.20. Nous recommandons fortement la mise à jour vers la dernière version.**

:::warning Attention

Soyez prudent lors de l'installation de Skills tiers — privilégiez les Skills officiels ou de sources fiables, et évitez d'installer des compétences communautaires non vérifiées.

:::

## Démarrage rapide

### Installation AI en un clic

Copiez le prompt ci-dessous à OpenClaw, il prendra automatiquement en charge l'installation, l'initialisation et la configuration de l'environnement de NocoBase CLI :

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

<!-- TODO : compiler 5-8 questions fréquentes. Par exemple : que faire si l'installation des Skills échoue, comment mettre à jour la version des Skills, quels modèles OpenClaw prend-il en charge, comment annuler une opération en cas d'erreur, etc. -->

## Liens connexes

- [NocoBase CLI](../quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — packs de connaissances métier installables dans un AI Agent
- [Démarrage rapide pour la construction AI](../../ai-builder/index.md) — construire une application NocoBase à partir de zéro avec l'AI
- [Guide de déploiement OpenClaw sur Lark](https://openclaw.feishu.cn) — déployer OpenClaw sur Lark en un clic
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — capitalise automatiquement les compétences, comprend de mieux en mieux votre système métier
- [WorkBuddy + NocoBase](../workbuddy/index.md) — pilotage à distance de NocoBase via plusieurs plateformes : WeCom, Lark, DingTalk
