:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Lier un flux de travail

## Introduction

Sur certains boutons d'action, vous pouvez configurer un **flux de travail** lié. Cela permet d'associer l'action de soumission à un **flux de travail**, automatisant ainsi le traitement des données.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Actions et types de flux de travail pris en charge

Voici les boutons d'action et les types de **flux de travail** actuellement pris en charge pour la liaison :

| Bouton d'action \ Type de **flux de travail** | Événement avant l'action | Événement après l'action | Événement d'approbation | Événement d'action personnalisé |
| --- | --- | --- | --- | --- |
| Boutons "Soumettre", "Enregistrer" des formulaires | ✅ | ✅ | ✅ | ❌ |
| Bouton "Mettre à jour l'enregistrement" dans les lignes de données (Tableau, Liste, etc.) | ✅ | ✅ | ✅ | ❌ |
| Bouton "Supprimer" dans les lignes de données (Tableau, Liste, etc.) | ✅ | ❌ | ❌ | ❌ |
| Bouton "Déclencher le **flux de travail**" | ❌ | ❌ | ❌ | ✅ |

## Lier plusieurs flux de travail

Un bouton d'action peut être lié à plusieurs **flux de travail**. Lorsque plusieurs **flux de travail** sont liés, leur ordre d'exécution suit les règles suivantes :

1. Pour les **flux de travail** du même type de déclencheur, les **flux de travail** synchrones s'exécutent en premier, suivis par les **flux de travail** asynchrones.
2. Les **flux de travail** du même type de déclencheur s'exécutent dans l'ordre de configuration.
3. Entre les **flux de travail** de différents types de déclencheurs :
    1. Les événements avant l'action sont toujours exécutés avant les événements après l'action et les événements d'approbation.
    2. Les événements après l'action et les événements d'approbation n'ont pas d'ordre spécifique, et la logique métier ne devrait pas dépendre de l'ordre de configuration.

## En savoir plus

Pour les différents types d'événements de **flux de travail**, veuillez consulter la documentation détaillée des **plugins** pertinents :

* [Événement après l'action]
* [Événement avant l'action]
* [Événement d'approbation]
* [Événement d'action personnalisé]