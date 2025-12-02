---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Copie Carbone <Badge>v1.8.2+</Badge>

## Introduction

Le nœud Copie Carbone permet d'envoyer certains contenus contextuels du processus d'exécution du flux de travail à des utilisateurs spécifiques pour leur information et consultation. Par exemple, dans un processus d'approbation ou autre, vous pouvez envoyer des informations pertinentes en copie carbone à d'autres participants afin qu'ils soient tenus informés de l'avancement du travail.

Vous pouvez configurer plusieurs nœuds Copie Carbone dans un flux de travail. Lorsqu'un flux de travail atteint ce nœud, les informations pertinentes sont envoyées aux destinataires spécifiés.

Le contenu envoyé en copie carbone s'affiche dans le menu « CC pour moi » du Centre des tâches, où les utilisateurs peuvent consulter tous les éléments qui leur ont été copiés. Le système signalera également les contenus non lus, et les utilisateurs pourront les marquer comme lus manuellement après consultation.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Copie Carbone » :

![Ajouter une Copie Carbone](https://static-docs.nocobase.com/20250710222842.png)

## Configuration du nœud

![Configuration du nœud](https://static-docs.nocobase.com/20250710224041.png)

Dans l'interface de configuration du nœud, vous pouvez définir les paramètres suivants :

### Destinataires

Les destinataires sont la collection d'utilisateurs cibles pour la copie carbone, qui peut être un ou plusieurs utilisateurs. La source peut être une valeur statique sélectionnée dans la liste des utilisateurs, une valeur dynamique spécifiée par une variable, ou le résultat d'une requête sur la collection d'utilisateurs.

![Configuration des destinataires](https://static-docs.nocobase.com/20250710224421.png)

### Interface utilisateur

Les destinataires doivent consulter le contenu envoyé en copie carbone dans le menu « CC pour moi » du Centre des tâches. Vous pouvez configurer les résultats du déclencheur et de n'importe quel nœud dans le contexte du flux de travail comme blocs de contenu.

![Interface utilisateur](https://static-docs.nocobase.com/20250710225400.png)

### Titre de la tâche

Le titre de la tâche est le titre affiché dans le Centre des tâches. Vous pouvez utiliser des variables du contexte du flux de travail pour générer dynamiquement le titre.

![Titre de la tâche](https://static-docs.nocobase.com/20250710225603.png)

## Centre des tâches

Les utilisateurs peuvent consulter et gérer tous les contenus qui leur ont été envoyés en copie carbone dans le Centre des tâches, et les filtrer et les afficher en fonction de leur statut de lecture.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Après consultation, vous pouvez marquer un élément comme lu, et le nombre d'éléments non lus diminuera en conséquence.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)