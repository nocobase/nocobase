---
title: "Hermes Agent : l'assistant NocoBase qui vous comprend de mieux en mieux"
description: "Intégrez Hermes Agent à NocoBase ; grâce à la mémoire inter-sessions et à la capitalisation automatique des compétences, l'AI comprend de mieux en mieux votre système métier."
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,apprentissage automatique,auto-hébergé"
sidebar: false
---

:::warning Attention

Le contenu de cette page est en cours de rédaction ; certaines sections peuvent être incomplètes ou sujettes à modification.

:::

# Hermes Agent : l'assistant NocoBase qui vous comprend de mieux en mieux

[Hermes Agent](https://github.com/nousresearch/hermes-agent) est un AI Agent open source auto-hébergé — il capitalise automatiquement chaque opération réussie sous forme de documents de compétences réutilisables, comprenant ainsi de mieux en mieux votre système au fil de l'usage. En l'intégrant à NocoBase, vous pouvez non seulement construire et gérer votre système en langage naturel, mais aussi lui faire apprendre progressivement vos conventions et préférences métier.

<!-- Une capture d'écran de Hermes Agent pilotant NocoBase dans un terminal ou Lark serait nécessaire -->

## Qu'est-ce que Hermes Agent

Hermes Agent est développé par Nous Research (35,7k étoiles sur GitHub) ; sa philosophie centrale est « plus on l'utilise, plus il est intelligent ». Contrairement à d'autres AI Agents, Hermes dispose d'un mécanisme d'apprentissage en boucle complète :

- **Mémoire inter-sessions** — basée sur la recherche en texte intégral et le résumé par LLM, peut remonter au contexte de conversations vieilles de plusieurs semaines
- **Capitalisation automatique des compétences** — après chaque tâche complexe réalisée avec succès, crée automatiquement un document de compétence réutilisable
- **Auto-amélioration continue** — les compétences s'optimisent au fil des utilisations répétées, devenant de plus en plus précises
- **Prise en charge de plus de 400 modèles** — compatible avec les principaux fournisseurs LLM, sans verrouillage sur un modèle spécifique

Hermes prend en charge 8 plateformes (Lark, Telegram, Discord, Slack, etc.) et s'utilise aussi directement en terminal.

:::tip Astuce

Hermes Agent s'exécute sur votre propre serveur, toutes les données et la mémoire sont stockées localement, ce qui le rend adapté aux scénarios exigeants en matière de sécurité des données.

:::

## Pourquoi choisir Hermes Agent

Si vous hésitez entre plusieurs AI Agents pour piloter NocoBase, voici les scénarios où Hermes excelle :

- **Maintenance à long terme du même système** — le mécanisme de mémoire de Hermes lui permet de comprendre votre métier de mieux en mieux, sans avoir à réexpliquer le contexte à chaque fois
- **L'équipe a un besoin d'auto-hébergement** — toutes les données restent locales, sans passer par un service cloud tiers
- **Besoin de procédures opérationnelles standardisées** — les documents de compétences capitalisés automatiquement par Hermes peuvent servir de manuel d'opérations pour l'équipe
- **Préférence pour les opérations en terminal** — Hermes prend en charge nativement l'interaction CLI, idéal pour l'usage quotidien des équipes techniques

## Principe de connexion

Hermes Agent collabore avec NocoBase de la manière suivante :

```
Vous (Lark / Telegram / terminal / ...)
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills (permet à l'Agent de comprendre le système de configuration de NocoBase)
        │
        ├── NocoBase CLI (exécute la création, la modification, le déploiement, etc.)
        │
        └── Mémoire & documents de compétences (capitalisés automatiquement, réutilisés en continu)
              │
              └─→ Service NocoBase (votre système métier)
```

Contrairement aux autres Agents, Hermes met à jour sa mémoire et ses documents de compétences après chaque opération. Ces informations sont stockées localement et réutilisées automatiquement lors des opérations suivantes.

## Prérequis

Avant de commencer, assurez-vous de disposer de l'environnement suivant :

- Un serveur exécutant Hermes Agent (Linux / macOS, Python 3.10+)
- Node.js >= 22 (pour exécuter NocoBase CLI et Skills)
- Si vous disposez déjà d'une instance NocoBase, **en raison de l'évolution rapide des capacités AI, seule la dernière version beta offre actuellement une expérience complète, avec une version minimale requise >= 2.1.0-beta.20. Nous recommandons fortement la mise à jour vers la dernière version.**

L'installation de Hermes ne nécessite qu'une seule commande :

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning Attention

Hermes Agent doit être déployé et maintenu par vos soins. Si vous souhaitez une expérience clé en main sans configuration, vous pouvez envisager [OpenClaw](../openclaw/index.md) (déploiement Lark en un clic) ou [WorkBuddy](../workbuddy/index.md) (hébergé par Tencent).

:::

## Démarrage rapide

### Installation AI en un clic

Copiez le prompt ci-dessous à Hermes Agent, il prendra automatiquement en charge l'installation, l'initialisation et la configuration de l'environnement de NocoBase CLI :

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

<!-- TODO : compiler 5-8 questions fréquentes. Par exemple : où sont stockés les fichiers de mémoire, comment migrer vers un nouveau serveur, quels modèles sont pris en charge, comment supprimer une mémoire erronée, quelle est la différence entre Hermes et OpenClaw, etc. -->

## Liens connexes

- [NocoBase CLI](../quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — packs de connaissances métier installables dans un AI Agent
- [Démarrage rapide pour la construction AI](../../ai-builder/index.md) — construire une application NocoBase à partir de zéro avec l'AI
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) — code source et documentation de Hermes Agent
- [OpenClaw + NocoBase](../openclaw/index.md) — l'AI Agent open source le plus populaire au monde, déploiement Lark en un clic
- [WorkBuddy + NocoBase](../workbuddy/index.md) — pilotage à distance de NocoBase via plusieurs plateformes : WeCom, Lark, DingTalk
