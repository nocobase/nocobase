---
title: "nb app autostart disable"
description: "Référence de nb app autostart disable : désactivez le démarrage automatique de l’application pour un env."
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

Désactive le marqueur de démarrage automatique de l’application pour un env.

Une fois désactivé, cet env ne participe plus à `nb app autostart run`. Cette commande n’arrête pas directement une application déjà en cours d’exécution. Si vous souhaitez aussi arrêter le runtime actuel, utilisez `nb app stop` séparément.

## Utilisation

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l’env CLI à retirer du démarrage automatique. Utilise l’env courant si omis |
| `--yes`, `-y` | boolean | Ignore la confirmation interactive lorsqu’un `--env` explicite pointe vers un env différent de l’env courant |

## Exemples

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## Notes

Cette commande ne modifie que le marqueur de démarrage automatique enregistré. Elle n’arrête pas directement l’application. Si un env n’avait déjà pas le démarrage automatique activé, il restera simplement désactivé.

Comme pour `enable`, la CLI ne vérifie la confirmation inter-env que lorsque `--env` est fourni explicitement. En terminal non interactif ou avec agent IA, ajoutez `--yes` vous-même si nécessaire.

## Commandes associées

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
