:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Condition

## Introduction

Similaire à l'instruction `if` des langages de programmation, ce nœud détermine la direction du `flux de travail` en fonction du résultat de la condition configurée.

## Créer un nœud

Le nœud de condition propose deux modes : « Continuer si vrai » et « Brancher sur vrai/faux ». Vous devez choisir l'un de ces modes lors de la création du nœud ; ce choix ne pourra pas être modifié ultérieurement dans sa configuration.

![条件判断_模式选择](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

En mode « Continuer si vrai », si le résultat de la condition est « vrai », le `flux de travail` poursuivra l'exécution des nœuds suivants. Dans le cas contraire, le `flux de travail` se terminera et s'arrêtera prématurément avec un statut d'échec.

!["Continue if true" mode](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Ce mode est idéal pour les scénarios où le `flux de travail` ne doit pas se poursuivre si la condition n'est pas remplie. Par exemple, un bouton de soumission de formulaire pour une commande est lié à un « événement avant action ». Si le stock du produit commandé est insuffisant, le processus de création de commande ne doit pas continuer, mais échouer et s'arrêter.

En mode « Brancher sur vrai/faux », le nœud de condition créera deux branches de `flux de travail` distinctes, correspondant respectivement aux résultats « vrai » et « faux » de la condition. Chaque branche peut être configurée avec ses propres nœuds suivants. Une fois qu'une branche a terminé son exécution, elle fusionnera automatiquement avec la branche parente du nœud de condition pour poursuivre l'exécution des nœuds subséquents.

!["Branch on true/false" mode](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Ce mode est adapté aux scénarios où différentes actions doivent être effectuées selon que la condition est remplie ou non. Par exemple, vérifier si une donnée existe : si elle n'existe pas, la créer ; si elle existe, la mettre à jour.

## Configuration du nœud

### Moteur de calcul

Actuellement, trois moteurs sont pris en charge :

- **Basique** : Obtient un résultat logique via de simples calculs binaires et des regroupements « ET » / « OU ».
- **Math.js** : Calcule les expressions prises en charge par le moteur [Math.js](https://mathjs.org/) pour obtenir un résultat logique.
- **Formula.js** : Calcule les expressions prises en charge par le moteur [Formula.js](https://formulajs.info/) pour obtenir un résultat logique.

Dans les trois types de calcul, vous pouvez utiliser les variables du contexte du `flux de travail` comme paramètres.