---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Export Pro

## Introduction

Le plugin Export Pro offre des fonctionnalités améliorées par rapport à la fonction d'exportation standard.

## Installation

Ce plugin dépend du plugin de gestion des tâches asynchrones. Vous devez l'activer avant de pouvoir utiliser Export Pro.

## Améliorations des fonctionnalités

- Prend en charge les opérations d'exportation asynchrones, exécutées dans un thread indépendant, permettant l'exportation de grandes quantités de données.
- Prend en charge l'exportation des pièces jointes.

## Guide d'utilisation

### Configuration du mode d'exportation

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Sur le bouton d'exportation, vous pouvez configurer le mode d'exportation. Trois modes sont disponibles :

- Automatique : Le mode d'exportation est déterminé en fonction du volume de données. Si le nombre d'enregistrements est inférieur à 1000 (ou 100 pour les exportations de pièces jointes), l'exportation synchrone est utilisée. S'il est supérieur à 1000 (ou 100 pour les exportations de pièces jointes), l'exportation asynchrone est utilisée.
- Synchrone : Utilise l'exportation synchrone, qui s'exécute dans le thread principal. Ce mode convient aux petites quantités de données. L'exportation de grandes quantités de données en mode synchrone peut entraîner un blocage ou un ralentissement du système, l'empêchant de traiter les requêtes d'autres utilisateurs.
- Asynchrone : Utilise l'exportation asynchrone, qui s'exécute dans un thread d'arrière-plan indépendant et ne bloque pas l'utilisation actuelle du système.

### Exportation asynchrone

Une fois l'exportation lancée, le processus s'exécute dans un thread d'arrière-plan indépendant, sans nécessiter de configuration manuelle de votre part. Dans l'interface utilisateur, après avoir démarré une exportation, la tâche d'exportation en cours s'affiche en haut à droite, indiquant sa progression en temps réel.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Une fois l'exportation terminée, vous pouvez télécharger le fichier exporté depuis les tâches d'exportation.

#### Exportations concurrentes

Un grand nombre de tâches d'exportation concurrentes peut affecter les performances du serveur et ralentir la réponse du système. Il est donc recommandé aux développeurs de systèmes de configurer le nombre maximal de tâches d'exportation concurrentes (la valeur par défaut est 3). Lorsque ce nombre est dépassé, les nouvelles tâches sont mises en file d'attente.

![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Méthode de configuration de la concurrence : Variable d'environnement `ASYNC_TASK_MAX_CONCURRENCY=nombre_de_concurrence`

Suite à des tests approfondis avec différentes configurations et complexités de données, les nombres de concurrences recommandés sont :
- CPU 2 cœurs, concurrence : 3.
- CPU 4 cœurs, concurrence : 5.

#### À propos des performances

Si vous constatez que le processus d'exportation est anormalement lent (voir ci-dessous), cela peut être dû à un problème de performance lié à la structure de la collection.

| Caractéristiques des données | Type d'index | Volume de données | Durée de l'exportation |
|-----------------------------|--------------|-------------------|------------------------|
| Champs sans relation         | Clé primaire / Contrainte unique | 1 million         | 3 à 6 minutes          |
| Champs sans relation         | Index normal | 1 million         | 6 à 10 minutes         |
| Champs sans relation         | Index composite (non unique) | 1 million         | 30 minutes             |
| Champs de relation<br>(Un à un, Un à plusieurs,<br>Plusieurs à un, Plusieurs à plusieurs) | Clé primaire / Contrainte unique | 500 000           | 15 à 30 minutes        | Les champs de relation réduisent les performances |

Pour garantir des exportations efficaces, nous vous recommandons de :
1. La collection doit remplir les conditions suivantes :

| Type de condition               | Condition requise