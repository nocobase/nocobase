---
pkg: '@nocobase/plugin-notification-in-app-message'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Notification : Message intégré à l'application

## Introduction

Permet aux utilisateurs de recevoir des notifications de message en temps réel directement au sein de l'application NocoBase.

## Installation

Ce plugin est un plugin intégré, aucune installation supplémentaire n'est donc requise.

## Ajout d'un canal de message intégré à l'application

Accédez à la gestion des notifications, cliquez sur le bouton Ajouter et sélectionnez Message intégré à l'application.
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Saisissez le nom et la description du canal, puis cliquez sur Soumettre.
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

Le nouveau canal apparaîtra alors dans la liste.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Exemple de cas d'utilisation

Pour vous aider à mieux comprendre comment utiliser les messages intégrés à l'application, voici un exemple de « Suivi des pistes marketing ».

Imaginez que votre équipe mène une campagne marketing majeure visant à suivre les retours et les besoins des clients potentiels. En utilisant les messages intégrés à l'application, vous pouvez :

**Créer un canal de notification** : Tout d'abord, dans la gestion des notifications, configurez un canal de message intégré à l'application nommé « Marketing Clue » pour vous assurer que les membres de l'équipe peuvent clairement identifier son objectif.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Configurer un flux de travail** : Créez un flux de travail qui déclenche automatiquement une notification lorsqu'une nouvelle piste marketing est générée. Vous pouvez ajouter un nœud de notification au flux de travail, sélectionner le canal « Marketing Clue » que vous avez créé et configurer le contenu du message selon vos besoins. Par exemple :

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Recevoir des notifications en temps réel** : Une fois le flux de travail déclenché, tout le personnel concerné recevra des notifications en temps réel, garantissant que l'équipe peut réagir et agir rapidement.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Gestion et suivi des messages** : Les messages intégrés à l'application sont regroupés par nom de canal. Vous pouvez filtrer les messages par leur statut lu ou non lu pour consulter rapidement les informations importantes. Cliquer sur le bouton « Voir » vous redirigera vers la page de lien configurée pour une action ultérieure.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)