---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Procédure de Configuration

## Vue d'ensemble
Une fois le plugin d'e-mail activé, les administrateurs doivent d'abord finaliser sa configuration pour que les utilisateurs puissent connecter leurs comptes de messagerie à NocoBase. (Actuellement, seule la connexion par autorisation pour les comptes Outlook et Gmail est prise en charge ; la connexion directe avec les comptes Microsoft et Google n'est pas encore disponible).

Le cœur de la configuration réside dans les paramètres d'authentification des appels d'API des fournisseurs de services de messagerie. Pour assurer le bon fonctionnement du plugin, les administrateurs doivent suivre les étapes suivantes :

1.  **Obtenez les informations d'authentification auprès du fournisseur de services**
    -   Connectez-vous à la console développeur de votre fournisseur de services de messagerie (par exemple, Google Cloud Console ou Microsoft Azure Portal).
    -   Créez une nouvelle application ou un nouveau projet et activez le service API Gmail ou Outlook.
    -   Obtenez l'ID client (Client ID) et le Secret client (Client Secret) correspondants.
    -   Configurez l'URI de redirection pour qu'il corresponde à l'adresse de rappel du plugin NocoBase.

2.  **Configuration du fournisseur de services de messagerie**
    -   Accédez à la page de configuration du plugin d'e-mail.
    -   Fournissez les informations d'authentification API nécessaires, notamment l'ID client (Client ID) et le Secret client (Client Secret), afin de garantir une intégration d'autorisation correcte avec le fournisseur de services de messagerie.

3.  **Connexion par autorisation**
    -   Les utilisateurs se connectent à leurs comptes de messagerie via le protocole OAuth.
    -   Le plugin générera et stockera automatiquement le jeton d'autorisation de l'utilisateur pour les appels d'API et les opérations de messagerie ultérieurs.

4.  **Connexion des comptes de messagerie**
    -   Après une autorisation réussie, le compte de messagerie de l'utilisateur sera connecté à NocoBase.
    -   Le plugin synchronisera les données de messagerie de l'utilisateur et offrira des fonctionnalités de gestion, d'envoi et de réception d'e-mails.

5.  **Utilisation des fonctionnalités d'e-mail**
    -   Les utilisateurs peuvent consulter, gérer et envoyer des e-mails directement depuis la plateforme.
    -   Toutes les opérations sont effectuées via les appels d'API du fournisseur de services de messagerie, garantissant une synchronisation en temps réel et une transmission efficace.

Grâce à ce processus, le plugin d'e-mail de NocoBase vous offre des services de gestion d'e-mails efficaces et sécurisés. Si vous rencontrez des problèmes lors de la configuration, veuillez consulter la documentation pertinente ou contacter l'équipe de support technique pour obtenir de l'aide.

## Configuration du plugin

### Activation du plugin d'e-mail

1.  Accédez à la page de gestion des plugins.
2.  Recherchez le plugin "Email manager" et activez-le.

### Configuration du fournisseur de services de messagerie

Une fois le plugin d'e-mail activé, vous pouvez configurer les fournisseurs de services de messagerie. Actuellement, les services de messagerie Google et Microsoft sont pris en charge. Pour accéder à la page de configuration, cliquez sur "Paramètres" -> "Paramètres d'e-mail" dans la barre supérieure.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Pour chaque fournisseur de services, vous devrez renseigner l'ID client (Client ID) et le Secret client (Client Secret). Les sections suivantes détaillent comment obtenir ces deux paramètres.