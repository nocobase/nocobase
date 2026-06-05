:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Intégration des requêtes HTTP dans les flux de travail

Le nœud de requête HTTP permet aux flux de travail NocoBase d'envoyer proactivement des requêtes à n'importe quel service HTTP, facilitant ainsi l'échange de données et l'intégration métier avec des systèmes externes.

## Vue d'ensemble

Le nœud de requête HTTP est un composant d'intégration essentiel dans les flux de travail. Il vous permet d'appeler des API tierces, des interfaces de services internes ou d'autres services web pendant l'exécution d'un flux de travail, afin de récupérer des données ou de déclencher des opérations externes.

## Cas d'utilisation typiques

### Récupération de données

- **Requêtes de données tierces** : Récupérez des données en temps réel depuis des API météo, des API de taux de change, etc.
- **Résolution d'adresses** : Appelez des API de services cartographiques pour l'analyse d'adresses et le géocodage.
- **Synchronisation de données d'entreprise** : Récupérez des données clients ou de commandes depuis des systèmes CRM ou ERP.

### Déclencheurs métier

- **Notifications** : Appelez des services de SMS, d'e-mail ou de WeCom pour envoyer des notifications.
- **Requêtes de paiement** : Initiez des paiements ou des remboursements auprès de passerelles de paiement.
- **Traitement des commandes** : Soumettez des lettres de voiture ou interrogez le statut logistique auprès de systèmes d'expédition.

### Intégration de systèmes

- **Appels de microservices** : Appelez les API d'autres services dans des architectures de microservices.
- **Rapports de données** : Transmettez des données métier à des plateformes d'analyse ou des systèmes de surveillance.
- **Services tiers** : Intégrez des services d'IA, de reconnaissance OCR, de synthèse vocale, etc.

### Automatisation

- **Tâches planifiées** : Appelez périodiquement des API externes pour synchroniser des données.
- **Réponse aux événements** : Appelez automatiquement des API externes pour notifier les systèmes concernés lors de modifications de données.
- **Flux de travail d'approbation** : Soumettez des requêtes d'approbation via les API de systèmes d'approbation.

## Fonctionnalités

### Prise en charge complète de HTTP

- Prend en charge toutes les méthodes HTTP : GET, POST, PUT, PATCH, DELETE.
- Prend en charge les en-têtes de requête (Headers) personnalisés.
- Prend en charge plusieurs formats de données : JSON, données de formulaire, XML, etc.
- Prend en charge divers types de paramètres : paramètres d'URL, paramètres de chemin, corps de requête.

### Traitement flexible des données

- **Références de variables** : Construisez dynamiquement des requêtes en utilisant les variables du flux de travail.
- **Analyse des réponses** : Analysez automatiquement les réponses JSON et extrayez les données nécessaires.
- **Transformation de données** : Transformez les formats des données de requête et de réponse.
- **Gestion des erreurs** : Configurez les stratégies de réessai, les paramètres de temporisation et la logique de gestion des erreurs.

### Authentification sécurisée

- **Basic Auth** : Authentification HTTP de base.
- **Bearer Token** : Authentification par jeton.
- **Clé API** : Authentification par clé API personnalisée.
- **En-têtes personnalisés** : Prise en charge de toute méthode d'authentification.

## Étapes d'utilisation

### 1. Vérifiez que le plugin est activé

Le nœud de requête HTTP est une fonctionnalité intégrée du **plugin** de **flux de travail**. Assurez-vous que le **[plugin de flux de travail](/plugins/@nocobase/plugin-workflow/)** est activé.

### 2. Ajoutez un nœud de requête HTTP à votre flux de travail

1. Créez ou modifiez un flux de travail.
2. Ajoutez un nœud **Requête HTTP** à l'emplacement souhaité.

![Requête HTTP - Ajouter un nœud](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Configurez les paramètres de la requête.

### 3. Configurez les paramètres de la requête

![Nœud de requête HTTP - Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Configuration de base

- **URL de la requête** : L'adresse de l'API cible, prend en charge l'utilisation de variables.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Méthode de requête** : Sélectionnez GET, POST, PUT, DELETE, etc.

- **En-têtes de requête** : Configurez les en-têtes HTTP.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Paramètres de la requête** :
  - **Paramètres de requête (Query)** : Paramètres de requête d'URL.
  - **Paramètres du corps (Body)** : Données du corps de la requête (POST/PUT).

#### Configuration avancée

- **Délai d'attente** : Définissez le délai d'attente de la requête (30 secondes par défaut).
- **Réessayer en cas d'échec** : Configurez le nombre de tentatives et l'intervalle de réessai.
- **Ignorer l'échec** : Le flux de travail continue de s'exécuter même si la requête échoue.
- **Paramètres de proxy** : Configurez un proxy HTTP (si nécessaire).

### 4. Utilisez les données de réponse

Après l'exécution du nœud de requête HTTP, les données de réponse peuvent être utilisées dans les nœuds suivants :

- `{{$node.data.status}}` : Code de statut HTTP.
- `{{$node.data.headers}}` : En-têtes de réponse.
- `{{$node.data.data}}` : Données du corps de la réponse.
- `{{$node.data.error}}` : Message d'erreur (si la requête a échoué).

![Nœud de requête HTTP - Utilisation de la réponse](https://static-docs.nocobase.com/20240529110610.png)

## Scénarios d'exemple

### Exemple 1 : Obtenir des informations météorologiques

```javascript
// Configuration
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Utilisation de la réponse
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Exemple 2 : Envoyer un message WeCom

```javascript
// Configuration
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "La commande {{$context.orderId}} a été expédiée"
  }
}
```

### Exemple 3 : Interroger le statut de paiement

```javascript
// Configuration
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Logique conditionnelle
Si {{$node.data.data.status}} est égal à "paid"
  - Mettre à jour le statut de la commande à "Payé"
  - Envoyer une notification de succès de paiement
Sinon si {{$node.data.data.status}} est égal à "pending"
  - Maintenir le statut de la commande à "En attente de paiement"
Sinon
  - Enregistrer l'échec du paiement
  - Notifier l'administrateur pour gérer l'exception
```

### Exemple 4 : Synchroniser des données avec un CRM

```javascript
// Configuration
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Configuration de l'authentification

### Authentification de base (Basic Authentication)

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Jeton Bearer (Bearer Token)

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### Clé API (API Key)

```javascript
// Dans l'en-tête
Headers:
  X-API-Key: your-api-key

// Ou dans les paramètres de requête (Query)
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Vous devez d'abord obtenir un `access_token`, puis l'utiliser comme suit :

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Gestion des erreurs et débogage

### Erreurs courantes

1. **Délai de connexion dépassé** : Vérifiez la connexion réseau, augmentez le délai d'attente.
2. **401 Non autorisé** : Vérifiez que les informations d'authentification sont correctes.
3. **404 Introuvable** : Vérifiez que l'URL est correcte.
4. **500 Erreur interne du serveur** : Vérifiez l'état du service du fournisseur d'API.

### Conseils de débogage

1. **Utilisez des nœuds de journalisation** : Ajoutez des nœuds de journalisation avant et après les requêtes HTTP pour enregistrer les données de requête et de réponse.

2. **Consultez les journaux d'exécution** : Les journaux d'exécution du flux de travail contiennent des informations détaillées sur les requêtes et les réponses.

3. **Outils de test** : Testez d'abord l'API à l'aide d'outils comme Postman, cURL, etc.

4. **Gestion des erreurs** : Ajoutez une logique conditionnelle pour gérer les différents statuts de réponse.

```javascript
Si {{$node.data.status}} >= 200 et {{$node.data.status}} < 300
  - Gérer la logique de succès
Sinon
  - Gérer la logique d'échec
  - Enregistrer l'erreur : {{$node.data.error}}
```

## Conseils d'optimisation des performances

### 1. Utilisez le traitement asynchrone

Pour les requêtes qui ne nécessitent pas de résultats immédiats, envisagez d'utiliser des flux de travail asynchrones.

### 2. Configurez des délais d'attente raisonnables

Définissez les délais d'attente en fonction des temps de réponse réels de l'API pour éviter des attentes excessives.

### 3. Mettez en œuvre des stratégies de mise en cache

Pour les données qui ne changent pas fréquemment (configurations, dictionnaires), envisagez de mettre en cache les réponses.

### 4. Traitement par lots

Si vous devez effectuer plusieurs appels à la même API, envisagez d'utiliser les points de terminaison de traitement par lots de l'API (si pris en charge).

### 5. Réessai en cas d'erreur

Configurez des stratégies de réessai raisonnables, mais évitez les réessais excessifs qui pourraient entraîner une limitation de débit de l'API.

## Bonnes pratiques de sécurité

### 1. Protégez les informations sensibles

- N'exposez pas d'informations sensibles dans les URL.
- Utilisez HTTPS pour une transmission chiffrée.
- Stockez les clés API et les données sensibles dans des variables d'environnement ou via la gestion de configuration.

### 2. Validez les données de réponse

```javascript
// Valider le statut de la réponse
if (![200, 201].includes($node.data.status)) {
  throw new Error('La requête API a échoué');
}

// Valider le format des données
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Données de réponse invalides');
}
```

### 3. Limitez la fréquence des requêtes

Respectez les limites de débit des API tierces pour éviter d'être bloqué.

### 4. Anonymisation des journaux

Lors de l'enregistrement des journaux, veillez à anonymiser les informations sensibles (mots de passe, clés, etc.).

## Comparaison avec les Webhooks

| Caractéristique | Nœud de requête HTTP | Déclencheur Webhook |
|------|-------------|---------------|
| Direction | NocoBase appelle l'extérieur | L'extérieur appelle NocoBase |
| Moment | Pendant l'exécution du flux de travail | Lorsqu'un événement externe se produit |
| Objectif | Récupérer des données, déclencher des opérations externes | Recevoir des notifications, des événements externes |
| Scénarios typiques | Appel d'API de paiement, interrogation météo | Rappels de paiement, notifications de messages |

Ces deux fonctionnalités sont complémentaires et construisent ensemble une solution d'intégration système complète.

## Ressources associées

- [Documentation du plugin de flux de travail](/plugins/@nocobase/plugin-workflow/)
- [Flux de travail : Nœud de requête HTTP](/workflow/nodes/request)
- [Flux de travail : Déclencheur Webhook](/integration/workflow-webhook/)
- [Authentification par clés API](/integration/api-keys/)
- [Plugin de documentation API](/plugins/@nocobase/plugin-api-doc/)