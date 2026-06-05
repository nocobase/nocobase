---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Événement avant action

## Introduction

Le plugin Événement avant action offre un mécanisme d'interception pour les opérations. Il se déclenche après la soumission d'une requête (pour une création, une mise à jour ou une suppression) et avant son traitement.

Si un nœud "Fin de flux de travail" est exécuté dans le flux de travail déclenché, ou si un autre nœud échoue (en raison d'une erreur ou d'une exécution incomplète), l'opération du formulaire sera interceptée. Sinon, l'opération prévue sera exécutée normalement.

En l'associant au nœud "Message de réponse", vous pouvez configurer un message de réponse à renvoyer au client, lui fournissant ainsi des informations pertinentes. Les événements avant action peuvent être utilisés pour effectuer des validations métier ou des vérifications logiques afin d'approuver ou d'intercepter les requêtes de création, de mise à jour et de suppression soumises par le client.

## Configuration du déclencheur

### Créer un déclencheur

Lors de la création d'un flux de travail, sélectionnez le type "Événement avant action" :

![Créer un événement avant action](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Sélectionner une collection

Dans le déclencheur d'un flux de travail d'interception, la première chose à configurer est la collection (table de données) correspondant à l'opération :

![Configuration de l'événement d'interception_Collection](https://static-docs.nocobase.com/8f712caca8159d334cf776f838d53d6.png)

Ensuite, sélectionnez le mode d'interception. Vous pouvez choisir d'intercepter uniquement le bouton d'action lié à ce flux de travail, ou d'intercepter toutes les opérations sélectionnées pour cette collection (indépendamment du formulaire d'origine et sans nécessiter de liaison avec le flux de travail correspondant) :

### Mode d'interception

![Configuration de l'événement d'interception_Mode d'interception](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Les types d'opérations actuellement pris en charge sont "Créer", "Mettre à jour" et "Supprimer". Vous pouvez sélectionner plusieurs types d'opérations simultanément.

## Configuration de l'opération

Si le mode "Déclencher l'interception uniquement lors de la soumission d'un formulaire lié à ce flux de travail" est sélectionné dans la configuration du déclencheur, vous devez également revenir à l'interface du formulaire et lier ce flux de travail au bouton d'opération correspondant :

![Ajouter une commande_Lier un flux de travail](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Dans la configuration de liaison du flux de travail, sélectionnez le flux de travail approprié. Généralement, le contexte par défaut pour les données déclenchées, "Données complètes du formulaire", est suffisant :

![Sélectionner le flux de travail à lier](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Remarque}
Les boutons qui peuvent être liés à un Événement avant action ne prennent actuellement en charge que les boutons "Soumettre" (ou "Enregistrer"), "Mettre à jour les données" et "Supprimer" dans les formulaires de création ou de mise à jour. Le bouton "Déclencher le flux de travail" n'est pas pris en charge (il ne peut être lié qu'à un "Événement après action").
:::

## Conditions d'interception

Dans un "Événement avant action", deux conditions peuvent entraîner l'interception de l'opération correspondante :

1. Le flux de travail atteint un nœud "Fin de flux de travail". Comme expliqué précédemment, si les données qui ont déclenché le flux de travail ne remplissent pas les conditions prédéfinies dans un nœud "Condition", le flux entrera dans la branche "Non" et exécutera le nœud "Fin de flux de travail". À ce stade, le flux de travail se terminera et l'opération demandée sera interceptée.
2. Tout nœud du flux de travail échoue à s'exécuter, y compris les erreurs d'exécution ou d'autres exceptions. Dans ce cas, le flux de travail se terminera avec un statut correspondant, et l'opération demandée sera également interceptée. Par exemple, si le flux de travail appelle des données externes via une "Requête HTTP" et que la requête échoue, le flux de travail se terminera avec un statut d'échec et interceptera également la requête d'opération correspondante.

Une fois les conditions d'interception remplies, l'opération correspondante ne sera plus exécutée. Par exemple, si la soumission d'une commande est interceptée, les données de commande correspondantes ne seront pas créées.

## Paramètres associés à l'opération

Dans un flux de travail de type "Événement avant action", différentes données du déclencheur peuvent être utilisées comme variables dans le flux de travail pour diverses opérations :

| Type d'opération \ Variable | "Opérateur" | "Identifiant de rôle de l'opérateur" | Paramètre d'opération : "ID" | Paramètre d'opération : "Objet de données soumis" |
| --------------------------- | ----------- | ----------------------------------- | ---------------------------- | ------------------------------------------------ |
| Créer un enregistrement     | ✓           | ✓                                   | -                            | ✓                                                |
| Mettre à jour un enregistrement | ✓           | ✓                                   | ✓                            | ✓                                                |
| Supprimer un ou plusieurs enregistrements | ✓           | ✓                                   | ✓                            | -                                                |

:::info{title=Remarque}
La variable "Données du déclencheur / Paramètres de l'opération / Objet de données soumis" dans un Événement avant action n'est pas la donnée réelle de la base de données, mais plutôt les paramètres soumis avec l'opération. Si vous avez besoin des données réelles de la base de données, vous devez les interroger à l'aide d'un nœud "Interroger les données" dans le flux de travail.

De plus, pour une opération de suppression, l' "ID" dans les paramètres d'opération est une valeur unique lorsqu'il s'agit d'un seul enregistrement, mais c'est un tableau lorsqu'il s'agit de plusieurs enregistrements.
:::

## Message de réponse en sortie

Après avoir configuré le déclencheur, vous pouvez personnaliser la logique de décision dans le flux de travail. Généralement, vous utiliserez le mode de branchement du nœud "Condition" pour décider si vous devez "Terminer le flux de travail" et renvoyer un "Message de réponse" prédéfini, en fonction des résultats des conditions métier spécifiques :

![Configuration du flux de travail d'interception](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

La configuration du flux de travail correspondant est maintenant terminée. Vous pouvez essayer de soumettre des données qui ne remplissent pas les conditions définies dans le flux de travail pour déclencher la logique d'interception. Vous verrez alors le message de réponse renvoyé :

![Message de réponse d'erreur](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Statut du message de réponse

Si le nœud "Fin de flux de travail" est configuré pour se terminer avec un statut "Succès", la requête d'opération sera toujours interceptée lorsque ce nœud est exécuté, mais le message de réponse renvoyé s'affichera avec un statut "Succès" (plutôt que "Erreur") :

![Message de réponse avec statut de succès](https://static-docs.nocobase.com/9559bbf56076144759451294b18c790e.png)

## Exemple

En combinant les instructions de base ci-dessus, prenons l'exemple d'un scénario de "Soumission de commande". Supposons que nous devions vérifier le stock de tous les produits sélectionnés par l'utilisateur lors de la soumission d'une commande. Si le stock d'un produit sélectionné est insuffisant, la soumission de la commande est interceptée et un message d'information correspondant est renvoyé. Le flux de travail parcourra chaque produit pour vérifier que le stock est suffisant. Si tous les produits sont en stock, la commande sera validée et les données de commande seront générées pour l'utilisateur.

Les autres étapes sont identiques à celles des instructions. Cependant, comme une commande implique plusieurs produits, en plus d'ajouter une relation plusieurs-à-plusieurs "Commande" <-- M:1 -- "Détail de commande" -- 1:M --> "Produit" lors de la modélisation des données, vous devez également ajouter un nœud "Boucle" dans le flux de travail "Événement avant action" pour vérifier itérativement si le stock de chaque produit est suffisant :

![Exemple_Flux de travail de vérification en boucle](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

L'objet de la boucle est sélectionné comme le tableau "Détail de commande" à partir des données de commande soumises :

![Exemple_Configuration de l'objet de la boucle](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Le nœud de condition dans le flux de travail en boucle est utilisé pour déterminer si le stock de l'objet produit en cours de boucle est suffisant :

![Exemple_Condition dans la boucle](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Les autres configurations sont identiques à celles de l'utilisation de base. Lors de la soumission finale de la commande, si le stock d'un produit est insuffisant, la soumission de la commande sera interceptée et un message d'information correspondant sera renvoyé. Lors des tests, essayez de soumettre une commande avec plusieurs produits, dont un avec un stock insuffisant et un autre avec un stock suffisant. Vous pourrez alors voir le message de réponse renvoyé :

![Exemple_Message de réponse après soumission](https://static-docs.nocobase.com/dd81084aa237bda0241d399ac19270.png)

Comme vous pouvez le constater, le message de réponse n'indique pas que le stock du premier produit, "iPhone 15 Pro", est insuffisant, mais seulement celui du second produit, "iPhone 14 Pro". Cela s'explique par le fait que, dans la boucle, le premier produit avait un stock suffisant et n'a donc pas été intercepté, tandis que le second produit avait un stock insuffisant, ce qui a entraîné l'interception de la soumission de la commande.

## Appel externe

L'événement avant action est injecté pendant la phase de traitement des requêtes, il peut donc également être déclenché via des appels d'API HTTP.

Pour les flux de travail liés localement à un bouton d'opération, vous pouvez les appeler comme suit (en prenant l'exemple du bouton de création de la collection `posts`) :

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Le paramètre d'URL `triggerWorkflows` est la clé du flux de travail ; plusieurs clés de flux de travail sont séparées par des virgules. Cette clé peut être obtenue en survolant le nom du flux de travail en haut du canevas du flux de travail :

![Flux de travail_Clé_Méthode d'affichage](https://static-docs.nocobase.com/20240426135108.png)

Une fois l'appel ci-dessus effectué, l'événement avant action pour la collection `posts` correspondante sera déclenché. Après le traitement synchrone du flux de travail correspondant, les données seront créées et renvoyées normalement.

Si le flux de travail configuré atteint un "Nœud de fin", la logique est la même que pour une action d'interface : la requête sera interceptée et aucune donnée ne sera créée. Si le statut du nœud de fin est configuré comme échec, le code de statut de la réponse renvoyée sera `400` ; en cas de succès, il sera `200`.

Si un nœud "Message de réponse" est également configuré avant le nœud de fin, le message généré sera également renvoyé dans le résultat de la réponse. La structure en cas d'erreur est la suivante :

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

La structure du message lorsque le "Nœud de fin" est configuré pour le succès est la suivante :

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Remarque}
Étant donné que plusieurs nœuds "Message de réponse" peuvent être ajoutés dans un flux de travail, la structure des données du message renvoyé est un tableau.
:::

Si l'événement avant action est configuré en mode global, vous n'avez pas besoin d'utiliser le paramètre d'URL `triggerWorkflows` pour spécifier le flux de travail correspondant lors de l'appel de l'API HTTP. Il suffit d'appeler directement l'opération de la collection correspondante pour le déclencher.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Remarque"}
Lorsque vous déclenchez un événement avant action via un appel d'API HTTP, vous devez également prêter attention à l'état d'activation du flux de travail et à la correspondance de la configuration de la collection, sinon l'appel pourrait échouer ou entraîner une erreur.
:::