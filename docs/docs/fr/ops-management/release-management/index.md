:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Gestion des versions

## Introduction

Dans les applications concrètes, pour garantir la sécurité des données et la stabilité de l'application, il est courant de déployer plusieurs environnements, tels qu'un environnement de développement, un environnement de pré-production et un environnement de production. Ce document présente deux exemples de flux de travail de développement sans code courants et explique en détail comment implémenter la gestion des versions dans NocoBase.

## Installation

Trois plugins sont essentiels pour la gestion des versions. Veuillez vous assurer que les plugins suivants sont activés.

### Variables d'environnement et clés

- Plugin intégré, installé et activé par défaut.
- Il permet la configuration et la gestion centralisées des variables d'environnement et des clés, utilisées pour le stockage de données sensibles, la réutilisation de données de configuration, l'isolation des configurations par environnement, etc. ([Consulter la documentation](#)).

### Gestionnaire de sauvegardes

- Ce plugin est disponible uniquement dans l'édition Professionnelle ou supérieure ([En savoir plus](https://www.nocobase.com/en/commercial)).
- Il prend en charge la sauvegarde et la restauration, y compris les sauvegardes planifiées, garantissant la sécurité des données et une récupération rapide. ([Consulter la documentation](../backup-manager/index.mdx)).

### Gestionnaire de migrations

- Ce plugin est disponible uniquement dans l'édition Professionnelle ou supérieure ([En savoir plus](https://www.nocobase.com/en/commercial)).
- Il est utilisé pour migrer les configurations d'application d'un environnement d'application à un autre. ([Consulter la documentation](../migration-manager/index.md)).

## Flux de travail de développement sans code courants

### Environnement de développement unique, déploiement unidirectionnel

Cette approche convient aux flux de travail de développement simples. Il y a un seul environnement de développement, un seul environnement de pré-production et un seul environnement de production. Les modifications passent de l'environnement de développement à l'environnement de pré-production, puis sont finalement déployées dans l'environnement de production. Dans ce flux de travail, seul l'environnement de développement peut modifier les configurations ; ni l'environnement de pré-production ni l'environnement de production n'autorisent les modifications.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Lors de la configuration des règles de migration, sélectionnez la règle **« Priorité à l'écrasement »** pour les tables intégrées du noyau et des plugins si nécessaire ; pour toutes les autres, vous pouvez conserver les paramètres par défaut si vous n'avez pas d'exigences particulières.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Plusieurs environnements de développement, déploiement fusionné

Cette approche convient aux scénarios de collaboration multi-personnes ou aux projets complexes. Plusieurs environnements de développement parallèles peuvent être utilisés indépendamment, et toutes les modifications sont fusionnées dans un environnement de pré-production unique pour les tests et la validation avant d'être déployées en production. Dans ce flux de travail, seul l'environnement de développement peut modifier les configurations ; ni l'environnement de pré-production ni l'environnement de production n'autorisent les modifications.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Lors de la configuration des règles de migration, sélectionnez la règle **« Priorité à l'insertion ou à la mise à jour »** pour les tables intégrées du noyau et des plugins si nécessaire ; pour toutes les autres, vous pouvez conserver les paramètres par défaut si vous n'avez pas d'exigences particulières.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Annulation

Avant d'exécuter une migration, le système crée automatiquement une sauvegarde de l'application actuelle. Si la migration échoue ou si les résultats ne correspondent pas à vos attentes, vous pouvez annuler et restaurer via le [Gestionnaire de sauvegardes](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)