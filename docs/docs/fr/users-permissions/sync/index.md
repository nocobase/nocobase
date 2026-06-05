---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Synchronisation des données utilisateur

## Introduction

Cette fonctionnalité vous permet d'enregistrer et de gérer les sources de synchronisation des données utilisateur. Par défaut, une API HTTP est fournie, mais d'autres sources de données peuvent être prises en charge via des plugins. Elle prend en charge la synchronisation des données vers les **collections** Utilisateurs et Départements par défaut, avec la possibilité d'étendre la synchronisation à d'autres ressources cibles à l'aide de plugins.

## Gestion et synchronisation des sources de données

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Si aucun plugin fournissant des sources de synchronisation de données utilisateur n'est installé, vous pouvez synchroniser les données utilisateur via l'API HTTP. Consultez [Source de données - API HTTP](./sources/api.md).
:::

## Ajouter une source de données

Une fois que vous avez installé un plugin qui fournit une source de synchronisation de données utilisateur, vous pouvez ajouter la source de données correspondante. Seules les sources de données activées afficheront les boutons « Synchroniser » et « Tâches ».

> Exemple : WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Synchroniser les données

Cliquez sur le bouton **Synchroniser** pour démarrer la synchronisation des données.

![](https://static-docs.nocobase.com/202412041055022.png)

Cliquez sur le bouton **Tâches** pour afficher l'état de la synchronisation. Après une synchronisation réussie, vous pouvez consulter les données dans les listes Utilisateurs et Départements.

![](https://static-docs.nocobase.com/202412041202337.png)

Pour les tâches de synchronisation ayant échoué, vous pouvez cliquer sur **Réessayer**.

![](https://static-docs.nocobase.com/202412041058337.png)

En cas d'échec de synchronisation, vous pouvez résoudre le problème en consultant les journaux système. De plus, les enregistrements de synchronisation bruts sont stockés dans le répertoire `user-data-sync` sous le dossier des journaux de l'application.

![](https://static-docs.nocobase.com/202412041205655.png)