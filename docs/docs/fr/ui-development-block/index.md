:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Présentation des extensions de blocs

Dans NocoBase 2.0, le mécanisme d'extension des blocs a été considérablement simplifié. Les développeurs n'ont qu'à hériter de la classe de base **FlowModel** correspondante et à implémenter les méthodes d'interface associées (principalement la méthode `renderComponent()`) pour personnaliser rapidement les blocs.

## Catégories de blocs

NocoBase classe les blocs en trois types, affichés par groupes dans l'interface de configuration :

-   **Blocs de données** : Les blocs qui héritent de `DataBlockModel` ou `CollectionBlockModel`.
-   **Blocs de filtre** : Les blocs qui héritent de `FilterBlockModel`.
-   **Autres blocs** : Les blocs qui héritent directement de `BlockModel`.

> Le regroupement des blocs est déterminé par la classe de base correspondante. La logique de classification repose sur les relations d'héritage et ne nécessite aucune configuration supplémentaire.

## Description des classes de base

Le système fournit quatre classes de base pour les extensions :

### BlockModel

**Modèle de bloc de base**, la classe de base de bloc la plus polyvalente.

-   Convient aux blocs purement d'affichage qui ne dépendent pas de données.
-   Classé dans le groupe **Autres blocs**.
-   Applicable aux scénarios personnalisés.

### DataBlockModel

**Modèle de bloc de données (non lié à une collection)**, pour les blocs avec des sources de données personnalisées.

-   N'est pas directement lié à une collection ; vous pouvez personnaliser la logique de récupération des données.
-   Classé dans le groupe **Blocs de données**.
-   Applicable aux scénarios tels que : l'appel d'API externes, le traitement de données personnalisé, les graphiques statistiques, etc.

### CollectionBlockModel

**Modèle de bloc de collection**, pour les blocs qui doivent être liés à une collection.

-   Classe de base de modèle nécessitant d'être liée à une collection.
-   Classé dans le groupe **Blocs de données**.
-   Applicable aux : listes, formulaires, tableaux Kanban et autres blocs qui dépendent clairement d'une collection spécifique.

### FilterBlockModel

**Modèle de bloc de filtre**, pour la création de blocs de conditions de filtre.

-   Classe de base de modèle pour la création de conditions de filtre.
-   Classé dans le groupe **Blocs de filtre**.
-   Fonctionne généralement en conjonction avec les blocs de données.

## Comment choisir une classe de base

Lorsque vous choisissez une classe de base, vous pouvez suivre ces principes :

-   **Vous devez lier à une collection spécifique** : Privilégiez `CollectionBlockModel`.
-   **Source de données personnalisée** : Choisissez `DataBlockModel`.
-   **Pour définir des conditions de filtre et interagir avec les blocs de données** : Choisissez `FilterBlockModel`.
-   **Vous ne savez pas comment classer** : Choisissez `BlockModel`.

## Démarrage rapide

La création d'un bloc personnalisé ne nécessite que trois étapes :

1.  Héritez de la classe de base correspondante (par exemple, `BlockModel`).
2.  Implémentez la méthode `renderComponent()` pour retourner un composant React.
3.  Enregistrez le modèle de bloc dans le plugin.

Pour des exemples détaillés, veuillez consulter [Écrire un plugin de bloc](./write-a-block-plugin).