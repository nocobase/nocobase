---
title: "nb proxy nginx generate"
description: "Référence de la commande nb proxy nginx generate : générer ou actualiser la configuration Nginx pour un env géré par la CLI."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,configuration proxy"
---

# nb proxy nginx generate

Génère ou actualise la configuration d'entrée Nginx pour un env géré par la CLI.

## Utilisation

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env géré par la CLI pour lequel générer la configuration |
| `--host` | string | Nom de domaine écrit dans la configuration d'entrée, par exemple `app1.example.com` |
| `--port` | string | Port d'écoute écrit dans la configuration d'entrée, par exemple `8080` |

## Fichiers générés

En prenant l'env `test2` comme exemple, la commande maintient généralement ces fichiers et répertoires :

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

L'entrée Nginx générée couvre principalement ces zones :

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Exemples

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Remarques

- `generate` se contente d'écrire ou d'actualiser la configuration et ne démarre pas automatiquement Nginx
- `app.conf` est le fichier d'entrée modifiable, mais son bloc géré doit rester intact
- Si vous modifiez des réglages comme `app-port` ou `app-public-path` avec `nb env update`, il faut généralement relancer cette commande
- Seuls les env gérés par la CLI de type `local` ou `docker` peuvent utiliser cette commande

## Commandes associées

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
