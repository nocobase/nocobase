---
title: "Modélisation des données"
description: "Le Skill de modélisation des données permet de créer et de gérer les tables NocoBase en langage naturel : créer des tables, ajouter des champs, configurer des relations, etc."
keywords: "construction par IA, modélisation des données, tables, champs, relations, collections"
---

# Modélisation des données

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

## Introduction

Le Skill de modélisation des données permet de créer et de gérer les tables NocoBase en langage naturel — créer des tables, ajouter des champs, configurer des relations, etc.

Avant utilisation, vous devez vous assurer que la source de données cible est correctement configurée dans «Gestion des sources de données».


## Périmètre fonctionnel

- Créer, modifier, supprimer des tables, avec prise en charge des tables ordinaires, tables d'arborescence, tables de fichiers, tables de calendrier, tables SQL, tables de vues et tables d'héritage
- Ajouter, modifier, supprimer des champs, y compris les types de champs intégrés à NocoBase (avec les champs relationnels) et les types de champs étendus par les plugins

## Exemples de prompts

### Scénario A : Créer une table

```
Aide-moi à créer une table de fichiers pour gérer les contrats
```

Le Skill guide l'IA pour analyser les champs nécessaires à la table et leurs types correspondants dans NocoBase, puis crée la table de type fichier dans le système et ajoute les champs correspondants.

![Créer une table](https://static-docs.nocobase.com/202604162103369.png)

### Scénario B : Ajouter un champ

```
Sur la table users, aide-moi à ajouter un champ statut indiquant si l'utilisateur est en poste, comprenant les trois états : en poste, en cours de départ, parti
```

Le Skill guide l'IA pour récupérer les métadonnées de la table users, et analyse que le champ de statut indiquant la situation correspond au type «Menu déroulant (sélection unique)» dans NocoBase, puis ajoute le champ à la table users et configure les valeurs énumérées.

![Ajouter un champ](https://static-docs.nocobase.com/202604162112692.png)

### Scénario C : Initialiser le modèle de données

```
Je suis en train de construire un CRM, aide-moi à concevoir et à mettre en place le modèle de données
```

Le Skill, en s'appuyant sur le modèle de données analysé et conçu par l'IA, crée les tables dans le système, ajoute les champs et configure les relations.

![Initialiser le modèle de données](https://static-docs.nocobase.com/202604162126729.png)

![Résultat de l'initialisation du modèle de données](https://static-docs.nocobase.com/202604162201867.png)

### Scénario D : Ajouter un module fonctionnel

```
Je souhaite ajouter le modèle de données de gestion des commandes utilisateurs au système CRM existant
```

Le Skill guide l'IA pour récupérer le modèle de données du système actuel, puis effectue la conception du modèle pour la nouvelle fonctionnalité en s'appuyant dessus, avant de créer automatiquement les tables, d'ajouter les champs et de configurer les relations.

![Ajouter un module fonctionnel](https://static-docs.nocobase.com/202604162203006.png)

![Résultat de l'ajout d'un module fonctionnel](https://static-docs.nocobase.com/202604162203893.png)

## Questions fréquentes

**Les champs système sont-ils créés automatiquement lors de la création d'une table ?**

Oui. Les champs système `id`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy` sont générés automatiquement par le serveur, il n'est pas nécessaire de les spécifier manuellement.

**Comment modifier une relation mal configurée ?**

Il est recommandé de vérifier d'abord la clé étrangère et le champ inverse de la relation actuelle, avant de décider de la modifier ou de la supprimer puis recréer. Le Skill effectue une vérification post-modification en relisant l'état des deux côtés de la relation.

**Comment créer une table basée sur un type étendu par un plugin ?**

Cela nécessite que le plugin correspondant soit activé. S'il ne l'est pas, l'IA tente généralement de l'activer ; si l'IA n'y parvient pas, activez-le manuellement.

**Comment ajouter un champ basé sur un type étendu par un plugin ?**

Idem que ci-dessus.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [Configuration de l'interface](./ui-builder) — une fois les tables créées, utilisez l'IA pour construire des pages et des blocs
- [Solutions](./dsl-reconciler) — construction par lots de systèmes métier complets à partir de YAML
