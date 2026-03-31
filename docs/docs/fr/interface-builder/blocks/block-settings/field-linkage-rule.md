:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Règles de liaison de champs

## Introduction

Les règles de liaison de champs vous permettent d'ajuster dynamiquement l'état des champs dans les blocs de formulaire ou de détails, en fonction des actions de l'utilisateur. Actuellement, les blocs qui prennent en charge les règles de liaison de champs sont les suivants :

- [Bloc de formulaire](/interface-builder/blocks/data-blocks/form)
- [Bloc de détails](/interface-builder/blocks/data-blocks/details)
- [Sous-formulaire](/interface-builder/fields/specific/sub-form)

## Instructions d'utilisation

### **Bloc de formulaire**

Dans un bloc de formulaire, les règles de liaison peuvent ajuster dynamiquement le comportement des champs en fonction de conditions spécifiques :

- **Contrôler la visibilité des champs (afficher/masquer)** : Décidez si le champ actuel doit être affiché en fonction des valeurs d'autres champs.
- **Définir un champ comme obligatoire** : Rendez un champ obligatoire ou facultatif de manière dynamique sous certaines conditions.
- **Attribuer une valeur** : Affectez automatiquement une valeur à un champ en fonction de conditions.
- **Exécuter un script JavaScript spécifié** : Rédigez du JavaScript selon vos besoins métier.

### **Bloc de détails**

Dans un bloc de détails, les règles de liaison sont principalement utilisées pour contrôler dynamiquement la visibilité (afficher/masquer) des champs du bloc.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Liaison de propriétés

### Attribuer une valeur

Exemple : Lorsqu'une commande est marquée comme commande supplémentaire, le statut de la commande est automatiquement défini sur « En attente de révision ».

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Obligatoire

Exemple : Lorsque le statut de la commande est « Payée », le champ du montant de la commande devient obligatoire.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Afficher/Masquer

Exemple : Le compte de paiement et le montant total ne sont affichés que lorsque le statut de la commande est « En attente de paiement ».

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)