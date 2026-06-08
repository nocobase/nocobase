---
title: 'nb env proxy nginx'
description: 'Référence de la commande nb env proxy nginx : génère des configurations proxy Nginx et des fichiers auxiliaires pour un env géré par la CLI.'
keywords: 'nb env proxy nginx,NocoBase CLI,nginx,reverse proxy,configuration proxy'
---

# nb env proxy nginx

`nb env proxy nginx` génère des configurations proxy Nginx et des fichiers auxiliaires pour un env géré par la CLI. Cette commande convient bien si tu utilises déjà Nginx pour gérer les sites, ou si tu veux continuer à gérer toi-même les certificats, le cache ou le contrôle d’accès.

Cette commande fonctionne uniquement pour des env gérés dont le runtime est accessible depuis la machine actuelle, c’est-à-dire `local` ou `docker`. Elle ne fonctionne pas pour le moment avec des env qui n’ont qu’une connexion API distante ni avec des env SSH.

## Utilisation

```bash
nb env proxy nginx [name] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l’env configuré pour lequel générer une configuration proxy. Si ce paramètre est omis, l’env actuel est utilisé |
| `--env`, `-e` | string | Indiquer explicitement le nom de l’env. Cette forme est généralement recommandée |
| `--host` | string | Hôte écrit dans la configuration d’entrée, comme `example.com` ou `localhost` |
| `--port` | string | Port écrit dans la configuration d’entrée. C’est le port d’entrée du proxy, pas le port de l’application NocoBase en amont |
| `--install` | boolean | Installe la configuration proxy partagée dans la configuration principale de Nginx |
| `--reload` | boolean | Valide et recharge Nginx après l’écriture des fichiers |
| `--print` | boolean | Affiche directement la `app.conf` rendue au lieu d’écrire des fichiers |

## Sortie par défaut

`nb env proxy nginx` maintient ces fichiers sous `~/.nocobase/proxy/nginx/` :

| Fichier | Rôle |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | Fichier d’entrée du site, modifiable. La CLI actualise le bloc géré à l’intérieur, et tu peux ajouter autour une configuration spécifique au site |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | Page de repli SPA v1 générée à partir du `index.html` du client actif |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | Page de repli SPA v2 générée à partir du `v/index.html` du client actif |
| `~/.nocobase/proxy/nginx/nocobase.conf` | Configuration principale partagée qui inclut tous les `app.conf` des env |
| `~/.nocobase/proxy/nginx/snippets/` | Répertoire partagé de snippets copié depuis les modèles intégrés |

Autrement dit :

- `app.conf` est modifiable, mais tu dois conserver le bloc géré entre `# BEGIN NocoBase managed config` et `# END NocoBase managed config`
- `index-v1.html` et `index-v2.html` réécrivent automatiquement les URLs d’assets selon le sous-chemin de l’env actuel, la version active du client et `CDN_BASE_URL`
- `nocobase.conf` est surtout utilisé par `--install`
- Les fichiers sous `public/` et `snippets/` ne sont généralement pas faits pour être modifiés à la main et seront resynchronisés à la prochaine exécution de la commande

:::warning Note

Si tu dois ajouter une configuration Nginx spécifique au site, modifie `app.conf`. N’édite pas manuellement les fichiers gérés sous `public/` ou `snippets/`, car ils seront écrasés à la prochaine exécution de `nb env proxy nginx`.

:::

## Éléments de configuration associés

Ces éléments de configuration CLI influencent directement la sortie Nginx générée :

| Élément de configuration | Valeur par défaut | Description |
| --- | --- | --- |
| `proxy.nb-cli-root` | Racine de la CLI, généralement le répertoire personnel de l’utilisateur actuel | Mappe le chemin `.nocobase` vers la racine réellement visible par Nginx |
| `proxy.upstream-host` | `127.0.0.1` | Hôte utilisé par le proxy pour renvoyer le trafic vers l’application NocoBase |
| `bin.nginx` | `nginx` | Chemin de l’exécutable Nginx utilisé par `--install` ou `--reload` |

La plupart des installations n’ont pas besoin de modifier `proxy.nb-cli-root`. En général, cela n’est utile que si Nginx s’exécute dans un autre conteneur, sous une autre racine de montage ou avec une autre vue des chemins.

## Remarques

- `--port` doit être un entier compris entre `1` et `65535`
- Le port de l’application NocoBase en amont provient du `appPort` enregistré dans l’env, pas de `--port`
- Si la commande indique que l’env ne possède pas `appPort`, exécute d’abord `nb env update <name>` ou enregistre-le explicitement avec `nb env update <name> --app-port <port>`
- Si tu modifies des paramètres comme `app-port` ou `app-public-path` avec `nb env update`, tu devras généralement relancer ensuite `nb env proxy nginx`
- `--print` ne peut pas être combiné avec `--install` ou `--reload`
- Le provider Nginx ne prend pas en charge `--output`

## Exemples

```bash
# Générer une configuration Nginx pour l’env actuel
nb env proxy nginx

# Générer une configuration pour un env précis
nb env proxy nginx --env demo

# Écrire l’hôte public et le port dans la configuration d’entrée
nb env proxy nginx --env demo --host demo.local.nocobase.com --port 8080

# Afficher la app.conf rendue sans écrire de fichiers
nb env proxy nginx --env demo --print

# Mapper le chemin .nocobase si Nginx s’exécute sous une autre racine de montage
nb config set proxy.nb-cli-root /workspace

# Installer la configuration partagée dans la configuration principale de Nginx et recharger immédiatement
nb env proxy nginx --env demo --install --reload
```

## Commandes associées

- [`nb env proxy`](./index.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
