:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Intégration

## Vue d'ensemble

NocoBase offre des capacités d'intégration complètes, vous permettant de vous connecter en toute transparence à des systèmes externes, des services tiers et diverses sources de données. Grâce à des méthodes d'intégration flexibles, vous pouvez étendre les fonctionnalités de NocoBase pour répondre à des besoins métier variés.

## Méthodes d'intégration

### Intégration API

NocoBase met à votre disposition de puissantes capacités API pour l'intégration avec des applications et services externes :

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Clés API](/integration/api-keys/)** : Utilisez des clés API pour une authentification sécurisée et un accès programmatique aux ressources NocoBase.
- **[Documentation API](/integration/api-doc/)** : Une documentation API intégrée pour explorer et tester les points de terminaison.

### Authentification unique (SSO)

Intégrez-vous aux systèmes d'identité d'entreprise pour une authentification unifiée :

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Intégration SSO](/integration/sso/)** : Prise en charge de l'authentification SAML, OIDC, CAS, LDAP et des plateformes tierces.
- Gestion centralisée des utilisateurs et contrôle d'accès.
- Expérience d'authentification fluide entre les systèmes.

### Intégration de flux de travail

Connectez les flux de travail NocoBase à des systèmes externes :

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook de flux de travail](/integration/workflow-webhook/)** : Recevez des événements de systèmes externes pour déclencher des flux de travail.
- **[Requête HTTP de flux de travail](/integration/workflow-http-request/)** : Envoyez des requêtes HTTP à des API externes depuis des flux de travail.
- Automatisez les processus métier sur différentes plateformes.

### Sources de données externes

Connectez-vous à des bases de données et systèmes de données externes :

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Bases de données externes](/data-sources/)** : Connectez-vous directement aux bases de données MySQL, PostgreSQL, MariaDB, MSSQL, Oracle et KingbaseES.
- NocoBase reconnaît les structures de tables de bases de données externes et vous permet d'effectuer directement des opérations CRUD sur ces données.
- Interface de gestion de données unifiée.

### Contenu intégré

Intégrez du contenu externe dans NocoBase :

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Bloc Iframe](/integration/block-iframe/)** : Intégrez des pages web et des applications externes.
- **Blocs JS** : Exécutez du code JavaScript personnalisé pour des intégrations avancées.

## Scénarios d'intégration courants

### Intégration de systèmes d'entreprise

- Connectez NocoBase à des systèmes ERP, CRM ou d'autres systèmes d'entreprise.
- Synchronisation bidirectionnelle des données.
- Automatisation des flux de travail inter-systèmes.

### Intégration de services tiers

- Interrogez le statut de paiement des passerelles de paiement, intégrez des services de messagerie ou des plateformes cloud.
- Tirez parti des API externes pour étendre les fonctionnalités.
- Créez des intégrations personnalisées à l'aide de webhooks et de requêtes HTTP.

### Intégration de données

- Connectez-vous à plusieurs sources de données.
- Agrégez les données provenant de différents systèmes.
- Créez des tableaux de bord et des rapports unifiés.

## Considérations de sécurité

Lorsque vous intégrez NocoBase à des systèmes externes, veuillez prendre en compte les meilleures pratiques de sécurité suivantes :

1.  **Utilisez HTTPS** : Utilisez toujours des connexions chiffrées pour la transmission des données.
2.  **Sécurisez les clés API** : Stockez les clés API en toute sécurité et renouvelez-les régulièrement.
3.  **Principe du moindre privilège** : N'accordez que les permissions nécessaires aux intégrations.
4.  **Journalisation d'audit** : Surveillez et enregistrez les activités d'intégration.
5.  **Validation des données** : Validez toutes les données provenant de sources externes.