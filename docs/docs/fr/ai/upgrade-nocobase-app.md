---
title: Mettre à niveau l’application NocoBase
description: Mettre à niveau une application NocoBase enregistrée comme CLI env avec nb app upgrade, avec confirmation de l’env, commandes de mise à niveau, versions cibles et vérification.
---

# Mettre à niveau l’application NocoBase

:::tip Portée

Ce guide s’applique aux applications installées avec `nb init`. Si ton application a été installée avec l’ancienne méthode, lis d’abord [Comment passer NocoBase de 2.0 à 2.1](./upgrade-from-2-0-to-2-1.md).

:::

## Étape 1 : confirmer l’env actuel

Commence par confirmer le CLI env actif :

```bash
nb env current
```

Si tu ne sais pas quels envs existent, affiche d’abord la liste :

```bash
nb env list
```

Si l’env actuel n’est pas l’application à mettre à niveau, passe d’abord à l’env cible :

```bash
nb env use <env-name>
```

## Étape 2 : lancer la mise à niveau

:::warning Remarque

Par défaut, la mise à niveau télécharge à nouveau le code source de l’application ou l’image Docker.

Pour les envs npm / Git, le répertoire `source/` est supprimé puis téléchargé à nouveau. Ne place pas dans `source/` des fichiers à conserver.

Si tu as déjà préparé manuellement le code source ou l’image Docker et que tu ne veux pas que la CLI les télécharge à nouveau, ajoute `--skip-download` à la commande.

:::

La commande de mise à niveau par défaut est :

```bash
nb app upgrade
```

Cette commande effectue généralement les étapes suivantes :

1. Arrêter l’application actuelle
2. Télécharger et remplacer la source ou l’image enregistrée
3. Synchroniser les plugins commerciaux
4. Mettre à niveau et démarrer l’application
5. Actualiser les informations runtime de l’env

Dans les scripts, CI ou sessions d’AI Agent, passe explicitement `--force` :

```bash
nb app upgrade --force
```

Si l’application à mettre à niveau n’est pas l’env actuel, indique l’env :

```bash
nb app upgrade --env app1 --yes --force
```

### Mettre à niveau vers une version spécifique

Utilise `--version` pour mettre à niveau vers un canal de version spécifique :

```bash
nb app upgrade --version beta
```

Tu peux aussi indiquer une version exacte :

```bash
nb app upgrade --version 2.1.0-beta.24
```

Après une mise à niveau réussie, la CLI écrit la version cible dans la configuration de l’env. Les prochaines mises à niveau ou restaurations pourront la réutiliser.

### Ignorer le téléchargement

Si tu as déjà mis à jour le code source ou l’image Docker et que tu veux seulement exécuter la mise à niveau et le démarrage avec le contenu actuel, ajoute `--skip-download` :

```bash
nb app upgrade --skip-download
```

Ce paramètre ignore le téléchargement de la source ou de l’image, ainsi que la synchronisation des plugins commerciaux. Utilise-le généralement seulement lorsque la version cible a déjà été préparée manuellement.

## Étape 3 : vérifier le résultat

Après la mise à niveau, vérifie d’abord les informations runtime de l’env et les logs de l’application :

```bash
nb env info
nb app logs
```

Ouvre ensuite l’application et confirme que le compte administrateur peut se connecter. Si tu veux qu’un AI Agent continue à travailler avec cette application, démarre une nouvelle session d’AI Agent ou redémarre la session actuelle afin qu’elle lise les dernières informations de l’env.

## Liens associés

- [Gérer les applications](../nocobase-cli/operations/manage-app.md) — Démarrer, arrêter, redémarrer, consulter les logs et mettre à niveau les applications
- [Référence de la commande `nb app upgrade`](../api/cli/app/upgrade.md) — Voir toutes les options de la commande de mise à niveau
- [Gestion de plusieurs environnements](../nocobase-cli/operations/multi-environment.md) — Confirmer, changer et maintenir plusieurs CLI envs
