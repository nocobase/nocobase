---
pkg: "@nocobase/plugin-verification"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



pkg: '@nocobase/plugin-verification'
---

# Vérification

:::info{title=Note}
À partir de `1.6.0-alpha.30`, la fonctionnalité originale de **code de vérification** a été mise à niveau vers la **Gestion de la vérification**, qui prend en charge la gestion et l'intégration de diverses méthodes de vérification d'identité utilisateur. Une fois que les utilisateurs ont lié la méthode de vérification correspondante, ils peuvent effectuer une vérification d'identité lorsque cela est nécessaire. Cette fonctionnalité devrait être prise en charge de manière stable à partir de la version `1.7.0`.
:::



## Introduction

**Le Centre de gestion de la vérification prend en charge la gestion et l'intégration de diverses méthodes de vérification d'identité utilisateur.** Par exemple :

- Code de vérification par SMS – Fourni par défaut par le **plugin** de vérification. Référez-vous à : [Vérification : SMS](./sms)
- Authentificateur TOTP – Référez-vous à : [Vérification : Authentificateur TOTP](../verification-totp/)

Les développeurs peuvent également étendre d'autres types de vérification sous forme de **plugins**. Référez-vous à : [Extension des types de vérification](./dev/type)

**Les utilisateurs peuvent effectuer une vérification d'identité lorsque cela est nécessaire après avoir lié la méthode de vérification correspondante.** Par exemple :

- Connexion par code de vérification SMS – Référez-vous à : [Authentification : SMS](./sms)
- Authentification à deux facteurs (2FA) – Référez-vous à : [Authentification à deux facteurs (2FA)](../2fa)
- Vérification secondaire pour les opérations à risque – Prise en charge future

Les développeurs peuvent également intégrer la vérification d'identité dans d'autres scénarios nécessaires en étendant les **plugins**. Référez-vous à : [Extension des scénarios de vérification](./dev/scene)

**Différences et relations entre le module de vérification et le module d'authentification utilisateur :** Le module d'authentification utilisateur est principalement responsable de l'authentification d'identité dans les scénarios de connexion utilisateur, où les processus tels que la connexion par SMS et l'authentification à deux facteurs dépendent des vérificateurs fournis par le module de vérification. Le module de vérification, quant à lui, gère la vérification d'identité pour diverses opérations à risque élevé, la connexion utilisateur étant l'un de ces scénarios.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)