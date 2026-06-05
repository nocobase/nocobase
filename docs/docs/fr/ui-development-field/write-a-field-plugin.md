:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Comprendre les collections



## Qu'est-ce qu'une collection ?

Dans NocoBase, une **collection** est un concept fondamental pour organiser vos données. Imaginez-la comme une table de base de données, mais dotée de fonctionnalités plus puissantes, spécialement conçues pour le développement d'applications. Chaque collection définit la structure d'un type de données spécifique, comme les `Utilisateurs`, les `Produits` ou les `Commandes`.

### Principales fonctionnalités des collections

- **Champs :** Définissent les attributs de vos données (par exemple, `name`, `email`, `price`).
- **Relations :** Permettent de lier les collections entre elles (par exemple, une collection `Commande` peut être liée à une collection `Utilisateur`).
- **Permissions :** Contrôlent qui peut consulter, créer, modifier ou supprimer des données au sein d'une collection.
- **Actions :** Exécutent des opérations sur les données de la collection, souvent intégrées aux [flux de travail](#).

### Créer une nouvelle collection

Pour créer une nouvelle collection :

1. Accédez à la section `Collections` dans le panneau d'administration.
2. Cliquez sur le bouton `Ajouter`.
3. Saisissez un nom pour votre collection (par exemple, `Tâches`).
4. Ajoutez les champs nécessaires.