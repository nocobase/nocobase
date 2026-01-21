:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Définir les règles de validation

## Introduction

Les règles de validation servent à garantir que les données saisies par l'utilisateur correspondent aux attentes.

## Où définir les règles de validation des champs

### Configurer les règles de validation pour les champs de collection

La plupart des champs permettent de configurer des règles de validation. Une fois ces règles définies pour un champ, une validation côté serveur est déclenchée lors de la soumission des données. Différents types de champs prennent en charge différentes règles de validation.

- **Champ de date**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Champ numérique**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Champ de texte**

  En plus de limiter la longueur du texte, les champs de texte prennent également en charge les expressions régulières personnalisées pour une validation plus précise.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Validation côté client dans la configuration des champs

Les règles de validation définies dans la configuration des champs déclenchent une validation côté client, garantissant que la saisie de l'utilisateur est conforme aux exigences.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

Les **champs de texte** prennent également en charge la validation par expressions régulières personnalisées pour répondre à des exigences de format spécifiques.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)