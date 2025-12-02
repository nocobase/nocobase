---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Avancé

## Introduction

Le plugin IA d'employé vous permet de configurer des sources de données et de prédéfinir des requêtes de collection. Ces requêtes sont ensuite transmises comme contexte d'application lors de vos échanges avec l'employé IA, qui formulera ses réponses en se basant sur les résultats obtenus.

## Configuration de la source de données

Accédez à la page de configuration du plugin IA d'employé, puis cliquez sur l'onglet `Data source` pour accéder à la page de gestion des sources de données de l'employé IA.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Cliquez sur le bouton `Add data source` pour ouvrir la page de création d'une source de données.

Première étape : Saisissez les informations de base de la `Collection` :
- Dans le champ `Title`, entrez un nom facile à retenir pour votre source de données ;
- Dans le champ `Collection`, sélectionnez la source de données et la collection à utiliser ;
- Dans le champ `Description`, saisissez une description pour cette source de données.
- Dans le champ `Limit`, définissez une limite pour le nombre de résultats de la requête. Cela permet d'éviter de renvoyer trop de données, ce qui pourrait dépasser le contexte de conversation de l'IA.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Deuxième étape : Sélectionnez les champs à interroger :

Dans la liste `Fields`, cochez les champs que vous souhaitez interroger.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Troisième étape : Définissez les conditions de la requête :

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Quatrième étape : Définissez les conditions de tri :

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Enfin, avant d'enregistrer la source de données, vous pouvez prévisualiser les résultats de la requête.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Envoyer des sources de données dans les conversations

Dans la boîte de dialogue de l'employé IA, cliquez sur le bouton `Add work context` en bas à gauche, puis sélectionnez `Data source`. Vous verrez alors la source de données que vous venez d'ajouter.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Cochez la source de données que vous souhaitez envoyer. La source de données sélectionnée sera alors attachée à la boîte de dialogue.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Après avoir saisi votre question, cliquez simplement sur le bouton d'envoi, comme pour un message normal. L'employé IA répondra en se basant sur la source de données fournie.

La source de données apparaîtra également dans la liste des messages.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Remarques

La source de données filtrera automatiquement les informations en fonction des permissions ACL de l'utilisateur actuel, n'affichant que les données auxquelles l'utilisateur a accès.