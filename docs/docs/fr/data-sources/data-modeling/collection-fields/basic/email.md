---
title: "E-mail"
description: "Le champ e-mail sert à enregistrer des adresses e-mail et fournit une validation du format des e-mails."
keywords: "e-mail,email,coordonnées,NocoBase"
---

# E-mail

## Présentation

Dans NocoBase, le champ **e-mail (Email)** sert à enregistrer des adresses e-mail.

Le champ e-mail convient aux adresses e-mail des clients, des employés, des fournisseurs et autres coordonnées. Par rapport au texte à une ligne standard, il fournit une sémantique plus précise pour les adresses e-mail ainsi qu’une validation de leur format.

Si le contenu n’est pas une adresse e-mail, mais simplement une information de contact ordinaire, le [texte à une ligne](./input.md) est plus adapté.

## Cas d’utilisation

Le champ e-mail convient notamment aux cas d’utilisation suivants :

- E-mails des clients et des contacts
- E-mails des employés et adresses e-mail de contact pour la connexion
- E-mails des fournisseurs et adresses e-mail de service
- Adresses de réception des notifications

## Créer et configurer

Dans la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « E-mail » pour créer un champ e-mail.

![20240512175609](https://static-docs.nocobase.com/20240512175609.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. L’e-mail correspond à `email`, qui détermine la manière dont le champ est saisi et affiché dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « E-mail du client », « E-mail du contact » ou « E-mail de réception ». Il est recommandé d’utiliser un nom directement compréhensible par les équipes métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les autorisations, les workflows, etc. Il n’est généralement plus modifié après la création. Il ne peut contenir que des lettres, des chiffres et des traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ dans la couche de données. Le champ e-mail est par défaut de type `string`. |
| Default value | Valeur par défaut. Lors de la création d’un enregistrement, cette valeur peut être automatiquement renseignée si l’utilisateur ne saisit rien. |
| Validation rules | Règles de validation. Il est généralement nécessaire d’activer la validation du format des e-mails. Le champ peut également être rendu obligatoire. |
| Description | Description du champ. Elle peut préciser sa signification, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Après sa création, le nom du champ sera référencé par les blocs de page, les autorisations, les workflows et les API. Vérifiez le nom avant la création afin d’éviter des coûts de reconfiguration ultérieurs.

:::

## Caractéristiques du champ

Le comportement par défaut du champ e-mail est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `email`. |
| Field type par défaut | `string`. |
| Field type disponible | `string`. |
| Composant de page | En mode édition, un champ de saisie est utilisé et le format de l’adresse e-mail est validé. |
| Filtrage | Les filtres de type texte sont pris en charge, notamment contient, égal à, est vide et n’est pas vide. |
| Tri | Le tri est pris en charge dans les blocs de tableau. |
| Validation | La validation du format des e-mails, l’obligation de saisie et d’autres règles sont prises en charge. |

## Modifier la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification d’un champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple son nom d’affichage, sa description, sa valeur par défaut, ses règles de validation ou ses options spécifiques.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer une correspondance de champ : le champ de la base de données est associé à un Field type et à une Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans modifier son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après sa création. |
| Field interface | Selon les conditions | L’interface des champs de la base de données principale ou des champs synchronisés peut être ajustée lors de la correspondance des champs. Cette modification affecte la saisie, l’affichage et la validation dans les pages. |
| Field type | Selon les conditions | Le type des champs de la base de données principale ou des champs synchronisés peut être ajusté lors de la correspondance des champs. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Default value | Oui | Modifie la valeur par défaut lors de la création de nouveaux enregistrements. |
| Validation rules | Oui | Modifie les règles de validation du champ. |
| Description | Oui | Complète la signification du champ, les exigences de saisie, la source des données ou la personne responsable de sa maintenance. |

:::warning Attention

Changer le Field type ou la Field interface ne revient pas à modifier simplement un nom d’affichage. Cela affecte le mode de stockage du champ, le composant de saisie, les règles de validation, les critères de filtrage et la manière dont les variables sont utilisées dans les workflows. Lorsque le volume de données existantes est important, vérifiez d’abord que leur format est compatible.

:::

## Supprimer un champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ e-mail. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs, puis les supprimer en lot.

Lors de la suppression d’un champ e-mail créé dans la base de données principale, la colonne correspondante dans la base de données ainsi que les données qu’elle contient sont généralement supprimées en même temps. Pour les champs synchronisés depuis une base de données ou issus d’une source de données externe, l’étendue des conséquences dépend de la source de données et de l’origine du champ concerné.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les autorisations, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de supprimer un champ, vérifiez qu’il n’est plus référencé par des configurations métier.

:::

## Utilisation dans la configuration des pages

Le champ e-mail convient aux formulaires, aux pages de détails et aux processus de notification.
![20260709224700](https://static-docs.nocobase.com/20260709224700.png)

| Cas d’utilisation | Fonction |
| --- | --- |
| Bloc de formulaire | Saisir une adresse e-mail. |
| Bloc de détails | Afficher une adresse e-mail. |
| Bloc de filtrage | Filtrer les enregistrements par adresse e-mail. |
| Workflows et notifications | Servir de source pour les destinataires des notifications par e-mail. |

## Liens associés

- [Champs](../index.md) — Comprendre le rôle, la classification et la logique de correspondance des champs
- [Table standard](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table standard
- [Texte à une ligne](./input.md) — Enregistrer un texte court ordinaire
- [Numéro de téléphone](./phone.md) — Enregistrer un numéro de contact
