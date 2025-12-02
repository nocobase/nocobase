:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Intégration de l'authentification unique (SSO)

NocoBase propose des solutions complètes d'authentification unique (SSO), prenant en charge plusieurs protocoles d'authentification courants pour une intégration fluide avec vos systèmes d'identité d'entreprise existants.

## Présentation

L'authentification unique (SSO) permet aux utilisateurs d'accéder à plusieurs systèmes liés mais indépendants avec un seul ensemble d'identifiants. Vous vous connectez une seule fois et accédez à toutes les applications autorisées sans avoir à saisir vos nom d'utilisateur et mot de passe à plusieurs reprises. Cela améliore non seulement l'expérience utilisateur, mais renforce également la sécurité du système et l'efficacité administrative.

## Protocoles d'authentification pris en charge

NocoBase prend en charge les protocoles et méthodes d'authentification suivants via des **plugins** :

### Protocoles SSO d'entreprise

- **[SAML 2.0](/auth-verification/auth-saml/)** : Un standard ouvert basé sur XML, largement utilisé pour l'authentification d'identité en entreprise. Idéal pour l'intégration avec les fournisseurs d'identité (IdP) d'entreprise.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)** : Une couche d'authentification moderne basée sur OAuth 2.0, offrant des mécanismes d'authentification et d'autorisation. Prend en charge l'intégration avec les principaux fournisseurs d'identité (comme Google, Azure AD, etc.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)** : Protocole SSO développé par l'Université de Yale, largement adopté dans les établissements d'enseignement supérieur.

- **[LDAP](/auth-verification/auth-ldap/)** : Protocole léger d'accès aux annuaires, utilisé pour accéder et maintenir les services d'information d'annuaire distribués. Convient aux scénarios nécessitant une intégration avec Active Directory ou d'autres serveurs LDAP.

### Authentification via des plateformes tierces

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)** : Prend en charge la connexion par code QR WeCom et l'authentification transparente au sein de l'application.

- **[DingTalk](/auth-verification/auth-dingtalk/)** : Prend en charge la connexion par code QR DingTalk et l'authentification transparente au sein de l'application.

### Autres méthodes d'authentification

- **[Vérification par SMS](/auth-verification/auth-sms/)** : Authentification par code de vérification envoyé par SMS sur téléphone mobile.

- **[Nom d'utilisateur/Mot de passe](/auth-verification/auth/)** : La méthode d'authentification de base intégrée à NocoBase.

## Étapes d'intégration

### 1. Installer le **plugin** d'authentification

Selon vos besoins, trouvez et installez le **plugin** d'authentification approprié depuis le gestionnaire de **plugins**. La plupart des **plugins** d'authentification SSO nécessitent un achat ou un abonnement séparé.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Par exemple, installez le **plugin** d'authentification SAML 2.0 :

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Ou installez le **plugin** d'authentification OIDC :

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Configurer la méthode d'authentification

1. Accédez à la page **Paramètres système > Authentification utilisateur**.

![](https://static-docs.nocobase.com/202411130004459.png)

2. Cliquez sur **Ajouter une méthode d'authentification**.
3. Sélectionnez le type d'authentification installé (par exemple, SAML).

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Ou sélectionnez OIDC :

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Configurez les paramètres requis comme indiqué.

### 3. Configurer le fournisseur d'identité

Chaque protocole d'authentification nécessite une configuration spécifique du fournisseur d'identité :

- **SAML** : Configurez les métadonnées IdP, les certificats, etc.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC** : Configurez l'ID client, le secret client, le point de terminaison de découverte, etc.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS** : Configurez l'adresse du serveur CAS.
- **LDAP** : Configurez l'adresse du serveur LDAP, le DN de liaison, etc.
- **WeCom/DingTalk** : Configurez les identifiants de l'application, l'ID d'entreprise, etc.

### 4. Tester l'authentification

Une fois la configuration terminée, nous vous recommandons d'effectuer un test de connexion :

1. Déconnectez-vous de la session actuelle.
2. Sur la page de connexion, sélectionnez la méthode SSO que vous avez configurée.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Terminez le processus d'authentification du fournisseur d'identité.
4. Vérifiez que vous pouvez vous connecter avec succès à NocoBase.

## Mappage des utilisateurs et attribution des rôles

Après une authentification SSO réussie, NocoBase gère automatiquement les comptes utilisateurs :

- **Première connexion** : Un nouveau compte utilisateur est automatiquement créé et les informations de base (nom d'utilisateur, e-mail, etc.) sont synchronisées depuis le fournisseur d'identité.
- **Connexions ultérieures** : Le compte existant est utilisé ; vous pouvez choisir de synchroniser ou non les informations utilisateur mises à jour.
- **Attribution de rôles** : Vous pouvez configurer des rôles par défaut ou attribuer automatiquement des rôles en fonction des attributs utilisateur provenant du fournisseur d'identité.

## Recommandations de sécurité

1. **Utilisez HTTPS** : Assurez-vous que NocoBase est déployé dans un environnement HTTPS pour protéger la transmission des données d'authentification.
2. **Mises à jour régulières des certificats** : Mettez à jour et renouvelez rapidement les identifiants de sécurité tels que les certificats SAML.
3. **Configurez la liste blanche des URL de rappel** : Configurez correctement les URL de rappel de NocoBase chez le fournisseur d'identité.
4. **Principe du moindre privilège** : Attribuez des rôles et des permissions appropriés aux utilisateurs SSO.
5. **Activez la journalisation d'audit** : Enregistrez et surveillez les activités de connexion SSO.

## Dépannage

### Échec de la connexion SSO ?

1. Vérifiez que la configuration du fournisseur d'identité est correcte.
2. Assurez-vous que les URL de rappel sont correctement configurées.
3. Consultez les journaux de NocoBase pour obtenir des messages d'erreur détaillés.
4. Confirmez que les certificats et les clés sont valides.

### Les informations utilisateur ne se synchronisent pas ?

1. Vérifiez les attributs utilisateur renvoyés par le fournisseur d'identité.
2. Vérifiez que la configuration du mappage des champs est correcte.
3. Confirmez que l'option de synchronisation des informations utilisateur est activée.

### Comment prendre en charge plusieurs méthodes d'authentification ?

NocoBase prend en charge la configuration simultanée de plusieurs méthodes d'authentification. Les utilisateurs peuvent choisir leur méthode préférée sur la page de connexion.

## Ressources associées

- [Documentation sur l'authentification](/auth-verification/auth/)
- [Authentification par clés API](/integration/api-keys/)
- [Gestion des utilisateurs et des permissions](/plugins/@nocobase/plugin-users/)