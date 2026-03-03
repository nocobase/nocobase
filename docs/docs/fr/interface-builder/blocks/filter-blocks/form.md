:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/blocks/filter-blocks/form).
:::

# Formulaire de filtrage

## Introduction

Le formulaire de filtrage permet aux utilisateurs de filtrer les données en remplissant des champs de formulaire. Il peut être utilisé pour filtrer des blocs de tableau, des blocs de graphique, des blocs de liste, et bien plus encore.

## Comment l'utiliser

Commençons par un exemple simple pour comprendre rapidement comment utiliser le formulaire de filtrage. Supposons que nous ayons un bloc de tableau contenant des informations utilisateur, et que nous souhaitions filtrer ces données à l'aide d'un formulaire de filtrage, comme ceci :

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Voici les étapes de configuration :

1. Activez le mode de configuration et ajoutez un bloc « Formulaire de filtrage » et un bloc « Tableau » à la page.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Ajoutez le champ « Pseudo » aux blocs de tableau et de formulaire de filtrage.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Vous pouvez maintenant commencer à l'utiliser.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Utilisation avancée

Le bloc de formulaire de filtrage prend en charge des configurations plus avancées. Voici quelques cas d'utilisation courants.

### Connecter plusieurs blocs

Un seul champ de formulaire peut filtrer simultanément les données de plusieurs blocs. Voici comment procéder :

1. Cliquez sur l'option de configuration « Connect fields » du champ.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Ajoutez les blocs cibles que vous souhaitez connecter. Dans cet exemple, nous allons sélectionner le bloc de liste sur la page.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Sélectionnez un ou plusieurs champs du bloc de liste à connecter. Ici, nous sélectionnons le champ « Pseudo ».
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Cliquez sur le bouton d'enregistrement pour finaliser la configuration. Le résultat se présente comme suit :
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Connecter des blocs de graphique

Référence : [Filtres de page et liaison](../../../data-visualization/guide/filters-and-linkage.md)

### Champs personnalisés

En plus de sélectionner des champs à partir des collections, vous pouvez également créer des champs de formulaire à l'aide des « Champs personnalisés ». Par exemple, vous pouvez créer un champ de sélection déroulante avec des options personnalisées. Voici comment procéder :

1. Cliquez sur l'option « Champs personnalisés » pour ouvrir le panneau de configuration.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Remplissez le titre du champ, sélectionnez « Sélection » dans « Type de champ » et configurez les options.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Les champs personnalisés nouvellement ajoutés doivent être connectés manuellement aux champs des blocs cibles. Voici comment procéder :
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. La configuration est terminée. Le résultat se présente comme suit :
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Les types de champs actuellement pris en charge sont :

- Texte court
- Nombre
- Date
- Sélection
- Radio Group
- Checkbox group
- Association

#### Association (Champs de relation personnalisés)

« Association » est adapté au filtrage par enregistrements de table associée. Par exemple, filtrer les commandes par « Client » ou les tâches par « Responsable ».

Description des options :

- **Collection cible** : Indique de quelle collection charger les enregistrements.
- **Champ de titre** : Texte affiché pour les options et les étiquettes (ex: nom, titre).
- **Champ de valeur** : Valeur soumise lors du filtrage, généralement l'ID.
- **Autoriser la sélection multiple** : Permet de sélectionner plusieurs enregistrements.
- **Opérateur** : Définit comment la condition de filtrage correspond (voir ci-dessous).

Recommandations de configuration :

1. Choisissez un champ lisible pour le `Champ de titre` (ex: « Nom »).
2. Privilégiez la clé primaire pour le `Champ de valeur` pour garantir la stabilité.
3. Désactivez `Autoriser la sélection multiple` pour les scénarios à choix unique.

#### Opérateur

L'« Opérateur » définit la relation de correspondance entre la valeur du champ du formulaire de filtrage et la valeur du champ du bloc cible.

### Réduction

Ajoutez un bouton de réduction pour plier et déplier le contenu du formulaire de filtrage, ce qui permet d'économiser de l'espace sur la page.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Les configurations prises en charge sont les suivantes :

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Nombre de lignes affichées en mode réduit** : Définit le nombre de lignes de champs de formulaire affichées lorsque le formulaire est réduit.
- **Réduit par défaut** : Lorsque cette option est activée, le formulaire de filtrage s'affiche par défaut en mode réduit.