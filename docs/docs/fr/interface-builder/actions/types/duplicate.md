---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/actions/types/duplicate).
:::

# Dupliquer

## Présentation

L'action Dupliquer permet aux utilisateurs de créer rapidement de nouveaux enregistrements à partir de données existantes. Elle prend en charge deux modes de duplication : **Duplication directe** et **Dupliquer vers le formulaire et continuer à remplir**.

## Installation

Il s'agit d'un plugin intégré, aucune installation supplémentaire n'est requise.

## Mode de duplication

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Duplication directe

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- S'exécute par défaut en tant que « Duplication directe » ;
- **Champs du modèle** : Spécifiez les champs à dupliquer. L'option « Tout sélectionner » est prise en charge. Il s'agit d'une configuration requise.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Une fois configuré, cliquez sur le bouton pour dupliquer les données.

### Dupliquer vers le formulaire et continuer à remplir

Les champs du modèle configurés seront pré-remplis dans le formulaire en tant que **valeurs par défaut**. Les utilisateurs peuvent modifier ces valeurs avant de soumettre pour terminer la duplication.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Configurer les champs du modèle** : Seuls les champs sélectionnés seront reportés comme valeurs par défaut.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Synchroniser les champs du formulaire

- Analyse automatiquement les champs déjà configurés dans le bloc de formulaire actuel en tant que champs du modèle ;
- Si les champs du bloc de formulaire sont modifiés ultérieurement (par exemple, ajustement des composants de champ d'association), vous devez rouvrir la configuration du modèle et cliquer sur **Synchroniser les champs du formulaire** pour garantir la cohérence.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Les données du modèle seront remplies comme valeurs par défaut du formulaire, et les utilisateurs pourront soumettre après modification pour terminer la duplication.

### Notes complémentaires

#### Dupliquer, Référence, Préchargement

Différents types de champs (types d'association) ont des logiques de traitement différentes : **Dupliquer / Référence / Préchargement**. Le **composant de champ** d'un champ d'association affecte également cette logique :

- Sélection / Sélecteur d'enregistrement : Utilisé pour la **Référence**
- Sous-formulaire / Sous-tableau : Utilisé pour la **Duplication**

**Dupliquer**

- Les champs ordinaires sont dupliqués ;
- `hasOne` / `hasMany` ne peuvent être que dupliqués (ces relations ne doivent pas utiliser de composants de sélection comme la sélection simple ou le sélecteur d'enregistrement ; utilisez plutôt les composants Sous-formulaire ou Sous-tableau) ;
- Modifier le composant pour `hasOne` / `hasMany` **ne changera pas** la logique de traitement (elle reste Duplication) ;
- Pour les champs d'association dupliqués, tous les sous-champs peuvent être sélectionnés.

**Référence**

- `belongsTo` / `belongsToMany` sont traités comme Référence ;
- Si le composant de champ est modifié de « Sélection simple » à « Sous-formulaire », la relation passe de **Référence à Duplication** (une fois qu'elle devient Duplication, tous les sous-champs deviennent sélectionnables).

**Préchargement**

- Les champs d'association sous un champ de Référence sont traités comme Préchargement ;
- Les champs de préchargement peuvent devenir Référence ou Duplication après un changement de composant.

#### Tout sélectionner

- Sélectionne tous les **champs de duplication** et les **champs de référence**.

#### Les champs suivants seront filtrés de l'enregistrement sélectionné comme modèle de données :

- Les clés primaires des données d'association dupliquées sont filtrées ; les clés primaires pour Référence et Préchargement ne sont pas filtrées ;
- Clés étrangères ;
- Champs n'autorisant pas les doublons (Unique) ;
- Champs de tri ;
- Champs de séquence (auto-incrémentation) ;
- Mot de passe ;
- Créé par, Créé le ;
- Dernière mise à jour par, Mis à jour le.

#### Synchroniser les champs du formulaire

- Analyse automatiquement les champs configurés dans le bloc de formulaire actuel en champs du modèle ;
- Après avoir modifié les champs du bloc de formulaire (par exemple, ajustement des composants de champ d'association), vous devez synchroniser à nouveau pour garantir la cohérence.