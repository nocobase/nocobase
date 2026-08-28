---
pkg: "@nocobase/plugin-comments"
title: "Table des commentaires"
description: "La table des commentaires stocke les commentaires, réponses et retours associés aux enregistrements métier, et prend en charge le contenu enrichi, le suivi des utilisateurs, les commentaires imbriqués et les blocs de commentaires."
keywords: "table des commentaires,fonctionnalité de commentaires,commentaires enrichis,commentaires imbriqués,Collection Comment,NocoBase"
---

# Table des commentaires

## Introduction

La table des commentaires convient à l’enregistrement des discussions, retours et annotations associés aux enregistrements métier. Les commentaires de tâches, avis d’approbation, commentaires d’articles et retours clients peuvent par exemple être enregistrés dans une table des commentaires.

La table des commentaires n’est généralement pas utilisée seule comme table métier principale. Il est plus courant de commencer par créer une table des commentaires, puis de configurer un champ de relation dans la table métier et enfin d’ajouter un bloc de commentaires dans la vue détaillée ou la fenêtre contextuelle de l’enregistrement métier.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Cas d’utilisation

La table des commentaires convient notamment aux scénarios métier suivants :

- Discussions collaboratives sur les tâches, exigences et anomalies
- Avis de traitement concernant les demandes d’approbation, tickets et contrats
- Commentaires sur les articles, bases de connaissances et annonces
- Retours clients, suivi après-vente et remarques internes

## Processus d’utilisation

La table des commentaires est généralement utilisée avec une table métier et un bloc de commentaires :

1. Créez une table des commentaires pour stocker le contenu des commentaires, les relations de réponse, le créateur, la date de création et d’autres informations.
2. Créez un champ de relation dans la table métier et associez-le à la table des commentaires. Par exemple, associez la table « Tâches » à la table « Commentaires des tâches ».
3. Ajoutez un bloc de commentaires dans la page détaillée ou la fenêtre contextuelle de la table métier.
4. Les utilisateurs publient des commentaires ou des réponses dans le bloc de commentaires. Les données sont enregistrées dans la table des commentaires et associées à l’enregistrement métier courant.
5. Configurez les permissions de la table des commentaires selon les besoins métier afin de contrôler qui peut consulter, créer ou supprimer les commentaires.

## Créer et configurer

Dans la base de données principale, cliquez sur « Create collection », puis sélectionnez « Comment collection » pour créer une table des commentaires.

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| Configuration | Description |
| --- | --- |
| Collection display name | Nom sous lequel la table s’affiche dans l’interface, par exemple « Commentaires des tâches », « Avis d’approbation » ou « Commentaires des articles ». |
| Collection name | Nom d’identification de la table, utilisé pour les références internes dans l’API, les champs de relation, les permissions, les workflows, etc. |
| Inherits | Sélectionnez la table parente dont hériter. Visible uniquement lorsque la base de données principale est PostgreSQL. |
| Categories | Catégories de la table. Les catégories influencent uniquement l’organisation de l’interface de gestion des tables et ne modifient pas la structure de la table. |
| Description | Description de la table. Vous pouvez préciser à quel objet métier cette table des commentaires est destinée, qui la gère et comment les permissions de commentaire sont conçues. |
| Preset fields | Champs prédéfinis. Lors de la création d’une table des commentaires, il est recommandé de conserver les champs système et les champs intégrés de la table des commentaires. |

### Champs intégrés

Après sa création, une table des commentaires contient généralement les champs intégrés suivants. Le bloc de commentaires s’appuie principalement sur `content`, `createdBy` et `createdAt` pour afficher le contenu, l’auteur et la date des commentaires.

| Champ | Nom du champ | Description |
| --- | --- | --- |
| ID | `id` | Champ de clé primaire par défaut, utilisé pour identifier de manière unique un enregistrement de commentaire. |
| Contenu du commentaire | `content` | Stocke le corps du commentaire saisi par l’utilisateur et utilise par défaut le composant Markdown Vditor. |
| Date de création | `createdAt` | Enregistre automatiquement la date de création du commentaire ; le bloc de commentaires l’utilise pour afficher la date du commentaire. |
| Créateur | `createdBy` | Enregistre automatiquement l’utilisateur ayant publié le commentaire ; le bloc de commentaires l’utilise pour afficher son auteur. |
| Date de mise à jour | `updatedAt` | Enregistre automatiquement la date de la dernière modification du commentaire. |
| Modificateur | `updatedBy` | Enregistre automatiquement l’utilisateur ayant effectué la dernière modification du commentaire. |
| Espace | `space` | Disponible après l’activation du [plugin multi-espace](../../multi-app/multi-space/index.md), ce champ sert à isoler les données par espace. Il n’apparaît pas lorsque le multi-espace n’est pas activé. |

:::warning Attention

Les champs intégrés de la table des commentaires sont généralement gérés par le bloc de commentaires. Il est déconseillé de les supprimer ou de leur attribuer une autre signification métier sans précaution. Si vous devez enregistrer la catégorie du commentaire, son état de traitement ou d’autres informations, vous pouvez ajouter des champs métier.

:::

### Champ de clé primaire

La table des commentaires, comme une table ordinaire, doit comporter un champ de clé primaire. Le bloc de commentaires utilise la clé primaire pour localiser les enregistrements de commentaires et les relations de réponse.

Si la table des commentaires ne possède pas de clé primaire, définissez « Record unique key » lors de la modification de la table de données ; sinon, le bloc de commentaires risque de ne pas pouvoir consulter, répondre à ou supprimer correctement les commentaires.

## Établir une relation
Créez un champ de relation dans la table métier et associez-le à la table des commentaires
![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## Utilisation dans la configuration des pages

La table des commentaires est généralement utilisée via le bloc de commentaires. Vous pouvez ajouter ce bloc dans la page détaillée, la fenêtre contextuelle ou la page d’enregistrement de la table métier afin que les utilisateurs puissent commenter l’enregistrement courant.

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| Emplacement de configuration | Utilisation |
| --- | --- |
| [Bloc de détail](../../interface-builder/blocks/data-blocks/details.md) | Affiche l’accès aux commentaires dans les détails de l’enregistrement métier. |
| [Bloc de formulaire](../../interface-builder/blocks/data-blocks/form.md) | Utilise le champ de relation des commentaires dans le processus de modification de la table métier. |
| Bloc de commentaires | Affiche la liste des commentaires et permet de publier des commentaires et d’y répondre. |

## Modifier la configuration

Dans la liste des tables de données, cliquez sur « Edit » à droite de la table des commentaires pour modifier son nom d’affichage, ses catégories, sa description, le mode de pagination simplifié, « Record unique key » et d’autres paramètres.

Après la mise en production de la table des commentaires, il est déconseillé de modifier arbitrairement le champ de contenu des commentaires ou le champ de relation des réponses. Le bloc de commentaires, les permissions, les workflows et l’API peuvent dépendre de ces champs.

## Supprimer la table de données

Dans la liste des tables de données, cliquez sur « Delete » à droite de la table des commentaires pour la supprimer.

La suppression de la table des commentaires supprime les enregistrements de commentaires, les relations de réponse et les métadonnées Collection associées. Avant de supprimer la table, vérifiez si les champs de relation, le bloc de commentaires, les permissions, les workflows et l’API de la table métier en dépendent encore.

:::danger Avertissement

La suppression de la table des commentaires fera perdre les données de commentaires aux enregistrements métier existants. Les commentaires contiennent souvent l’historique de la collaboration et les avis de traitement ; avant d’effectuer cette opération, vérifiez s’il est nécessaire de réaliser une sauvegarde ou un archivage.

:::

## Liens associés

- [Table ordinaire](../data-source-main/general-collection.md) — Consultez la configuration générale et les modes d’utilisation des blocs
- [Champ de relation](../data-modeling/collection-fields/associations/index.md) — Découvrez comment associer une table métier à une table des commentaires
- [Plugin de commentaires](../../plugins/@nocobase/plugin-comments/index.md) — Consultez le bloc de commentaires et les fonctionnalités de commentaire
- [Multi-espace](../../multi-app/multi-space/index.md) — Découvrez le champ d’espace et les fonctionnalités d’isolation par espace