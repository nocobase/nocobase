:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Sélecteur déroulant

## Introduction

Le sélecteur déroulant vous permet d'associer des données en les sélectionnant parmi les données existantes d'une collection cible, ou en ajoutant de nouvelles données à cette collection pour les associer. Les options du menu déroulant prennent en charge la recherche floue.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Configuration du champ

### Définir le périmètre des données

Contrôle le périmètre des données affichées dans la liste déroulante.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Pour plus d'informations, consultez [Définir le périmètre des données](/interface-builder/fields/field-settings/data-scope)

### Définir les règles de tri

Contrôle le tri des données dans le sélecteur déroulant.

Exemple : Trier par date de service dans l'ordre décroissant.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Autoriser l'ajout/l'association de plusieurs enregistrements

Restreint une relation de type "plusieurs" pour n'autoriser l'association qu'à un seul enregistrement.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Champ de titre

Le champ de titre est le champ d'étiquette affiché dans les options.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Permet une recherche rapide basée sur le champ de titre.

Pour plus d'informations, consultez [Champ de titre](/interface-builder/fields/field-settings/title-field)

### Création rapide : Ajouter les données puis les sélectionner

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Ajout via le menu déroulant

Après avoir créé un nouvel enregistrement dans la collection cible, le système le sélectionne automatiquement et l'associe lors de la soumission du formulaire.

Dans l'exemple ci-dessous, la collection "Commandes" possède un champ de relation "plusieurs à un" nommé **« Compte »**.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Ajout via une fenêtre modale

L'ajout via une fenêtre modale convient aux scénarios de saisie de données plus complexes et permet de configurer un formulaire personnalisé pour la création de nouveaux enregistrements.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Composant de champ](/interface-builder/fields/association-field)