---
title: "nb source test"
description: "Référence de la commande nb source test : exécuter les tests dans le répertoire de l'application sélectionnée et préparer automatiquement la base de tests intégrée."
keywords: "nb source test,NocoBase CLI,tests,Vitest,base de données"
---

# nb source test

Exécuter les tests dans le répertoire de l'application sélectionnée. Avant l'exécution, le CLI recrée une base Docker de test intégrée et injecte les variables d'environnement `DB_*` utilisées en interne.

## Utilisation

```bash
nb source test [paths...] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[paths...]` | string[] | Chemins ou globs de fichiers de test transmis tels quels au runner de tests |
| `--cwd`, `-c` | string | Répertoire de l'application dans lequel exécuter les tests, par défaut le répertoire courant |
| `--watch`, `-w` | boolean | Exécuter Vitest en mode watch |
| `--run` | boolean | Exécution unique, sans entrer en mode watch |
| `--allowOnly` | boolean | Autoriser les tests `.only` |
| `--bail` | boolean | S'arrêter au premier échec |
| `--coverage` | boolean | Activer le rapport de couverture |
| `--single-thread` | string | Transmettre le mode single-thread au runner de tests sous-jacent |
| `--server` | boolean | Forcer le mode test côté serveur |
| `--client` | boolean | Forcer le mode test côté client |
| `--db-clean`, `-d` | boolean | Nettoyer la base lorsque la commande applicative sous-jacente le supporte |
| `--db-dialect` | string | Type de la base de tests intégrée : `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--db-image` | string | Image Docker de la base de tests intégrée |
| `--db-port` | string | Port TCP de la base de tests intégrée publié sur l'hôte |
| `--db-database` | string | Nom de base injecté pour les tests |
| `--db-user` | string | Utilisateur de base injecté pour les tests |
| `--db-password` | string | Mot de passe de base injecté pour les tests |
| `--verbose` | boolean | Afficher la sortie détaillée de Docker et du runner de tests |

## Exemples

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Commandes connexes

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
