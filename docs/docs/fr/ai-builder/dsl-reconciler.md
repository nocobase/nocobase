---
title: "Solutions"
description: "Le Skill Solutions permet de construire en lot une application NocoBase à partir d'un fichier de configuration YAML."
keywords: "construction par IA, solutions, construction d'application, YAML, création de tables en lot, tableau de bord"
---

# Solutions

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

:::warning Attention

La fonctionnalité Solutions est encore en phase de test, sa stabilité est limitée, elle est uniquement destinée à un usage exploratoire.

:::

## Introduction

Le Skill Solutions permet de construire en lot une application NocoBase à partir d'un fichier de configuration YAML — créer en une seule fois les tables, configurer les pages, générer les tableaux de bord et les graphiques.

Idéal pour les scénarios où vous devez rapidement mettre en place un système métier complet, comme un CRM, une gestion de tickets ou une gestion des stocks.


## Périmètre fonctionnel

Capacités :

- Concevoir un plan d'application complet à partir d'une description de besoins, comprenant tables, pages et tableaux de bord
- Créer en lot des tables et des pages via `structure.yaml`
- Configurer popups et formulaires via `enhance.yaml`
- Générer automatiquement des tableaux de bord, comprenant des cartes KPI et des graphiques
- Mises à jour incrémentales — toujours en mode `--force`, sans détruire les données existantes

Limitations :

- Ne convient pas pour des ajustements champ par champ (utilisez plutôt le [Skill Modélisation des données](./data-modeling))
- Ne peut pas effectuer de migration ou d'import de données
- Ne peut pas configurer les permissions ni les workflows (nécessite d'autres Skills)

## Exemples de prompts

### Scénario A : Construire un système complet

```
Aide-moi à utiliser le skill nocobase-dsl-reconciler pour construire un système de gestion de tickets, comprenant un tableau de bord, une liste de tickets, la gestion des utilisateurs et la configuration SLA
```

Le Skill produit d'abord un plan de conception — listant toutes les tables et la structure des pages — et après confirmation, exécute la construction par étapes.

![Plan de conception](https://static-docs.nocobase.com/20260420100420.png)

![Résultat de la construction](https://static-docs.nocobase.com/20260420100450.png)

### Scénario B : Modifier un module existant

```
Aide-moi à utiliser le skill nocobase-dsl-reconciler pour ajouter un champ déroulant «Niveau d'urgence» à la table des tickets, avec les options P0 à P3
```

Modifiez `structure.yaml`, puis utilisez `--force` pour mettre à jour.

### Scénario C : Personnaliser les graphiques

```
Aide-moi à utiliser le skill nocobase-dsl-reconciler pour modifier «Tickets ajoutés cette semaine» en «Tickets ajoutés ce mois» dans le tableau de bord
```

![Personnaliser les graphiques](https://static-docs.nocobase.com/20260420100517.png)

Éditez le fichier SQL correspondant, modifiez la plage de temps de `'7 days'` en `'1 month'`, puis exécutez `--verify-sql` pour valider.

## Questions fréquentes

**Que faire si la validation SQL échoue ?**

NocoBase utilise PostgreSQL : les noms de colonnes doivent être en camelCase et entourés de guillemets doubles (par exemple `"createdAt"`), et les fonctions de date utilisent `NOW() - '7 days'::interval` plutôt que la syntaxe SQLite. L'exécution de `--verify-sql` permet de détecter ce type de problème avant déploiement.

**Comment ajuster un champ après la construction ?**

Utilisez le Skill Solutions pour la construction complète, et pour les ajustements ultérieurs, le [Skill Modélisation des données](./data-modeling) ou le [Skill Configuration de l'interface](./ui-builder) sont plus flexibles.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [Modélisation des données](./data-modeling) — pour les ajustements champ par champ, utilisez le Skill Modélisation des données
- [Configuration de l'interface](./ui-builder) — pour ajuster les pages et la mise en page des blocs après construction
