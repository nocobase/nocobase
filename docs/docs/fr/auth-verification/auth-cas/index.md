---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Authentification : CAS

## Introduction

Le plugin Authentification : CAS suit la norme du protocole CAS (Central Authentication Service). Il permet aux utilisateurs de se connecter à NocoBase en utilisant les comptes fournis par des fournisseurs de services d'authentification d'identité tiers (IdP).

## Installation

## Manuel d'utilisation

### Activer le plugin

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Ajouter l'authentification CAS

Accédez à la page de gestion de l'authentification des utilisateurs

http://localhost:13000/admin/settings/auth/authenticators

Ajoutez une méthode d'authentification CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Configurez CAS et activez-le

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Accédez à la page de connexion

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)