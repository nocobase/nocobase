---
pkg: '@nocobase/plugin-ai'
title: 'Utilisation des outils par les AI Employees'
description: 'Les outils (Tools) définissent les capacités des AI Employees : General tools, Employee-specific tools, Custom tools, configuration des autorisations Ask/Allow.'
keywords: 'outils AI Employees,Tools,Ask,Allow,autorisations,NocoBase'
---

# Utiliser les outils

Les outils (Tools) définissent ce que les AI Employees « peuvent faire ».

## Structure des outils

La page des outils est divisée en trois catégories :

1. `General tools` : partagés par tous les AI Employees, généralement en lecture seule.
2. `Employee-specific tools` : exclusifs à l'employé courant.
3. `Custom tools` : outils personnalisés déclenchés par le déclencheur « AI employee event » des workflows. Vous pouvez les ajouter, les supprimer et configurer leurs autorisations par défaut.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Autorisations des outils

Les autorisations des outils sont uniformément définies comme suit :

- `Ask` : confirmation demandée avant l'appel.
- `Allow` : appel direct autorisé.

Recommandation : pour les outils qui modifient des données, utilisez `Ask` par défaut.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Présentation des outils

### Outils généraux

| Nom de l'outil       | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| Form filler          | Remplit les données dans un formulaire spécifié                          |
| Chart generator      | Génère une configuration JSON pour un graphique ECharts                  |
| Load specific SKILLS | Charge les compétences et les outils requis par ces compétences          |
| Suggestions          | Propose des suggestions d'actions suivantes selon le contexte de la conversation |

### Outils spécifiques

| Nom de l'outil               | Description                                                              | Employé concerné |
| ---------------------------- | ------------------------------------------------------------------------ | ---------------- |
| AI employee task dispatching | Outil d'attribution des tâches selon le type de tâche et les compétences | Atlas            |
| List AI employees            | Liste tous les employés disponibles                                      | Atlas            |
| Get AI employee              | Récupère les détails d'un employé spécifié, y compris ses compétences et outils | Atlas      |

### Outils personnalisés

Dans le module Workflow, créez un workflow avec le déclencheur de type `AI employee event`.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

Dans `Custom tools`, cliquez sur `Add tool` pour ajouter un workflow en tant qu'outil et configurez ses autorisations en fonction du risque métier.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
