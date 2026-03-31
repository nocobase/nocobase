---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Variable

## Introduction

Vous pouvez déclarer des variables dans un flux de travail ou attribuer des valeurs à des variables déjà déclarées. Cela sert généralement à stocker des données temporaires au sein du flux.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Variable » :

![Ajouter un nœud Variable](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Configurer le nœud

### Mode

Le nœud Variable est similaire aux variables en programmation : il doit être déclaré avant de pouvoir être utilisé et de se voir attribuer une valeur. Par conséquent, lors de la création d'un nœud Variable, vous devez choisir son mode. Deux modes sont disponibles :

![Sélectionner le mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Déclarer une nouvelle variable : Crée une nouvelle variable.
- Attribuer à une variable existante : Attribue une valeur à une variable qui a été déclarée précédemment dans le flux de travail, ce qui équivaut à modifier la valeur de la variable.

Lorsque le nœud créé est le premier nœud Variable du flux de travail, vous ne pouvez sélectionner que le mode de déclaration, car aucune variable n'est encore disponible pour l'attribution.

Lorsque vous choisissez d'attribuer une valeur à une variable déclarée, vous devez également sélectionner la variable cible, c'est-à-dire le nœud où la variable a été déclarée :

![Sélectionner la variable à laquelle attribuer une valeur](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Valeur

La valeur d'une variable peut être de n'importe quel type. Il peut s'agir d'une constante, comme une chaîne de caractères, un nombre, une valeur booléenne ou une date, ou d'une autre variable du flux de travail.

En mode déclaration, définir la valeur de la variable équivaut à lui attribuer une valeur initiale.

![Déclarer la valeur initiale](https://static-docs.nocobase.com/4ce2c50896565ad537343013758c6a4.png)

En mode attribution, définir la valeur de la variable équivaut à modifier la valeur de la variable cible déclarée pour une nouvelle valeur. Les utilisations ultérieures récupéreront cette nouvelle valeur.

![Attribuer une variable de déclencheur à une variable déclarée](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Utiliser la valeur de la variable

Dans les nœuds qui suivent le nœud Variable, vous pouvez utiliser la valeur de la variable en sélectionnant la variable déclarée dans le groupe « Variables de nœud ». Par exemple, dans un nœud de requête, utilisez la valeur de la variable comme condition de requête :

![Utiliser la valeur de la variable comme condition de filtre de requête](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Exemple

Un scénario plus utile pour le nœud Variable se trouve dans les branches, où de nouvelles valeurs sont calculées ou fusionnées avec des valeurs précédentes (similaire à `reduce`/`concat` en programmation), puis utilisées après la fin de la branche. Voici un exemple d'utilisation d'une branche de boucle et d'un nœud Variable pour concaténer une chaîne de destinataires.

Tout d'abord, créez un flux de travail déclenché par une collection qui se déclenche lorsque les données « Article » sont mises à jour, et préchargez les données de relation « Auteur » associées (pour obtenir les destinataires) :

![Configurer le déclencheur](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Ensuite, créez un nœud Variable pour stocker la chaîne de destinataires :

![Nœud Variable de destinataire](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Ensuite, créez un nœud de branche de boucle pour itérer sur les auteurs de l'article et concaténer leurs informations de destinataire dans la variable de destinataire :

![Boucler sur les auteurs de l'article](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

À l'intérieur de la branche de boucle, créez d'abord un nœud de calcul pour concaténer l'auteur actuel avec la chaîne d'auteurs déjà stockée :

![Concaténer la chaîne de destinataires](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Après le nœud de calcul, créez un autre nœud Variable. Sélectionnez le mode attribution, choisissez le nœud Variable de destinataire comme cible d'attribution, et sélectionnez le résultat du nœud de calcul comme valeur :

![Attribuer la chaîne de destinataires concaténée au nœud de destinataire](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Ainsi, une fois la branche de boucle terminée, la variable de destinataire stockera la chaîne de destinataires de tous les auteurs de l'article. Ensuite, après la boucle, vous pourrez utiliser un nœud de requête HTTP pour appeler une API d'envoi de courrier, en passant la valeur de la variable de destinataire comme paramètre de destinataire à l'API :

![Envoyer un e-mail aux destinataires via le nœud de requête](https://static-docs.nocobase.com/37f71ae1a63e172bcb2dce10a250947e.png)

À ce stade, une fonctionnalité simple d'envoi d'e-mails en masse a été implémentée à l'aide d'une boucle et d'un nœud Variable.