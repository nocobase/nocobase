:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Obligatoire

## Introduction

La règle « Obligatoire » est une règle courante de validation de formulaire. Vous pouvez l'activer directement dans la configuration d'un champ, ou définir dynamiquement un champ comme obligatoire via les règles de liaison du formulaire.

## Où configurer un champ comme obligatoire

### Paramètres de champ de collection

Lorsqu'un champ de collection est défini comme obligatoire, cela déclenche une validation côté serveur (backend), et le frontend l'affiche également comme obligatoire par défaut (non modifiable).

![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Paramètres de champ

Définissez directement un champ comme obligatoire. Cette option est idéale pour les champs qui doivent toujours être renseignés par l'utilisateur, tels que le nom d'utilisateur, le mot de passe, etc.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Règles de liaison

Définissez un champ comme obligatoire en fonction de conditions spécifiques, via les règles de liaison de champ du bloc de formulaire.

Exemple : Le numéro de commande est obligatoire lorsque la date de commande n'est pas vide.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Flux de travail