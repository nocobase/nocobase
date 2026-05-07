# Chapitre 3 : Gestion des données de tâches

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113504258425496&bvid=BV1XvUxYREWx&cid=26827688969&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Maintenant que nous avons clarifié les besoins du système de gestion de tâches, il est temps de passer à l'action ! Pour rappel, notre système de gestion de tâches doit pouvoir **[créer](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [éditer](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) et [supprimer](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete)** des tâches, ainsi qu'**afficher la liste des tâches**, et toutes ces fonctionnalités s'implémentent via les pages, blocs et actions de NocoBase.

> Consultez la documentation officielle pour les définitions détaillées des [menus](https://docs-cn.nocobase.com/handbook/ui/menus) et [pages](https://docs-cn.nocobase.com/handbook/ui/pages).

### 3.1 Par où commencer ?

Vous vous souvenez peut-être que nous avons déjà vu comment créer une nouvelle page et afficher une liste d'utilisateurs. Ces pages sont comme des toiles vierges : elles peuvent contenir différents types de blocs, dont vous pouvez librement organiser l'ordre et la taille. Pour rappel, les étapes :

1. [**Créer une page**](https://docs-cn.nocobase.com/handbook/ui/pages) : quelques clics suffisent pour créer une page.
   ![Créer une page](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333648.gif)
2. **Créer un [bloc Tableau](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)** : une fois le bloc Tableau choisi, vous pouvez afficher différentes données.
   ![Créer un bloc Tableau](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333239.gif)

Cela paraît très simple, n'est-ce pas ?
Mais en ouvrant la « Liste des données », vous découvrirez que les options par défaut ne contiennent que les tables « Utilisateurs » et « Rôles ».
Où est passée la table Tâches ? Pas d'inquiétude, la réponse se trouve dans la fonction [**Source de données**](https://docs-cn.nocobase.com/handbook/data-source-manager) de NocoBase.

> **À propos des sources de données :** une source de données peut être une base de données, une API ou tout autre type de stockage. Elle prend en charge la connexion à diverses bases relationnelles, comme MySQL, PostgreSQL, SQLite, MariaDB.
> NocoBase fournit un **plugin de gestion des sources de données** qui prend en charge l'administration des sources et des tables. Ce plugin propose toutefois uniquement l'interface ; il a besoin d'être combiné aux **plugins de sources de données** correspondants pour réellement se connecter aux sources.

### 3.2 La source de données : votre entrepôt de tables

![](https://static-docs.nocobase.com/20241009144356.png)

Dans NocoBase, toutes les tables de données sont stockées dans des [**sources de données**](https://docs-cn.nocobase.com/handbook/data-source-manager). La source de données est comme un livre dans lequel sont consignés la conception et la structure de chaque table. Écrivons ensemble une nouvelle page : la **table Tâches**.

> [!NOTE] Note
> Pour plus d'informations sur les capacités des sources et des tables, voir la [Gestion des sources de données](https://docs-cn.nocobase.com/handbook/data-source-manager) et la [Présentation des tables](https://docs-cn.nocobase.com/handbook/data-modeling/collection).

- **Accéder à la configuration de la source de données** :
  - Cliquez en haut à droite sur **Paramètres** > **Sources de données** > **Configuration de la source principale**.
  - Vous verrez toutes les tables existantes dans la source principale de NocoBase, en général uniquement « Utilisateurs » et « Rôles » par défaut.
    ![Configuration de la source de données](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334835.gif)

Il est temps de créer la troisième table, à savoir notre **table Tâches**. C'est notre première création de table dans NocoBase, un moment vraiment excitant ! Conformément à la conception précédente, nous créons simplement une table de tâches contenant les champs suivants :

```
Table Tâches (Tasks) :
        Nom de la tâche (task_name) Texte ligne unique
        Description de la tâche (task_description) Texte multilignes
```

### 3.3 Créer la table Tâches

1. **Créer la table Tâches** :

   - Cliquez sur « Créer une table » > sélectionnez **Table standard** > saisissez le **nom de la table** (par exemple « Table Tâches ») et son **identifiant** (par exemple « tasks »).
   - L'**identifiant de la table** est l'ID unique ; nous recommandons d'utiliser des lettres anglaises, des chiffres ou des underscores, pour faciliter la recherche et la maintenance ultérieures.
   - Validez la création.
     ![Créer la table Tâches](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334006.gif)
2. **À propos des champs par défaut** :
   NocoBase génère pour chaque table standard des champs prédéfinis :

   - **ID** : identifiant unique de chaque enregistrement.
   - **Date de création** : enregistre automatiquement la date de création de la tâche.
   - **Créé par** : enregistre automatiquement le créateur de la tâche.
   - **Date de dernière modification** et **Modifié par** : enregistrent la date et l'auteur de la dernière modification.

Ces champs par défaut correspondent à ce dont nous avons besoin et nous évitent bien des ajouts manuels.

3. **Créer des champs personnalisés** :
   - **Nom de la tâche** : cliquez sur « Ajouter un champ » > sélectionnez **Texte ligne unique** > donnez le nom de champ « Nom de la tâche » et l'identifiant « task_name ».
     ![Créer le champ Nom de la tâche](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335943.gif)
   - **Description de la tâche** : créez un autre champ **Texte multilignes**, identifiant « task_description ».
     ![Créer le champ Description de la tâche](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335521.gif)

Félicitations ! Notre **table Tâches** est désormais définie : vous avez créé votre propre structure de données de tâches. Bravo à vous !

### 3.4 Créer la page de gestion des tâches

Maintenant que nous avons la table Tâches, il s'agit d'utiliser un bloc adapté pour la présenter dans le conteneur de la page. Nous allons créer une page **Gestion des tâches** et y ajouter un bloc Tableau qui affiche les données de tâches.

1. **Créer la page Gestion des tâches** :

   - Cliquez sur « Nouvelle page » et nommez-la « Gestion des tâches ».
   - Créez un bloc tâches qui affiche les données de la table Tâches.
     ![Créer un bloc tâches](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162336833.gif)
2. **Ajouter des données** :

   - « Tiens, pourquoi n'y a-t-il pas de données ? ». Pas d'inquiétude, c'est ce que nous allons faire maintenant !
   - Cliquez en haut à droite sur « Configurer les actions », puis sur l'action **« Ajouter »** : une popup vide apparaît.
     Les actions [Ajouter](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new) et [Éditer](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) sont liées à une popup par défaut.
   - Place à un nouveau bloc (le formulaire) : Créer un bloc dans la popup > sélectionnez **Table actuelle**.
   - Affichez les champs Nom de la tâche et Description, configurez l'action de soumission, validez le formulaire, et c'est terminé !
     ![Configurer les actions](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162337313.gif)
3. **Saisir des données** :

   - Saisissez une donnée de test, cliquez sur Soumettre, c'est réussi ! Les données de tâche sont ajoutées.
     ![Soumettre des données](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338074.gif)

Moment palpitant ! Vous venez d'enregistrer votre première tâche, n'est-ce pas simple ?

### 3.5 Recherche et filtrage des tâches — localiser rapidement vos tâches

Lorsque les tâches s'accumulent, comment trouver rapidement celle qui vous intéresse ? C'est là qu'intervient l'[**action de filtre**](https://docs-cn.nocobase.com/handbook/ui/actions/types/filter). Avec NocoBase, vous combinez aisément les conditions du filtre pour localiser une tâche précise.

#### 3.5.1 Activer l'action de filtre

D'abord, activez l'action de filtre :

- **Survolez « Configurer les actions »** avec la souris, puis cliquez sur l'**interrupteur de filtre** pour l'activer.
  ![Activer le filtre](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338152.png)

#### 3.5.2 Utiliser des conditions de filtre

Une fois l'action activée, le bouton de filtre apparaît sur la page. Vous pouvez maintenant tester le filtrage à l'aide du **Nom de la tâche** :

- Dans le panneau de filtre, sélectionnez Nom de la tâche et saisissez le contenu recherché.
- Cliquez sur « Soumettre » et vérifiez que la liste des tâches affiche bien le résultat filtré.
  ![Activer le filtre](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338495.gif)

#### 3.5.3 Désactiver l'action de filtre

Si vous n'avez plus besoin de l'action de filtre : pour les actions de type interrupteur, un seul clic suffit pour les désactiver.

- **Réinitialisez les conditions de filtre** : assurez-vous qu'aucune condition n'est active, puis cliquez sur « Réinitialiser ».
- Cliquez à nouveau sur l'**interrupteur « Filtre »** : il sera masqué de la page.
  ![Désactiver le filtre](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339299.gif)

Aussi simple que cela ! L'action de filtre vous facilite grandement la gestion d'un grand nombre de tâches. Au fur et à mesure de la prise en main du système, d'autres modes de recherche flexibles vous seront révélés. (Vous pouvez consulter le [bloc Filtre formulaire](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) et le [bloc Filtre Collapse](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/collapse).)

Conservez cet enthousiasme et continuons d'avancer !

### 3.6 Édition et suppression des tâches

Outre l'ajout et la recherche, nous devons pouvoir [**éditer**](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) et [**supprimer**](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete) des tâches. Comme vous êtes désormais à l'aise avec l'ajout de blocs, de champs et d'actions, c'est très simple :

1. **Éditer une tâche** :

   - Dans la configuration de la liste des tâches, ajoutez l'action **Éditer**, cliquez sur Éditer > ajoutez un bloc Formulaire (édition) > sélectionnez les champs à modifier.
2. **Supprimer une tâche** :

   - De même, dans la configuration de la colonne d'actions, activez l'action **Supprimer** ; le bouton Supprimer apparaît, cliquez dessus puis confirmez : la tâche est retirée de la liste.
     ![Éditer une tâche](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339672.gif)

Voilà : l'ensemble des opérations **CRUD** sur la liste des tâches est désormais en place.

Bravo ! Vous venez de franchir cette étape avec succès !

### Défi

Maintenant que vous êtes de plus en plus à l'aise avec NocoBase, voici un petit défi : nous voulons marquer le statut de la tâche et permettre l'upload de pièces jointes. Comment faire ?

Indices :

- Ajoutez à la table Tâches :
  1. un champ **Statut (status)**, en liste déroulante à choix unique, contenant les options : **Non démarrée, En cours, En attente de validation, Terminée, Annulée, Archivée**.
  2. un champ **Pièce jointe (attachment)**.
- Dans le tableau des tâches, ainsi que dans les blocs de formulaire « Ajouter » et « Éditer », affichez les champs « Statut » et « Pièce jointe ».

Vous avez une idée ? Pas d'inquiétude, le [chapitre suivant (chapitre 4 : Plugins de tâches et de commentaires — un véritable atout, à maîtriser sereinement)](https://www.nocobase.com/cn/tutorials/task-tutorial-plugin-use) dévoilera la solution. Restons à l'affût !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
