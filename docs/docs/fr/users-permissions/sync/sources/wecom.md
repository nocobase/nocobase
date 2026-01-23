---
pkg: "@nocobase/plugin-wecom"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Synchroniser les données utilisateur depuis WeChat Work

## Introduction

Le **plugin** **WeChat Work** vous permet de synchroniser les données des utilisateurs et des départements depuis WeChat Work.

## Créer et configurer une application WeChat Work personnalisée

Tout d'abord, vous devez créer une application personnalisée dans la console d'administration de WeChat Work et récupérer l'**ID d'entreprise** (Corp ID), l'**AgentId** et le **Secret**.

Reportez-vous à [Authentification utilisateur - WeChat Work](/auth-verification/auth-wecom/).

## Ajouter une **source de données** de synchronisation dans NocoBase

Allez dans Utilisateurs et Permissions - Synchronisation - Ajouter, puis renseignez les informations que vous avez obtenues.

![](https://static-docs.nocobase.com/202412041251867.png)

## Configurer la synchronisation des contacts

Dans la console d'administration de WeChat Work, accédez à Sécurité et Gestion - Outils de gestion, puis cliquez sur Synchronisation des contacts.

![](https://static-docs.nocobase.com/202412041249958.png)

Configurez comme indiqué sur l'image, et définissez l'adresse IP de confiance de votre entreprise.

![](https://static-docs.nocobase.com/202412041250776.png)

Vous pouvez maintenant procéder à la synchronisation des données utilisateur.

## Configurer le serveur de réception d'événements

Si vous souhaitez que les modifications des données utilisateur et de département côté WeChat Work soient synchronisées en temps réel avec votre application NocoBase, vous pouvez effectuer des configurations supplémentaires.

Après avoir renseigné les informations de configuration précédentes, vous pouvez copier l'URL de notification de rappel des contacts.

![](https://static-docs.nocobase.com/202412041256547.png)

Collez-la dans les paramètres de WeChat Work, récupérez le Token et l'EncodingAESKey, puis finalisez la configuration de la **source de données** de synchronisation utilisateur NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)