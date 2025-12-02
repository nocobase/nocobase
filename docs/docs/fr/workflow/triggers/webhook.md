---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Webhook

## Introduction

Le déclencheur Webhook met à votre disposition une URL qui peut être appelée par des systèmes tiers via des requêtes HTTP. Lorsqu'un événement tiers se produit, une requête HTTP est envoyée à cette URL pour déclencher l'exécution du flux de travail. C'est idéal pour les notifications initiées par des systèmes externes, comme les rappels de paiement ou les messages.

## Créer un flux de travail

Lorsque vous créez un flux de travail, sélectionnez le type « Événement Webhook » :

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Astuce"}
La différence entre les flux de travail « synchrones » et « asynchrones » est la suivante : un flux de travail synchrone attend que l'exécution soit terminée avant de renvoyer une réponse, tandis qu'un flux de travail asynchrone renvoie immédiatement la réponse configurée dans le déclencheur et met l'exécution en file d'attente en arrière-plan.
:::

## Configuration du déclencheur

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### Webhook URL

L'URL du déclencheur Webhook est générée automatiquement par le système et liée à ce flux de travail. Vous pouvez la copier en cliquant sur le bouton à droite et la coller dans le système tiers.

Seule la méthode HTTP POST est prise en charge ; les autres méthodes renverront une erreur `405`.

### Sécurité

L'authentification HTTP de base est actuellement prise en charge. Vous pouvez activer cette option et définir un nom d'utilisateur et un mot de passe. En incluant ces informations dans l'URL du Webhook du système tiers, vous assurez une authentification sécurisée du Webhook (pour plus de détails sur la norme, consultez : [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Lorsque vous avez configuré un nom d'utilisateur et un mot de passe, le système vérifie si ceux-ci correspondent à ceux de la requête. Si les informations ne sont pas fournies ou ne correspondent pas, une erreur `401` sera renvoyée.

### Analyser les données de la requête

Lorsqu'un système tiers appelle le Webhook, les données contenues dans la requête doivent être analysées avant de pouvoir être utilisées dans le flux de travail. Une fois analysées, elles deviennent des variables de déclencheur que vous pouvez référencer dans les nœuds suivants.

L'analyse des requêtes HTTP se divise en trois parties :

1.  En-têtes de requête

    Les en-têtes de requête sont généralement de simples paires clé-valeur de type chaîne de caractères. Vous pouvez configurer directement les champs d'en-tête dont vous avez besoin, tels que `Date`, `X-Request-Id`, etc.

2.  Paramètres de requête

    Les paramètres de requête sont la partie des paramètres de recherche dans l'URL, comme le paramètre `query` dans `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Vous pouvez coller un exemple d'URL complète ou seulement la partie des paramètres de recherche, puis cliquer sur le bouton d'analyse pour analyser automatiquement les paires clé-valeur.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    L'analyse automatique convertit la partie des paramètres de l'URL en une structure JSON et génère des chemins tels que `query[0]`, `query[0].a` en fonction de la hiérarchie des paramètres. Le nom du chemin peut être modifié manuellement si nécessaire, mais cela est rarement requis. L'alias est le nom d'affichage de la variable lorsqu'elle est utilisée ; il est facultatif. L'analyse génère également une liste complète des paramètres à partir de l'exemple ; vous pouvez supprimer ceux dont vous n'avez pas besoin.

3.  Corps de la requête

    Le corps de la requête est la partie Body de la requête HTTP. Actuellement, seuls les corps de requête avec un `Content-Type` au format `application/json` sont pris en charge. Vous pouvez configurer directement les chemins à analyser, ou saisir un exemple JSON et cliquer sur le bouton d'analyse pour une analyse automatique.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    L'analyse automatique convertit les paires clé-valeur de la structure JSON en chemins. Par exemple, `{"a": 1, "b": {"c": 2}}` générera des chemins tels que `a`, `b` et `b.c`. L'alias est le nom d'affichage de la variable lorsqu'elle est utilisée ; il est facultatif. L'analyse génère également une liste complète des paramètres à partir de l'exemple ; vous pouvez supprimer ceux dont vous n'avez pas besoin.

### Paramètres de réponse

La configuration de la réponse d'un Webhook diffère selon qu'il s'agit d'un flux de travail synchrone ou asynchrone. Pour les flux de travail asynchrones, la réponse est configurée directement dans le déclencheur : dès la réception d'une requête Webhook, la réponse configurée est immédiatement renvoyée au système tiers, puis le flux de travail est exécuté. Pour les flux de travail synchrones, vous devez ajouter un nœud de réponse au sein du flux pour gérer la réponse selon vos besoins métier (pour plus de détails, consultez : [Nœud de réponse](#nœud-de-réponse)).

Généralement, la réponse d'un événement Webhook déclenché de manière asynchrone a un code de statut `200` et un corps de réponse `ok`. Vous pouvez également personnaliser le code de statut, les en-têtes et le corps de la réponse selon vos besoins.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Nœud de réponse

Référence : [Nœud de réponse](../nodes/response.md)

## Exemple

Dans un flux de travail Webhook, vous pouvez renvoyer différentes réponses en fonction de diverses conditions métier, comme illustré ci-dessous :

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Utilisez un nœud de branche conditionnelle pour déterminer si un certain état métier est rempli. Si c'est le cas, renvoyez une réponse de succès ; sinon, renvoyez une réponse d'échec.