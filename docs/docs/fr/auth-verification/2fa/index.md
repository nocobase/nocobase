---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Authentification à deux facteurs (2FA)

## Introduction

L'authentification à deux facteurs (2FA) est une mesure de sécurité supplémentaire que vous utilisez lorsque vous vous connectez à une application. Lorsque la 2FA est activée, en plus de votre mot de passe, vous devrez fournir une autre méthode d'authentification, comme un code OTP ou un TOTP.

:::info{title=Note}
Actuellement, le processus d'authentification à deux facteurs (2FA) ne s'applique qu'aux connexions par mot de passe. Si votre application utilise le SSO ou d'autres méthodes d'authentification, veuillez plutôt utiliser les mesures de protection d'authentification multifacteur (MFA) fournies par l'IdP (fournisseur d'identité) correspondant.
:::

## Activer le plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Configuration administrateur

Une fois le plugin activé, une sous-page de configuration 2FA sera ajoutée à la page de gestion des authentificateurs.

En tant qu'administrateur, vous devrez cocher l'option « Activer l'authentification à deux facteurs (2FA) pour tous les utilisateurs » et choisir un type d'authentificateur disponible à lier. Si aucun authentificateur n'est disponible, vous devrez d'abord en créer un nouveau sur la page de gestion de la vérification. Consultez la section [Vérification](../verification/index.md) pour plus de détails.

![](https://static-docs.nocobase.com/202502282109802.png)

## Connexion utilisateur

Une fois la 2FA activée, lorsque vous vous connecterez avec votre mot de passe, vous entrerez dans le processus de vérification 2FA.

Si vous n'avez pas encore lié d'authentificateur spécifique, il vous sera demandé d'en lier un. Une fois cette liaison effectuée avec succès, vous pourrez accéder à l'application.

![](https://static-docs.nocobase.com/202502282110829.png)

Si vous avez déjà lié un authentificateur spécifique, il vous sera demandé de vérifier votre identité à l'aide de cet authentificateur. Une fois la vérification réussie, vous pourrez accéder à l'application.

![](https://static-docs.nocobase.com/202502282110148.png)

Après vous être connecté, vous pourrez lier d'autres authentificateurs sur la page de gestion de la vérification de votre centre personnel.

![](https://static-docs.nocobase.com/202502282110024.png)