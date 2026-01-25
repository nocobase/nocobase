:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Bloc de détails

## Introduction

Le bloc de détails sert à afficher les valeurs de chaque champ d'un enregistrement de données. Il prend en charge des mises en page de champs flexibles et intègre diverses fonctions d'action sur les données, facilitant ainsi la consultation et la gestion des informations par les utilisateurs.

## Paramètres du bloc

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Règles de liaison du bloc

Contrôlez le comportement du bloc (par exemple, s'il doit être affiché ou exécuter du JavaScript) via les règles de liaison.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Pour plus de détails, consultez les [Règles de liaison](/interface-builder/linkage-rule)

### Définir la portée des données

Exemple : N'afficher que les commandes payées.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Pour plus de détails, consultez [Définir la portée des données](/interface-builder/blocks/block-settings/data-scope)

### Règles de liaison des champs

Les règles de liaison dans le bloc de détails permettent de définir dynamiquement l'affichage ou le masquage des champs.

Exemple : Ne pas afficher le montant lorsque le statut de la commande est « Annulée ».

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Pour plus de détails, consultez les [Règles de liaison](/interface-builder/linkage-rule)

## Configurer les champs

### Champs de cette collection

> **Note** : Les champs des collections héritées (c'est-à-dire les champs de la collection parente) sont automatiquement fusionnés et affichés dans la liste des champs actuelle.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Champs des collections associées

> **Note** : L'affichage des champs des collections associées est pris en charge (actuellement uniquement pour les relations un-à-un).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Autres champs
- Champ JS
- Élément JS
- Séparateur
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Conseil** : Vous pouvez écrire du JavaScript pour implémenter un contenu d'affichage personnalisé, vous permettant ainsi de présenter des informations plus complexes.  
> Par exemple, vous pouvez afficher différents effets visuels en fonction de différents types de données, conditions ou logiques.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Configurer les actions

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Modifier](/interface-builder/actions/types/edit)
- [Supprimer](/interface-builder/actions/types/delete)
- [Lien](/interface-builder/actions/types/link)
- [Fenêtre contextuelle](/interface-builder/actions/types/pop-up)
- [Mettre à jour l'enregistrement](/interface-builder/actions/types/update-record)
- [Déclencher un flux de travail](/interface-builder/actions/types/trigger-workflow)
- [Action JS](/interface-builder/actions/types/js-action)
- [Employé IA](/interface-builder/actions/types/ai-employee)