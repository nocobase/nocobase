:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Règles de liaison de blocs

## Introduction

Les règles de liaison de blocs vous permettent de contrôler dynamiquement l'affichage des blocs et de gérer la présentation des éléments au niveau du bloc. Étant donné que les blocs servent de conteneurs pour les champs et les boutons d'action, ces règles vous offrent une flexibilité totale pour contrôler l'affichage de la vue complète, directement depuis le bloc.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Note** : Avant d'exécuter les règles de liaison de blocs, l'affichage du bloc doit d'abord passer par une **vérification des permissions ACL**. Ce n'est que lorsque vous disposez des permissions d'accès correspondantes que la logique des règles de liaison de blocs sera évaluée. En d'autres termes, les règles de liaison de blocs ne prennent effet qu'après que les exigences de permission de visualisation ACL sont satisfaites. Si aucune règle de liaison de blocs n'est configurée, le bloc s'affiche par défaut.

### Contrôler les blocs avec des variables globales

Les **règles de liaison de blocs** permettent d'utiliser des variables globales pour contrôler dynamiquement le contenu affiché dans les blocs. Cela permet aux utilisateurs ayant des rôles et des permissions différents de visualiser et d'interagir avec des vues de données personnalisées. Par exemple, dans un système de gestion des commandes, bien que différents rôles (tels que les administrateurs, le personnel de vente et le personnel financier) aient tous la permission de consulter les commandes, les champs et les boutons d'action que chaque rôle doit voir peuvent différer. En configurant des variables globales, vous pouvez ajuster de manière flexible les champs affichés, les boutons d'action, et même les règles de tri et de filtrage des données en fonction du rôle, des permissions ou d'autres conditions de l'utilisateur.

#### Cas d'utilisation spécifiques :

- **Contrôle des rôles et des permissions** : Contrôlez la visibilité ou l'éditabilité de certains champs en fonction des permissions des différents rôles. Par exemple, le personnel de vente peut uniquement consulter les informations de base d'une commande, tandis que le personnel financier peut voir les détails de paiement.
- **Vues personnalisées** : Personnalisez différentes vues de blocs pour différents départements ou équipes, en vous assurant que chaque utilisateur ne voit que le contenu pertinent pour son travail, améliorant ainsi l'efficacité.
- **Gestion des permissions d'action** : Contrôlez l'affichage des boutons d'action à l'aide de variables globales. Par exemple, certains rôles peuvent uniquement visualiser les données, tandis que d'autres peuvent effectuer des actions telles que la modification ou la suppression.

### Contrôler les blocs avec des variables contextuelles

Les blocs peuvent également être contrôlés par des variables de contexte. Par exemple, vous pouvez utiliser des variables contextuelles comme « Enregistrement actuel », « Formulaire actuel » et « Enregistrement de la fenêtre contextuelle actuelle » pour afficher ou masquer dynamiquement des blocs.

Exemple : Le bloc « Informations sur l'opportunité de commande » s'affiche uniquement lorsque le statut de la commande est « Payé ».

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Pour plus d'informations sur les règles de liaison, consultez [Règles de liaison](/interface-builder/linkage-rule).