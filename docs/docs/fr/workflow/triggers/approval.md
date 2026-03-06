---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/workflow/triggers/approval).
:::

# Approbation

## Introduction

L'approbation est une forme de processus spécifiquement conçue pour être initiée et traitée manuellement afin de décider de l'état des données associées. Elle est généralement utilisée pour la gestion des processus d'automatisation de bureau ou d'autres affaires de décision humaine. Par exemple, vous pouvez créer et gérer des processus manuels pour des scénarios tels que les « demandes de congé », les « approbations de remboursement de frais » et les « approbations d'achat de matières premières ».

Le plugin d'approbation fournit un type de flux de travail (déclencheur) dédié « Approbation (événement) » et un nœud « Approbation » spécifique à ce processus. En combinant les collections personnalisées et les blocs personnalisés uniques de NocoBase, vous pouvez créer et gérer rapidement et de manière flexible divers scénarios d'approbation.

## Créer un flux de travail

Lors de la création d'un flux de travail, sélectionnez le type « Approbation » pour créer un processus d'approbation :

![Approvisionnement Déclencheur_Créer un flux d'approbation](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Ensuite, dans l'interface de configuration du flux de travail, cliquez sur le déclencheur pour ouvrir la fenêtre contextuelle et effectuer davantage de configurations.

## Configuration du déclencheur

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Lier une collection

Le plugin d'approbation de NocoBase est conçu sur la base de la flexibilité et peut être utilisé avec n'importe quelle collection personnalisée. Cela signifie que la configuration de l'approbation n'a pas besoin de reconfigurer le modèle de données, mais réutilise directement les collections déjà créées. Par conséquent, après être entré dans la configuration du déclencheur, vous devez d'abord sélectionner une collection pour décider pour quelle collection de données le processus d'approbation sera effectué :

![Déclencheur d'approbation_Configuration du déclencheur_Sélectionner une collection](https://static-docs.nocobase.com/20251226103223.png)

### Mode de déclenchement

Lors du lancement d'une approbation pour des données métier, vous pouvez choisir entre les deux modes de déclenchement suivants :

*   **Avant l'enregistrement des données**

    Lance l'approbation avant que les données soumises ne soient enregistrées. Ce mode convient aux scénarios où les données ne doivent être enregistrées qu'après l'approbation. Dans ce mode, les données au moment du lancement de l'approbation ne sont que des données temporaires et ne seront officiellement enregistrées dans la collection correspondante qu'après l'approbation.

*   **Après l'enregistrement des données**

    Lance l'approbation après que les données soumises ont été enregistrées. Ce mode convient aux scénarios où les données peuvent être enregistrées d'abord, puis approuvées. Dans ce mode, les données au moment du lancement de l'approbation sont déjà enregistrées dans la collection correspondante, et les modifications apportées pendant le processus d'approbation seront également enregistrées.

### Emplacement de l'initiation de l'approbation

Vous pouvez choisir l'emplacement dans le système où l'approbation peut être initiée :

*   **Uniquement dans les blocs de données**

    Vous pouvez lier l'action de n'importe quel bloc de formulaire de cette table à ce flux de travail pour lancer une approbation, et traiter ainsi que suivre le processus d'approbation dans le bloc d'approbation d'une seule donnée. Cela convient généralement aux données métier.

*   **Dans les blocs de données et le centre des tâches à faire**

    En plus des blocs de données, vous pouvez également lancer et traiter des approbations dans le centre global des tâches à faire. Cela convient généralement aux données administratives.

### Qui peut initier l'approbation

Vous pouvez configurer des autorisations basées sur la portée des utilisateurs pour décider quels utilisateurs peuvent lancer cette approbation :

*   **Tous les utilisateurs**

    Tous les utilisateurs du système peuvent lancer cette approbation.

*   **Uniquement les utilisateurs sélectionnés**

    Seuls les utilisateurs de la portée spécifiée sont autorisés à lancer cette approbation. Plusieurs sélections sont possibles.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Configuration de l'interface du formulaire de l'initiateur

Enfin, vous devez configurer l'interface du formulaire de l'initiateur. Cette interface sera utilisée pour les opérations de soumission lors du lancement depuis le bloc du centre d'approbation et lors du relancement après un retrait par l'utilisateur. Cliquez sur le bouton de configuration pour ouvrir la fenêtre contextuelle :

![Déclencheur d'approbation_Configuration du déclencheur_Formulaire de l'initiateur](https://static-docs.nocobase.com/20251226130239.png)

Vous pouvez ajouter à l'interface de l'initiateur un formulaire de saisie basé sur la collection liée, ou un texte explicatif (Markdown) pour les instructions et le guidage. L'ajout d'un bloc de formulaire est obligatoire, sinon l'initiateur ne pourra effectuer aucune opération après être entré dans cette interface.

Après avoir ajouté un bloc de formulaire, comme pour une interface de configuration de formulaire ordinaire, vous pouvez ajouter des composants de champ de la collection correspondante et les organiser librement pour structurer le contenu à remplir :

![Déclencheur d'approbation_Configuration du déclencheur_Formulaire de l'initiateur_Configuration des champs](https://static-docs.nocobase.com/20251226130339.png)

Contrairement au bouton de soumission directe, vous pouvez également ajouter un bouton d'action « Enregistrer le brouillon » pour prendre en charge les processus de stockage temporaire :

![Déclencheur d'approbation_Configuration du déclencheur_Formulaire de l'initiateur_Configuration des actions_Enregistrer](https://static-docs.nocobase.com/20251226130512.png)

Si un processus d'approbation permet à l'initiateur de se rétracter, vous devez activer le bouton « Retirer » dans la configuration de l'interface de l'initiateur :

![Déclencheur d'approbation_Configuration du déclencheur_Autoriser le retrait](https://static-docs.nocobase.com/20251226130637.png)

Une fois activé, l'approbation lancée par ce processus peut être retirée par l'initiateur avant tout traitement par un approbateur. Cependant, après le traitement par un approbateur configuré dans n'importe quel nœud d'approbation ultérieur, elle ne pourra plus être retirée.

:::info{title=Conseil}
Après avoir activé ou supprimé le bouton de retrait, vous devez cliquer sur enregistrer et soumettre dans la fenêtre contextuelle de configuration du déclencheur pour que cela devienne effectif.
:::

### Carte « Mes demandes » <Badge>2.0+</Badge>

Peut être utilisée pour configurer les cartes de tâches dans la liste « Mes demandes » du centre des tâches à faire.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Vous pouvez configurer librement les champs métier que vous souhaitez afficher dans la carte (à l'exception des champs de relation) ou les informations relatives à l'approbation.

Une fois la demande d'approbation créée, vous pourrez voir la carte de tâche personnalisée dans la liste du centre des tâches à faire :

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Mode d'affichage des enregistrements dans le flux

*   **Instantané**

    Dans le processus d'approbation, l'état de l'enregistrement tel qu'il est vu par le demandeur et les approbateurs au moment de leur entrée. Après la soumission, ils ne verront que les enregistrements qu'ils ont eux-mêmes modifiés — ils ne verront pas les mises à jour effectuées ultérieurement par d'autres personnes.

*   **Dernière version**

    Dans le processus d'approbation, le demandeur et les approbateurs voient toujours la version la plus récente de l'enregistrement tout au long du processus, quel que soit l'état de l'enregistrement avant leur opération. Une fois le processus terminé, ils verront la version finale de l'enregistrement.

## Nœud d'approbation

Dans un flux de travail d'approbation, vous devez utiliser le nœud dédié « Approbation » pour configurer la logique opérationnelle permettant aux approbateurs de traiter (approuver, rejeter ou retourner) l'approbation lancée. Le nœud « Approbation » ne peut être utilisé que dans les flux de travail d'approbation. Reportez-vous à [Nœud d'approbation](../nodes/approval.md) pour plus de détails.

:::info{title=Conseil}
Si un processus d'approbation ne contient aucun nœud « Approbation », le processus sera automatiquement approuvé.
:::

## Configuration de l'initiation de l'approbation

Après avoir configuré et activé un flux de travail d'approbation, vous pouvez lier ce flux de travail au bouton de soumission du formulaire de la collection correspondante, afin que les utilisateurs puissent lancer l'approbation lors de la soumission :

![Initier l'approbation_Lier le flux de travail](https://static-docs.nocobase.com/20251226110710.png)

Par la suite, la soumission de ce formulaire par l'utilisateur déclenchera le flux de travail d'approbation correspondant. Les données soumises seront non seulement enregistrées dans la collection correspondante, mais seront également capturées sous forme d'instantané dans le flux d'approbation pour consultation ultérieure par le personnel d'approbation.

:::info{title=Conseil}
Le bouton de lancement d'approbation ne prend actuellement en charge que le bouton « Soumettre » (ou « Enregistrer ») dans les formulaires d'ajout ou de mise à jour. Il ne prend pas en charge le bouton « Déclencher le flux de travail » (ce bouton ne peut être lié qu'à des « Événements d'action personnalisés »).
:::

## Centre des tâches à faire

Le centre des tâches à faire offre un point d'entrée unifié permettant aux utilisateurs de consulter et de traiter facilement leurs tâches. Les approbations lancées par l'utilisateur actuel et les tâches à faire sont accessibles via le centre des tâches à faire dans la barre d'outils supérieure, et les différents types de tâches peuvent être consultés via la navigation par catégorie sur la gauche.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Mes demandes

#### Consulter les approbations lancées

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Lancer directement une nouvelle approbation

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Mes tâches à faire

#### Liste des tâches à faire

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Détails de la tâche à faire

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Initiateur

#### Lancement depuis une collection

Pour lancer depuis un bloc de données, vous pouvez effectuer un appel comme suit (exemple avec le bouton de création de la table `posts`) :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' -d \
  '{
    "title": "Hello, world!",
    "content": "Ceci est un article de test."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Le paramètre d'URL `triggerWorkflows` est la clé du flux de travail ; plusieurs flux de travail sont séparés par des virgules. Cette clé peut être obtenue en survolant le nom du flux de travail en haut du canevas du flux de travail :

![Flux de travail_clé_méthode de consultation](https://static-docs.nocobase.com/20240426135108.png)

Une fois l'appel réussi, le flux de travail d'approbation de la table `posts` correspondante sera déclenché.

:::info{title="Conseil"}
Comme les appels externes doivent également être basés sur l'identité de l'utilisateur, lors d'un appel via l'API HTTP, les informations d'authentification doivent être fournies, tout comme pour les requêtes envoyées depuis l'interface normale, y compris l'en-tête `Authorization` ou le paramètre `token` (le jeton obtenu lors de la connexion), ainsi que l'en-tête `X-Role` (le nom du rôle actuel de l'utilisateur).
:::

Si vous devez déclencher des événements pour des données de relation un-à-un (le un-à-plusieurs n'est pas encore pris en charge) dans cette opération, vous pouvez utiliser `!` dans les paramètres pour spécifier les données de déclenchement du champ de relation :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' -d \
  '{
    "title": "Hello, world!",
    "content": "Ceci est un article de test.",
    "category": {
      "title": "Catégorie de test"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Une fois l'appel réussi, l'événement d'approbation de la table `categories` correspondante sera déclenché.

:::info{title="Conseil"}
Lors du déclenchement d'événements après opération via l'API HTTP, vous devez également faire attention à l'état d'activation du flux de travail et à la correspondance de la configuration de la collection, sinon l'appel pourrait échouer ou une erreur pourrait survenir.
:::

#### Lancement depuis le centre d'approbation

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' -d \
  '{
    "collectionName": "<nom de la collection>",
    "workflowId": <id du flux de travail>,
    "data": { "<champ>": "<valeur>" },
    "status": <statut initial de l'approbation>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Paramètres**

* `collectionName` : Nom de la collection cible pour lancer l'approbation, obligatoire.
* `workflowId` : ID du flux de travail utilisé pour lancer l'approbation, obligatoire.
* `data` : Champs de l'enregistrement de la collection créés lors du lancement de l'approbation, obligatoire.
* `status` : État de l'enregistrement créé lors du lancement de l'approbation, obligatoire. Les valeurs possibles incluent :
  * `0` : Brouillon, signifie enregistrer mais ne pas soumettre pour approbation.
  * `2` : Soumettre pour approbation, signifie que l'initiateur soumet la demande d'approbation et entre dans l'approbation.

#### Enregistrer et soumettre

Lorsqu'une approbation lancée (ou retirée) est à l'état de brouillon, vous pouvez l'enregistrer ou la soumettre à nouveau via l'interface suivante :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' -d \
  '{
    "data": { "<champ>": "<valeur>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<id de l'approbation>"
```

#### Obtenir la liste des approbations lancées

```bash
curl -X GET -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Retirer

L'initiateur peut retirer un enregistrement actuellement en cours d'approbation via l'interface suivante :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' -d \
  "http://localhost:3000/api/approvals:withdraw/<id de l'approbation>"
```

**Paramètres**

* `<id de l'approbation>` : ID de l'enregistrement d'approbation à retirer, obligatoire.

### Approbateur

Une fois que le processus d'approbation entre dans un nœud d'approbation, une tâche à faire est créée pour l'approbateur actuel. L'approbateur peut terminer la tâche d'approbation via l'interface ou via un appel à l'API HTTP.

#### Obtenir les enregistrements de traitement d'approbation

Les tâches à faire sont des enregistrements de traitement d'approbation. Vous pouvez obtenir tous les enregistrements de traitement d'approbation de l'utilisateur actuel via l'interface suivante :

```bash
curl -X GET -H 'Authorization: Bearer <votre token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Comme `approvalRecords` est une ressource de collection, vous pouvez également utiliser des conditions de requête générales telles que `filter`, `sort`, `pageSize` et `page`.

#### Obtenir un seul enregistrement de traitement d'approbation

```bash
curl -X GET -H 'Authorization: Bearer <votre token>' \
  "http://localhost:3000/api/approvalRecords:get/<id de l'enregistrement>"
```

#### Approuver et rejeter

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -d \
  '{
    "status": 2,
    "comment": "Cela me semble correct.",
    "data": { "<champ à modifier>": "<valeur>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<id de l'enregistrement>"
```

**Paramètres**

* `<id de l'enregistrement>` : ID de l'enregistrement à traiter, obligatoire.
* `status` : État du traitement de l'approbation, `2` signifie « Approuver », `-1` signifie « Rejeter », obligatoire.
* `comment` : Remarque sur le traitement de l'approbation, facultatif.
* `data` : Représente les modifications apportées à l'enregistrement de la collection où se trouve le nœud d'approbation actuel après l'approbation, facultatif (valable uniquement lors de l'approbation).

#### Retourner <Badge>v1.9.0+</Badge>

Avant la version v1.9.0, le retour utilisait la même interface que « Approuver » et « Rejeter », avec `"status": 1` pour représenter le retour.

À partir de la version v1.9.0, le retour dispose d'une interface séparée :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -d \
  '{
    "returnToNodeKey": "<clé du nœud>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<id de l'enregistrement>"
```

**Paramètres**

* `<id de l'enregistrement>` : ID de l'enregistrement à traiter, obligatoire.
* `returnToNodeKey` : Clé du nœud cible du retour, facultatif. Lorsqu'une portée de nœuds retournables est configurée dans le nœud, ce paramètre peut être utilisé pour spécifier vers quel nœud retourner. Si non configuré, ce paramètre n'a pas besoin de valeur, et le retour se fera par défaut au point de départ pour une nouvelle soumission par l'initiateur.

#### Transférer

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -d \
  '{
    "assignee": <id de l'utilisateur>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<id de l'enregistrement>"
```

**Paramètres**

* `<id de l'enregistrement>` : ID de l'enregistrement à traiter, obligatoire.
* `assignee` : ID de l'utilisateur vers lequel transférer, obligatoire.

#### Co-signer

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -d \
  '{
    "assignees": [<id de l'utilisateur>],
    "order": <ordre>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<id de l'enregistrement>"
```

**Paramètres**

* `<id de l'enregistrement>` : ID de l'enregistrement à traiter, obligatoire.
* `assignees` : Liste des ID d'utilisateurs à ajouter pour la co-signature, obligatoire.
* `order` : Ordre de la co-signature, `-1` indique avant « moi », `1` indique après « moi ».