:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Permissions d'action

## Introduction

Dans NocoBase 2.0, les permissions d'action sont principalement contrôlées par les permissions de ressources de collection :

- **Permission de ressource de collection** : Elle permet de contrôler de manière uniforme les permissions d'action de base (Créer, Afficher, Mettre à jour, Supprimer) des différents rôles pour une collection. Cette permission s'applique à l'ensemble de la collection sous la source de données, garantissant que les permissions d'action d'un rôle pour cette collection restent cohérentes sur les différentes pages, fenêtres modales et blocs.

### Permission de ressource de collection

Dans le système de permissions de NocoBase, les permissions d'action des collections sont généralement divisées selon les dimensions CRUD afin d'assurer la cohérence et la standardisation de la gestion des permissions. Par exemple :

- **Permission de création (Create)** : Elle contrôle toutes les actions liées à la création pour la collection, y compris les actions d'ajout, de duplication, etc. Dès qu'un rôle possède la permission de création pour cette collection, toutes les actions de création (ajout, duplication, etc.) seront visibles sur toutes les pages et dans toutes les fenêtres modales.
- **Permission de suppression (Delete)** : Elle contrôle l'action de suppression pour cette collection. La permission reste cohérente, qu'il s'agisse d'une suppression en masse dans un bloc de tableau ou d'une suppression d'un enregistrement unique dans un bloc de détails.
- **Permission de mise à jour (Update)** : Elle contrôle les actions de type mise à jour pour cette collection, telles que les actions d'édition et de mise à jour d'enregistrements.
- **Permission de visualisation (View)** : Elle contrôle la visibilité des données de cette collection. Les blocs de données associés (tableau, liste, détails, etc.) ne sont visibles que si le rôle possède la permission de visualisation pour cette collection.

Cette méthode de gestion des permissions universelle est adaptée au contrôle standardisé des permissions de données. Elle garantit que pour la `même collection`, la `même action` dispose de règles de permission `cohérentes` sur les `différentes pages, fenêtres modales et blocs`, offrant ainsi uniformité et maintenabilité.

#### Permissions globales

Les permissions d'action globales s'appliquent à toutes les collections sous la source de données et sont classées par type de ressource comme suit :

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Permissions d'action spécifiques à une collection

Les permissions d'action spécifiques à une collection priment sur les permissions générales de la source de données. Elles affinent davantage les permissions d'action et permettent des configurations de permissions personnalisées pour l'accès aux ressources d'une collection spécifique. Ces permissions sont divisées en deux aspects :

1. Permissions d'action : Les permissions d'action incluent les actions d'ajout, de visualisation, d'édition, de suppression, d'exportation et d'importation. Ces permissions sont configurées selon la dimension de la portée des données :

   - Toutes les données : Permet aux utilisateurs d'effectuer des actions sur tous les enregistrements de la collection.
   - Mes données : Limite les utilisateurs à n'effectuer des actions que sur les enregistrements de données qu'ils ont créés.

2. Permissions de champ : Les permissions de champ permettent de configurer les permissions pour chaque champ dans différentes actions. Par exemple, certains champs peuvent être configurés pour être en lecture seule et non modifiables.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

## Documentation associée

[Configurer les permissions]