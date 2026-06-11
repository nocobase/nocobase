---
title: Installer l'application NocoBase
description: Installez NocoBase CLI et créez rapidement une nouvelle application NocoBase avec `nb init --ui`, pour que votre AI Agent puisse commencer à travailler tout de suite.
---

# Installer l'application NocoBase

Si vous n'avez pas encore d'application NocoBase, le plus rapide est d'installer d'abord `@nocobase/cli`, puis d'exécuter une fois `nb init --ui`. Dans la plupart des cas, les options par défaut de l'assistant suffisent.

## Prérequis

- Node.js >= 22
- Yarn 1.x
- Si vous comptez installer avec Docker, assurez-vous d'abord que Docker est déjà lancé

## Étape 1 : installer la CLI

Installez d'abord NocoBase CLI globalement :

```bash
npm install -g @nocobase/cli
nb --version
```

Si vous travaillez souvent avec plusieurs terminaux en parallèle, ou si vous voulez avancer en même temps qu'un AI Agent, nous vous recommandons aussi d'exécuter `nb session setup` une fois. Ainsi, chaque session conserve son propre `current env`, et elles se perturbent moins facilement.

## Étape 2 : initialiser l'application

Par défaut, nous vous recommandons d'ouvrir directement l'assistant visuel :

```bash
nb init --ui
```

Dans l'assistant, suivez ces étapes dans l'ordre :

1. Définir le nom de l'application - il devient aussi le nom de l'env dans la CLI
2. Choisir « Nouvelle installation »
3. Choisir la méthode d'installation - Docker, npm ou Git
4. Définir le port, la base de données et le compte administrateur
5. Attendre la fin du téléchargement, de l'installation et du démarrage

Si vous préférez rester dans le terminal, vous pouvez aussi exécuter directement :

```bash
nb init
```

Si vous initialisez dans des scripts ou dans un pipeline CI, utilisez le mode non interactif :

```bash
nb init --yes --env app1
```

:::tip Installation sur un serveur distant

Si vous exécutez `nb init --ui` sur un serveur, nous vous recommandons de remplacer d'abord le host par défaut par l'IP actuelle de ce serveur. Vous pourrez ainsi ouvrir l'assistant depuis votre navigateur local.

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## Étape 3 : vérifier que l'application est prête

Après l'installation, il vaut généralement mieux vérifier d'abord ces trois points :

- L'env a bien été enregistré
- L'application a bien démarré
- Vous pouvez vous connecter avec le compte administrateur

Les commandes les plus courantes sont :

```bash
nb env list
nb env status
nb app logs
```

Pour une installation locale avec la configuration par défaut, vous pouvez généralement ouvrir directement `http://localhost:13000` dans le navigateur. Une fois connecté, ouvrez une nouvelle session AI Agent ou redémarrez la session actuelle, et l'IA pourra commencer à travailler avec cette application NocoBase.

La configuration de la CLI est enregistrée par défaut dans `~/.nocobase/`, de sorte que les AI Agents peuvent généralement y accéder depuis n'importe quel répertoire de travail.

Si cette application doit ensuite être exposée à de vrais utilisateurs, nous ne recommandons pas d'utiliser durablement `IP + port` tel quel. L'étape suivante consiste généralement à mettre en place un reverse proxy et à activer HTTPS.

## Et ensuite

- Si vous avez déjà une instance NocoBase en cours d'exécution, allez directement au [Guide d'intégration pour AI Agent](./quick-start.mdx)
- Si vous voulez continuer avec un déploiement en production, consultez [Installer avec la CLI](../nocobase-cli/installation/cli.md) et [Vue d'ensemble du déploiement en production](../nocobase-cli/production/index.md)
- Si vous voulez laisser l'IA commencer à construire l'application ensuite, consultez [AI Builder](../ai-builder/index.md)
