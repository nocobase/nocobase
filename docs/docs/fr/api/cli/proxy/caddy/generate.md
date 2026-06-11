---
title: "nb proxy caddy generate"
description: "Référence de la commande nb proxy caddy generate : générer ou actualiser la configuration Caddy pour un env géré par la CLI."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,configuration proxy"
---

# nb proxy caddy generate

Génère ou actualise la configuration d'entrée Caddy pour un env géré par la CLI.

## Utilisation

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env géré par la CLI pour lequel générer la configuration |
| `--host` | string | Nom d'hôte écrit dans l'adresse du site, par exemple `app1.example.com` |
| `--port` | string | Port d'écoute écrit dans l'adresse du site, par exemple `8080` |

## Fichiers générés

En prenant l'env `test2` comme exemple, la commande maintient généralement ces fichiers et répertoires :

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

Dans la conception actuelle, `app.caddy` est déjà la configuration complète du site pour un env et n'est plus scindé dans un fichier `generated.caddy` séparé.

## Exemples

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Remarques

- `generate` se contente d'écrire ou d'actualiser la configuration et ne démarre pas automatiquement Caddy
- Régénérer la configuration remplace entièrement `app.caddy`
- Si vous modifiez des réglages comme `app-port` ou `app-public-path` avec `nb env update`, il faut généralement relancer cette commande
- Seuls les env gérés par la CLI de type `local` ou `docker` peuvent utiliser cette commande

## Commandes associées

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
