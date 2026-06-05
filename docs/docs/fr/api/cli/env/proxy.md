---
title: 'nb env proxy'
description: 'Référence de la commande nb env proxy : génère une configuration proxy Nginx ou Caddy pour un env géré par la CLI.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuration proxy'
---

# nb env proxy

Dans NocoBase CLI, `nb env proxy` génère une configuration de reverse proxy pour un env géré par la CLI. `nginx` est le choix par défaut. Passez à `caddy` seulement si vous utilisez déjà Caddy ou si vous avez besoin explicitement d’un Caddyfile.

Cette commande fonctionne uniquement pour les env gérés dont le runtime est accessible depuis la machine actuelle, c’est-à-dire `local` ou `docker`. Pour le moment, elle ne prend pas en charge les env qui n’ont qu’une connexion API distante ni les env SSH.

## Utilisation

```bash
nb env proxy [name] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l’env configuré pour lequel générer la configuration proxy. Si ce paramètre est omis, l’env actuel est utilisé |
| `--output`, `-o` | string | Chemin du fichier de sortie. La valeur par défaut est `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Provider proxy : `nginx` ou `caddy` |
| `--host` | string | Hôte écrit dans la configuration d’entrée, comme `example.com` ou `localhost` |
| `--port` | string | Port écrit dans la configuration d’entrée. C’est le port d’entrée du proxy, pas le port de l’application NocoBase en amont |
| `--install` | boolean | Installe la configuration proxy partagée dans la configuration principale du provider |
| `--reload` | boolean | Valide et recharge le provider après l’écriture de la configuration |
| `--print` | boolean | Affiche la configuration générée sur stdout au lieu d’écrire des fichiers |

## Fichiers de sortie par défaut

Si vous ne passez pas `--output`, la CLI maintient trois types de fichiers sous `~/.nocobase/proxy/<provider>/` :

| Provider | Fichier généré | Fichier d’entrée modifiable | Configuration principale partagée |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

Autrement dit :

- `generated.*` est géré par la CLI et sera écrasé à la prochaine exécution de `nb env proxy`
- `app.conf` / `app.caddy` est le fichier d’entrée modifiable, mais vous devez conserver la référence à la configuration generated gérée par la CLI
- `nocobase.conf` / `nocobase.caddy` est la configuration principale partagée qui inclut les fichiers d’entrée de tous les env

Si vous passez `--output`, la CLI écrit uniquement la configuration générée dans ce fichier et ne crée ni ne met à jour le fichier d’entrée ni la configuration principale partagée.

## Éléments de configuration associés

| Élément de configuration | Valeur par défaut | Description |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Provider par défaut utilisé par `nb env proxy` |
| `proxy.nb-cli-root` | Racine de la CLI, généralement le répertoire personnel de l’utilisateur actuel | Mappe le chemin `.nocobase` vers la racine réellement visible par le processus proxy |
| `proxy.upstream-host` | `127.0.0.1` | Hôte utilisé par le proxy pour renvoyer le trafic vers l’application NocoBase |
| `bin.caddy` | `caddy` | Chemin de l’exécutable Caddy utilisé par `--install` ou `--reload` |
| `bin.nginx` | `nginx` | Chemin de l’exécutable Nginx utilisé par `--install` ou `--reload` |

La plupart des environnements n’ont pas besoin de modifier `proxy.nb-cli-root`. En général, cela n’est utile que si Nginx ou Caddy s’exécute dans un autre conteneur, sous une autre racine de montage ou avec une autre vue des chemins.

## Remarques

- `--port` doit être un entier compris entre `1` et `65535`
- Le port de l’application NocoBase en amont provient du `appPort` enregistré dans l’env, pas de `--port`
- Si la commande indique que l’env ne possède pas `appPort`, exécutez d’abord `nb env update <name>` ou enregistrez-le explicitement avec `nb env update <name> --app-port <port>`
- `--print` ne peut pas être combiné avec `--install` ou `--reload`
- `--output` ne peut pas être combiné avec `--install` ou `--reload`
- `--install` relie la configuration partagée à la configuration principale du provider. `--reload` valide et recharge le provider. En pratique, ces deux options sont généralement utilisées ensemble

## Exemples

```bash
# Génère la configuration nginx par défaut pour l’env actuel
nb env proxy

# Génère une configuration pour un env précis
nb env proxy demo

# Affiche la configuration générée sans écrire de fichiers
nb env proxy demo --print

# Écrit l’hôte et le port dans la configuration d’entrée
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Génère une configuration Caddy
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Modifie le provider par défaut et l’hôte upstream
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Mappe le chemin .nocobase lorsque le provider s’exécute sous une autre racine
nb config set proxy.nb-cli-root /workspace

# Installe la configuration partagée dans la configuration principale du provider et le recharge
nb env proxy demo --install --reload
```

## Commandes associées

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
