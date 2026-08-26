---
pkg: '@nocobase/plugin-ai'
title: 'Utilisation des compétences par les AI Employees'
description: 'Les compétences (Skills) sont des guides de connaissances spécialisées pour les AI Employees : General skills, Employee-specific skills.'
keywords: 'compétences AI Employees,Skills,NocoBase'
---

# Utiliser les compétences

Les compétences (Skills) sont des guides de connaissances spécialisées fournis aux AI Employees, leur permettant d'utiliser plusieurs outils pour traiter des tâches dans des domaines spécifiques.

Les compétences ne sont pas personnalisables actuellement, elles sont uniquement préconfigurées par le système.

## Structure des compétences

La page des compétences est divisée en deux catégories :

1. `General skills` : partagées par tous les AI Employees, généralement en lecture seule.
2. `Employee-specific skills` : exclusives à l'employé courant.

![](https://static-docs.nocobase.com/202604230832639.png)

## Présentation des compétences

### Compétences générales

| Nom de la compétence    | Description                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Data metadata            | Récupérer le modèle de données du système, les métadonnées des collections et des champs, pour aider l'AI Employee à comprendre le contexte métier. |
| Data query               | Interroger les données des collections, avec prise en charge du filtrage par condition, de l'agrégation, etc., pour aider l'AI Employee à obtenir des données métier. |
| Business analysis report | Générer des rapports d'analyse à partir des données métier, avec analyse multidimensionnelle et visualisation, pour aider l'AI Employee à fournir des insights métier. |
| Document search          | Rechercher et lire le contenu de documents préconfigurés, pour aider l'AI Employee à accomplir des tâches basées sur des documents, principalement la rédaction de code JS. |

### Compétences spécifiques

| Nom de la compétence | Description                                          | Employé concerné |
| -------------------- | ---------------------------------------------------- | ---------------- |
| Data modeling        | Compétence de modélisation de données, comprendre et construire des modèles de données métier | Orin             |
| Frontend developer   | Écrire et tester du code JS pour les blocs frontend  | Nathan           |
