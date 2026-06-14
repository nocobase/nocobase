---
title: Installer l'application NocoBase
description: Installez NocoBase CLI et créez rapidement une nouvelle application NocoBase avec `nb init --ui`, pour que votre AI Agent puisse commencer à travailler tout de suite.
---

# Installer l'application NocoBase

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

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

Selon le chemin de setup choisi, les étapes affichées peuvent varier un peu. Si vous suivez le chemin par défaut `Install a new app`, vous verrez généralement ces six étapes :

1. `Getting started` - définir l'identifiant `--env` et choisir `Install a new app`
2. `App environment` - définir les informations de base de l'application, l'emplacement de stockage et le port d'exécution
3. `App source and version` - choisir comment récupérer l'application, ainsi que la source et la version à utiliser
4. `Configure the database` - choisir la base de données intégrée ou une base de données personnalisée
5. `Create an admin account` - configurer le premier compte administrateur
6. `Connection & authentication` - saisir l'URL d'accès de l'application et choisir une méthode d'authentification

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
nb env info
nb app logs
```

Pour une installation locale avec la configuration par défaut, vous pouvez généralement ouvrir directement `http://localhost:13000` dans le navigateur. Une fois connecté, ouvrez une nouvelle session AI Agent ou redémarrez la session actuelle, et l'IA pourra commencer à travailler avec cette application NocoBase.

La configuration de la CLI est enregistrée par défaut dans `~/.nocobase/`, de sorte que les AI Agents peuvent généralement y accéder depuis n'importe quel répertoire de travail.

Si cette application doit ensuite être exposée à de vrais utilisateurs, nous ne recommandons pas d'utiliser durablement `IP + port` tel quel. L'étape suivante consiste généralement à mettre en place un reverse proxy et à activer HTTPS.

## Étapes suivantes

- Si vous avez déjà une application NocoBase en cours d'exécution, consultez le [Guide d'intégration pour AI Agent](./quick-start.mdx)
- Si vous voulez gérer le démarrage, l'arrêt, les logs et les mises à jour de l'application, consultez [Gérer les applications](../nocobase-cli/operations/manage-app.md)
- Si vous voulez continuer avec le déploiement en production, consultez [Installer une application avec la CLI](../nocobase-cli/installation/cli.md) et [Vue d'ensemble du déploiement en production](../nocobase-cli/production/index.md)
- Si vous voulez laisser l'IA commencer à construire l'application, consultez [AI Builder](../ai-builder/index.md)

## Liens connexes

- [Comparaison des méthodes d'installation et des versions](../get-started/quickstart.md) — Comparez d'abord les méthodes d'installation et les canaux de version, puis choisissez comment installer
- [Guide d'intégration pour AI Agent](./quick-start.mdx) — Connectez une application NocoBase existante et laissez votre AI Agent commencer à travailler
- [Référence de la commande `nb init`](../api/cli/init.md) — Initialiser une nouvelle application, reprendre une application locale existante ou connecter une application distante
- [Référence de la commande `nb env info`](../api/cli/env/info.md) — Voir les détails de connexion et la configuration d'exécution du env actuel
- [NocoBase CLI](../api/cli/index.md) — Référence complète de toutes les commandes `nb`
- [Gérer les applications](../nocobase-cli/operations/manage-app.md) — Démarrer, arrêter, redémarrer, consulter les logs et mettre à jour les applications
- [Gestion d'environnements multiples](../nocobase-cli/operations/multi-environment.md) — Opérations courantes quand vous maintenez plusieurs env en même temps
