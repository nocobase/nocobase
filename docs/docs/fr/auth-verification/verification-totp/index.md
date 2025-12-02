---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vérification : Authentificateur TOTP

## Introduction

L'authentificateur TOTP permet aux utilisateurs de lier tout authentificateur conforme à la spécification TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), et d'effectuer une vérification d'identité à l'aide d'un mot de passe à usage unique basé sur le temps (TOTP).

## Configuration administrateur

Accédez à la page de gestion des vérifications.

![](https://static-docs.nocobase.com/202502271726791.png)

Ajouter - Authentificateur TOTP

![](https://static-docs.nocobase.com/202502271745028.png)

L'authentificateur TOTP ne nécessite aucune configuration supplémentaire, à l'exception d'un identifiant unique et d'un titre.

![](https://static-docs.nocobase.com/202502271746034.png)

## Association utilisateur

Après avoir ajouté l'authentificateur, les utilisateurs peuvent associer l'authentificateur TOTP dans la section de gestion des vérifications de leur espace personnel.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Le plugin ne propose pas actuellement de mécanisme de code de récupération. Une fois l'authentificateur TOTP associé, nous vous conseillons de le conserver en lieu sûr. En cas de perte accidentelle de l'authentificateur, vous pouvez utiliser une autre méthode de vérification pour confirmer votre identité, puis le dissocier et le réassocier.
:::

## Dissociation utilisateur

La dissociation de l'authentificateur nécessite une vérification à l'aide de la méthode de vérification déjà associée.

![](https://static-docs.nocobase.com/202502282103205.png)