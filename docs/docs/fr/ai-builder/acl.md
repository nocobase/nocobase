---
title: "Configuration des permissions"
description: "Le Skill de configuration des permissions permet de gérer en langage naturel les rôles, les stratégies de permissions, l'association des utilisateurs et l'évaluation des risques ACL de NocoBase."
keywords: "construction par IA, configuration des permissions, ACL, rôles, permissions, association utilisateur, évaluation des risques"
---

# Configuration des permissions

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

## Introduction

Le Skill de configuration des permissions permet de gérer en langage naturel les rôles, les stratégies de permissions, l'association des utilisateurs et l'évaluation des risques ACL de NocoBase — vous décrivez vos objectifs métier, et il choisit les commandes et les paramètres.


## Périmètre fonctionnel

- Créer de nouveaux rôles
- Basculer le mode de rôle global (mode indépendant / mode combiné)
- Configurer en lot les permissions d'action et la portée des données pour les tables
- Désassocier les utilisateurs des rôles
- Produire des rapports d'évaluation des risques au niveau du rôle, de l'utilisateur et du système

## Exemples de prompts

### Scénario A : Association d'utilisateurs en lot
:::tip Prérequis
L'environnement actuel contient un rôle Member et plusieurs utilisateurs
:::

```
Aide-moi à associer ces nouveaux utilisateurs au rôle Member : James, Emma, Michael
```

![Association d'utilisateurs en lot](https://static-docs.nocobase.com/20260422202343.png)

### Scénario B : Configuration en lot des permissions de pages
:::tip Prérequis
L'environnement actuel contient un rôle Member et plusieurs pages
:::
```
Aide-moi à configurer les permissions de ces pages pour le rôle Member : Product, Order, Stock
```

![Configuration en lot des permissions de pages](https://static-docs.nocobase.com/20260422202949.png)

### Scénario C : Configuration en lot des permissions sur plusieurs tables
:::tip Prérequis
L'environnement actuel contient un rôle Member et plusieurs tables
:::

```
Ajoute au rôle Member les permissions indépendantes de lecture seule sur ces tables : order, product, stock
```

![Configuration en lot des permissions indépendantes sur les tables](https://static-docs.nocobase.com/20260422205341.png)

![Configuration en lot des permissions indépendantes sur les tables 2](https://static-docs.nocobase.com/20260422205430.png)

### Scénario D : Configuration de permissions pour plusieurs rôles et plusieurs tables
:::tip Prérequis
L'environnement actuel contient plusieurs rôles et plusieurs tables
:::

```
Ajoute aux rôles Member et Sales les permissions indépendantes de lecture/écriture sur ces tables : order, product, stock
```

![Configuration multi-rôles et multi-tables](https://static-docs.nocobase.com/20260422213524.png)

### Scénario E : Évaluation des risques

```
Évalue les risques de permissions du rôle Member
```

Le résultat fournit un score de risque, une description du périmètre d'impact et des suggestions d'amélioration.

## Questions fréquentes

**Les permissions sont configurées mais ne prennent pas effet, que faire ?**

Vérifiez d'abord que le mode de rôle global est correct — si un utilisateur possède plusieurs rôles, le comportement diffère grandement entre le mode combiné et le mode indépendant. Vous pouvez consulter le mode actuel pour identifier le problème.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [NocoBase CLI](../ai/quick-start.md) — outil en ligne de commande pour installer et gérer NocoBase
