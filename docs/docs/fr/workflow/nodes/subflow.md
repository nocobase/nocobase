---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Appeler un flux de travail

## Introduction

Ce nœud permet d'appeler d'autres flux de travail depuis un flux de travail existant. Vous pouvez utiliser les variables du flux de travail actuel comme entrées pour le sous-flux de travail, et récupérer les sorties du sous-flux de travail comme variables dans le flux de travail principal pour les utiliser dans les nœuds suivants.

Le processus d'appel d'un flux de travail est illustré ci-dessous :

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

L'appel de flux de travail vous permet de réutiliser des logiques de processus courantes, telles que l'envoi d'e-mails, de SMS, etc., ou de décomposer un flux de travail complexe en plusieurs sous-flux de travail pour une gestion et une maintenance plus faciles.

Essentiellement, un flux de travail ne fait pas de distinction entre un processus principal et un sous-processus. N'importe quel flux de travail peut être appelé comme sous-flux de travail par d'autres, et il peut également appeler d'autres flux de travail. Tous les flux de travail sont égaux ; il n'existe qu'une relation d'appel et d'être appelé.

De même, l'utilisation de l'appel de flux de travail se fait à deux niveaux :

1.  Dans le flux de travail principal : En tant qu'appelant, il appelle d'autres flux de travail via le nœud "Appeler un flux de travail".
2.  Dans le sous-flux de travail : En tant que partie appelée, il enregistre les variables à exporter du flux de travail actuel via le nœud "Sortie du flux de travail", qui pourront être utilisées par les nœuds suivants du flux de travail qui l'a appelé.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus ("+") dans le flux de travail pour ajouter un nœud "Appeler un flux de travail" :

![Ajouter un nœud Appeler un flux de travail](https://static-docs.nocobase.com/20241230001323.png)

## Configurer le nœud

### Sélectionner le flux de travail

Sélectionnez le flux de travail à appeler. Vous pouvez utiliser la barre de recherche pour une recherche rapide :

![Sélectionner le flux de travail](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Conseil}
*   Les flux de travail désactivés peuvent également être appelés comme sous-flux de travail.
*   Si le flux de travail actuel est en mode synchrone, il ne peut appeler que des sous-flux de travail également en mode synchrone.
:::

### Configurer les variables du déclencheur du flux de travail

Après avoir sélectionné un flux de travail, vous devez également configurer les variables du déclencheur qui serviront de données d'entrée pour déclencher le sous-flux de travail. Vous pouvez choisir des données statiques ou des variables du flux de travail actuel :

![Configurer les variables du déclencheur](https://static-docs.nocobase.com/20241230162722.png)

Différents types de déclencheurs nécessitent différentes variables, que vous pouvez configurer dans le formulaire selon vos besoins.

## Nœud de sortie du flux de travail

Référez-vous au contenu du nœud [Sortie du flux de travail](./output.md) pour configurer les variables de sortie du sous-flux de travail.

## Utiliser la sortie du flux de travail

De retour dans le flux de travail principal, dans les nœuds situés après le nœud "Appeler un flux de travail", lorsque vous souhaitez utiliser la valeur de sortie du sous-flux de travail, vous pouvez sélectionner le résultat du nœud "Appeler un flux de travail". Si le sous-flux de travail produit une valeur simple, comme une chaîne de caractères, un nombre, une valeur logique (booléenne), une date (la date est une chaîne au format UTC), etc., vous pouvez l'utiliser directement. S'il s'agit d'un objet complexe (comme un objet d'une collection), il doit d'abord être mappé via un nœud d'analyse JSON avant que ses propriétés puissent être utilisées ; sinon, il ne peut être utilisé que comme un objet entier.

Si le sous-flux de travail n'a pas de nœud "Sortie du flux de travail" configuré, ou s'il ne produit aucune valeur, alors lorsque vous utilisez le résultat du nœud "Appeler un flux de travail" dans le flux de travail principal, vous obtiendrez uniquement une valeur nulle (`null`).