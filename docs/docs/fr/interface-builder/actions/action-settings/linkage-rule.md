:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Règles de liaison des actions

## Introduction

Les règles de liaison des actions vous permettent de contrôler dynamiquement l'état d'une action (par exemple, afficher, activer, masquer, désactiver, etc.) en fonction de conditions spécifiques. En configurant ces règles, vous pouvez lier le comportement des boutons d'action à l'enregistrement actuel, au rôle de l'utilisateur ou aux données contextuelles.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Comment utiliser

Lorsqu'une condition est remplie (par défaut, elle est considérée comme remplie si aucune condition n'est définie), cela déclenche l'exécution de paramètres de propriétés ou de code JavaScript. Les constantes et les variables sont prises en charge dans l'évaluation des conditions.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Ces règles permettent de modifier les propriétés des boutons.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Constantes

Exemple : Les commandes payées ne peuvent pas être modifiées.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variables

### Variables système

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Exemple 1 : Contrôler la visibilité d'un bouton en fonction du type d'appareil actuel.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Exemple 2 : Le bouton de mise à jour en masse, situé dans l'en-tête du tableau du bloc des commandes, est réservé au rôle d'administrateur ; les autres rôles ne peuvent pas effectuer cette action.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Variables contextuelles

Exemple : Le bouton d'ajout, situé sur les opportunités de commande (bloc de relation), n'est activé que lorsque le statut de la commande est « En attente de paiement » ou « Brouillon ». Dans les autres statuts, le bouton sera désactivé.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Pour plus d'informations sur les variables, consultez [Variables](/interface-builder/variables).