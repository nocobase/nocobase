:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Événements de collection

## Introduction

Les déclencheurs de type "événement de collection" surveillent les événements de création, de modification et de suppression sur une collection. Lorsqu'une opération de données sur cette collection se produit et remplit les conditions configurées, elle déclenche le flux de travail correspondant. Par exemple, des scénarios comme la déduction du stock d'un produit après la création d'une nouvelle commande, ou l'attente d'une révision manuelle après l'ajout d'un nouveau commentaire.

## Utilisation de base

Il existe plusieurs types de modifications de collection :

1.  Après la création de données.
2.  Après la mise à jour de données.
3.  Après la création ou la mise à jour de données.
4.  Après la suppression de données.

![Événement de collection_Sélection du moment de déclenchement](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Vous pouvez choisir le moment du déclenchement en fonction de vos besoins métier. Lorsque le type de modification sélectionné inclut la mise à jour de la collection, vous pouvez également spécifier les champs qui ont été modifiés. La condition de déclenchement n'est remplie que si les champs sélectionnés changent. Si aucun champ n'est sélectionné, cela signifie qu'une modification de n'importe quel champ peut déclencher le flux de travail.

![Événement de collection_Sélection des champs modifiés](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Plus précisément, vous pouvez configurer des règles de condition pour chaque champ de la ligne de données déclenchée. Le déclencheur ne se déclenchera que si les champs remplissent les conditions correspondantes.

![Événement de collection_Configuration des conditions de données](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Après le déclenchement d'un événement de collection, la ligne de données ayant généré l'événement sera injectée dans le plan d'exécution en tant que données de contexte de déclenchement, afin d'être utilisée comme variables par les nœuds ultérieurs du flux de travail. Cependant, lorsque les nœuds ultérieurs souhaitent utiliser les champs de relation de ces données, vous devez d'abord configurer le préchargement des données de relation. Les données de relation sélectionnées seront injectées dans le contexte en même temps que le déclencheur et pourront être sélectionnées et utilisées de manière hiérarchique.

## Conseils associés

### Le déclenchement par opérations de données en masse n'est pas pris en charge actuellement

Les événements de collection ne prennent pas en charge actuellement le déclenchement par des opérations de données en masse. Par exemple, lors de la création d'un article et de l'ajout simultané de plusieurs tags pour cet article (données de relation un-à-plusieurs), seul le flux de travail pour la création de l'article sera déclenché. Les multiples tags créés simultanément ne déclencheront pas le flux de travail pour la création de tags. Lors de l'association ou de l'ajout de données de relation plusieurs-à-plusieurs, le flux de travail pour la collection intermédiaire ne sera pas non plus déclenché.

### Les opérations de données effectuées en dehors de l'application ne déclencheront pas d'événements

Les opérations sur les collections via des appels d'API HTTP à l'interface de l'application peuvent également déclencher des événements correspondants. Cependant, si les modifications de données sont effectuées directement via des opérations de base de données plutôt que via l'application NocoBase, les événements correspondants ne pourront pas être déclenchés. Par exemple, les déclencheurs natifs de la base de données ne seront pas associés aux flux de travail de l'application.

De plus, l'utilisation du nœud d'action SQL pour opérer sur la base de données équivaut à des opérations directes sur la base de données et ne déclenchera pas d'événements de collection.

### Sources de données externes

Les flux de travail prennent en charge les sources de données externes depuis la version `0.20`. Si vous utilisez un plugin de source de données externe et que l'événement de collection est configuré pour une source de données externe, tant que les opérations de données sur cette source de données sont effectuées au sein de l'application (telles que la création par l'utilisateur, les mises à jour et les opérations de données de flux de travail), les événements de collection correspondants peuvent être déclenchés. Cependant, si les modifications de données sont effectuées via d'autres systèmes ou directement dans la base de données externe, les événements de collection ne peuvent pas être déclenchés.

## Exemple

Prenons l'exemple d'un scénario où, après la création d'une nouvelle commande, le prix total est calculé et le stock est déduit.

Tout d'abord, nous créons une collection de produits et une collection de commandes, avec les modèles de données suivants :

| Nom du champ | Type de champ |
| -------- | -------- |
| Nom du produit | Texte sur une ligne |
| Prix     | Nombre     |
| Stock     | Entier     |

| Nom du champ | Type de champ       |
| -------- | -------------- |
| Numéro de commande   | Séquence       |
| Produit de la commande | Plusieurs-à-un (Produits) |
| Total de la commande | Nombre           |

Et ajoutons quelques données de produits de base :

| Nom du produit      | Prix | Stock |
| ------------- | ---- | ---- |
| iPhone 14 Pro | 7999 | 10   |
| iPhone 13 Pro | 5999 | 0    |

Ensuite, créez un flux de travail basé sur l'événement de la collection "Commandes" :

![Événement de collection_Exemple_Déclenchement nouvelle commande](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Voici quelques-unes des options de configuration :

-   Collection : Sélectionnez la collection "Commandes".
-   Moment du déclenchement : Sélectionnez "Après la création de données".
-   Conditions de déclenchement : Laissez vide.
-   Précharger les données de relation : Cochez "Produits".

Ensuite, configurez les autres nœuds selon la logique du flux de travail : vérifiez si le stock du produit est supérieur à 0. Si oui, déduisez le stock ; sinon, la commande est invalide et doit être supprimée :

![Événement de collection_Exemple_Orchestration flux de travail nouvelle commande](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

La configuration des nœuds sera expliquée en détail dans la documentation des types de nœuds spécifiques.

Activez ce flux de travail et testez-le en créant une nouvelle commande via l'interface. Après avoir passé une commande pour "iPhone 14 Pro", le stock du produit correspondant sera réduit à 9. Si une commande est passée pour "iPhone 13 Pro", la commande sera supprimée en raison d'un stock insuffisant.

![Événement de collection_Exemple_Résultat exécution nouvelle commande](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)