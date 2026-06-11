---
title: "nb source dev"
description: "Référence de la commande nb source dev : démarrer le mode développement NocoBase dans un env d'origine npm ou Git."
keywords: "nb source dev,NocoBase CLI,mode développement,hot reload"
---

# nb source dev

Démarrer le mode développement dans un env d'origine npm ou Git. Pour les env Docker, utilisez [`nb app logs`](../app/logs.md) afin de consulter les logs d'exécution.

## Utilisation

```bash
nb source dev [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom de l'env CLI dans lequel entrer en mode développement ; utilise l'env courant si omis |
| `--db-sync` | boolean | Synchroniser la base de données avant de démarrer le mode développement |
| `--port`, `-p` | string | Port du serveur de développement |
| `--client`, `-c` | boolean | Démarrer uniquement le client |
| `--server`, `-s` | boolean | Démarrer uniquement le serveur |
| `--inspect`, `-i` | string | Port de debug Node.js inspect du serveur |

## Exemples

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## Commandes connexes

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
