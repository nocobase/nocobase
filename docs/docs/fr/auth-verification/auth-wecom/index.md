---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Authentification : WeCom

## Introduction

Le **plugin** WeCom permet aux utilisateurs de se connecter à NocoBase avec leur compte WeCom.

## Activer le plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Créer et configurer une application WeCom personnalisée

Accédez à la console d'administration WeCom pour créer une application personnalisée.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Cliquez sur l'application pour accéder à sa page de détails, faites défiler la page vers le bas et cliquez sur « Connexion autorisée WeCom ».

![](https://static-docs.nocobase.com/202406272104655.png)

Définissez le domaine de rappel autorisé sur le domaine de votre application NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Revenez à la page de détails de l'application et cliquez sur « Autorisation Web et JS-SDK ».

![](https://static-docs.nocobase.com/202406272107063.png)

Définissez et vérifiez le domaine de rappel pour la fonctionnalité d'autorisation Web OAuth2.0 de l'application.

![](https://static-docs.nocobase.com/202406272107899.png)

Sur la page de détails de l'application, cliquez sur « IP d'entreprise de confiance ».

![](https://static-docs.nocobase.com/202406272108834.png)

Configurez l'adresse IP de l'application NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Obtenir les identifiants depuis la console d'administration WeCom

Dans la console d'administration WeCom, sous « Mon entreprise », copiez l'« ID d'entreprise ».

![](https://static-docs.nocobase.com/202406272111637.png)

Dans la console d'administration WeCom, sous « Gestion des applications », accédez à la page de détails de l'application créée à l'étape précédente et copiez l'AgentId et le Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Ajouter l'authentification WeCom dans NocoBase

Accédez à la page de gestion des **plugins** d'authentification utilisateur.

![](https://static-docs.nocobase.com/202406272115044.png)

Ajouter - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Configuration

![](https://static-docs.nocobase.com/202412041459250.png)

| Option                                                                                                | Description                                                                                                                                                                                   | Version requise |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Si un numéro de téléphone ne correspond pas à un utilisateur existant, <br />faut-il créer automatiquement un nouvel utilisateur ? | Lorsque le numéro de téléphone ne correspond pas à un utilisateur existant, indique si un nouvel utilisateur doit être créé automatiquement.                                                 | -        |
| ID d'entreprise                                                                                            | ID d'entreprise, obtenu depuis la console d'administration WeCom.                                                                                                                                  | -        |
| AgentId                                                                                               | Obtenu depuis la configuration de l'application personnalisée dans la console d'administration WeCom.                                                                 | -        |
| Secret                                                                                                | Obtenu depuis la configuration de l'application personnalisée dans la console d'administration WeCom.                                                                 | -        |
| Origine                                                                                                | Le domaine de l'application actuelle.                                                                                       | -        |
| Lien de redirection de l'application du poste de travail                                                                   | Le chemin de l'application vers lequel rediriger après une connexion réussie.                                                                           | `v1.4.0` |
| Connexion automatique                                                                                       | Connectez-vous automatiquement lorsque le lien de l'application est ouvert dans le navigateur WeCom. Si plusieurs authentificateurs WeCom sont configurés, un seul peut avoir cette option activée. | `v1.4.0` |
| Lien de la page d'accueil de l'application du poste de travail                                                                   | Lien de la page d'accueil de l'application du poste de travail.                                                                                 | -        |

## Configurer la page d'accueil de l'application WeCom

:::info
Pour les versions `v1.4.0` et supérieures, lorsque l'option « Connexion automatique » est activée, le lien de la page d'accueil de l'application peut être simplifié en : `https://<url>/<path>`, par exemple `https://example.nocobase.com/admin`.

Vous pouvez également configurer des liens distincts pour les versions mobile et de bureau, par exemple `https://example.nocobase.com/m` et `https://example.nocobase.com/admin`.
:::

Accédez à la console d'administration WeCom et collez le lien de la page d'accueil de l'application du poste de travail que vous avez copié dans le champ d'adresse de la page d'accueil de l'application correspondante.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Connexion

Visitez la page de connexion et cliquez sur le bouton sous le formulaire de connexion pour initier une connexion tierce.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
En raison des restrictions d'autorisation de WeCom sur les informations sensibles telles que les numéros de téléphone, l'autorisation ne peut être effectuée qu'à l'intérieur du client WeCom. Lors de votre première connexion avec WeCom, veuillez suivre les étapes ci-dessous pour effectuer l'autorisation de connexion initiale dans le client WeCom.
:::

## Première connexion

Depuis le client WeCom, accédez au poste de travail, faites défiler vers le bas et cliquez sur l'application pour accéder à la page d'accueil que vous avez configurée précédemment. Cela complétera l'autorisation initiale. Ensuite, vous pourrez utiliser WeCom pour vous connecter à votre application NocoBase.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />