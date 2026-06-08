---
title: 'nb env proxy caddy'
description: 'Référence de la commande nb env proxy caddy : génère une configuration proxy Caddy pour un env géré par la CLI.'
keywords: 'nb env proxy caddy,NocoBase CLI,caddy,reverse proxy,configuration proxy'
---

# nb env proxy caddy

`nb env proxy caddy` génère une configuration proxy Caddy pour un env géré par la CLI. Cette commande convient bien si tu as déjà un domaine, si tu veux mettre HTTPS en place rapidement et si tu ne veux pas gérer toi-même trop de détails TLS.

Cette commande fonctionne uniquement pour des env gérés dont le runtime est accessible depuis la machine actuelle, c’est-à-dire `local` ou `docker`. Elle ne fonctionne pas pour le moment avec des env qui n’ont qu’une connexion API distante ni avec des env SSH.

## Utilisation

```bash
nb env proxy caddy [name] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l’env configuré pour lequel générer une configuration proxy. Si ce paramètre est omis, l’env actuel est utilisé |
| `--env`, `-e` | string | Indiquer explicitement le nom de l’env. Cette forme est généralement recommandée |
| `--output`, `-o` | string | Chemin du fichier de sortie. Seule la configuration de route générée est écrite, sans créer en plus `app.caddy` ni la configuration principale partagée |
| `--host` | string | Hôte écrit dans la configuration d’entrée, comme `example.com` ou `localhost` |
| `--port` | string | Port écrit dans la configuration d’entrée. C’est le port d’entrée du proxy, pas le port de l’application NocoBase en amont |
| `--install` | boolean | Installe la configuration proxy partagée dans la configuration principale de Caddy |
| `--reload` | boolean | Valide et recharge Caddy après l’écriture des fichiers |
| `--print` | boolean | Affiche directement la configuration de route générée au lieu d’écrire des fichiers |

## Sortie par défaut

Si tu ne passes pas `--output`, la CLI maintient ces fichiers sous `~/.nocobase/proxy/caddy/` :

| Fichier | Rôle |
| --- | --- |
| `~/.nocobase/proxy/caddy/<env>/generated.caddy` | Configuration de reverse proxy réellement gérée par la CLI et écrasée à chaque exécution |
| `~/.nocobase/proxy/caddy/<env>/app.caddy` | Fichier d’entrée du site, modifiable, dans lequel tu peux ajouter une configuration spécifique au site |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | Configuration principale partagée qui importe tous les `app.caddy` des env |

Autrement dit :

- `generated.caddy` est uniquement destiné à être géré par la CLI et ne doit pas être modifié à la main
- `app.caddy` est modifiable, mais tu dois conserver l’import géré inséré par la CLI
- `nocobase.caddy` est surtout utilisé par `--install`

:::warning Note

Si tu dois ajouter une configuration Caddy spécifique au site, modifie `app.caddy`. `generated.caddy` sera écrasé à la prochaine exécution de `nb env proxy caddy`.

:::

Si tu passes `--output`, la CLI écrit uniquement la configuration générée dans ce fichier et ne crée ni ne met à jour `app.caddy` ni la configuration principale partagée.

## Éléments de configuration associés

Ces éléments de configuration CLI influencent directement la sortie Caddy générée :

| Élément de configuration | Valeur par défaut | Description |
| --- | --- | --- |
| `proxy.nb-cli-root` | Racine de la CLI, généralement le répertoire personnel de l’utilisateur actuel | Mappe le chemin `.nocobase` vers la racine réellement visible par Caddy |
| `proxy.upstream-host` | `127.0.0.1` | Hôte utilisé par le proxy pour renvoyer le trafic vers l’application NocoBase |
| `bin.caddy` | `caddy` | Chemin de l’exécutable Caddy utilisé par `--install` ou `--reload` |

La plupart des installations n’ont pas besoin de modifier `proxy.nb-cli-root`. En général, cela n’est utile que si Caddy s’exécute dans un autre conteneur, sous une autre racine de montage ou avec une autre vue des chemins.

## Remarques

- `--host` est important. Caddy décide de gérer ou non HTTPS en fonction de l’adresse du site. En production, essaie de fournir un domaine qui pointe déjà vers le serveur actuel
- `--port` doit être un entier compris entre `1` et `65535`
- Le port de l’application NocoBase en amont provient du `appPort` enregistré dans l’env, pas de `--port`
- Si la commande indique que l’env ne possède pas `appPort`, exécute d’abord `nb env update <name>` ou enregistre-le explicitement avec `nb env update <name> --app-port <port>`
- Si tu modifies des paramètres comme `app-port` ou `app-public-path` avec `nb env update`, tu devras généralement relancer ensuite `nb env proxy caddy`
- `--print` ne peut pas être combiné avec `--install` ou `--reload`
- `--output` ne peut pas être combiné avec `--install` ou `--reload`

## Exemples

```bash
# Générer une configuration Caddy pour l’env actuel
nb env proxy caddy

# Générer une configuration pour un env précis
nb env proxy caddy --env demo

# Écrire l’hôte public et le port dans la configuration d’entrée
nb env proxy caddy --env demo --host demo.local.nocobase.com --port 8080

# Afficher la configuration de route générée sans écrire de fichiers
nb env proxy caddy --env demo --print

# Écrire le fragment de route généré dans un fichier personnalisé
nb env proxy caddy --env demo --output ./generated.caddy

# Mapper le chemin .nocobase si Caddy s’exécute sous une autre racine de montage
nb config set proxy.nb-cli-root /workspace

# Installer la configuration partagée dans la configuration principale de Caddy et recharger immédiatement
nb env proxy caddy --env demo --install --reload
```

## Commandes associées

- [`nb env proxy`](./index.md)
- [`nb env proxy nginx`](./nginx.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
