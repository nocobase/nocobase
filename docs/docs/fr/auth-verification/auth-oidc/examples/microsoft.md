:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Ajouter un authentificateur dans NocoBase

Pour commencer, ajoutez un nouvel authentificateur dans NocoBase : Paramètres des plugins - Authentification utilisateur - Ajouter - OIDC.

Copiez l'URL de rappel.

![](https://static-docs.nocobase.com/202412021504114.png)

## Enregistrer l'application

Ouvrez le centre d'administration Microsoft Entra et enregistrez une nouvelle application.

![](https://static-docs.nocobase.com/202412021506837.png)

Collez ici l'URL de rappel que vous venez de copier.

![](https://static-docs.nocobase.com/202412021520696.png)

## Obtenir et renseigner les informations correspondantes

Cliquez sur l'application que vous venez d'enregistrer et copiez l'**ID d'application (client)** et l'**ID de répertoire (locataire)** depuis la page d'aperçu.

![](https://static-docs.nocobase.com/202412021522063.png)

Cliquez sur `Certificates & secrets`, créez un nouveau secret client et copiez la **Valeur**.

![](https://static-docs.nocobase.com/202412021522846.png)

La correspondance entre les informations Microsoft Entra et la configuration de l'authentificateur NocoBase est la suivante :

| Informations Microsoft Entra | Configuration de l'authentificateur NocoBase                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID d'application (client)    | Client ID                                                                                                                                                               |
| Secrets client - Valeur      | Secret client                                                                                                                                                           |
| ID de répertoire (locataire) | Émetteur :<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, remplacez `{tenant}` par l'ID de répertoire (locataire) correspondant. |