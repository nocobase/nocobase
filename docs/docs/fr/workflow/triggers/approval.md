---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Approbation

## Introduction

L'approbation est une forme de processus spécifiquement conçue pour être initiée et traitée manuellement afin de déterminer l'état de données pertinentes. Elle est généralement utilisée pour la gestion de processus d'automatisation de bureau ou d'autres tâches de décision humaine. Par exemple, vous pouvez créer et gérer des **flux de travail** manuels pour des scénarios tels que les « demandes de congé », les « approbations de remboursement de dépenses » et les « approbations d'achat de matières premières ».

Le **plugin** d'Approbation offre un type de **flux de travail** (déclencheur) dédié, « Approbation (événement) », ainsi qu'un nœud « Approbation » spécifique à ce processus. En combinant ces éléments avec les **collections** et les blocs personnalisés uniques de NocoBase, vous pouvez créer et gérer rapidement et de manière flexible divers scénarios d'approbation.

## Créer un flux de travail

Lorsque vous créez un **flux de travail**, sélectionnez le type « Approbation » pour créer un processus d'approbation :

![Approval Trigger_Create Approval Workflow](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Ensuite, dans l'interface de configuration du **flux de travail**, cliquez sur le déclencheur pour ouvrir une fenêtre contextuelle et effectuer des configurations supplémentaires.

## Configuration du déclencheur

### Lier une collection

Le **plugin** d'Approbation de NocoBase est conçu pour la flexibilité et peut être utilisé avec n'importe quelle **collection** personnalisée. Cela signifie que la configuration de l'approbation n'a pas besoin de reconfigurer le modèle de données, mais réutilise directement une **collection** existante. Par conséquent, après être entré dans la configuration du déclencheur, vous devez d'abord sélectionner une **collection** pour déterminer quelle création ou mise à jour de données de **collection** déclenchera ce **flux de travail** :

![Approval Trigger_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Ensuite, dans le formulaire de création (ou de modification) des données de la **collection** correspondante, liez ce **flux de travail** au bouton de soumission :

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Après cela, lorsqu'un utilisateur soumet ce formulaire, le **flux de travail** d'approbation correspondant sera déclenché. Les données soumises sont non seulement enregistrées dans la **collection** correspondante, mais elles sont également capturées (sous forme d'instantané) dans le processus d'approbation pour que les approbateurs ultérieurs puissent les consulter et les utiliser.

### Retrait

Si un processus d'approbation permet à l'initiateur de le retirer, vous devez activer le bouton « Retirer » dans la configuration de l'interface de l'initiateur :

![Approval Trigger_Trigger Configuration_Allow Withdraw](https://static-docs.nocobase.com/20251029232544.png)

Une fois activée, une approbation initiée par ce **flux de travail** peut être retirée par l'initiateur avant qu'un approbateur ne la traite. Cependant, après qu'un approbateur d'un nœud d'approbation ultérieur l'ait traitée, elle ne pourra plus être retirée.

:::info{title=Conseil}
Après avoir activé ou supprimé le bouton de retrait, vous devez cliquer sur « Enregistrer » et « Soumettre » dans la fenêtre contextuelle de configuration du déclencheur pour que les modifications prennent effet.
:::

### Configuration de l'interface du formulaire de l'initiateur

Enfin, vous devez configurer l'interface du formulaire de l'initiateur. Cette interface sera utilisée pour les actions de soumission lors de l'initiation depuis le bloc du centre d'approbation et lors de la réinitiation après un retrait. Cliquez sur le bouton de configuration pour ouvrir la fenêtre contextuelle :

![Approval Trigger_Trigger Configuration_Initiator Form](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Vous pouvez ajouter à l'interface de l'initiateur un formulaire de saisie basé sur la **collection** liée, ou un texte descriptif (Markdown) pour des invites et des conseils. Le formulaire est obligatoire ; sinon, l'initiateur ne pourra effectuer aucune action après être entré dans cette interface.

Après avoir ajouté un bloc de formulaire, comme dans une interface de configuration de formulaire classique, vous pouvez ajouter des composants de champ de la **collection** correspondante et les organiser comme vous le souhaitez pour structurer le contenu à remplir dans le formulaire :

![Approval Trigger_Trigger Configuration_Initiator Form_Field Configuration](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

En plus du bouton de soumission directe, vous pouvez également ajouter un bouton d'action « Enregistrer comme brouillon » pour prendre en charge un processus de stockage temporaire :

![Approval Trigger_Trigger Configuration_Initiator Form_Action Configuration](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Nœud d'approbation

Dans un **flux de travail** d'approbation, vous devez utiliser le nœud « Approbation » dédié pour configurer la logique opérationnelle permettant aux approbateurs de traiter (approuver, rejeter ou retourner) l'approbation initiée. Le nœud « Approbation » ne peut être utilisé que dans les **flux de travail** d'approbation. Consultez le [Nœud d'approbation](../nodes/approval.md) pour plus de détails.

## Configuration de l'initiation d'approbation

Après avoir configuré et activé un **flux de travail** d'approbation, vous pouvez le lier au bouton de soumission du formulaire de la **collection** correspondante, permettant ainsi aux utilisateurs d'initier une approbation lors de la soumission :

![Initiate Approval_Bind Workflow](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Après avoir lié le **flux de travail**, lorsqu'un utilisateur soumet le formulaire actuel, une approbation est initiée.

:::info{title=Conseil}
Actuellement, le bouton pour initier une approbation ne prend en charge que le bouton « Soumettre » (ou « Enregistrer ») dans un formulaire de création ou de mise à jour. Il ne prend pas en charge le bouton « Soumettre au **flux de travail** » (lequel ne peut être lié qu'à un « Événement après action »).
:::

## Centre des tâches à faire

Le Centre des tâches à faire offre un point d'entrée unifié permettant aux utilisateurs de consulter et de traiter leurs tâches en attente. Les approbations initiées par l'utilisateur actuel et ses tâches en attente sont accessibles via le Centre des tâches à faire dans la barre d'outils supérieure, et les différents types de tâches en attente peuvent être consultés via la navigation latérale gauche.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Mes soumissions

#### Afficher les approbations soumises

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Initier directement une nouvelle approbation

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Mes tâches à faire

#### Liste des tâches à faire

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Détails des tâches à faire

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Initiateur

#### Initier depuis une collection

Pour initier depuis un bloc de données, vous pouvez effectuer un appel comme suit (en prenant l'exemple du bouton de création de la **collection** `posts`) :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Ici, le paramètre d'URL `triggerWorkflows` est la clé du **flux de travail** ; plusieurs clés de **flux de travail** sont séparées par des virgules. Cette clé peut être obtenue en survolant le nom du **flux de travail** en haut du canevas du **flux de travail** :

![Workflow_Key_View_Method](https://static-docs.nocobase.com/20240426135108.png)

Après un appel réussi, le **flux de travail** d'approbation de la **collection** `posts` correspondante sera déclenché.

:::info{title="Conseil"}
Étant donné que les appels externes doivent également être basés sur l'identité de l'utilisateur, lors d'un appel via l'API HTTP, tout comme les requêtes envoyées depuis l'interface régulière, des informations d'authentification doivent être fournies, y compris l'en-tête `Authorization` ou le paramètre `token` (le jeton obtenu lors de la connexion), et l'en-tête `X-Role` (le nom du rôle actuel de l'utilisateur).
:::

Si vous devez déclencher un événement pour des données liées en relation un-à-un dans cette action (le un-à-plusieurs n'est pas encore pris en charge), vous pouvez utiliser `!` dans le paramètre pour spécifier les données de déclenchement pour le champ d'association :

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

Après un appel réussi, l'événement d'approbation pour la **collection** `categories` correspondante sera déclenché.

:::info{title="Conseil"}
Lorsque vous déclenchez un événement après action via l'API HTTP, vous devez également prêter attention à l'état d'activation du **flux de travail** et à la correspondance de la configuration de la **collection** ; sinon, l'appel pourrait échouer ou entraîner une erreur.
:::

#### Initier depuis le Centre d'approbation

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Paramètres**

*   `collectionName` : Le nom de la **collection** cible pour l'initiation de l'approbation. Obligatoire.
*   `workflowId` : L'ID du **flux de travail** utilisé pour initier l'approbation. Obligatoire.
*   `data` : Les champs de l'enregistrement de la **collection** créé lors de l'initiation de l'approbation. Obligatoire.
*   `status` : Le statut de l'enregistrement créé lors de l'initiation de l'approbation. Obligatoire. Les valeurs possibles sont :
    *   `0` : Brouillon, indique l'enregistrement sans soumission pour approbation.
    *   `1` : Soumettre pour approbation, indique que l'initiateur soumet la demande d'approbation, entrant dans le processus d'approbation.

#### Enregistrer et soumettre

Lorsqu'une approbation initiée (ou retirée) est à l'état de brouillon, vous pouvez l'enregistrer ou la soumettre à nouveau via l'API suivante :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Obtenir la liste des approbations soumises

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Retirer

L'initiateur peut retirer un enregistrement actuellement en cours d'approbation via l'API suivante :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Paramètres**

*   `<approval id>` : L'ID de l'enregistrement d'approbation à retirer. Obligatoire.

### Approbateur

Une fois que le **flux de travail** d'approbation entre dans un nœud d'approbation, une tâche à faire est créée pour l'approbateur actuel. L'approbateur peut accomplir la tâche d'approbation via l'interface ou en appelant l'API HTTP.

#### Obtenir les enregistrements d'approbation

Les tâches à faire sont des enregistrements d'approbation. Vous pouvez obtenir tous les enregistrements d'approbation de l'utilisateur actuel via l'API suivante :

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Ici, `approvalRecords` est une ressource de **collection**, vous pouvez donc utiliser des conditions de requête courantes telles que `filter`, `sort`, `pageSize` et `page`.

#### Obtenir un seul enregistrement d'approbation

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Approuver et rejeter

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Paramètres**

*   `<record id>` : L'ID de l'enregistrement à traiter pour approbation. Obligatoire.
*   `status` : Le statut du processus d'approbation. `2` pour « Approuver », `-1` pour « Rejeter ». Obligatoire.
*   `comment` : Remarques pour le processus d'approbation. Facultatif.
*   `data` : Modifications apportées à l'enregistrement de la **collection** au niveau du nœud d'approbation actuel après approbation. Facultatif (uniquement effectif en cas d'approbation).

#### Retourner <Badge>v1.9.0+</Badge>

Avant la version v1.9.0, le retour utilisait la même API que l'« Approbation » et le « Rejet », avec `"status": 1` représentant un retour.

À partir de la version v1.9.0, le retour dispose d'une API distincte :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Paramètres**

*   `<record id>` : L'ID de l'enregistrement à traiter pour approbation. Obligatoire.
*   `returnToNodeKey` : La clé du nœud cible vers lequel retourner. Facultatif. Lorsqu'une plage de nœuds de retour est configurée dans le nœud, ce paramètre peut être utilisé pour spécifier à quel nœud retourner. Si non configuré, ce paramètre n'a pas besoin d'être transmis, et le système retournera par défaut au point de départ pour que l'initiateur puisse soumettre à nouveau.

#### Déléguer

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Paramètres**

*   `<record id>` : L'ID de l'enregistrement à traiter pour approbation. Obligatoire.
*   `assignee` : L'ID de l'utilisateur à qui déléguer. Obligatoire.

#### Ajouter un signataire

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Paramètres**

*   `<record id>` : L'ID de l'enregistrement à traiter pour approbation. Obligatoire.
*   `assignees` : Une liste d'ID d'utilisateurs à ajouter comme signataires. Obligatoire.
*   `order` : L'ordre du signataire ajouté. `-1` indique avant « moi », `1` indique après « moi ».