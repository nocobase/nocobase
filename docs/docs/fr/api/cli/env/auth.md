---
title: "nb env auth"
description: "Référence de la commande nb env auth : authentifier un env NocoBase enregistré avec basic, token ou OAuth."
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,connexion,authentification"
---

# nb env auth

Authentifie à nouveau un env NocoBase enregistré ou met à jour les informations d'authentification qui lui sont associées. Si le nom est omis, l'env courant est utilisé.

`nb env auth` prend en charge trois méthodes d'authentification : `basic`, `token` et `oauth`. Si `--auth-type` est omis, la CLI déduit d'abord la méthode à partir des options d'authentification passées. Si elle ne peut toujours pas la déduire, elle utilise la méthode déjà enregistrée dans l'env.

## Utilisation

```bash
nb env auth [name] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l'environnement configuré auquel se connecter ; utilise l'env courante s'il est omis |
| `--auth-type`, `-a` | string | Méthode d'authentification : `basic`, `token` ou `oauth` |
| `--access-token`, `-t` | string | API key ou access token utilisé avec l'authentification `token` |
| `--username` | string | Nom d'utilisateur utilisé avec l'authentification `basic` ; demandé dans un TTY s'il est omis |
| `--password` | string | Mot de passe utilisé avec l'authentification `basic` ; demandé dans un TTY s'il est omis |

## Options de compatibilité

| Option | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'environnement, équivalent à `[name]`. Cette option cachée est conservée pour la compatibilité avec d'autres commandes ; l'argument positionnel suffit normalement |

## Description

Les méthodes d'authentification fonctionnent ainsi :

- `basic` : se connecte à NocoBase avec un nom d'utilisateur et un mot de passe, puis enregistre l'access token renvoyé et le nom d'utilisateur
- `token` : enregistre l'API key ou l'access token passé avec `--access-token`
- `oauth` : démarre le flux d'authentification dans le navigateur, puis enregistre l'access token une fois l'authentification terminée

Dans un terminal interactif, la CLI demande `--auth-type`, `--username`, `--password` ou `--access-token` quand c'est nécessaire. En mode non interactif, l'authentification `basic` exige `--username` et `--password`.

L'authentification `oauth` essaie d'abord Device Authorization Grant. Lorsque le serveur OAuth prend en charge ce flux, la commande affiche une URL de vérification et un code utilisateur, puis attend par polling que l'approbation dans le navigateur soit terminée. Cela fonctionne sur des serveurs distants ou sans interface graphique, car aucun listener de callback local n'est nécessaire.

Si le serveur OAuth n'expose pas de device authorization endpoint, la commande revient au flux PKCE loopback : elle démarre un service de callback local, ouvre le navigateur pour l'autorisation, échange le token et l'enregistre dans le fichier de configuration.

Une fois l'authentification réussie, la CLI exécute automatiquement `nb env update <name>` pour resynchroniser l'état de l'env.

## Limites

- `[name]` et `--env` ne peuvent pas fournir deux noms d'environnement différents en même temps
- `--access-token` ne peut pas être utilisé avec `--username` ou `--password`
- `--auth-type oauth` ne peut pas être utilisé avec `--access-token`, `--username` ou `--password`
- `--auth-type token` ne peut pas être utilisé avec `--username` ou `--password`
- `--auth-type basic` ne peut pas être utilisé avec `--access-token`
- `--access-token`, `--username` et `--password` ne peuvent pas être vides une fois fournis

## Exemples

```bash
# Authentifier l'env courant avec la méthode d'authentification enregistrée
nb env auth

# Authentifier un env spécifique
nb env auth prod

# Utiliser la connexion OAuth dans le navigateur
nb env auth prod --auth-type oauth

# Se connecter avec un nom d'utilisateur et un mot de passe
nb env auth prod --auth-type basic --username admin --password secret

# Enregistrer une API key ou un access token
nb env auth prod --auth-type token --access-token <api-key>
```

Pour device authorization, ouvre l'URL affichée par la commande et saisis dans le navigateur le code indiqué.

## Commandes connexes

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
