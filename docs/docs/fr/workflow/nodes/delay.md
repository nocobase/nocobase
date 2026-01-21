:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Délai

## Introduction

Le nœud `Délai` permet d'ajouter un délai à un `flux de travail`. Une fois le délai écoulé, vous pouvez configurer le nœud pour qu'il continue l'exécution des nœuds suivants ou qu'il mette fin au `flux de travail` de manière anticipée.

Ce nœud est souvent utilisé conjointement avec le nœud `Branche parallèle`. Vous pouvez ajouter un nœud `Délai` à l'une des branches pour gérer les traitements après un dépassement de délai. Par exemple, dans une branche parallèle, l'une des branches pourrait contenir un traitement manuel et l'autre un nœud `Délai`. Si le traitement manuel dépasse le délai imparti :
- Si vous configurez le nœud pour qu'il `échoue en cas de dépassement de délai`, cela signifie que le traitement manuel doit impérativement être terminé dans le temps imparti.
- Si vous le configurez pour qu'il `continue en cas de dépassement de délai`, cela signifie que le traitement manuel peut être ignoré une fois le délai écoulé.

## Installation

C'est un `plugin` intégré, aucune installation n'est requise.

## Créer un nœud

Dans l'interface de configuration du `flux de travail`, cliquez sur le bouton plus (« + ») dans le `flux de travail` pour ajouter un nœud « Délai » :

![Créer un nœud Délai](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Configuration du nœud

![Nœud Délai_Configuration du nœud](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Durée du délai

Pour la durée du délai, vous pouvez saisir un nombre et sélectionner une unité de temps. Les unités de temps prises en charge sont : secondes, minutes, heures, jours et semaines.

### État en cas de dépassement de délai

Pour l'état en cas de dépassement de délai, vous pouvez choisir entre « Passer et continuer » et « Échouer et quitter ».
- L'option « Passer et continuer » signifie qu'une fois le délai écoulé, le `flux de travail` poursuivra l'exécution des nœuds suivants.
- L'option « Échouer et quitter » signifie qu'une fois le délai écoulé, le `flux de travail` se terminera de manière anticipée avec un statut d'échec.

## Exemple

Prenons l'exemple d'un scénario où une demande de service (ticket) doit être traitée dans un délai imparti après son initiation. Nous devons ajouter un nœud manuel dans l'une des deux branches parallèles et un nœud `Délai` dans l'autre. Si le traitement manuel n'est pas effectué dans les 10 minutes, le statut de la demande de service est mis à jour en « Dépassement de délai, non traité ».

![Nœud Délai_Exemple_Organisation du flux](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)