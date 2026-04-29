---
title: "nb env auth"
description: "Référence de la commande nb env auth : effectuer la connexion OAuth pour un env NocoBase enregistré."
keywords: "nb env auth,NocoBase CLI,OAuth,connexion,authentification"
---

# nb env auth

Effectuer la connexion OAuth pour l'env indiqué. Si le nom est omis, l'env courant est utilisé.

## Utilisation

```bash
nb env auth [name]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l'environnement ; utilise l'env courant si omis |

## Description

En interne, la commande utilise le flux PKCE : elle démarre un service de callback local, ouvre le navigateur pour l'autorisation, échange le token et l'enregistre dans le fichier de configuration.

## Exemples

```bash
nb env auth
nb env auth prod
```

## Commandes connexes

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
