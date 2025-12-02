---
pkg: "@nocobase/plugin-comments"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Collection de commentaires

## Introduction

La collection de commentaires est un modèle de collection de données spécialisé, conçu pour stocker les commentaires et les retours des utilisateurs. Grâce à cette fonctionnalité, vous pouvez ajouter des capacités de commentaire à n'importe quelle collection de données, permettant aux utilisateurs de discuter, de fournir des retours ou d'annoter des enregistrements spécifiques. La collection de commentaires prend en charge l'édition de texte enrichi, offrant des capacités de création de contenu flexibles.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Fonctionnalités

- **Édition de texte enrichi** : Inclut par défaut l'éditeur Markdown (vditor), prenant en charge la création de contenu en texte enrichi.
- **Association à n'importe quelle collection de données** : Permet d'associer des commentaires à des enregistrements de n'importe quelle collection de données via des champs de relation.
- **Commentaires multiniveaux** : Prend en charge les réponses aux commentaires, permettant de construire une structure d'arbre de commentaires.
- **Suivi des utilisateurs** : Enregistre automatiquement l'auteur et l'heure de création du commentaire.

## Guide d'utilisation

### Créer une collection de commentaires

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Accédez à la page de gestion des collections de données.
2. Cliquez sur le bouton « Créer une collection ».
3. Sélectionnez le modèle « Collection de commentaires ».
4. Saisissez le nom de la collection (par exemple : « Commentaires de tâches », « Commentaires d'articles », etc.).
5. Le système créera automatiquement une collection de commentaires avec les champs par défaut suivants :
   - Contenu du commentaire (type Markdown vditor)
   - Créé par (lié à la collection d'utilisateurs)
   - Date de création (type date et heure)

### Configurer les relations

Pour lier les commentaires à une collection de données cible, vous devez configurer des champs de relation :

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Ajoutez un champ de relation « Plusieurs à un » dans la collection de commentaires.
2. Sélectionnez la collection de données cible à laquelle vous souhaitez lier les commentaires (par exemple : collection de tâches, collection d'articles, etc.).
3. Définissez le nom du champ (par exemple : « Appartient à la tâche », « Appartient à l'article », etc.).

### Utiliser les blocs de commentaires sur les pages

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Accédez à la page où vous souhaitez ajouter la fonctionnalité de commentaire.
2. Ajoutez un bloc dans les détails ou la fenêtre contextuelle de l'enregistrement cible.
3. Sélectionnez le type de bloc « Commentaires ».
4. Choisissez la collection de commentaires que vous venez de créer.

### Cas d'utilisation typiques

- **Systèmes de gestion de tâches** : Les membres de l'équipe discutent et fournissent des retours sur les tâches.
- **Systèmes de gestion de contenu** : Les lecteurs commentent et interagissent avec les articles.
- **Flux de travail d'approbation** : Les approbateurs annotent et donnent leur avis sur les formulaires de demande.
- **Retours clients** : Recueillez les avis des clients sur les produits ou services.

## Remarques

- La collection de commentaires est une fonctionnalité de plugin commercial et nécessite l'activation du plugin de commentaires pour être utilisée.
- Il est recommandé de définir des permissions appropriées pour la collection de commentaires afin de contrôler qui peut afficher, créer et supprimer des commentaires.
- Pour les scénarios avec un grand nombre de commentaires, il est recommandé d'activer la pagination pour améliorer les performances.