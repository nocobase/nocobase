---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
title: "Événement d'action personnalisée"
description: "Déclencheur d'événement d'action personnalisée : associé à un bouton d'action personnalisée, déclenche le workflow au clic pour automatiser des opérations pilotées par bouton."
keywords: "workflow,événement d'action personnalisée,Custom Action,déclencheur de bouton,liaison de workflow,NocoBase"
---
# Événement d'action personnalisée

## Introduction

NocoBase intègre les opérations de données les plus courantes (création, suppression, modification, lecture, etc.). Lorsque ces opérations ne suffisent pas pour des besoins métier complexes, vous pouvez utiliser un événement d'action personnalisée dans un workflow et lier cet événement à un bouton « Déclencher le workflow » d'un bloc de page : à chaque clic de l'utilisateur, un workflow d'action personnalisée est déclenché.

## Créer le workflow

Lors de la création d'un workflow, sélectionnez « Événement d'action personnalisée » :

![Créer un workflow « Événement d'action personnalisée »](https://static-docs.nocobase.com/20240509091820.png)

## Configuration du déclencheur

### Type de contexte

> v.1.6.0+

Le type de contexte détermine sur quels boutons de bloc le workflow peut être lié :

* Sans contexte : c'est un événement global, peut être lié aux boutons d'action des panneaux d'action et des blocs de données ;
* Enregistrement unique : peut être lié aux boutons d'action des blocs de données comme les lignes de tableau, les formulaires, les détails ;
* Plusieurs enregistrements : peut être lié aux boutons d'opération en lot d'un tableau.

![Configuration du déclencheur_Type de contexte](https://static-docs.nocobase.com/20250215135808.png)

### Table de données

Lorsque le type de contexte est « Enregistrement unique » ou « Plusieurs enregistrements », vous devez sélectionner la table de données à laquelle lier le modèle de données :

![Configuration du déclencheur_Sélection de la table](https://static-docs.nocobase.com/20250215135919.png)

### Données de relation à utiliser

Si vous avez besoin d'utiliser dans le workflow les données associées à la ligne déclenchée, vous pouvez sélectionner ici des champs de relation profonds :

![Configuration du déclencheur_Sélection des données de relation à utiliser](https://static-docs.nocobase.com/20250215135955.png)

Ces champs seront automatiquement préchargés dans le contexte du workflow lorsque l'événement sera déclenché, pour pouvoir être utilisés dans le workflow.

## Configuration de l'action

Selon le type de contexte du workflow, la configuration des boutons d'action diffère selon les blocs.

### Sans contexte

> v1.6.0+

Dans les panneaux d'action et les autres blocs de données, vous pouvez ajouter un bouton « Déclencher le workflow » :

![Ajouter un bouton d'action au bloc_Panneau d'action](https://static-docs.nocobase.com/20250215221738.png)

![Ajouter un bouton d'action au bloc_Calendrier](https://static-docs.nocobase.com/20250215221942.png)

![Ajouter un bouton d'action au bloc_Gantt](https://static-docs.nocobase.com/20250215221810.png)

Une fois le bouton ajouté, liez-le au workflow sans contexte créé précédemment ; en prenant le bouton du panneau d'action en exemple :

![Lier le workflow au bouton_Panneau d'action](https://static-docs.nocobase.com/20250215222120.png)

![Sélectionner le workflow à lier_Sans contexte](https://static-docs.nocobase.com/20250215222234.png)

### Enregistrement unique

Dans n'importe quel bloc de données, vous pouvez ajouter un bouton « Déclencher le workflow » dans la barre d'actions sur un enregistrement unique : formulaire, ligne de tableau, détails, etc. :

![Ajouter un bouton d'action au bloc_Formulaire](https://static-docs.nocobase.com/20240509165428.png)

![Ajouter un bouton d'action au bloc_Ligne de tableau](https://static-docs.nocobase.com/20240509165340.png)

![Ajouter un bouton d'action au bloc_Détails](https://static-docs.nocobase.com/20240509165545.png)

Une fois le bouton ajouté, liez-le au workflow créé précédemment :

![Lier le workflow au bouton](https://static-docs.nocobase.com/20240509165631.png)

![Sélectionner le workflow à lier](https://static-docs.nocobase.com/20240509165658.png)

Cliquer sur ce bouton déclenche alors l'événement d'action personnalisée :

![Résultat du déclenchement par clic](https://static-docs.nocobase.com/20240509170453.png)

### Plusieurs enregistrements

> v1.6.0+

Dans la barre d'actions d'un bloc tableau, lors de l'ajout d'un bouton « Déclencher le workflow », une option supplémentaire apparaît pour choisir le type de contexte « Sans contexte » ou « Plusieurs enregistrements » :

![Ajouter un bouton d'action au bloc_Tableau](https://static-docs.nocobase.com/20250215222507.png)

Choisir « Sans contexte » correspond à un événement global et ne permet de lier que des workflows de type sans contexte.

Choisir « Plusieurs enregistrements » permet de lier un workflow de type plusieurs enregistrements, utilisable pour des opérations en lot après sélection multiple (actuellement, seul le tableau le prend en charge). La portée des workflows sélectionnables se limite alors à ceux configurés pour la table du bloc de données courant :

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Au moment du clic sur le bouton, vous devez avoir coché des lignes du tableau, sinon le workflow ne sera pas déclenché :

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Exemple

Par exemple, supposons une table « Échantillons » : pour les échantillons « Collectés » (statut), nous voulons fournir une action « Envoi à inspection » qui vérifie d'abord les informations de base de l'échantillon, puis génère un enregistrement « Suivi d'inspection », puis change le statut de l'échantillon en « Envoyé à inspection ». Cette série d'actions ne peut pas être réalisée par un simple clic sur les boutons CRUD : c'est un cas d'usage typique pour un événement d'action personnalisée.

Créez d'abord une table « Échantillons » et une table « Suivi d'inspection », puis saisissez quelques données de test dans la table des échantillons :

![Exemple_Table Échantillons](https://static-docs.nocobase.com/20240509172234.png)

Créez ensuite un workflow « Événement d'action personnalisée » ; si vous souhaitez un retour relativement immédiat sur l'opération, choisissez le mode synchrone (en mode synchrone, les nœuds asynchrones de type traitement manuel ne sont pas utilisables) :

![Exemple_Création du workflow](https://static-docs.nocobase.com/20240509173106.png)

Dans la configuration du déclencheur, sélectionnez la table « Échantillons » :

![Exemple_Configuration du déclencheur](https://static-docs.nocobase.com/20240509173148.png)

Selon les besoins métier, organisez la logique du processus ; par exemple, n'autoriser l'envoi à inspection que si le paramètre indicateur est supérieur à `90`, sinon afficher un message d'erreur :

![Exemple_Organisation de la logique métier](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Astuce}
Le nœud « [Message de réponse](../nodes/response-message.md) » peut être utilisé dans un événement d'action personnalisée synchrone pour renvoyer un message au client. Il n'est pas utilisable en mode asynchrone.
:::

Une fois le workflow configuré et activé, retournez sur l'interface du tableau et ajoutez un bouton « Déclencher le workflow » dans la colonne d'actions du tableau :

![Exemple_Ajout du bouton d'action](https://static-docs.nocobase.com/20240509174525.png)

Ensuite, dans le menu de configuration du bouton, choisissez de lier un workflow et ouvrez la popup de configuration :

![Exemple_Ouvrir la popup de liaison de workflow](https://static-docs.nocobase.com/20240509174633.png)

Ajoutez le workflow précédemment activé :

![Exemple_Sélection du workflow](https://static-docs.nocobase.com/20240509174723.png)

Après soumission, modifiez le texte du bouton avec le nom de l'opération, par exemple « Envoyer à inspection » : la configuration est terminée.

À l'utilisation, sélectionnez n'importe quelle ligne d'échantillon dans le tableau et cliquez sur « Envoyer à inspection » pour déclencher l'événement d'action personnalisée. Conformément à la logique configurée, si le paramètre indicateur est inférieur à 90, un message s'affiche :

![Exemple_Indicateur insuffisant pour l'envoi à inspection](https://static-docs.nocobase.com/20240509175026.png)

Si le paramètre indicateur est supérieur à 90, le processus s'exécute normalement, génère un enregistrement « Suivi d'inspection » et change le statut de l'échantillon en « Envoyé à inspection » :

![Exemple_Envoi à inspection réussi](https://static-docs.nocobase.com/20240509175247.png)

Voilà, un événement d'action personnalisée simple est terminé. De même, pour des opérations métier complexes telles que le traitement de commandes ou la soumission de rapports, vous pouvez utiliser des événements d'action personnalisée.

## Appel externe

Le déclenchement d'un événement d'action personnalisée n'est pas limité aux opérations dans l'interface utilisateur ; il peut aussi être déclenché via l'HTTP API. En particulier, l'événement d'action personnalisée fournit pour toutes les opérations de table un nouveau type d'opération `trigger` qui peut être appelé via l'API d'opération standard de NocoBase.

:::info{title="Astuce"}
Comme l'appel externe doit aussi être basé sur une identité utilisateur, lors d'un appel via l'HTTP API, comme pour les requêtes envoyées depuis l'interface, il faut fournir les informations d'authentification : en-tête `Authorization` ou paramètre `token` (token obtenu à la connexion), ainsi que l'en-tête `X-Role` (nom du rôle courant de l'utilisateur).
:::

### Sans contexte

Les workflows sans contexte doivent être déclenchés sur la ressource workflows :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Enregistrement unique

À l'instar du workflow déclenché par bouton dans l'exemple, vous pouvez l'appeler ainsi :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Comme l'opération porte sur une seule donnée, lors de l'appel sur des données existantes, vous devez spécifier l'ID de la ligne en remplaçant la portion `<:id>` de l'URL.

S'il s'agit d'un appel sur un formulaire (par exemple création ou mise à jour), pour un formulaire de création, vous pouvez ne pas passer d'ID, mais vous devez transmettre les données soumises pour servir de contexte d'exécution :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Pour un formulaire de mise à jour, il faut passer à la fois l'ID de la ligne et les données mises à jour :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Si l'ID et les données sont passés simultanément, la ligne correspondante à l'ID sera d'abord chargée, puis les propriétés de l'objet de données passées en paramètre écraseront la ligne d'origine pour produire le contexte de déclenchement final.

:::warning Attention
Si des données de relation sont passées, elles seront aussi écrasées ; en particulier lorsque le préchargement des données de relation est configuré, soyez prudent avec les données passées pour éviter qu'elles ne soient écrasées de façon inattendue.
:::

Par ailleurs, le paramètre d'URL `triggerWorkflows` est la key du workflow ; plusieurs workflows sont séparés par des virgules. Cette key peut être obtenue en survolant le nom du workflow en haut du canvas :

![Workflow_key_méthode de visualisation](https://static-docs.nocobase.com/20240426135108.png)

L'appel réussi déclenchera l'événement d'action personnalisée correspondant à la table `samples`.

:::info{title="Astuce"}
Lors du déclenchement d'événements après opération via l'HTTP API, soyez attentif à l'état d'activation du workflow et à la cohérence de la configuration de la table : sinon l'appel risque d'échouer ou de produire une erreur.
:::

### Plusieurs enregistrements

Similaire à l'appel sur enregistrement unique, mais les données passées ne nécessitent que plusieurs paramètres de clé primaire (`filterByTk[]`), sans la partie data :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Cet appel déclenchera l'événement d'action personnalisée en mode plusieurs enregistrements et utilisera les lignes d'ID 1 et 2 comme données du contexte du déclencheur.
