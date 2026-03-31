---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Authentification par SMS

## Introduction

Le plugin d'authentification par SMS permet aux utilisateurs de s'inscrire et de se connecter à NocoBase via SMS.

> Ce plugin doit être utilisé conjointement avec la fonctionnalité de code de vérification par SMS fournie par le [plugin `@nocobase/plugin-verification`](/auth-verification/verification/).

## Ajouter l'authentification par SMS

Accédez à la page de gestion des plugins d'authentification utilisateur.

![](https://static-docs.nocobase.com/202502282112517.png)

Ajouter - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Configuration de la nouvelle version

:::info{title=Note}
La nouvelle configuration a été introduite à partir de la version `1.6.0-alpha.30` et son support stable est prévu à partir de la version `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Vérificateur :** Liez un vérificateur SMS pour envoyer des codes de vérification par SMS. Si aucun vérificateur n'est disponible, vous devez d'abord vous rendre sur la page de gestion des vérifications pour en créer un.
Voir aussi :

- [Vérification](../verification/index.md)
- [Vérification : SMS](../verification/sms/index.md)

**Inscription automatique si l'utilisateur n'existe pas :** Lorsque cette option est cochée, si le numéro de téléphone utilisé par l'utilisateur n'existe pas, un nouvel utilisateur sera enregistré en utilisant ce numéro de téléphone comme pseudonyme.

## Configuration de l'ancienne version

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

La fonctionnalité d'authentification par SMS utilisera le fournisseur de codes de vérification SMS configuré et défini par défaut pour envoyer les messages.

**Inscription automatique si l'utilisateur n'existe pas :** Lorsque cette option est cochée, si le numéro de téléphone utilisé par l'utilisateur n'existe pas, un nouvel utilisateur sera enregistré en utilisant ce numéro de téléphone comme pseudonyme.

## Connexion

Accédez à la page de connexion pour l'utiliser.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)