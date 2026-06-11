---
title: "nb proxy"
description: "Référence du groupe de commandes nb proxy : choisir le provider Nginx ou Caddy et gérer les points d'entrée reverse proxy pour les environnements gérés par la CLI."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,configuration proxy"
---

# nb proxy

Dans NocoBase CLI, `nb proxy` est le point d'entrée unifié pour la gestion du reverse proxy.

Il sépare la gestion des envs de la gestion de la couche d'entrée :

- `nb env` enregistre et maintient les environnements de l'application
- `nb proxy` génère et gère les points d'entrée Nginx ou Caddy pour ces environnements gérés par la CLI

Tant que ton application a déjà été enregistrée comme env géré par la CLI et que cet env est `local` ou `docker`, il suffit généralement de choisir un sous-commande de provider.

## Utilisation

```bash
nb proxy <provider> <command>
```

## Arborescence des commandes

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Providers

| Je veux... | Aller ici |
| --- | --- |
| Continuer à utiliser Nginx pour les sites, certificats, caches ou contrôles d'accès | [`nb proxy nginx`](./nginx/index.md) |
| Mettre HTTPS en place rapidement et gérer moins de détails TLS moi-même | [`nb proxy caddy`](./caddy/index.md) |
| Ajuster des paramètres d'env pouvant affecter le résultat du proxy, comme `app-port` ou `app-public-path` | [`nb env update`](../env/update.md) |

## Notes

- `nb proxy` lui-même n'a pas de flags autonomes
- Utilise `nb proxy nginx` ou `nb proxy caddy` pour générer et gérer les points d'entrée
- Les deux providers ne fonctionnent que pour des envs gérés dont la runtime est accessible depuis la machine courante, c'est-à-dire `local` ou `docker`
- Les deux providers prennent en charge deux drivers : `local` et `docker`
- `use` enregistre le driver par défaut, et `current` affiche directement le driver courant
- `generate` écrit ou met à jour les fichiers de configuration d'entrée et ne démarre pas automatiquement le processus proxy
- `start`, `restart`, `reload`, `stop`, `status` et `info` opèrent tous sur la runtime du driver courant
- Si tu modifies des paramètres comme `app-port` ou `app-public-path` avec `nb env update`, tu devras généralement réexécuter ensuite la commande `generate` correspondante
- Ce groupe de commandes ne fonctionne pas actuellement pour les envs qui n'ont qu'une connexion API distante ni pour les envs SSH

## Flux typique

```bash
# 1. Choisir un provider et un driver de runtime
nb proxy nginx use docker

# 2. Générer la configuration d'entrée pour un env géré par la CLI
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Démarrer le proxy
nb proxy nginx start

# 4. Vérifier l'état et les informations de chemin
nb proxy nginx status
nb proxy nginx info

# 5. Recharger après des changements de configuration
nb proxy nginx reload
```

Si tu choisis Caddy, remplace simplement `nginx` par `caddy` dans les commandes ci-dessus.

## Différences courantes entre les commandes

| Commande | Rôle |
| --- | --- |
| `use` | Changer le driver par défaut du provider courant |
| `current` | Afficher le driver courant du provider, par exemple `local` ou `docker` |
| `generate` | Générer ou rafraîchir les fichiers d'entrée proxy pour un env |
| `start` | Démarrer le proxy avec le driver courant |
| `reload` | Recharger la configuration sans arrêter le service |
| `restart` | Arrêter puis redémarrer |
| `stop` | Arrêter le proxy |
| `status` | Afficher l'état d'exécution |
| `info` | Afficher le driver, le chemin du fichier de configuration, la racine de runtime, l'hôte upstream et d'autres détails de runtime |

## Exemples

```bash
# Générer et démarrer Nginx pour un env
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Générer et démarrer Caddy pour un env
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Commandes associées

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
