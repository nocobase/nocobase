---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Requête HTTP

## Introduction

Lorsque vous avez besoin d'interagir avec un autre système web, vous pouvez utiliser le nœud de requête HTTP. Lors de son exécution, ce nœud envoie une requête HTTP à l'adresse spécifiée selon sa configuration. Il peut transporter des données au format JSON ou `application/x-www-form-urlencoded` pour interagir avec des systèmes externes.

Si vous êtes familier avec des outils d'envoi de requêtes comme Postman, vous maîtriserez rapidement l'utilisation du nœud de requête HTTP. Contrairement à ces outils, tous les paramètres du nœud de requête HTTP peuvent utiliser les variables de contexte du `flux de travail` actuel, permettant une intégration organique avec les processus métier de votre système.

## Installation

`Plugin` intégré, aucune installation requise.

## Création d'un nœud

Dans l'interface de configuration du `flux de travail`, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Requête HTTP » :

![Requête HTTP_Ajouter](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Configuration du nœud

![Nœud de requête HTTP_Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Méthode de requête

Méthodes de requête HTTP disponibles : `GET`, `POST`, `PUT`, `PATCH` et `DELETE`.

### URL de la requête

L'URL du service HTTP, qui doit inclure la partie protocole (`http://` ou `https://`). L'utilisation de `https://` est recommandée.

### Format des données de la requête

Il s'agit du `Content-Type` dans l'en-tête de la requête. Pour les formats pris en charge, consultez la section « [Corps de la requête](#corps-de-la-requête) ».

### Configuration des en-têtes de requête

Paires clé-valeur pour la section `Header` de la requête. Les valeurs peuvent utiliser les variables de contexte du `flux de travail`.

:::info{title=Astuce}
L'en-tête de requête `Content-Type` est configuré via le format des données de la requête. Il n'est pas nécessaire de le renseigner ici, et toute tentative de le surcharger sera inefficace.
:::

### Paramètres de requête

Paires clé-valeur pour la section `query` de la requête. Les valeurs peuvent utiliser les variables de contexte du `flux de travail`.

### Corps de la requête

La partie `Body` de la requête. Différents formats sont pris en charge en fonction du `Content-Type` sélectionné.

#### `application/json`

Prend en charge le texte au format JSON standard. Vous pouvez insérer des variables du contexte du `flux de travail` en utilisant le bouton de variable situé dans le coin supérieur droit de l'éditeur de texte.

:::info{title=Astuce}
Les variables doivent être utilisées à l'intérieur d'une chaîne JSON, par exemple : `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Format de paires clé-valeur. Les valeurs peuvent utiliser des variables du contexte du `flux de travail`. Lorsque des variables sont incluses, elles seront analysées comme un modèle de chaîne et concaténées pour former la valeur de chaîne finale.

#### `application/xml`

Prend en charge le texte au format XML standard. Vous pouvez insérer des variables du contexte du `flux de travail` en utilisant le bouton de variable situé dans le coin supérieur droit de l'éditeur de texte.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Prend en charge les paires clé-valeur pour les données de formulaire. Les fichiers peuvent être téléchargés lorsque le type de données est défini sur un objet fichier. Les fichiers ne peuvent être sélectionnés que via des variables à partir d'objets fichiers existants dans le contexte, tels que les résultats d'une requête sur une `collection` de fichiers ou des données liées d'une `collection` de fichiers associée.

:::info{title=Astuce}
Lorsque vous sélectionnez des données de fichier, assurez-vous que la variable correspond à un objet fichier unique, et non à une liste de fichiers (dans une requête de relation un-à-plusieurs ou plusieurs-à-plusieurs, la valeur du champ de relation sera un tableau).
:::

### Paramètres de délai d'attente

Lorsqu'une requête ne répond pas pendant une longue période, le paramètre de délai d'attente peut être utilisé pour annuler son exécution. Si la requête expire, le `flux de travail` actuel sera terminé prématurément avec un statut d'échec.

### Ignorer les échecs

Le nœud de requête considère les codes de statut HTTP standard entre `200` et `299` (inclus) comme des succès, et tous les autres comme des échecs. Si l'option « Ignorer les requêtes échouées et continuer le `flux de travail` » est cochée, les nœuds suivants du `flux de travail` continueront à s'exécuter même si la requête échoue.

## Utilisation du résultat de la réponse

Le résultat de la réponse d'une requête HTTP peut être analysé par le nœud [Requête JSON](./json-query.md) pour être utilisé par les nœuds suivants.

Depuis la version `v1.0.0-alpha.16`, trois parties du résultat de la réponse du nœud de requête peuvent être utilisées comme variables distinctes :

*   Code de statut de la réponse
*   En-têtes de réponse
*   Données de réponse

![Nœud de requête HTTP_Utilisation du résultat de la réponse](https://static-docs.nocobase.com/20240529110610.png)

Le code de statut de la réponse est généralement un code de statut HTTP standard sous forme numérique, tel que `200`, `403`, etc. (fourni par le fournisseur de services).

Les en-têtes de réponse (`Response headers`) sont au format JSON. Les en-têtes et les données de réponse au format JSON doivent toujours être analysés à l'aide d'un nœud JSON avant de pouvoir être utilisés.

## Exemple

Par exemple, nous pouvons utiliser le nœud de requête pour nous connecter à une plateforme cloud afin d'envoyer des SMS de notification. La configuration pour une API SMS cloud, en prenant l'exemple de l'API d'envoi de SMS d'Alibaba Cloud, est la suivante (vous devrez consulter la documentation spécifique de l'API pour adapter les paramètres) :

![Nœud de requête HTTP_Configuration du nœud](https://static-docs.nocobase.com/20240515124004.png)

Lorsque le `flux de travail` déclenche l'exécution de ce nœud, il appellera l'API SMS d'Alibaba Cloud avec le contenu configuré. Si la requête est réussie, un SMS sera envoyé via le service cloud de SMS.