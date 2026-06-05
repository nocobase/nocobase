:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Intégration de Webhook dans les flux de travail

Grâce aux déclencheurs Webhook, NocoBase peut recevoir des appels HTTP de systèmes tiers et déclencher automatiquement des flux de travail, permettant ainsi une intégration transparente avec des systèmes externes.

## Présentation

Un Webhook est un mécanisme d'"API inversée" qui permet à des systèmes externes d'envoyer proactivement des données à NocoBase lorsqu'un événement spécifique se produit. Par rapport à l'interrogation active (polling), les Webhooks offrent une approche d'intégration plus en temps réel et plus efficace.

## Cas d'utilisation typiques

### Soumission de données de formulaire

Les systèmes de sondage externes, les formulaires d'inscription ou les formulaires de commentaires clients peuvent, après la soumission des données par l'utilisateur, pousser ces données vers NocoBase via un Webhook. Cela permet de créer automatiquement des enregistrements et de déclencher des processus de suivi (comme l'envoi d'e-mails de confirmation, l'attribution de tâches, etc.).

### Notifications de messages

Les événements provenant de plateformes de messagerie tierces (telles que WeChat Work, DingTalk, Slack), comme les nouveaux messages, les mentions ou les approbations terminées, peuvent déclencher des processus automatisés dans NocoBase via des Webhooks.

### Synchronisation des données

Lorsqu'une modification de données se produit dans des systèmes externes (tels que CRM, ERP), les Webhooks peuvent pousser ces mises à jour vers NocoBase en temps réel pour maintenir la synchronisation des données.

### Intégration de services tiers

- **GitHub** : Les événements tels que les poussées de code ou la création de PR (Pull Requests) déclenchent des flux de travail d'automatisation.
- **GitLab** : Notifications de l'état des pipelines CI/CD.
- **Soumissions de formulaires** : Les systèmes de formulaires externes soumettent des données à NocoBase.
- **Appareils IoT** : Changements d'état des appareils, remontée de données de capteurs.

## Fonctionnalités

### Mécanisme de déclenchement flexible

- Prend en charge les méthodes HTTP GET, POST, PUT, DELETE.
- Analyse automatiquement les formats courants tels que JSON et les données de formulaire.
- Validation des requêtes configurable pour garantir la fiabilité des sources.

### Capacités de traitement des données

- Les données reçues peuvent être utilisées comme variables dans les flux de travail.
- Prend en charge la logique complexe de transformation et de traitement des données.
- Peut être combiné avec d'autres nœuds de flux de travail pour implémenter une logique métier complexe.

### Garantie de sécurité

- Prend en charge la vérification de signature pour prévenir les requêtes falsifiées.
- Liste blanche d'adresses IP configurable.
- Transmission chiffrée HTTPS.

## Étapes d'utilisation

### 1. Installer le plugin

Dans le gestionnaire de plugins, recherchez et installez le **[plugin flux de travail : Déclencheur Webhook](/plugins/@nocobase/plugin-workflow-webhook/)**.

> Remarque : Ce plugin est un plugin commercial et nécessite un achat ou un abonnement séparé.

### 2. Créer un flux de travail Webhook

1. Accédez à la page **Gestion des flux de travail**.
2. Cliquez sur **Créer un flux de travail**.
3. Sélectionnez **Déclencheur Webhook** comme type de déclencheur.

![Créer un flux de travail Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Configurez les paramètres du Webhook.

![Configuration du déclencheur Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Chemin de la requête** : Chemin d'URL Webhook personnalisé.
   - **Méthode de requête** : Sélectionnez les méthodes HTTP autorisées (GET/POST/PUT/DELETE).
   - **Synchrone/Asynchrone** : Choisissez si vous souhaitez attendre la fin de l'exécution du flux de travail avant de renvoyer les résultats.
   - **Méthode de validation** : Configurez la vérification de signature ou d'autres mécanismes de sécurité.

### 3. Configurer les nœuds du flux de travail

Ajoutez des nœuds de flux de travail en fonction de vos besoins métier, par exemple :

- **Opérations sur les collections** : Créer, mettre à jour, supprimer des enregistrements.
- **Logique conditionnelle** : Créer des branches en fonction des données reçues.
- **Requête HTTP** : Appeler d'autres API.
- **Notifications de messages** : Envoyer des e-mails, des SMS, etc.
- **Code personnalisé** : Exécuter du code JavaScript.

### 4. Obtenir l'URL du Webhook

Une fois le flux de travail créé, le système génère une URL de Webhook unique, généralement au format suivant :

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Configurer dans le système tiers

Configurez l'URL du Webhook générée dans le système tiers :

- Définissez l'adresse de rappel de soumission des données dans les systèmes de formulaires.
- Configurez le Webhook dans GitHub/GitLab.
- Configurez l'adresse de poussée d'événements dans WeChat Work/DingTalk.

### 6. Tester le Webhook

Testez le Webhook à l'aide d'outils (tels que Postman, cURL) :

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Accès aux données de la requête

Dans les flux de travail, vous pouvez accéder aux données reçues par le Webhook via des variables :

- ``{{$context.data}}`` : Données du corps de la requête.
- ``{{$context.headers}}`` : Informations d'en-tête de la requête.
- ``{{$context.query}}`` : Paramètres de requête de l'URL.
- ``{{$context.params}}`` : Paramètres de chemin.

![Analyse des paramètres de requête](https://static-docs.nocobase.com/20241210111155.png)

![Analyse du corps de la requête](https://static-docs.nocobase.com/20241210112529.png)

## Configuration de la réponse

![Paramètres de réponse](https://static-docs.nocobase.com/20241210114312.png)

### Mode synchrone

Les résultats sont renvoyés une fois l'exécution du flux de travail terminée. Vous pouvez configurer :

- **Code de statut de la réponse** : 200, 201, etc.
- **Données de la réponse** : Données JSON de retour personnalisées.
- **En-têtes de réponse** : En-têtes HTTP personnalisés.

### Mode asynchrone

Renvoie une confirmation immédiate, le flux de travail s'exécute en arrière-plan. Convient pour :

- Les flux de travail de longue durée.
- Les scénarios ne nécessitant pas de retour de résultats d'exécution.
- Les scénarios à forte concurrence.

## Bonnes pratiques de sécurité

### 1. Activer la vérification de signature

La plupart des services tiers prennent en charge les mécanismes de signature :

```javascript
// Exemple : Vérifier la signature d'un Webhook GitHub
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Utiliser HTTPS

Assurez-vous que NocoBase est déployé dans un environnement HTTPS pour protéger la transmission des données.

### 3. Restreindre les sources de requêtes

Configurez une liste blanche d'adresses IP pour n'autoriser que les requêtes provenant de sources fiables.

### 4. Validation des données

Ajoutez une logique de validation des données dans les flux de travail pour vous assurer que les données reçues ont un format correct et un contenu valide.

### 5. Audit des journaux

Enregistrez toutes les requêtes Webhook pour faciliter le suivi et le dépannage.

## Dépannage

### Le Webhook ne se déclenche pas ?

1. Vérifiez que l'URL du Webhook est correcte.
2. Confirmez que le statut du flux de travail est "Activé".
3. Vérifiez les journaux d'envoi du système tiers.
4. Examinez la configuration du pare-feu et du réseau.

### Comment déboguer les Webhooks ?

1. Consultez les enregistrements d'exécution du flux de travail pour obtenir des informations détaillées sur les requêtes et les résultats.
2. Utilisez des outils de test de Webhook (comme Webhook.site) pour vérifier les requêtes.
3. Examinez les données clés et les messages d'erreur dans les enregistrements d'exécution.

### Comment gérer les tentatives ?

Certains services tiers tentent de renvoyer les données s'ils ne reçoivent pas de réponse positive :

- Assurez-vous que le flux de travail est idempotent.
- Utilisez des identifiants uniques pour la déduplication.
- Enregistrez les ID des requêtes traitées.

### Conseils d'optimisation des performances

- Utilisez le mode asynchrone pour les opérations longues.
- Ajoutez une logique conditionnelle pour filtrer les requêtes inutiles.
- Envisagez d'utiliser des files d'attente de messages pour les scénarios à forte concurrence.

## Scénarios d'exemple

### Traitement des soumissions de formulaires externes

```javascript
// 1. Vérifier la source des données
// 2. Analyser les données du formulaire
const formData = context.data;

// 3. Créer un enregistrement client
// 4. Attribuer à la personne responsable
// 5. Envoyer un e-mail de confirmation à l'expéditeur
if (formData.email) {
  // Envoyer une notification par e-mail
}
```

### Notification de poussée de code GitHub

```javascript
// 1. Analyser les données de poussée
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Si c'est la branche principale
if (branch === 'main') {
  // 3. Déclencher le processus de déploiement
  // 4. Notifier les membres de l'équipe
}
```

![Exemple de flux de travail Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Ressources associées

- [Documentation du plugin flux de travail](/plugins/@nocobase/plugin-workflow/)
- [Flux de travail : Déclencheur Webhook](/workflow/triggers/webhook)
- [Flux de travail : Nœud de requête HTTP](/integration/workflow-http-request/)
- [Authentification par clés API](/integration/api-keys/)