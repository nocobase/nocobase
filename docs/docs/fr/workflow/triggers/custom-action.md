---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/workflow/triggers/custom-action).
:::

# Événement d'action personnalisée

## Présentation

NocoBase intègre des actions de données courantes (ajout, suppression, modification, consultation, etc.). Lorsque ces actions ne peuvent pas répondre à des besoins métier complexes, vous pouvez utiliser l'événement d'action personnalisée dans un flux de travail et lier cet événement au bouton « Déclencher le flux de travail » d'un bloc de page. Lorsqu'un utilisateur clique dessus, cela déclenchera un flux de travail d'action personnalisée.

## Créer un flux de travail

Lors de la création d'un flux de travail, sélectionnez « Événement d'action personnalisée » :

![Créer un flux de travail "Événement d'action personnalisée"](https://static-docs.nocobase.com/20240509091820.png)

## Configuration du déclencheur

### Type de contexte

> v.1.6.0+

Le type de contexte détermine les boutons de bloc auxquels le flux de travail peut être lié :

* Sans contexte : Il s'agit d'un événement global qui peut être lié aux boutons d'action des panneaux d'action et des blocs de données ;
* Enregistrement unique : Peut être lié aux boutons d'action des blocs de données tels que les lignes de tableau, les formulaires, les détails, etc. ;
* Plusieurs enregistrements : Peut être lié aux boutons d'action groupée d'un tableau.

![Configuration du déclencheur_Type de contexte](https://static-docs.nocobase.com/20250215135808.png)

### collection

Lorsque le type de contexte est un enregistrement unique ou plusieurs enregistrements, vous devez sélectionner la collection à laquelle lier le modèle de données :

![Configuration du déclencheur_Sélectionner la collection](https://static-docs.nocobase.com/20250215135919.png)

### Données d'association à utiliser

Si vous avez besoin d'utiliser les données d'association de la ligne de données déclenchée dans le flux de travail, vous pouvez sélectionner ici des champs d'association profonds :

![Configuration du déclencheur_Sélectionner les données d'association à utiliser](https://static-docs.nocobase.com/20250215135955.png)

Ces champs seront automatiquement préchargés dans le contexte du flux de travail après le déclenchement de l'événement, afin d'être utilisés dans le flux de travail.

## Configuration de l'action

Selon le type de contexte configuré pour le flux de travail, la configuration des boutons d'action dans les différents blocs varie également.

### Sans contexte

> v1.6.0+

Dans les panneaux d'action et les autres blocs de données, vous pouvez ajouter un bouton « Déclencher le flux de travail » :

![Ajouter un bouton d'action au bloc_Panneau d'action](https://static-docs.nocobase.com/20250215221738.png)

![Ajouter un bouton d'action au bloc_Calendrier](https://static-docs.nocobase.com/20250215221942.png)

![Ajouter un bouton d'action au bloc_Gantt](https://static-docs.nocobase.com/20250215221810.png)

Après avoir ajouté le bouton, liez le flux de travail sans contexte créé précédemment, en prenant pour exemple le bouton dans un panneau d'action :

![Lier le flux de travail au bouton_Panneau d'action](https://static-docs.nocobase.com/20250215222120.png)

![Sélectionner le flux de travail à lier_Sans contexte](https://static-docs.nocobase.com/20250215222234.png)

### Enregistrement unique

Dans n'importe quel bloc de données, un bouton « Déclencher le flux de travail » peut être ajouté à la barre d'actions pour un enregistrement unique, comme dans les formulaires, les lignes de tableau, les détails, etc. :

![Ajouter un bouton d'action au bloc_Formulaire](https://static-docs.nocobase.com/20240509165428.png)

![Ajouter un bouton d'action au bloc_Ligne de tableau](https://static-docs.nocobase.com/20240509165340.png)

![Ajouter un bouton d'action au bloc_Détails](https://static-docs.nocobase.com/20240509165545.png)

Après avoir ajouté le bouton, liez le flux de travail créé précédemment :

![Lier le flux de travail au bouton](https://static-docs.nocobase.com/20240509165631.png)

![Sélectionner le flux de travail à lier](https://static-docs.nocobase.com/20240509165658.png)

Ensuite, cliquez sur ce bouton pour déclencher cet événement d'action personnalisée :

![Résultat du déclenchement par clic sur le bouton](https://static-docs.nocobase.com/20240509170453.png)

### Plusieurs enregistrements

> v1.6.0+

Dans la barre d'actions d'un bloc de tableau, lors de l'ajout d'un bouton « Déclencher le flux de travail », une option supplémentaire apparaît pour choisir le type de contexte : « Sans contexte » ou « Plusieurs enregistrements » :

![Ajouter un bouton d'action au bloc_Tableau](https://static-docs.nocobase.com/20250215222507.png)

Lorsque vous choisissez « Sans contexte », il s'agit d'un événement global qui ne peut être lié qu'à des flux de travail de type sans contexte.

Lorsque vous choisissez « Plusieurs enregistrements », vous pouvez lier un flux de travail de type plusieurs enregistrements, utilisable pour des opérations groupées après avoir sélectionné plusieurs données (actuellement pris en charge uniquement par les tableaux). La portée des flux de travail sélectionnables est limitée à ceux configurés pour correspondre à la collection du bloc de données actuel :

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Lors du déclenchement par clic sur le bouton, vous devez avoir coché certaines lignes de données dans le tableau, sinon le flux de travail ne sera pas déclenché :

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Exemple

Par exemple, nous avons une collection « Échantillons ». Pour les échantillons « Collectés » (statut), nous devons fournir une opération « Soumettre pour inspection ». La soumission vérifiera d'abord les informations de base de l'échantillon, puis générera un « Enregistrement d'inspection », et modifiera enfin le statut de l'échantillon en « Soumis ». Cette série de processus ne peut pas être accomplie par de simples boutons CRUD ; c'est ici que l'événement d'action personnalisée intervient.

Créez d'abord une collection « Échantillons » et une collection « Enregistrements d'inspection », puis saisissez des données de test de base pour la table des échantillons :

![Exemple_Collection Échantillons](https://static-docs.nocobase.com/20240509172234.png)

Ensuite, créez un flux de travail « Événement d'action personnalisée ». Si vous avez besoin d'un retour immédiat du processus, vous pouvez choisir le mode synchrone (en mode synchrone, vous ne pouvez pas utiliser de nœuds asynchrones comme le traitement manuel) :

![Exemple_Créer un flux de travail](https://static-docs.nocobase.com/20240509173106.png)

Dans la configuration du déclencheur, sélectionnez « Échantillons » pour la collection :

![Exemple_Configuration du déclencheur](https://static-docs.nocobase.com/20240509173148.png)

Organisez la logique du processus selon les besoins métier, par exemple, la soumission n'est autorisée que si le paramètre de l'indicateur est supérieur à `90`, sinon un message d'erreur est affiché :

![Exemple_Organisation de la logique métier](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Conseil}
Le nœud « [Message de réponse](../nodes/response-message.md) » peut être utilisé dans les événements d'action personnalisée synchrones pour renvoyer des informations au client. Il ne peut pas être utilisé en mode asynchrone.
:::

Une fois le processus configuré et activé, retournez à l'interface du tableau et ajoutez un bouton « Déclencher le flux de travail » dans la colonne d'actions du tableau :

![Exemple_Ajouter un bouton d'action](https://static-docs.nocobase.com/20240509174525.png)

Ensuite, dans le menu de configuration du bouton, choisissez de lier le flux de travail pour ouvrir la fenêtre de configuration :

![Exemple_Ouvrir la fenêtre de liaison de flux de travail](https://static-docs.nocobase.com/20240509174633.png)

Ajoutez le flux de travail précédemment activé :

![Exemple_Sélectionner le flux de travail](https://static-docs.nocobase.com/20240509174723.png)

Après avoir soumis, modifiez le texte du bouton par le nom de l'opération, comme « Soumettre pour inspection ». La configuration est terminée.

Lors de l'utilisation, sélectionnez n'importe quel échantillon dans le tableau et cliquez sur le bouton « Soumettre pour inspection » pour déclencher l'événement d'action personnalisée. Selon la logique organisée, si le paramètre de l'indicateur est inférieur à 90, le message suivant s'affichera :

![Exemple_Indicateur insuffisant pour la soumission](https://static-docs.nocobase.com/20240509175026.png)

Si le paramètre de l'indicateur est supérieur à 90, le processus s'exécutera normalement, générant un « Enregistrement d'inspection » et changeant le statut de l'échantillon en « Soumis » :

![Exemple_Soumission réussie](https://static-docs.nocobase.com/20240509175247.png)

Ainsi, un événement d'action personnalisée simple est terminé. De même, pour des opérations métier complexes comme le traitement de commandes ou la soumission de rapports, vous pouvez utiliser les événements d'action personnalisée.

## Appel externe

Le déclenchement des événements d'action personnalisée ne se limite pas aux opérations de l'interface utilisateur ; il peut également être déclenché via des appels d'API HTTP. En particulier, les événements d'action personnalisée fournissent un nouveau type d'opération pour toutes les opérations de collection : `trigger`, qui peut être appelé via l'API d'action standard de NocoBase.

:::info{title="Conseil"}
Comme les appels externes doivent également être basés sur l'identité de l'utilisateur, lors d'un appel via l'API HTTP, vous devez fournir les informations d'authentification comme pour une requête d'interface classique, incluant l'en-tête `Authorization` ou le paramètre `token` (obtenu lors de la connexion), ainsi que l'en-tête `X-Role` (nom du rôle actuel de l'utilisateur).
:::

### Sans contexte

Les flux de travail sans contexte doivent être déclenchés sur la ressource workflows :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Enregistrement unique

Similairement au flux de travail déclenché par un bouton dans l'exemple, vous pouvez l'appeler ainsi :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Comme cette opération cible une seule donnée, vous devez spécifier l'ID de la ligne de données lors de l'appel sur des données existantes, en remplaçant la partie `<:id>` dans l'URL.

S'il s'agit d'un appel via un formulaire (comme un ajout ou une mise à jour), vous n'avez pas besoin de passer d'ID pour un ajout, mais vous devez passer les données soumises comme contexte d'exécution :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Pour un formulaire de mise à jour, vous devez passer à la fois l'ID de la ligne de données et les données mises à jour :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Si l'ID et les données sont fournis simultanément, la ligne de données correspondant à l'ID sera d'abord chargée, puis les propriétés de l'objet de données transmis écraseront la ligne originale pour obtenir le contexte de déclenchement final.

:::warning{title="Attention"}
Si des données d'association sont transmises, elles seront également écrasées. Soyez particulièrement prudent lors de la transmission de données si vous avez configuré le préchargement de données d'association, afin d'éviter que les données d'association ne soient écrasées de manière inattendue.
:::

De plus, le paramètre d'URL `triggerWorkflows` correspond à la clé du flux de travail, plusieurs flux de travail étant séparés par des virgules. Cette clé peut être obtenue en survolant le nom du flux de travail en haut du canevas :

![Flux de travail_clé_méthode de visualisation](https://static-docs.nocobase.com/20240426135108.png)

Une fois l'appel réussi, l'événement d'action personnalisée de la collection `samples` correspondante sera déclenché.

:::info{title="Conseil"}
Lors du déclenchement via un appel d'API HTTP, vous devez également faire attention à l'état d'activation du flux de travail et à la correspondance de la configuration de la collection, sinon l'appel pourrait échouer ou produire une erreur.
:::

### Plusieurs enregistrements

Similaire à l'appel pour un enregistrement unique, mais les données transmises ne nécessitent que plusieurs paramètres de clé primaire (`filterByTk[]`), sans partie data :

```bash
curl -X POST -H 'Authorization: Bearer <votre token>' -H 'X-Role: <nomDuRôle>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Cet appel déclenchera l'événement d'action personnalisée en mode plusieurs enregistrements, en utilisant les données d'ID 1 et 2 comme contexte du déclencheur.