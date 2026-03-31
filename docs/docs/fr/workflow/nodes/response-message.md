---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Message de réponse

## Introduction

Le nœud de message de réponse permet de renvoyer des messages personnalisés du flux de travail au client qui a soumis l'action, et ce, dans des types de flux de travail spécifiques.

:::info{title=Remarque}
Il est actuellement pris en charge dans les flux de travail de type « Événement avant action » et « Événement d'action personnalisée » en mode synchrone.
:::

## Création d'un nœud

Dans les types de flux de travail pris en charge, vous pouvez ajouter un nœud « Message de réponse » n'importe où dans le flux de travail. Cliquez sur le bouton plus (« + ») dans le flux de travail pour ajouter un nœud « Message de réponse » :

![Ajout d'un nœud](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Le message de réponse existe sous forme de tableau tout au long du processus de requête. Chaque fois qu'un nœud de message de réponse est exécuté dans le flux de travail, le nouveau contenu du message est ajouté au tableau. Lorsque le serveur envoie la réponse, tous les messages sont envoyés au client simultanément.

## Configuration du nœud

Le contenu du message est une chaîne de caractères de type modèle dans laquelle des variables peuvent être insérées. Vous pouvez organiser ce contenu de modèle comme vous le souhaitez dans la configuration du nœud :

![Configuration du nœud](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Lorsque le flux de travail exécute ce nœud, le modèle sera analysé pour générer le contenu du message. Dans la configuration ci-dessus, la variable « Variable locale / Boucler sur tous les produits / Objet de boucle / Produit / Titre » sera remplacée par une valeur spécifique dans le flux de travail réel, par exemple :

```
Le produit « iPhone 14 pro » est en rupture de stock.
```

![Contenu du message](https://static-docs.nocobase.com/06ad4a6b6ec499c853f0c39987f63a6a.png)

## Configuration du flux de travail

Le statut du message de réponse dépend du succès ou de l'échec de l'exécution du flux de travail. L'échec de l'exécution de n'importe quel nœud entraînera l'échec de l'ensemble du flux de travail. Dans ce cas, le contenu du message sera renvoyé au client avec un statut d'échec et affiché.

Si vous devez définir activement un état d'échec dans le flux de travail, vous pouvez utiliser un « nœud de fin » et le configurer en état d'échec. Lorsque ce nœud est exécuté, le flux de travail se terminera avec un statut d'échec, et le message sera renvoyé au client avec un statut d'échec.

Si l'ensemble du flux de travail ne produit pas d'état d'échec et s'exécute avec succès jusqu'à la fin, le contenu du message sera renvoyé au client avec un statut de succès.

:::info{title=Remarque}
Si plusieurs nœuds de message de réponse sont définis dans le flux de travail, les nœuds exécutés ajouteront le contenu du message à un tableau. Lors du renvoi final au client, tout le contenu du message sera renvoyé et affiché ensemble.
:::

## Cas d'utilisation

### Flux de travail « Événement avant action »

L'utilisation d'un message de réponse dans un flux de travail « Événement avant action » permet d'envoyer un retour de message correspondant au client une fois le flux de travail terminé. Pour plus de détails, consultez [Événement avant action](../triggers/pre-action.md).

### Flux de travail « Événement d'action personnalisée »

L'utilisation d'un message de réponse dans un « Événement d'action personnalisée » en mode synchrone permet d'envoyer un retour de message correspondant au client une fois le flux de travail terminé. Pour plus de détails, consultez [Événement d'action personnalisée](../triggers/custom-action.md).