:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Base de données vectorielle

## Introduction

Dans une base de connaissances, la base de données vectorielle stocke les documents de la base de connaissances sous forme vectorielle. Ces documents vectorisés servent d'index pour les documents.

Lorsque la récupération RAG est activée dans une conversation avec un agent IA, le message de l'utilisateur est vectorisé. Des fragments de documents de la base de connaissances sont alors récupérés dans la base de données vectorielle afin de faire correspondre les paragraphes pertinents et le texte original des documents.

Actuellement, le plugin de base de connaissances IA ne prend en charge nativement que PGVector, un plugin de base de données PostgreSQL.

## Gestion de la base de données vectorielle

Rendez-vous sur la page de configuration du plugin d'agent IA, cliquez sur l'onglet `Vector store`, puis sélectionnez `Vector database` pour accéder à la page de gestion des bases de données vectorielles.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Cliquez sur le bouton `Add new` en haut à droite pour ajouter une nouvelle connexion à une base de données vectorielle `PGVector` :

- Dans le champ `Name`, saisissez le nom de la connexion.
- Dans le champ `Host`, saisissez l'adresse IP de la base de données vectorielle.
- Dans le champ `Port`, saisissez le numéro de port de la base de données vectorielle.
- Dans le champ `Username`, saisissez le nom d'utilisateur de la base de données vectorielle.
- Dans le champ `Password`, saisissez le mot de passe de la base de données vectorielle.
- Dans le champ `Database`, saisissez le nom de la base de données.
- Dans le champ `Table name`, saisissez le nom de la table. Ce nom sera utilisé lors de la création d'une nouvelle table pour stocker les données vectorielles.

Après avoir saisi toutes les informations nécessaires, cliquez sur le bouton `Test` pour vérifier la disponibilité du service de base de données vectorielle, puis cliquez sur le bouton `Submit` pour enregistrer les informations de connexion.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)