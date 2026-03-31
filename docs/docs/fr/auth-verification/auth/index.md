:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Authentification des utilisateurs

Le module d'authentification des utilisateurs de NocoBase se compose principalement de deux parties :

- Le module `@nocobase/auth` au sein du noyau définit les interfaces extensibles et les middlewares liés à l'authentification des utilisateurs (connexion, enregistrement, vérification, etc.), et est également utilisé pour enregistrer et gérer diverses méthodes d'authentification étendues.
- Le plugin `@nocobase/plugin-auth` est utilisé pour initialiser le module de gestion de l'authentification dans le noyau, et fournit également la méthode d'authentification de base par nom d'utilisateur (ou e-mail) / mot de passe.

> Il doit être utilisé conjointement avec la fonctionnalité de gestion des utilisateurs fournie par le [`plugin @nocobase/plugin-users`](/users-permissions/user).

En outre, NocoBase propose également d'autres plugins pour diverses méthodes d'authentification des utilisateurs :

- [`@nocobase/plugin-auth-sms`](/auth-verification/auth-sms/) - Fournit la fonction de connexion par vérification SMS
- [`@nocobase/plugin-auth-saml`](/auth-verification/auth-saml/) - Fournit la fonction de connexion SSO SAML
- [`@nocobase/plugin-auth-oidc`](/auth-verification/auth-oidc/) - Fournit la fonction de connexion SSO OIDC
- [`@nocobase/plugin-auth-cas`](/auth-verification/auth-cas/) - Fournit la fonction de connexion SSO CAS
- [`@nocobase/plugin-auth-ldap`](/auth-verification/auth-ldap/) - Fournit la fonction de connexion SSO LDAP
- [`@nocobase/plugin-auth-wecom`](/auth-verification/auth-wecom/) - Fournit la fonction de connexion WeCom
- [`@nocobase/plugin-auth-dingtalk`](/auth-verification/auth-dingtalk/) - Fournit la fonction de connexion DingTalk

Grâce aux plugins ci-dessus, une fois que l'administrateur a configuré la méthode d'authentification correspondante, les utilisateurs peuvent se connecter directement au système en utilisant l'identité utilisateur fournie par des plateformes telles que Google Workspace, Microsoft Azure, et peuvent également s'intégrer à des outils de plateforme comme Auth0, Logto, Keycloak. En outre, les développeurs peuvent également étendre facilement d'autres méthodes d'authentification dont ils ont besoin grâce aux interfaces de base que nous fournissons.