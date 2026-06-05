:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Récupération RAG

## Introduction

Une fois votre base de connaissances configurée, vous pouvez activer la fonctionnalité RAG dans les paramètres de l'employé IA.

Lorsque le RAG est activé, lorsqu'un utilisateur discute avec un employé IA, ce dernier utilisera la récupération RAG pour récupérer des documents de la base de connaissances en fonction du message de l'utilisateur et y répondra en se basant sur les documents récupérés.

## Activer le RAG

Accédez à la page de configuration du plugin employé IA, puis cliquez sur l'onglet `AI employees` pour accéder à la page de gestion des employés IA.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Sélectionnez l'employé IA pour lequel vous souhaitez activer le RAG, puis cliquez sur le bouton `Edit` pour accéder à sa page d'édition.

Dans l'onglet `Knowledge base`, activez l'interrupteur `Enable`.

- Dans le champ `Knowledge Base Prompt`, saisissez l'invite pour référencer la base de connaissances. `{knowledgeBaseData}` est un espace réservé fixe et ne doit pas être modifié.
- Dans le champ `Knowledge Base`, sélectionnez la base de connaissances configurée. Référencez : [Base de connaissances](/ai-employees/knowledge-base/knowledge-base).
- Dans le champ `Top K`, saisissez le nombre de documents à récupérer. La valeur par défaut est de 3.
- Dans le champ `Score`, saisissez le seuil de pertinence des documents pour la récupération.

Cliquez sur le bouton `Submit` pour enregistrer les paramètres de l'employé IA.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)