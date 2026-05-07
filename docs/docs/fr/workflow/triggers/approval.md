---
pkg: '@nocobase/plugin-workflow-approval'
title: "Approbation"
description: "Déclencheur d'approbation : à utiliser avec un processus d'approbation, déclenche un workflow lors de l'initiation manuelle puis lors de l'approbation/rejet, pour une automatisation pilotée par approbation."
keywords: "workflow,déclencheur d'approbation,Approval,processus d'approbation,approbation manuelle,NocoBase"
---
# Approbation

## Introduction

L'approbation est une forme de processus dédiée à l'initiation et au traitement manuels pour décider de l'état des données associées. Elle est généralement utilisée pour la gestion de processus d'automatisation de bureau ou d'autres affaires de décision humaine. Par exemple, vous pouvez créer et gérer des processus manuels pour des scénarios tels que les « demandes de congé », les « demandes de remboursement de frais » ou les « approbations d'achat de matières premières ».

Le plugin d'approbation fournit un type de workflow dédié (déclencheur) « Approbation (événement) » et un nœud « Approbation » spécifique à ce processus. En combinant ces éléments avec les tables et blocs personnalisés propres à NocoBase, vous pouvez créer et gérer rapidement et avec souplesse divers scénarios d'approbation.

## Créer un processus

Lors de la création d'un workflow, sélectionnez le type « Approbation » pour créer un processus d'approbation :

![Déclencheur d'approbation_Créer un workflow d'approbation](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Ensuite, dans l'interface de configuration du workflow, cliquez sur le déclencheur pour ouvrir la popup et procéder à des configurations supplémentaires.

## Configuration du déclencheur

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Lier une table de données

Le plugin d'approbation de NocoBase est conçu sur la base de la souplesse : il peut être utilisé avec n'importe quelle table de données personnalisée. Autrement dit, la configuration de l'approbation n'a pas besoin de redéfinir le modèle de données ; elle réutilise directement les tables déjà créées. C'est pourquoi, après être entré dans la configuration du déclencheur, vous devez d'abord sélectionner la table de données sur laquelle ce processus portera :

![Déclencheur d'approbation_Configuration du déclencheur_Sélection d'une table](https://static-docs.nocobase.com/20251226103223.png)

### Mode de déclenchement

Lors du lancement d'une approbation pour des données métier, deux modes de déclenchement sont possibles :

*   **Avant l'enregistrement des données**

    L'approbation est lancée avant l'enregistrement des données soumises ; adapté aux scénarios où les données ne doivent être enregistrées qu'après l'approbation. Dans ce mode, les données au moment du lancement de l'approbation sont uniquement temporaires ; elles ne sont enregistrées dans la table que si l'approbation est validée.

*   **Après l'enregistrement des données**

    L'approbation est lancée après l'enregistrement des données soumises ; adapté aux scénarios où les données peuvent être enregistrées d'abord puis soumises à approbation. Dans ce mode, les données au moment du lancement de l'approbation sont déjà enregistrées dans la table correspondante, et les modifications apportées pendant le processus d'approbation sont également enregistrées.

### Emplacement de l'initiation de l'approbation

Vous pouvez choisir où l'approbation peut être initiée dans le système :

*   **Uniquement depuis les blocs de données**

    Vous pouvez lier l'action de n'importe quel bloc formulaire de cette table à ce workflow pour lancer l'approbation, et traiter/suivre le processus dans le bloc d'approbation d'un enregistrement unique. Cela convient généralement aux données métier.

*   **Depuis les blocs de données et le centre des tâches**

    Outre les blocs de données, vous pouvez aussi lancer et traiter une approbation depuis le centre des tâches global. Cela convient généralement aux données administratives.

### Qui peut initier l'approbation

Vous pouvez configurer des permissions basées sur la portée des utilisateurs pour décider qui peut lancer cette approbation :

*   **Tous les utilisateurs**

    Tous les utilisateurs du système peuvent lancer cette approbation.

*   **Uniquement les utilisateurs sélectionnés**

    Seuls les utilisateurs de la portée spécifiée peuvent lancer cette approbation ; sélection multiple possible.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Configuration de l'interface du formulaire de l'initiateur

Enfin, vous devez configurer l'interface du formulaire de l'initiateur. Cette interface est utilisée pour la soumission depuis le bloc du centre d'approbation et pour la nouvelle soumission après un retrait par l'utilisateur. Cliquez sur le bouton de configuration pour ouvrir la popup :

![Déclencheur d'approbation_Configuration du déclencheur_Formulaire initiateur](https://static-docs.nocobase.com/20251226130239.png)

Vous pouvez ajouter à l'interface de l'initiateur un formulaire de saisie basé sur la table liée, ou un texte explicatif (Markdown) pour le guider. L'ajout d'un formulaire est obligatoire ; sinon, l'initiateur ne pourra effectuer aucune opération une fois entré dans cette interface.

Une fois le bloc formulaire ajouté, comme dans une interface de configuration de formulaire ordinaire, vous pouvez ajouter les composants de champ de la table correspondante et les organiser librement pour structurer le contenu à remplir :

![Déclencheur d'approbation_Configuration du déclencheur_Formulaire initiateur_Configuration des champs](https://static-docs.nocobase.com/20251226130339.png)

À la différence du bouton de soumission directe, vous pouvez aussi ajouter un bouton « Enregistrer le brouillon » pour prendre en charge un workflow de stockage temporaire :

![Déclencheur d'approbation_Configuration du déclencheur_Formulaire initiateur_Configuration des actions_Enregistrer](https://static-docs.nocobase.com/20251226130512.png)

Si un processus d'approbation autorise l'initiateur à se rétracter, il faut activer le bouton « Retirer » dans la configuration de l'interface initiateur :

![Déclencheur d'approbation_Configuration du déclencheur_Autoriser le retrait](https://static-docs.nocobase.com/20251226130637.png)

Une fois activé, l'approbation lancée par ce processus peut être retirée par l'initiateur tant qu'aucun approbateur ne l'a traitée. Mais une fois traitée par un approbateur configuré dans un nœud d'approbation suivant, elle ne peut plus être retirée.

:::info{title=Astuce}
Après avoir activé ou supprimé le bouton de retrait, vous devez cliquer sur enregistrer dans la popup de configuration du déclencheur pour que la modification prenne effet.
:::

### Carte « Mes demandes » <Badge>2.0+</Badge>

Permet de configurer les cartes de tâches de la liste « Mes demandes » du centre des tâches.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Vous pouvez configurer librement les champs métier à afficher sur la carte (à l'exception des champs de relation) ainsi que les informations relatives à l'approbation.

Une fois la demande d'approbation créée, la carte de tâche personnalisée apparaîtra dans la liste du centre des tâches :

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Mode d'affichage des enregistrements dans le processus

*   **Instantané**

    Pendant le processus d'approbation, le demandeur et les approbateurs voient l'état de l'enregistrement au moment de leur entrée, et après soumission ne voient que les enregistrements qu'ils ont eux-mêmes modifiés — ils ne voient pas les mises à jour ultérieures effectuées par d'autres.

*   **Dernière version**

    Pendant le processus d'approbation, le demandeur et les approbateurs voient en permanence la dernière version de l'enregistrement, quel que soit son état avant leur opération. Une fois le processus terminé, ils voient la version finale de l'enregistrement.

## Nœud d'approbation

Dans un workflow d'approbation, vous devez utiliser le nœud dédié « Approbation » pour configurer la logique opérationnelle de traitement (approuver, rejeter ou retourner) par les approbateurs ; le nœud « Approbation » ne peut être utilisé que dans un processus d'approbation. Voir [Nœud d'approbation](../nodes/approval.md) pour les détails.

:::info{title=Astuce}
Si un processus d'approbation ne contient aucun nœud « Approbation », il sera approuvé automatiquement.
:::

## Configuration du lancement de l'approbation

Une fois un workflow d'approbation configuré et activé, vous pouvez lier ce workflow au bouton de soumission du formulaire de la table correspondante, afin que les utilisateurs puissent lancer l'approbation au moment de la soumission :

![Lancer l'approbation_Lier le workflow](https://static-docs.nocobase.com/20251226110710.png)

Ensuite, la soumission du formulaire par l'utilisateur déclenchera le workflow d'approbation correspondant ; les données soumises seront enregistrées dans la table correspondante mais aussi capturées en instantané dans le flux d'approbation pour la consultation ultérieure par les approbateurs.

:::info{title=Astuce}
Le bouton de lancement d'approbation ne prend actuellement en charge que les boutons « Soumettre » (ou « Enregistrer ») des formulaires de création ou de mise à jour ; le bouton « Déclencher le workflow » n'est pas pris en charge (ce dernier ne peut être lié qu'à un « Événement d'action personnalisée »).
:::

## Centre des tâches

Le centre des tâches offre un point d'entrée unifié pour que les utilisateurs consultent et traitent leurs tâches en attente. Les approbations lancées par l'utilisateur courant et les tâches en attente sont accessibles via le centre des tâches dans la barre d'outils en haut, et la navigation par catégorie sur la gauche permet de consulter différents types de tâches.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Mes demandes

#### Voir les approbations lancées

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Lancer directement une nouvelle approbation

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Mes tâches

#### Liste des tâches

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Détails d'une tâche

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Initiateur

#### Lancement depuis une table

Pour lancer depuis un bloc de données, vous pouvez appeler comme suit (exemple avec le bouton de création de la table `posts`) :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Le paramètre d'URL `triggerWorkflows` correspond à la key du workflow ; plusieurs workflows sont séparés par des virgules. Cette key s'obtient en survolant le nom du workflow en haut du canvas du workflow :

![Workflow_key_méthode de visualisation](https://static-docs.nocobase.com/20240426135108.png)

L'appel réussi déclenchera le workflow d'approbation correspondant à la table `posts`.

:::info{title="Astuce"}
Comme l'appel externe doit aussi être basé sur une identité utilisateur, lors d'un appel via l'HTTP API, comme pour une requête envoyée depuis l'interface, il faut fournir les informations d'authentification : en-tête `Authorization` ou paramètre `token` (le token obtenu à la connexion), ainsi que l'en-tête `X-Role` (le nom du rôle courant de l'utilisateur).
:::

Si vous souhaitez déclencher des événements sur des données de relation un-à-un (le un-à-plusieurs n'est pas pris en charge pour l'instant) lors de cette opération, vous pouvez utiliser `!` dans les paramètres pour spécifier les données de déclenchement du champ relationnel :

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

L'appel réussi déclenchera l'événement d'approbation correspondant à la table `categories`.

:::info{title="Astuce"}
Lors du déclenchement d'événements après opération via l'HTTP API, soyez attentif à l'état d'activation du workflow et à la cohérence de la configuration de la table : sinon l'appel risque d'échouer ou de produire une erreur.
:::

#### Lancement depuis le centre d'approbation

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

* `collectionName` : nom de la table cible pour le lancement de l'approbation ; obligatoire.
* `workflowId` : ID du workflow utilisé pour lancer l'approbation ; obligatoire.
* `data` : valeurs des champs de l'enregistrement créé lors du lancement ; obligatoire.
* `status` : état de l'enregistrement lors du lancement ; obligatoire. Valeurs possibles :
  * `0` : brouillon, signifie enregistrer mais ne pas soumettre l'approbation.
  * `2` : soumis pour approbation, signifie que l'initiateur soumet la demande et entre dans le processus.

#### Enregistrer et soumettre

Lorsqu'une approbation lancée (ou retirée) est à l'état brouillon, vous pouvez l'enregistrer ou la soumettre à nouveau via l'endpoint suivant :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Récupérer la liste des approbations lancées

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Retirer

L'initiateur peut retirer un enregistrement actuellement en cours d'approbation via l'endpoint suivant :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Paramètres**

* `<approval id>` : ID de l'enregistrement d'approbation à retirer ; obligatoire.

### Approbateur

Lorsque le processus entre dans un nœud d'approbation, une tâche est créée pour l'approbateur courant. L'approbateur peut traiter la tâche d'approbation via l'interface ou via l'HTTP API.

#### Récupérer les enregistrements de traitement d'approbation

Une tâche est un enregistrement de traitement d'approbation ; vous pouvez récupérer tous les enregistrements de traitement d'approbation de l'utilisateur courant via l'endpoint suivant :

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

`approvalRecords` étant une ressource de table, vous pouvez utiliser les conditions de requête classiques telles que `filter`, `sort`, `pageSize` et `page`.

#### Récupérer un seul enregistrement de traitement

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

* `<record id>` : ID de l'enregistrement à traiter ; obligatoire.
* `status` : état du traitement ; `2` signifie « approuvé », `-1` signifie « rejeté » ; obligatoire.
* `comment` : commentaire du traitement ; optionnel.
* `data` : représente les modifications à apporter à l'enregistrement de la table du nœud d'approbation courant après l'approbation ; optionnel (valable uniquement en cas d'approbation).

#### Retourner <Badge>v1.9.0+</Badge>

Avant la v1.9.0, le retour utilisait le même endpoint que « approuver » et « rejeter », avec `"status": 1` pour signifier le retour.

Depuis la v1.9.0, le retour dispose d'un endpoint dédié :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Paramètres**

* `<record id>` : ID de l'enregistrement à traiter ; obligatoire.
* `returnToNodeKey` : key du nœud cible du retour ; optionnel. Lorsqu'une plage de nœuds de retour est configurée dans le nœud, ce paramètre permet de spécifier vers quel nœud retourner. S'il n'est pas configuré, ce paramètre n'a pas besoin d'être passé : le retour se fera par défaut au point de départ pour une nouvelle soumission par l'initiateur.

#### Déléguer

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Paramètres**

* `<record id>` : ID de l'enregistrement à traiter ; obligatoire.
* `assignee` : ID de l'utilisateur à qui déléguer ; obligatoire.

#### Co-signature

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Paramètres**

* `<record id>` : ID de l'enregistrement à traiter ; obligatoire.
* `assignees` : liste des ID utilisateurs ajoutés en co-signature ; obligatoire.
* `order` : ordre de la co-signature ; `-1` indique avant « moi », `1` indique après « moi ».
