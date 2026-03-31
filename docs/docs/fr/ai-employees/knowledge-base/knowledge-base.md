:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Base de connaissances

## Introduction

La base de connaissances est le fondement de la récupération RAG. Elle organise les documents par catégorie et construit un index. Lorsqu'un employé IA répond à une question, il privilégie la recherche de réponses dans la base de connaissances.

## Gestion de la base de connaissances

Accédez à la page de configuration du **plugin** Employé IA, puis cliquez sur l'onglet `Knowledge base` pour accéder à la page de gestion de la base de connaissances.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Cliquez sur le bouton `Add new` en haut à droite pour ajouter une base de connaissances `Local`.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Saisissez les informations nécessaires pour la nouvelle base de connaissances :

- Dans le champ `Name`, saisissez le nom de la base de connaissances ;
- Dans `File storage`, sélectionnez l'emplacement de stockage des fichiers ;
- Dans `Vector store`, sélectionnez le magasin de vecteurs. Référez-vous à [Magasin de vecteurs](/ai-employees/knowledge-base/vector-store) ;
- Dans le champ `Description`, saisissez la description de la base de connaissances ;

Cliquez sur le bouton `Submit` pour créer la base de connaissances.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Gestion des documents de la base de connaissances

Une fois la base de connaissances créée, sur la page de liste des bases de connaissances, cliquez sur celle que vous venez de créer pour accéder à la page de gestion des documents de la base de connaissances.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Cliquez sur le bouton `Upload` pour télécharger des documents. Une fois les documents téléchargés, la vectorisation démarre automatiquement. Attendez que le `Status` passe de `Pending` à `Success`.

Actuellement, la base de connaissances prend en charge les types de documents suivants : txt, pdf, doc, docx, ppt, pptx ; les fichiers PDF ne prennent en charge que le texte brut.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Types de bases de connaissances

### Base de connaissances `Local`

Une base de connaissances `Local` est une base de connaissances stockée localement dans NocoBase. Les documents et leurs données vectorielles sont tous stockés localement par NocoBase.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Base de connaissances `Readonly`

Une base de connaissances `Readonly` est une base de connaissances en lecture seule. Les documents et les données vectorielles sont maintenus en externe. Seule une connexion à la base de données vectorielle est créée dans NocoBase (actuellement, seul PGVector est pris en charge).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Base de connaissances `External`

Une base de connaissances `External` est une base de connaissances externe où les documents et les données vectorielles sont maintenus en externe. La récupération des données de la base de données vectorielle nécessite une extension par les développeurs, ce qui permet d'utiliser des bases de données vectorielles non prises en charge actuellement par NocoBase.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)