---
title: "nb db check"
description: "Référence de la commande nb db check : vérifier si une base de données est accessible via l'env courant ou des flags de base de données explicites."
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

Vérifie si une base de données est accessible. Vous pouvez réutiliser les réglages de base de données enregistrés dans un env ou passer des flags `--db-*` explicites.

## Utilisation

```bash
nb db check [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Lire la configuration de base de données depuis un env CLI ; si omis, tous les flags `--db-*` requis doivent être fournis |
| `--db-dialect` | string | Dialecte de base de données : `postgres`, `kingbase`, `mysql` ou `mariadb` |
| `--db-host` | string | Nom d'hôte ou adresse IP de la base de données |
| `--db-port` | string | Port TCP de la base de données |
| `--db-database` | string | Nom de la base de données |
| `--db-user` | string | Nom d'utilisateur de la base de données |
| `--db-password` | string | Mot de passe de la base de données |
| `--json` | boolean | Sortie JSON |

## Exemples

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## Remarques

Si l'env sélectionné utilise une base de données intégrée gérée par le CLI, le CLI résout l'adresse de connexion réelle avant d'exécuter la vérification.

## Commandes connexes

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
