---
title: "nb session"
description: "Référence de la commande nb session : configurer et inspecter `NB_SESSION_ID` afin d’isoler l’env courant par shell ou runtime d’agent."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,mode session"
---

# nb session

Gère le mode session pour `NB_SESSION_ID`.

Une fois le mode session activé, `nb env use` et `nb env current` utilisent d’abord le contexte du shell ou du runtime d’agent courant, au lieu de partager directement un unique current env global.

## Utilisation


nb session <command>

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb session setup`](./setup.md) | Installer l'intégration shell ou runtime pour `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Afficher l'identifiant de session effectivement utilisé |
| [`nb session remove`](./remove.md) | Supprimer l'intégration shell ou runtime pour `NB_SESSION_ID` |

## Quand en avez-vous besoin

La recommandation par défaut est d’exécuter `nb session setup` une fois quand vous commencez à utiliser le CLI. Avec cela :

- le terminal 1 peut utiliser `env1`
- le terminal 2 peut utiliser `env2` en même temps
- un runtime d’agent peut aussi conserver son propre current env

Sans mode session, différentes sessions finissent par partager le `last env` global comme repli, ce qui augmente les interférences en travail parallèle.

## Commandes connexes

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
