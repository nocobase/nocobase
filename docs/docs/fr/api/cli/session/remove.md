---
title: "nb session remove"
description: "Référence de la commande nb session remove : supprimer l’intégration shell ou runtime pour `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,supprimer l’intégration de session"
---

# nb session remove

Supprime l’intégration de session pour `NB_SESSION_ID`.

Cette commande nettoie la configuration shell écrite auparavant par [`nb session setup`](./setup.md). Si une intégration du plugin opencode est détectée, elle la supprime également.

## Utilisation


nb session remove [flags]

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Exemples


nb session remove
nb session remove --shell zsh

## Commandes connexes

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
