---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Événement d'action personnalisée

## Introduction

NocoBase intègre des actions de données courantes (ajout, suppression, modification, consultation, etc.). Lorsque ces actions ne suffisent pas pour des besoins métier complexes, vous pouvez utiliser des événements d'action personnalisée dans un flux de travail. En liant cet événement à un bouton "Déclencher le flux de travail" dans un bloc de page, un flux de travail d'action personnalisée sera déclenché lorsque l'utilisateur cliquera dessus.

## Créer un flux de travail

Lors de la création d'un flux de travail, sélectionnez "Événement d'action personnalisée" :

![Créer un flux de travail "Événement d'action personnalisée"](https://static-docs.nocobase.com/20240509091820.png)

## Configuration du déclencheur

### Type de contexte

> v.1.6.0+

Le type de contexte détermine les boutons de bloc auxquels le flux de travail peut être lié :

*   Pas de contexte : Un événement global qui peut être lié aux boutons d'action de la barre d'actions et des blocs de données.
*   Enregistrement unique : Peut être lié aux boutons d'action des blocs de données tels que les lignes de tableau, les formulaires et les détails.
*   Plusieurs enregistrements : Peut être lié aux boutons d'action en masse d'un tableau.

![Configuration du déclencheur_Type de contexte](https://static-docs.nocobase.com/20250215135808.png)

### collection

Lorsque le type de contexte est Enregistrement unique ou Plusieurs enregistrements, vous devez sélectionner la collection à laquelle lier le modèle de données :

![Configuration du déclencheur_Sélectionner la collection](https://static-docs.nocobase.com/20250215135919.png)

### Données d'association à utiliser

Si vous devez utiliser les données d'association de la ligne de données déclenchée dans le flux de travail, vous pouvez sélectionner ici les champs d'association profonds :

![Configuration du déclencheur_Sélectionner les données d'association à utiliser](https://static-docs.nocobase.com/20250215135955.png)

Ces champs seront automatiquement préchargés dans le contexte du flux de travail après le déclenchement de l'événement, les rendant ainsi disponibles pour une utilisation dans le flux de travail.

## Configuration de l'action

La configuration des boutons d'action dans les différents blocs varie en fonction du type de contexte configuré dans le flux de travail.

### Pas de contexte

> v.1.6.0+

Dans la barre d'actions et les autres blocs de données, vous pouvez ajouter un bouton "Déclencher le flux de travail" :

![Ajouter un bouton d'action au bloc_Barre d'actions](https://static-docs.nocobase.com/20250215221738.png)

![Ajouter un bouton d'action au bloc_Calendrier](https://static-docs.nocobase.com/20250215221942.png)

![Ajouter un bouton d'action au bloc_Diagramme de Gantt](https://static-docs.nocobase.com/20250215221810.png)

Après avoir ajouté le bouton, liez le flux de travail sans contexte créé précédemment. Voici un exemple utilisant un bouton dans la barre d'actions :

![Lier le flux de travail au bouton_Barre d'actions](https://static-docs.nocobase.com/20250215222120.png)

![Sélectionner le flux de travail à lier_Pas de contexte](https://static-docs.nocobase.com/20250215222234.png)

### Enregistrement unique

Dans n'importe quel bloc de données, un bouton "Déclencher le flux de travail" peut être ajouté à la barre d'actions pour un enregistrement unique, par exemple dans les formulaires, les lignes de tableau, les détails, etc. :

![Ajouter un bouton d'action au bloc_Formulaire](https://static-docs.nocobase.com/20240509165428.png)

![Ajouter un bouton d'action au bloc_Ligne de tableau](https://static-docs.nocobase.com/20240509165340.png)

![Ajouter un bouton d'action au bloc_Détails](https://static-docs.nocobase.com/20240509165545.png)

Après avoir ajouté le bouton, liez le flux de travail créé précédemment :

![Lier le flux de travail au bouton](https://static-docs.nocobase.com/20240509165631.png)

![Sélectionner le flux de travail à lier](https://static-docs.nocobase.com/20240509165658.png)

Ensuite, un clic sur ce bouton déclenchera l'événement d'action personnalisée :

![Résultat du clic sur le bouton](https://static-docs.nocobase.com/20240509170453.png)

### Plusieurs enregistrements

> v.1.6.0+

Dans la barre d'actions d'un bloc de tableau, lorsque vous ajoutez un bouton "Déclencher le flux de travail", une option supplémentaire vous permet de sélectionner le type de contexte : "Pas de contexte" ou "Plusieurs enregistrements" :

![Ajouter un bouton d'action au bloc_Tableau](https://static-docs.nocobase.com/20250215222507.png)

Lorsque "Pas de contexte" est sélectionné, il s'agit d'un événement global et ne peut être lié qu'à des flux de travail de type "Pas de contexte".

Lorsque "Plusieurs enregistrements" est sélectionné, vous pouvez lier un flux de travail de type "Plusieurs enregistrements", qui peut être utilisé pour des actions en masse après avoir sélectionné plusieurs enregistrements (actuellement pris en charge uniquement par les tableaux). Les flux de travail disponibles sont limités à ceux configurés pour correspondre à la collection du bloc de données actuel :

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Lorsque vous cliquez sur le bouton pour déclencher l'action, certaines lignes de données du tableau doivent être cochées ; sinon, le flux de travail ne sera pas déclenché :

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Exemple

Par exemple, nous avons une collection "Échantillons". Pour les échantillons dont le statut est "Collecté", nous devons proposer une action "Soumettre pour inspection". Cette action vérifiera d'abord les informations de base de l'échantillon, puis générera un "Enregistrement d'inspection" et enfin modifiera le statut de l'échantillon en "Soumis". Cette série de processus ne peut pas être réalisée par de simples clics sur des boutons "ajouter, supprimer, modifier, consulter", c'est pourquoi un événement d'action personnalisée peut être utilisé pour l'implémenter.

Tout d'abord, créez une collection "Échantillons" et une collection "Enregistrements d'inspection", puis saisissez des données de test de base dans la collection "Échantillons" :

![Exemple_Collection Échantillons](https://static-docs.nocobase.com/20240509172234.png)

Ensuite, créez un flux de travail "Événement d'action personnalisée". Si vous avez besoin d'un retour d'information rapide sur le processus d'opération, vous pouvez choisir le mode synchrone (en mode synchrone, vous ne pouvez pas utiliser de nœuds de type asynchrone comme le traitement manuel) :

![Exemple_Créer un flux de travail](https://static-docs.nocobase.com/20240509173106.png)

Dans la configuration du déclencheur, sélectionnez "Échantillons" pour la collection :

![Exemple_Configuration du déclencheur](https://static-docs.nocobase.com/20240509173148.png)

Organisez la logique du processus en fonction des exigences métier. Par exemple, n'autorisez la soumission pour inspection que si le paramètre de l'indicateur est supérieur à `90` ; sinon, affichez un message pertinent :

![Exemple_Organisation de la logique métier](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Conseil}
Le nœud "[Message de réponse](../nodes/response-message.md)" peut être utilisé dans les événements d'action personnalisée synchrones pour renvoyer un message d'information au client. Il ne peut pas être utilisé en mode asynchrone.
:::

Après avoir configuré et activé le flux de travail, revenez à l'interface du tableau et ajoutez un bouton "Déclencher le flux de travail" dans la colonne d'actions du tableau :

![Exemple_Ajouter un bouton d'action](https://static-docs.nocobase.com/20240509174525.png)

Ensuite, dans le menu de configuration du bouton, choisissez de lier un flux de travail et ouvrez la fenêtre contextuelle de configuration :

![Exemple_Ouvrir la fenêtre contextuelle de liaison de flux de travail](https://static-docs.nocobase.com/20240509174633.png)

Ajoutez le flux de travail activé précédemment :

![Exemple_Sélectionner le flux de travail](https://static-docs.nocobase.com/20240509174723.png)

Après avoir soumis, modifiez le texte du bouton pour qu'il corresponde au nom de l'action, par exemple "Soumettre pour inspection". Le processus de configuration est maintenant terminé.

Pour l'utiliser, sélectionnez n'importe quelle donnée d'échantillon dans le tableau et cliquez sur le bouton "Soumettre pour inspection" pour déclencher l'événement d'action personnalisée. Conformément à la logique organisée précédemment, si le paramètre de l'indicateur de l'échantillon est inférieur à 90, le message suivant s'affichera après le clic :

![Exemple_L'indicateur ne satisfait pas aux critères de soumission](https://static-docs.nocobase.com/20240509175026.png)

Si le paramètre de l'indicateur est supérieur à 90, le processus s'exécutera normalement, générant un "Enregistrement d'inspection" et modifiant le statut de l'échantillon en "Soumis" :

![Exemple_Soumission réussie](https://static-docs.nocobase.com/20240509175247.png)

À ce stade, un événement d'action personnalisée simple est terminé. De même, pour les entreprises ayant des opérations complexes telles que le traitement des commandes ou la soumission de rapports, les événements d'action personnalisée peuvent être utilisés pour leur mise en œuvre.

## Appel externe

Le déclenchement des événements d'action personnalisée ne se limite pas aux actions de l'interface utilisateur ; il peut également être déclenché via des appels d'API HTTP. Plus précisément, les événements d'action personnalisée offrent un nouveau type d'action pour toutes les actions de collection afin de déclencher des flux de travail : `trigger`, qui peut être appelé en utilisant l'API d'action standard de NocoBase.

Un flux de travail déclenché par un bouton, comme dans l'exemple, peut être appelé de cette manière :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Étant donné que cette action concerne un enregistrement unique, lors de son appel sur des données existantes, vous devez spécifier l'ID de la ligne de données, en remplaçant la partie `<:id>` dans l'URL.

Si l'appel est destiné à un formulaire (par exemple pour la création ou la mise à jour), vous pouvez omettre l'ID pour un formulaire qui crée de nouvelles données, mais vous devez transmettre les données soumises comme contexte d'exécution :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Pour un formulaire de mise à jour, vous devez transmettre à la fois l'ID de la ligne de données et les données mises à jour :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Si un ID et des données sont transmis simultanément, la ligne de données correspondant à l'ID sera d'abord chargée, puis les propriétés de l'objet de données transmis seront utilisées pour écraser la ligne de données originale afin d'obtenir le contexte de données de déclenchement final.

:::warning{title="Attention"}
Si des données d'association sont transmises, elles seront également écrasées. Soyez particulièrement prudent lors du traitement des données entrantes si le préchargement des éléments de données d'association est configuré, afin d'éviter des écrasements inattendus des données d'association.
:::

De plus, le paramètre d'URL `triggerWorkflows` est la clé du flux de travail ; plusieurs clés de flux de travail sont séparées par des virgules. Cette clé peut être obtenue en survolant le nom du flux de travail en haut du canevas du flux de travail :

![Flux de travail_Clé_Méthode d'affichage](https://static-docs.nocobase.com/20240426135108.png)

Après un appel réussi, l'événement d'action personnalisée pour la collection `samples` correspondante sera déclenché.

:::info{title="Conseil"}
Étant donné que les appels externes doivent également être basés sur l'identité de l'utilisateur, lors d'un appel via l'API HTTP, comme pour les requêtes envoyées depuis l'interface normale, vous devez fournir des informations d'authentification. Cela inclut l'en-tête de requête `Authorization` ou le paramètre `token` (le jeton obtenu lors de la connexion), ainsi que l'en-tête de requête `X-Role` (le nom du rôle actuel de l'utilisateur).
:::

Si vous devez déclencher un événement pour une donnée d'association un-à-un (les associations un-à-plusieurs ne sont pas encore prises en charge) dans cette action, vous pouvez utiliser `!` dans le paramètre pour spécifier les données de déclenchement du champ d'association :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Après un appel réussi, l'événement d'action personnalisée pour la collection `categories` correspondante sera déclenché.

:::info{title="Conseil"}
Lorsque vous déclenchez un événement d'action via un appel d'API HTTP, vous devez également prêter attention à l'état d'activation du flux de travail et à la correspondance de la configuration de la collection ; sinon, l'appel pourrait échouer ou entraîner une erreur.
:::