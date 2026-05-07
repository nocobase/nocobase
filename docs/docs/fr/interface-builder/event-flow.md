---
title: "Flux d'événements"
description: "Flux d'événements de la construction d'interface : configurez la logique d'interaction des blocs et des champs, piloté par Flow et chaîné par Step pour orchestrer la logique métier sans code."
keywords: "flux d'événements, Event Flow, Flow, Step, logique d'interaction, orchestration sans code, construction d'interface, NocoBase"
---

# Flux d'événements

## Introduction

Si vous souhaitez déclencher des opérations personnalisées lorsqu'un formulaire change, vous pouvez utiliser le flux d'événements. Outre les formulaires, les pages, blocs, boutons et champs peuvent également utiliser le flux d'événements pour configurer des opérations personnalisées.

## Comment l'utiliser

Voici un exemple simple pour illustrer la configuration d'un flux d'événements. Implémentons une interaction entre deux tableaux : lorsque vous cliquez sur une ligne du tableau de gauche, les données du tableau de droite sont automatiquement filtrées.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Étapes de configuration :

1. Cliquez sur l'icône «éclair» en haut à droite du bloc de tableau de gauche pour ouvrir l'interface de configuration du flux d'événements.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Cliquez sur «Ajouter un flux d'événements (Add event flow)», sélectionnez «Clic sur ligne» comme «Événement déclencheur», ce qui signifie que le flux est déclenché lorsque vous cliquez sur une ligne du tableau.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Configurez le «Moment d'exécution» pour contrôler l'ordre d'exécution de ce flux d'événements par rapport aux flux intégrés du système. Conservez généralement la valeur par défaut ; si vous souhaitez afficher un message ou rediriger après l'exécution de la logique intégrée, vous pouvez choisir «Après tous les flux». Pour plus de détails, voir [Moment d'exécution](#moment-dexécution) ci-dessous.
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. La «Condition de déclenchement (Trigger condition)» permet de configurer une condition : le flux d'événements ne sera déclenché que si la condition est remplie. Ici, nous n'avons pas besoin de la configurer ; tout clic sur une ligne déclenchera le flux d'événements.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Survolez «Ajouter une étape (Add step)» avec la souris pour ajouter des étapes d'opération. Choisissons «Définir la portée des données (Set data scope)» pour définir la portée des données du tableau de droite.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Copiez l'UID du tableau de droite et collez-le dans le champ «UID du bloc cible (Target block UID)». Une interface de configuration de condition s'affiche immédiatement en dessous, où vous pouvez configurer la portée des données du tableau de droite.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Configurons une condition comme illustré ci-dessous :
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Après avoir configuré la portée des données, vous devez encore rafraîchir le bloc pour afficher les résultats filtrés. Configurons maintenant le rafraîchissement du bloc de tableau de droite. Ajoutez une étape «Rafraîchir les blocs cibles (Refresh target blocks)», puis saisissez l'UID du tableau de droite.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Enfin, cliquez sur le bouton de sauvegarde en bas à droite et la configuration est terminée.

## Détail des événements

### Avant rendu

Événement générique, utilisable dans les pages, blocs, boutons ou champs. Dans cet événement, vous pouvez effectuer des tâches d'initialisation. Par exemple, configurer différentes portées de données selon différentes conditions.

### Clic sur ligne (Row click)

Événement spécifique aux blocs de tableau. Déclenché lorsque vous cliquez sur une ligne du tableau. Lors du déclenchement, un Clicked row record est ajouté au contexte et peut être utilisé comme variable dans les conditions et les étapes.

### Changement de valeur du formulaire (Form values change)

Événement spécifique aux blocs de formulaire. Déclenché lorsque la valeur d'un champ du formulaire change. Vous pouvez accéder aux valeurs du formulaire dans les conditions et les étapes via la variable «Current form».

### Clic (Click)

Événement spécifique aux boutons. Déclenché lorsque vous cliquez sur le bouton.

## Moment d'exécution

Dans la configuration du flux d'événements, deux concepts sont facilement confondus :

- **Événement déclencheur :** quand commencer l'exécution (par exemple : avant rendu, clic sur ligne, clic, changement de valeur du formulaire, etc.).
- **Moment d'exécution :** une fois le même événement déclencheur survenu, à quel emplacement votre **flux d'événements personnalisé** doit s'insérer dans le **processus intégré**.

### Qu'est-ce qu'un «processus / étape intégré» ?

De nombreuses pages, blocs ou opérations disposent d'un processus de traitement intégré au système (par exemple : soumettre, ouvrir une fenêtre contextuelle, requêter des données, etc.). Lorsque vous ajoutez un flux d'événements personnalisé pour un même événement (par exemple «Clic»), le «Moment d'exécution» détermine :

- si votre flux d'événements s'exécute avant ou après la logique intégrée ;
- ou si votre flux d'événements s'insère avant ou après une étape donnée du processus intégré.

### Comment comprendre les options de moment d'exécution dans l'UI ?

- **Avant tous les flux (par défaut) :** s'exécute en premier. Idéal pour «intercepter / préparer» (par exemple validation, double confirmation, initialisation de variables, etc.).
- **Après tous les flux :** s'exécute après la fin de la logique intégrée. Idéal pour «finaliser / fournir un retour» (par exemple message, rafraîchissement d'autres blocs, redirection, etc.).
- **Avant un flux spécifique / Après un flux spécifique :** point d'insertion plus précis. Après sélection, vous devez choisir un «processus intégré» spécifique.
- **Avant une étape de flux spécifique / Après une étape de flux spécifique :** point d'insertion le plus précis. Après sélection, vous devez choisir à la fois le «processus intégré» et l'«étape du processus intégré».

> Astuce : si vous n'êtes pas sûr du processus / de l'étape intégrée à choisir, utilisez de préférence les deux premières options («Avant / Après»).

## Détail des étapes

### Variable personnalisée (Custom variable)

Permet de définir une variable, puis de l'utiliser dans le contexte.

#### Portée

Les variables personnalisées ont une portée. Par exemple, une variable définie dans le flux d'événements d'un bloc ne peut être utilisée que dans ce bloc. Si vous souhaitez l'utiliser dans tous les blocs de la page courante, vous devez la configurer dans le flux d'événements de la page.

#### Variable de formulaire (Form variable)

Utilise la valeur d'un bloc de formulaire comme variable. Configuration spécifique :

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title : titre de la variable
- Variable identifier : identifiant de la variable
- Form UID : UID du formulaire

#### Autres variables

D'autres variables seront prises en charge progressivement, restez à l'écoute.

### Définir la portée des données (Set data scope)

Définit la portée des données du bloc cible. Configuration spécifique :

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID : UID du bloc cible
- Condition : condition de filtrage

### Rafraîchir les blocs cibles (Refresh target blocks)

Rafraîchit les blocs cibles, plusieurs blocs peuvent être configurés. Configuration spécifique :

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID : UID du bloc cible

### Naviguer vers une URL (Navigate to URL)

Redirige vers une URL. Configuration spécifique :

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL : URL cible, prend en charge les variables
- Search parameters : paramètres de requête de l'URL
- Open in new window : si coché, ouvre une nouvelle page de navigateur lors de la redirection

### Afficher un message (Show message)

Affiche globalement un retour d'information sur l'opération.

#### Quand l'utiliser

- Permet de fournir des retours de succès, d'avertissement, d'erreur, etc.
- Affichage centré en haut, disparition automatique : c'est une notification légère qui n'interrompt pas l'opération de l'utilisateur.

#### Configuration spécifique

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type : type de message
- Message content : contenu du message
- Duration : durée d'affichage en secondes

### Afficher une notification (Show notification)

Affiche globalement une notification.

#### Quand l'utiliser

Affiche une notification dans l'un des quatre coins du système. Souvent utilisé dans les cas suivants :

- Contenu de notification relativement complexe.
- Notifications interactives, fournissant à l'utilisateur la prochaine action à effectuer.
- Push système actif.

#### Configuration spécifique

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type : type de notification
- Notification title : titre de la notification
- Notification description : description de la notification
- Placement : position, options : haut-gauche, haut-droite, bas-gauche, bas-droite

### Exécuter du JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Exécute du code JavaScript.

### Requête personnalisée (Custom request)

#### Quand l'utiliser
Lorsque vous devez appeler une interface externe ou un service tiers dans le flux, vous pouvez utiliser **Custom request** pour déclencher une requête HTTP personnalisée. Cas d'usage courants :

* Appeler une API d'un système externe (CRM, services AI, etc.)
* Récupérer des données distantes et les traiter dans les étapes ultérieures du flux
* Pousser des données vers un système tiers (Webhook, notifications, etc.)
* Déclencher des flux d'automatisation de services internes ou externes

Une fois la requête exécutée, ses données de réponse peuvent être utilisées dans les étapes suivantes, par exemple pour le traitement des données, des conditions ou le stockage.

#### Configuration spécifique

![](https://static-docs.nocobase.com/Leads-03-16-2026_05_50_PM%20(1).png)

* HTTP method : méthode de requête HTTP, par exemple `GET`, `POST`, `PUT`, `DELETE`, etc.
* URL : adresse cible de la requête, vous pouvez saisir une URL complète ou la composer dynamiquement avec des variables.
* Headers : en-têtes de requête, utilisés pour transmettre les informations d'authentification ou la configuration de l'interface, par exemple `Authorization`, `Content-Type`, etc.
* Parameters : paramètres de requête de l'URL (Query Parameters), généralement utilisés pour les requêtes `GET`.
* Body : contenu du corps de la requête, généralement utilisé pour les requêtes `POST`, `PUT`, etc., peut contenir du JSON, des données de formulaire, etc.
* Timeout config : configuration du délai d'expiration de la requête, pour limiter la durée maximale d'attente et éviter de bloquer le flux trop longtemps.
* Response type : type de données de la réponse de la requête.
  * JSON : l'interface renvoie des données JSON, le résultat est injecté dans le contexte du flux et peut être récupéré dans les étapes suivantes via `ctx.steps`.
  * Stream : l'interface renvoie un flux de données (Stream), un téléchargement de fichier est déclenché automatiquement après la requête réussie.
* Access control : contrôle d'accès, permet de restreindre les rôles autorisés à déclencher cette étape de requête, pour garantir la sécurité de l'appel d'interface.


## Exemples

### Formulaire : appeler une API tierce pour pré-remplir des champs

Scénario : déclencher un flux d'événements dans un formulaire pour appeler une API tierce, puis pré-remplir automatiquement les champs du formulaire avec les données reçues.

Étapes de configuration :

1. Ouvrez la configuration du flux d'événements dans le bloc de formulaire et ajoutez un nouveau flux d'événements ;
2. Sélectionnez «Avant rendu» comme événement déclencheur ;
3. Sélectionnez «Après tous les flux» comme moment d'exécution ;
4. Ajoutez l'étape «Exécuter du JavaScript (Execute JavaScript)», collez et adaptez le code suivant :

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// replace it with actual field name
ctx.form.setFieldsValue({ username });
```
