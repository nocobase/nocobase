---
title: "Gestion des publications"
description: "Le Skill de gestion des publications permet d'effectuer des opérations de publication auditables entre plusieurs environnements."
keywords: "construction par IA, gestion des publications, publication multi-environnements, sauvegarde et restauration, migration"
---

# Gestion des publications

:::tip Prérequis

- Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).
- Vous devez disposer d'une licence Pro ou supérieure [Édition commerciale NocoBase](https://www.nocobase.com/cn/commercial).
- Assurez-vous que les plugins de gestion des sauvegardes et de gestion des migrations sont activés et mis à jour vers la dernière version.

:::

:::warning Attention
Le CLI lié à la gestion des publications est encore en cours de développement, son utilisation n'est pas encore prise en charge.
:::
## Introduction

Le Skill de gestion des publications permet d'effectuer des opérations de publication entre plusieurs environnements — avec deux modes de publication : sauvegarde/restauration et migration.


## Périmètre fonctionnel

- Sauvegarde et restauration mono-environnement : restauration complète des données locales à partir d'un paquet de sauvegarde.
- Sauvegarde et restauration inter-environnements : restauration complète des données de l'environnement cible à partir d'un paquet de sauvegarde.
- Migration inter-environnements : mise à jour différentielle des données de l'environnement cible à partir d'un nouveau paquet de migration.

## Exemples de prompts

### Scénario A : Sauvegarde et restauration mono-environnement
:::tip Prérequis

L'environnement actuel doit disposer d'un paquet de sauvegarde, ou bien sauvegardez puis restaurez

:::

Mode prompt
```
Restaure à partir de <file-name>
```
Mode ligne de commande
```
// Voir les paquets de sauvegarde disponibles ; s'il n'y en a pas, exécutez nb backup <file-name>
nb backup list 
nb restore <file-name> 
```
![Sauvegarde et restauration](https://static-docs.nocobase.com/20260417150854.png)

### Scénario B : Sauvegarde et restauration inter-environnements

:::tip Prérequis

Vous devez préparer deux environnements, par exemple un environnement local dev et un environnement distant test, ou installer deux environnements en local.

:::

Mode prompt
```
Restaure dev sur test
```
Mode ligne de commande
```
// Voir les paquets de sauvegarde disponibles ; s'il n'y en a pas, exécutez nb backup <file-name> --env dev
nb backup list --env dev
// Restaurer en utilisant le paquet de sauvegarde
nb restore <file-name> --env test
```
![Sauvegarde et restauration](https://static-docs.nocobase.com/20260417150854.png)

### Scénario C : Migration inter-environnements

:::tip Prérequis

Comme dans le scénario B, vous devez préparer deux environnements, par exemple un environnement local dev et un environnement distant test, ou installer deux environnements en local.

:::

Mode prompt
```
Migre dev vers test
```
Mode ligne de commande
```
// Créer une nouvelle règle de migration, ce qui produira un nouveau ruleId, ou exécutez nb migration rule list --env dev pour obtenir un ruleId existant
nb migration rule add --env dev 
// Générer un paquet de migration à partir du ruleId
nb migration generate <ruleId> --env dev 
// Exécuter la migration en utilisant le paquet de migration
nb migration run <file-name> --env test
```
![Publication par migration](https://static-docs.nocobase.com/20260417151022.png)

## Questions fréquentes

**Sauvegarde/restauration ou migration : laquelle choisir ?**

Si vous disposez déjà d'un paquet de sauvegarde utilisable, choisissez la sauvegarde et restauration. Si vous devez contrôler par stratégie quelles données sont synchronisées (par exemple ne synchroniser que la structure et pas les données), choisissez la migration.

**Pourquoi le plugin de migration est absent ?**

Le plugin de gestion des migrations nécessite une licence Pro ou supérieure, voir [Édition commerciale NocoBase](https://www.nocobase.com/cn/commercial).

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [Gestion des environnements](./env-bootstrap) — vérification d'environnement, installation, déploiement et diagnostic
