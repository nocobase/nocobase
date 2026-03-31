---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Événement post-action

## Introduction

Toutes les modifications de données effectuées par les utilisateurs dans le système sont généralement réalisées via une action, qui prend souvent la forme d'un clic sur un bouton. Ce bouton peut être un bouton de soumission dans un formulaire ou un bouton d'action dans un bloc de données. L'événement post-action permet d'associer des flux de travail à ces actions de bouton, afin de déclencher un processus spécifique une fois l'opération de l'utilisateur réussie.

Par exemple, lors de l'ajout ou de la mise à jour de données, vous pouvez configurer l'option « Lier un flux de travail » pour un bouton. Une fois l'action terminée, le flux de travail lié sera déclenché.

Au niveau de l'implémentation, étant donné que la gestion des événements post-action se situe au niveau du middleware (le middleware de Koa), les appels d'API HTTP vers NocoBase peuvent également déclencher des événements post-action définis.

## Installation

C'est un plugin intégré, aucune installation n'est requise.

## Configuration du déclencheur

### Créer un flux de travail

Lors de la création d'un flux de travail, sélectionnez « Événement post-action » comme type :

![Créer un flux de travail_Déclencheur d'événement post-action](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Mode d'exécution

Pour les événements post-action, vous pouvez également choisir le mode d'exécution « Synchrone » ou « Asynchrone » lors de sa création :

![Créer un flux de travail_Sélectionner Synchrone ou Asynchrone](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Si le processus doit être exécuté et renvoyé immédiatement après l'action de l'utilisateur, vous pouvez utiliser le mode synchrone ; sinon, le mode asynchrone est utilisé par défaut. En mode asynchrone, l'action est terminée immédiatement après le déclenchement du flux de travail, et le flux de travail sera exécuté séquentiellement dans la file d'attente en arrière-plan de l'application.

### Configurer la collection

Accédez au canevas du flux de travail, cliquez sur le déclencheur pour ouvrir la fenêtre contextuelle de configuration, et sélectionnez d'abord la collection à lier :

![Configuration du flux de travail_Sélectionner la collection](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Sélectionner le mode de déclenchement

Ensuite, sélectionnez le mode de déclenchement, qui peut être local ou global :

![Configuration du flux de travail_Sélectionner le mode de déclenchement](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Où :

*   Le mode local est déclenché uniquement sur les boutons d'action auxquels ce flux de travail est lié. Cliquer sur des boutons sans ce flux de travail lié ne le déclenchera pas. Vous pouvez décider de lier ou non ce flux de travail en fonction de la nécessité de déclencher le même processus pour des formulaires ayant des objectifs différents.
*   Le mode global est déclenché sur tous les boutons d'action configurés de la collection, quel que soit le formulaire d'où ils proviennent, et il n'est pas nécessaire de lier le flux de travail correspondant.

En mode local, les boutons d'action qui prennent actuellement en charge la liaison sont les suivants :

*   Les boutons « Soumettre » et « Enregistrer » dans le formulaire d'ajout.
*   Les boutons « Soumettre » et « Enregistrer » dans le formulaire de mise à jour.
*   Le bouton « Mettre à jour les données » dans les lignes de données (tableau, liste, Kanban, etc.).

### Sélectionner le type d'action

Si vous choisissez le mode global, vous devez également sélectionner le type d'action. Actuellement, les actions « Créer des données » et « Mettre à jour des données » sont prises en charge. Ces deux actions déclenchent le flux de travail une fois l'opération réussie.

### Sélectionner les données d'association préchargées

Si vous avez besoin d'utiliser les données associées aux données déclenchées dans les processus ultérieurs, vous pouvez sélectionner les champs d'association à précharger :

![Configuration du flux de travail_Précharger l'association](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Après le déclenchement, vous pouvez utiliser directement ces données associées dans le processus.

## Configuration de l'action

Pour les actions en mode de déclenchement local, une fois le flux de travail configuré, vous devez retourner à l'interface utilisateur et lier le flux de travail au bouton d'action du formulaire du bloc de données correspondant.

Les flux de travail configurés pour le bouton « Soumettre » (y compris le bouton « Enregistrer les données ») seront déclenchés une fois que l'utilisateur aura soumis le formulaire correspondant et que l'action sur les données sera terminée.

![Événement post-action_Bouton Soumettre](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Sélectionnez « Lier un flux de travail » dans le menu de configuration du bouton pour ouvrir la fenêtre contextuelle de configuration de la liaison. Dans cette fenêtre, vous pouvez configurer autant de flux de travail à déclencher que vous le souhaitez. Si aucun n'est configuré, cela signifie qu'aucun déclenchement n'est nécessaire. Pour chaque flux de travail, vous devez d'abord spécifier si les données de déclenchement sont les données de l'ensemble du formulaire ou les données d'un certain champ d'association dans le formulaire. Ensuite, en fonction de la collection correspondant au modèle de données sélectionné, choisissez le flux de travail de formulaire qui a été configuré pour correspondre à ce modèle de collection.

![Événement post-action_Configuration de la liaison du flux de travail_Sélection du contexte](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Événement post-action_Configuration de la liaison du flux de travail_Sélection du flux de travail](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Remarque"}
Le flux de travail doit être activé avant de pouvoir être sélectionné dans l'interface ci-dessus.
:::

## Exemple

Voici une démonstration utilisant l'action de création.

Imaginons un scénario de « Demande de remboursement ». Après qu'un employé a soumis une demande de remboursement, nous devons effectuer une vérification automatique du montant et une vérification manuelle pour les montants dépassant la limite. Seules les demandes approuvées après vérification sont acceptées, puis transmises au service financier pour traitement.

Tout d'abord, nous pouvons créer une collection « Remboursement » avec les champs suivants :

- Nom du projet : Texte sur une seule ligne
- Demandeur : Plusieurs à un (Utilisateur)
- Montant : Nombre
- Statut : Sélection unique (« Approuvé », « Traité »)

Ensuite, créez un flux de travail de type « Événement post-action » et configurez le modèle de collection dans le déclencheur pour qu'il soit la collection « Remboursement » :

![Exemple_Configuration du déclencheur_Sélectionner la collection](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Après avoir activé le flux de travail, nous reviendrons plus tard pour configurer les nœuds de traitement spécifiques du processus.

Ensuite, nous créons un bloc de tableau pour la collection « Remboursement » dans l'interface, ajoutons un bouton « Ajouter » à la barre d'outils et configurons les champs de formulaire correspondants. Dans les options de configuration du bouton d'action « Soumettre » du formulaire, ouvrez la boîte de dialogue de configuration « Lier un flux de travail » du bouton, sélectionnez toutes les données du formulaire comme contexte, et le flux de travail que nous avons créé précédemment :

![Exemple_Configuration du bouton de formulaire_Lier un flux de travail](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Une fois la configuration du formulaire terminée, revenez à l'orchestration logique du flux de travail. Par exemple, nous exigeons une vérification manuelle par un administrateur lorsque le montant est supérieur à 500, sinon il est directement approuvé. Après approbation, un enregistrement de remboursement est créé et traité ultérieurement par le service financier (omis).

![Exemple_Flux de traitement](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

En ignorant le traitement ultérieur par le service financier, la configuration du processus de demande de remboursement est maintenant terminée. Lorsqu'un employé remplit et soumet une demande de remboursement, le flux de travail correspondant sera déclenché. Si le montant de la dépense est inférieur à 500, un enregistrement sera automatiquement créé et attendra un traitement ultérieur par le service financier. Sinon, il sera examiné par un superviseur, et après approbation, un enregistrement sera également créé et transmis au service financier pour traitement.

Le processus de cet exemple peut également être configuré sur un bouton « Soumettre » ordinaire. Vous pouvez décider de créer un enregistrement avant d'exécuter les processus ultérieurs en fonction du scénario métier spécifique.

## Appel externe

Le déclenchement des événements post-action ne se limite pas aux opérations de l'interface utilisateur ; il peut également être déclenché via des appels d'API HTTP.

:::info{title="Remarque"}
Lorsque vous déclenchez un événement post-action via un appel d'API HTTP, vous devez également prêter attention à l'état d'activation du flux de travail et à la correspondance de la configuration de la collection, sinon l'appel pourrait échouer ou une erreur pourrait se produire.
:::

Pour les flux de travail liés localement à un bouton d'action, vous pouvez l'appeler comme ceci (en utilisant le bouton de création de la collection `posts` comme exemple) :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Où le paramètre d'URL `triggerWorkflows` est la clé du flux de travail, avec plusieurs flux de travail séparés par des virgules. Cette clé peut être obtenue en survolant le nom du flux de travail en haut du canevas du flux de travail :

![Flux de travail_Clé_Méthode d'affichage](https://static-docs.nocobase.com/20240426135108.png)

Après le succès de l'appel ci-dessus, l'événement post-action de la collection `posts` correspondante sera déclenché.

:::info{title="Remarque"}
Étant donné que les appels externes doivent également être basés sur l'identité de l'utilisateur, lors d'un appel via l'API HTTP, tout comme les requêtes envoyées depuis l'interface normale, des informations d'authentification doivent être fournies, y compris l'en-tête de requête `Authorization` ou le paramètre `token` (le jeton obtenu lors de la connexion), ainsi que l'en-tête de requête `X-Role` (le nom du rôle actuel de l'utilisateur).
:::

Si vous devez déclencher un événement pour des données de relation un-à-un dans cette action (les relations un-à-plusieurs ne sont pas encore prises en charge), vous pouvez utiliser `!` dans le paramètre pour spécifier les données de déclenchement du champ d'association :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Après le succès de l'appel ci-dessus, l'événement post-action de la collection `categories` correspondante sera déclenché.

:::info{title="Remarque"}
Si l'événement est configuré en mode global, vous n'avez pas besoin d'utiliser le paramètre d'URL `triggerWorkflows` pour spécifier le flux de travail correspondant ; un simple appel à l'action de collection correspondante le déclenchera.
:::

## Questions fréquentes

### Différence avec l'événement pré-action

*   **Événement pré-action** : Déclenché avant l'exécution d'une action (telle que l'ajout, la mise à jour, etc.). Avant l'exécution de l'action, les données de la requête peuvent être validées ou traitées dans le flux de travail. Si le flux de travail est terminé (la requête est interceptée), l'action (ajout, mise à jour, etc.) ne sera pas exécutée.
*   **Événement post-action** : Déclenché après le succès d'une action de l'utilisateur. À ce stade, les données ont été soumises avec succès et enregistrées dans la base de données. Les processus connexes peuvent alors être poursuivis en fonction du résultat positif.

Comme illustré ci-dessous :

![Ordre d'exécution de l'action](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Différence avec l'événement de collection

Les événements post-action et les événements de collection présentent des similitudes en ce sens qu'ils sont tous deux des processus déclenchés après des modifications de données. Cependant, leurs niveaux d'implémentation diffèrent : les événements post-action se situent au niveau de l'API, tandis que les événements de collection concernent les modifications de données au sein de la collection.

Les événements de collection sont plus proches de la couche sous-jacente du système. Dans certains cas, une modification de données causée par un événement peut en déclencher un autre, créant ainsi une réaction en chaîne. En particulier, lorsque des données dans certaines collections associées changent également lors de l'opération sur la collection actuelle, les événements liés à la collection associée peuvent également être déclenchés.

Le déclenchement des événements de collection n'inclut pas d'informations relatives à l'utilisateur. En revanche, les événements post-action sont plus proches de l'utilisateur final, sont le résultat des actions de l'utilisateur, et le contexte du flux de travail inclura également des informations relatives à l'utilisateur, ce qui les rend adaptés au traitement des processus liés aux actions de l'utilisateur. Dans la conception future de NocoBase, davantage d'événements post-action pouvant être utilisés pour le déclenchement pourraient être étendus, il est donc **plus recommandé d'utiliser les événements post-action** pour gérer les processus où les modifications de données sont causées par les actions de l'utilisateur.

Une autre différence est que les événements post-action peuvent être liés localement à des boutons de formulaire spécifiques. S'il existe plusieurs formulaires, la soumission de certains formulaires peut déclencher l'événement, tandis que d'autres ne le déclenchent pas. Les événements de collection, en revanche, concernent les modifications de données dans l'ensemble de la collection et ne peuvent pas être liés localement.