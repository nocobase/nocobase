---
pkg: '@nocobase/plugin-verification'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Vérification : SMS

## Introduction

Le code de vérification SMS est un type de vérification intégré qui permet de générer un mot de passe à usage unique (OTP) et de l'envoyer à l'utilisateur par SMS.

## Ajouter un vérificateur SMS

Accédez à la page de gestion des vérifications.

![](https://static-docs.nocobase.com/202502271726791.png)

Ajouter - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Configuration administrateur

![](https://static-docs.nocobase.com/202502271727711.png)

Actuellement, les fournisseurs de services SMS pris en charge sont :

- <a href="https://www.aliyun.com/product/sms" target="_blank">SMS Aliyun</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">SMS Tencent Cloud</a>

Lorsque vous configurez le modèle SMS dans le panneau d'administration du fournisseur de services, vous devez réserver un paramètre pour le code de vérification SMS.

- Exemple de configuration Aliyun : `Votre code de vérification est : ${code}`

- Exemple de configuration Tencent Cloud : `Votre code de vérification est : {1}`

Les développeurs peuvent également étendre la prise en charge d'autres fournisseurs de services SMS sous forme de plugins. Consultez : [Étendre les fournisseurs de services SMS](./dev/sms-type)

## Association par l'utilisateur

Après avoir ajouté le vérificateur, les utilisateurs peuvent associer un numéro de téléphone pour la vérification dans leur gestion de vérification personnelle.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Une fois l'association réussie, vous pouvez effectuer une vérification d'identité dans tout scénario qui utilise ce vérificateur.

![](https://static-docs.nocobase.com/202502271739607.png)

## Désassociation par l'utilisateur

La désassociation d'un numéro de téléphone nécessite une vérification via une méthode de vérification déjà associée.

![](https://static-docs.nocobase.com/202502282103205.png)