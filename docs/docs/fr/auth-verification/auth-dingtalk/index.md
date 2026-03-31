---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Authentification : DingTalk

## Introduction

Le plugin Authentification : DingTalk permet aux utilisateurs de se connecter à NocoBase en utilisant leur compte DingTalk.

## Activer le plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Demander des autorisations d'API sur la console développeur DingTalk

Consultez la page <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Plateforme ouverte DingTalk - Implémenter la connexion à des sites tiers</a> pour créer une application.

Accédez à la console de gestion de l'application et activez les options « Informations sur le numéro de téléphone personnel » et « Autorisation de lecture des informations personnelles du carnet d'adresses ».

![](https://static-docs.nocobase.com/202406120006620.png)

## Récupérer les identifiants depuis la console développeur DingTalk

Copiez le Client ID et le Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Ajouter l'authentification DingTalk sur NocoBase

Accédez à la page de gestion des plugins d'authentification utilisateur.

![](https://static-docs.nocobase.com/202406112348051.png)

Ajouter - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Configuration

![](https://static-docs.nocobase.com/202406120016896.png)

- **Inscription automatique si l'utilisateur n'existe pas** : Indique si un nouvel utilisateur doit être créé automatiquement lorsqu'aucun utilisateur existant ne correspond au numéro de téléphone.
- **Client ID et Client Secret** : Saisissez les informations copiées à l'étape précédente.
- **URL de redirection** : Il s'agit de l'URL de rappel. Copiez-la et passez à l'étape suivante.

## Configurer l'URL de rappel dans la console développeur DingTalk

Collez l'URL de rappel copiée dans la console développeur DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Connexion

Accédez à la page de connexion et cliquez sur le bouton situé sous le formulaire de connexion pour lancer la connexion via un service tiers.

![](https://static-docs.nocobase.com/202406120014539.png)