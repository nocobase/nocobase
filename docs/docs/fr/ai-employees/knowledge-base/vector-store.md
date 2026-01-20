:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Stockage vectoriel

## Introduction

Dans une base de connaissances, lors de l'enregistrement de documents, ceux-ci sont vectorisés. Lors de la récupération de documents, les termes de recherche sont également vectorisés. Ces deux processus nécessitent l'utilisation d'un `Embedding model` pour vectoriser le texte original.

Dans le plugin Base de connaissances IA, un stockage vectoriel est l'association d'un `Embedding model` et d'une base de données vectorielle.

## Gestion du stockage vectoriel

Accédez à la page de configuration du plugin Employés IA, cliquez sur l'onglet `Vector store`, et sélectionnez `Vector store` pour accéder à la page de gestion du stockage vectoriel.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Cliquez sur le bouton `Add new` en haut à droite pour ajouter un nouveau stockage vectoriel :

- Dans le champ `Name`, saisissez le nom du stockage vectoriel ;
- Dans `Vector store`, sélectionnez une base de données vectorielle déjà configurée. Référez-vous à : [Base de données vectorielle](/ai-employees/knowledge-base/vector-database) ;
- Dans `LLM service`, sélectionnez un service LLM déjà configuré. Référez-vous à : [Gestion des services LLM](/ai-employees/quick-start/llm-service) ;
- Dans le champ `Embedding model`, saisissez le nom du modèle `Embedding` à utiliser ;

Cliquez sur le bouton `Submit` pour enregistrer les informations du stockage vectoriel.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)