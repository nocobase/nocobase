---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Authentification : SAML 2.0

## Introduction

Le plugin Authentification : SAML 2.0 est conforme à la norme du protocole SAML 2.0 (Security Assertion Markup Language 2.0), permettant aux utilisateurs de se connecter à NocoBase en utilisant les comptes fournis par des fournisseurs de services d'authentification d'identité tiers (IdP).

## Activer le plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Ajouter une authentification SAML

Accédez à la page de gestion des plugins d'authentification utilisateur.

![](https://static-docs.nocobase.com/202411130004459.png)

Ajouter - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Configuration

![](https://static-docs.nocobase.com/976b66e588973c322d81dcddd22c6146.png)

- SSO URL - Fournie par l'IdP, utilisée pour l'authentification unique (SSO).
- Certificat public - Fourni par l'IdP.
- ID d'entité (Émetteur IdP) - Facultatif, fourni par l'IdP.
- http - Si votre application NocoBase utilise le protocole HTTP, veuillez cocher cette case.
- Utiliser ce champ pour lier l'utilisateur - Ce champ est utilisé pour faire correspondre et lier les utilisateurs existants. Vous pouvez choisir l'e-mail ou le nom d'utilisateur ; l'e-mail est la valeur par défaut. Les informations utilisateur transmises par l'IdP doivent contenir le champ `email` ou `username`.
- Inscription automatique si l'utilisateur n'existe pas - Permet de créer automatiquement un nouvel utilisateur si aucun utilisateur existant correspondant n'est trouvé.
- Utilisation - `SP Issuer / EntityID` et `ACS URL` doivent être copiés et renseignés dans la configuration correspondante de l'IdP.

## Mappage des champs

Le mappage des champs doit être configuré sur la plateforme de configuration de l'IdP. Vous pouvez vous référer à l'[exemple](./examples/google.md).

Les champs disponibles pour le mappage dans NocoBase sont :

- email (obligatoire)
- phone (uniquement effectif pour les IdP qui prennent en charge le champ `phone` dans leur portée, comme Alibaba Cloud ou Feishu)
- nickname
- username
- firstName
- lastName

`nameID` est transmis par le protocole SAML et n'a pas besoin d'être mappé ; il sera enregistré comme identifiant unique de l'utilisateur.
La priorité des règles d'utilisation du surnom pour les nouveaux utilisateurs est : `nickname` > `firstName lastName` > `username` > `nameID`
Actuellement, le mappage des organisations et des rôles des utilisateurs n'est pas pris en charge.

## Connexion

Accédez à la page de connexion et cliquez sur le bouton sous le formulaire de connexion pour lancer l'authentification tierce.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)