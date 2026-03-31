---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Réponse HTTP

## Introduction

Ce nœud est uniquement pris en charge dans les flux de travail Webhook en mode synchrone et sert à renvoyer une réponse à un système tiers. Par exemple, lors du traitement d'un rappel de paiement (callback), si le processus métier rencontre un résultat inattendu (comme une erreur ou un échec), vous pouvez utiliser le nœud de réponse pour renvoyer une réponse d'erreur au système tiers. Cela permet à certains systèmes tiers de retenter l'opération ultérieurement en fonction de l'état.

De plus, l'exécution du nœud de réponse met fin à l'exécution du flux de travail, et les nœuds suivants ne seront pas exécutés. Si aucun nœud de réponse n'est configuré dans l'ensemble du flux de travail, le système répondra automatiquement en fonction de l'état d'exécution du flux : il renverra `200` en cas de succès et `500` en cas d'échec.

## Créer un nœud de réponse

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Réponse » :

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Configuration de la réponse

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Dans le corps de la réponse, vous pouvez utiliser les variables du contexte du flux de travail.