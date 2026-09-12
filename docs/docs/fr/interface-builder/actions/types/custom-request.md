# Requête personnalisée

## Introduction

Lorsque vous avez besoin d'appeler une interface externe ou un service tiers dans un flux, vous pouvez utiliser Custom request pour déclencher une requête HTTP personnalisée. Les scénarios d'utilisation courants comprennent :

* Appeler des API de systèmes externes (CRM, services d'IA, etc.)
* Récupérer des données distantes pour les traiter dans les étapes suivantes du flux
* Envoyer des données vers des systèmes tiers (Webhook, notifications de message, etc.)
* Déclencher des flux automatisés de services internes ou externes

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## Configuration de l'action

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

Dans «Paramètres du bouton» -> «Requête personnalisée», vous pouvez configurer les éléments suivants :

* HTTP method : la méthode de requête HTTP, par exemple GET, POST, PUT, DELETE, etc.
* URL : l'adresse cible de la requête. Vous pouvez saisir une URL d'interface complète, ou la composer dynamiquement à l'aide de variables.
* Headers : les en-têtes de requête, utilisés pour transmettre des informations d'authentification ou de configuration d'interface, par exemple Authorization, Content-Type, etc.
* Parameters : les paramètres de requête d'URL (Query Parameters), généralement utilisés pour les requêtes GET.
* Body : le contenu du corps de la requête, généralement utilisé pour les requêtes POST, PUT, etc. Vous pouvez y saisir du JSON, des données de formulaire, etc.
* Timeout config : la configuration du délai d'expiration de la requête, utilisée pour limiter la durée d'attente maximale et éviter que le flux ne soit bloqué trop longtemps.
* Response type : le type de données de la réponse de la requête.
* JSON : l'interface renvoie des données JSON. Le résultat est injecté dans le contexte du flux et peut être récupéré dans les étapes suivantes via `ctx.steps`.
* Stream : l'interface renvoie un flux de données (Stream). Une fois la requête réussie, le téléchargement du fichier est déclenché automatiquement.
* Access control : contrôle d'accès, utilisé pour limiter quels rôles peuvent déclencher cette étape de requête, afin d'assurer la sécurité de l'appel d'interface.

## Autres options de configuration de l'action

En plus des paramètres de requête, le bouton de requête personnalisée prend également en charge ces configurations courantes :

- [Modifier le bouton](/interface-builder/actions/action-settings/edit-button) : configurer le titre, le style, l'icône, etc. du bouton ;
- [Règles de liaison d'action](/interface-builder/actions/action-settings/linkage-rule) : contrôler dynamiquement la visibilité, l'état désactivé, etc. du bouton selon des conditions ;
- [Confirmation secondaire](/interface-builder/actions/action-settings/double-check) : afficher d'abord une boîte de confirmation au clic, avant d'envoyer réellement la requête ;
