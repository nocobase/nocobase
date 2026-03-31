:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Avancé

## Introduction

Les modèles de langage (LLM) courants sont capables d'utiliser des outils. Le plugin "AI employee" intègre des outils fréquemment utilisés pour ces modèles.

Les compétences que vous configurez sur la page de réglages de l'AI employee sont les outils que le modèle de langage peut utiliser.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Configurer les compétences

Accédez à la page de configuration du plugin "AI employee", puis cliquez sur l'onglet `AI employees` pour ouvrir la page de gestion des AI employees.

Sélectionnez l'AI employee pour lequel vous souhaitez configurer des compétences, puis cliquez sur le bouton `Edit` pour accéder à sa page d'édition.

Dans l'onglet `Skills`, cliquez sur le bouton `Add Skill` pour ajouter une compétence à l'AI employee actuel.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Présentation des compétences

### Frontend

Le groupe Frontend permet à l'AI employee d'interagir avec les composants front-end.

- La compétence `Form filler` permet à l'AI employee de pré-remplir un formulaire spécifié par l'utilisateur avec les données générées.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Les compétences du groupe Data modeling confèrent à l'AI employee la capacité d'appeler les API internes de NocoBase pour la modélisation des données.

- `Intent Router` (routeur d'intentions) : détermine si l'utilisateur souhaite modifier la structure d'une collection ou en créer une nouvelle.
- `Get collection names` : récupère les noms de toutes les collections existantes dans le système.
- `Get collection metadata` : récupère les informations de structure d'une collection spécifiée.
- `Define collections` : permet à l'AI employee de créer des collections dans le système.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` confère à l'AI employee la capacité d'exécuter des flux de travail. Les flux de travail configurés avec un `Trigger type` défini sur `AI employee event` dans le plugin "flux de travail" seront disponibles ici comme compétences pour l'AI employee.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Les compétences du groupe Code Editor permettent principalement à l'AI employee d'interagir avec l'éditeur de code.

- `Get code snippet list` : récupère la liste des extraits de code prédéfinis.
- `Get code snippet content` : récupère le contenu d'un extrait de code spécifié.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Others

- `Chart generator` : confère à l'AI employee la capacité de générer des graphiques et de les afficher directement dans la conversation.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)