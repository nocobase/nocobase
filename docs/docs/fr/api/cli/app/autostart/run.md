---
title: "nb app autostart run"
description: "Référence de nb app autostart run : démarre tous les envs dont le démarrage automatique de l’application est activé."
keywords: "nb app autostart run,NocoBase CLI,autostart,démarrage groupé"
---

# nb app autostart run

Démarre tous les envs dont le démarrage automatique de l’application est activé.

Cette commande est généralement appelée après le démarrage du système hôte, via votre propre mécanisme de démarrage. La CLI lit tous les envs enregistrés, filtre ceux dont le démarrage automatique est activé, puis tente de les démarrer un par un.

## Utilisation

```bash
nb app autostart run [flags]
```

## Flags

| Flag | Type | Description |
| --- | --- | --- |
| `--verbose` | boolean | Affiche la sortie brute de démarrage des commandes locales ou Docker sous-jacentes |

## Exemples

```bash
nb app autostart run
nb app autostart run --verbose
```

## Notes

Si aucun env n’a le démarrage automatique activé, la commande affiche `No environments have app autostart enabled.`.

Pendant l’exécution, la CLI traite chaque env activé un par un :

- les envs qui peuvent démarrer apparaissent comme `started`
- les envs qui ne devraient pas être démarrés automatiquement sur la machine actuelle apparaissent comme `skipped`
- les envs qui échouent au démarrage apparaissent comme `failed`

En interne, cette commande appelle `nb app start --env <name> --yes`. Si vous passez `--verbose`, ce flag est aussi transmis au flux de démarrage sous-jacent.

Si au moins un résultat est `failed`, la commande se termine avec une erreur et affiche `Some app autostart envs failed to start.`. Cela permet de rendre les échecs visibles dans `systemd`, CI ou d’autres mécanismes de démarrage de l’hôte.

## Commandes associées

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
