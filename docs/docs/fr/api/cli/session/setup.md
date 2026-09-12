---
title: "nb session setup"
description: "Référence de la commande nb session setup : installer l’intégration shell ou runtime pour `NB_SESSION_ID`."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,intégration shell"
---

# nb session setup

Installe l’intégration de session pour `NB_SESSION_ID`.

Cette commande détecte le shell actuel, ou utilise le shell passé avec `--shell`, puis écrit le fichier d’initialisation correspondant afin que les nouvelles sessions shell reçoivent automatiquement `NB_SESSION_ID`.

Si une configuration opencode est détectée sur la machine, elle écrit aussi l’intégration de plugin correspondante afin que le runtime d’agent puisse injecter son propre `NB_SESSION_ID`.

## Utilisation


nb session setup [flags]

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Remarques

Dans la plupart des cas, vous n’avez besoin d’exécuter cette commande qu’une seule fois.

Ensuite, ouvrez une nouvelle session shell ou rechargez votre profil afin que `NB_SESSION_ID` soit initialisé automatiquement.

Dans les runtimes d’agent comme Codex, si une variable de contexte comme `CODEX_THREAD_ID` existe déjà, le CLI réutilise d’abord cette valeur.

## Exemples


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## Commandes connexes

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
