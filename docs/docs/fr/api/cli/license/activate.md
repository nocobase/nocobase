---
title: "nb license activate"
description: "Référence de la commande nb license activate : activer une license key commerciale NocoBase existante pour un env sélectionné."
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

Active une license key commerciale existante pour un env sélectionné. Tu peux la passer directement, la lire depuis un fichier ou la coller dans un terminal interactif.

## Utilisation

```bash
nb license activate [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI ; si omis, l'env courant est utilisé |
| `--key` | string | Fournir directement une license key commerciale existante |
| `--key-file` | string | Lire une license key commerciale existante depuis un fichier |
| `--yes`, `-y` | boolean | Lorsque `--env` est passé explicitement et cible une env différente de l'env actuelle, ignore la confirmation interactive |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## Remarques

En mode interactif, la CLI affiche d'abord le Hostname et l'Instance ID actuels, puis te demande de coller directement la license key ou de saisir le chemin d'un fichier de key. Ces informations te permettent de vérifier que la licence est bien liée à la bonne instance.

Une fois l'activation réussie, redémarre l'application pour que la licence et l'état des plugins commerciaux prennent réellement effet ; avant le redémarrage, la CLI synchronisera automatiquement les plugins commerciaux autorisés par la licence actuelle :

```bash
nb app restart
```

Si vous passez `--env` explicitement et qu'il est différent de l'env actuelle, la CLI demande d'abord une confirmation. Dans un terminal non interactif ou une session d'agent IA, ajoutez vous-même `--yes` ou exécutez d'abord `nb env use <name>` puis réessayez.

## Commandes connexes

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
