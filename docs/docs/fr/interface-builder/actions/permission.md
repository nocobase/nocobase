---
title: "Autorisations des actions"
description: "Autorisations des actions : configurez la visibilité et les autorisations d'exécution des actions, prend en charge le contrôle par rôle et par portée des données."
keywords: "autorisations des actions, permission, autorisations de rôle, visibilité, construction d'interface, NocoBase"
---

# Autorisations des actions

## Introduction

Dans NocoBase 2.0, les autorisations des actions sont actuellement principalement contrôlées par les autorisations de ressources de la collection :

- **Autorisations de ressources de la collection** : permettent de contrôler de manière unifiée les autorisations de base des différents rôles sur la collection : créer (Create), consulter (View), mettre à jour (Update), supprimer (Delete), etc. Ces autorisations s'appliquent à l'ensemble de la collection sous une source de données et garantissent que les rôles disposent d'autorisations cohérentes pour les opérations correspondantes sur cette collection dans différents blocs, pages ou fenêtres contextuelles.
<!-- - **Autorisation indépendante d'action** : permet d'affiner le contrôle des actions visibles pour différents rôles, adaptée à la gestion des autorisations d'actions spécifiques telles que : déclencher un workflow, requête personnalisée, lien externe, etc. Ce type d'autorisation s'applique au contrôle des autorisations au niveau de l'action, ce qui permet à différents rôles d'exécuter des actions spécifiques sans affecter la configuration des autorisations globales de la collection. -->

### Autorisations de ressources de la collection

Dans le système d'autorisations de NocoBase, les autorisations d'action sur les collections sont essentiellement divisées selon les dimensions CRUD, afin de garantir la cohérence et la conformité de la gestion des autorisations. Par exemple :

- **Autorisation de création (Create)** : contrôle toutes les opérations de création liées à cette collection, y compris la création et la copie. Tant qu'un rôle possède l'autorisation de création sur cette collection, les opérations de création et de copie sont visibles dans toutes les pages et fenêtres contextuelles.
- **Autorisation de suppression (Delete)** : contrôle l'opération de suppression sur cette collection, qu'il s'agisse de la suppression par lots dans un bloc de tableau ou de la suppression d'un enregistrement unique dans un bloc de détails ; les autorisations restent cohérentes.
- **Autorisation de mise à jour (Update)** : contrôle les opérations de type mise à jour sur cette collection, telles que la modification ou la mise à jour d'un enregistrement.
- **Autorisation de consultation (View)** : contrôle la visibilité des données de cette collection ; les blocs de données associés (tableau, liste, détails, etc.) ne sont visibles que si le rôle dispose de l'autorisation de consultation sur cette collection.

Ce mode général de gestion des autorisations convient au contrôle des autorisations de données standardisées, et garantit que les `mêmes opérations` sur la `même collection` ont des `règles d'autorisation cohérentes` dans `différentes pages, fenêtres contextuelles et blocs`, avec une bonne uniformité et maintenabilité.

#### Autorisations globales

Les autorisations d'action globales s'appliquent à toutes les collections de cette source de données, divisées par type de ressource comme suit :

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Autorisations d'action sur une collection spécifique

Les autorisations d'action sur une collection spécifique priment sur les autorisations générales de la source de données et permettent d'affiner les autorisations d'action en configurant des autorisations personnalisées pour l'accès aux ressources d'une collection spécifique. Ces autorisations se divisent en deux aspects :

1. Autorisations d'action : les autorisations d'action incluent les opérations d'ajout, de consultation, de modification, de suppression, d'export et d'import. Ces autorisations sont configurées selon la dimension de la portée des données :

   - Toutes les données : autorise l'utilisateur à exécuter des actions sur tous les enregistrements de la collection.
   - Ses propres données : limite l'utilisateur à exécuter des actions uniquement sur les enregistrements qu'il a lui-même créés.

2. Autorisations de champ : les autorisations de champ permettent de configurer les autorisations sur chaque champ pour différentes opérations. Par exemple, certains champs peuvent être configurés pour autoriser uniquement la consultation et non la modification.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Autorisation indépendante d'action

> **Remarque** : cette fonctionnalité est **prise en charge depuis la version v1.6.0-beta.13**.

Contrairement aux autorisations d'action unifiées, l'autorisation indépendante d'action ne contrôle que l'action elle-même, ce qui permet à une même action d'avoir des configurations d'autorisations différentes selon les emplacements.

Ce type d'autorisation convient aux actions personnalisées, par exemple :

L'action de déclenchement de workflow peut nécessiter d'appeler différents workflows selon les pages ou les blocs, ce qui nécessite un contrôle d'autorisations indépendant.
Les actions personnalisées à différents emplacements exécutent une logique métier spécifique, adaptée à une gestion d'autorisations distincte.

Les actions suivantes prennent actuellement en charge la configuration d'autorisations indépendantes :

- Fenêtre contextuelle (contrôle la visibilité et les autorisations d'action de la fenêtre contextuelle)
- Lien (limite l'accès des rôles aux liens externes ou internes)
- Déclencher un workflow (appeler différents workflows selon la page)
- Actions du panneau d'actions (par exemple : scan de code, action de fenêtre contextuelle, déclenchement de workflow, lien externe)
- Requête personnalisée (envoyer une requête à un tiers)

Grâce à la configuration d'autorisations d'action indépendantes, vous pouvez gérer plus finement les autorisations d'action des différents rôles, ce qui rend le contrôle des autorisations plus flexible.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Si aucun rôle n'est défini, l'action est par défaut visible par tous les rôles.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## Documentation associée

[Configurer les autorisations]
<!-- (/users-and-permissions) -->
