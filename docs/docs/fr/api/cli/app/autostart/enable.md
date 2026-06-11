---
title: "nb app autostart enable"
description: "Référence de nb app autostart enable : activez le démarrage automatique de l’application pour un env local ou Docker."
keywords: "nb app autostart enable,NocoBase CLI,autostart,env"
---

# nb app autostart enable

Active le marqueur de démarrage automatique de l’application pour un env.

Ce marqueur ne s’applique qu’aux envs `local` ou `docker` dont le runtime est géré par la CLI sur la machine actuelle. Il ne démarre pas l’application immédiatement. À la place, il ajoute l’env à l’ensemble qui pourra ensuite être lancé par `nb app autostart run`.

## Utilisation

```bash
nb app autostart enable [flags]
```

## Flags

| Flag | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l’env CLI à ajouter au démarrage automatique. Utilise l’env courant si omis |
| `--yes`, `-y` | boolean | Ignore la confirmation interactive lorsqu’un `--env` explicite pointe vers un env différent de l’env courant |

## Exemples

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## Notes

La CLI vérifie uniquement si l’env cible est différente de l’env courant lorsque vous passez `--env` explicitement. En terminal interactif, elle demande d’abord confirmation. En terminal non interactif ou dans un flux avec agent IA, vous devez ajouter `--yes` vous-même, ou basculer d’abord vers l’env cible avec `nb env use <name>`.

Si l’env cible n’est pas un runtime `local` ou `docker` géré par la CLI sur la machine actuelle, la commande échoue et n’enregistre pas le marqueur de démarrage automatique.

## Commandes associées

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
