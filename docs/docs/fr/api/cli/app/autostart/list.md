---
title: "nb app autostart list"
description: "Référence de nb app autostart list : affiche l’état du démarrage automatique pour tous les envs configurés."
keywords: "nb app autostart list,NocoBase CLI,autostart,liste des envs"
---

# nb app autostart list

Affiche l’état du démarrage automatique pour tous les envs configurés.

Le tableau de sortie contient :

- `Current` : marque l’env courant avec `*`
- `Env` : nom de l’env
- `Kind` : type d’env
- `Source` : type d’installation ou de source
- `Autostart` : si le démarrage automatique est activé

## Utilisation

```bash
nb app autostart list
```

## Exemple

```bash
nb app autostart list
```

## Notes

S’il n’y a encore aucun env enregistré, la commande affiche `No environments are configured.`.

Cette commande ne montre que l’état enregistré dans la CLI. Elle ne vérifie pas si une application est déjà en cours d’exécution, ni si votre processus de démarrage système appelle déjà `nb app autostart run`. Son but principal est de montrer quels envs sont marqués pour le démarrage automatique dans la configuration CLI.

## Commandes associées

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart disable`](./disable.md)
- [`nb env list`](../../env/list.md)
