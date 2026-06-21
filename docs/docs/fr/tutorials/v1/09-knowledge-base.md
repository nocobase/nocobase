# Chapitre 8 : Base de connaissances - Tables arborescentes

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113815089907668&bvid=BV1mfcgeTE7H&cid=27830914731&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

### 8.1 Bienvenue dans ce nouveau chapitre

Dans ce chapitre, nous allons apprendre en profondeur à construire une base de connaissances. Il s'agira d'un module global qui nous aide à gérer et organiser les documents, les tâches et les informations. À travers la conception et la création d'une table de documents en structure arborescente, nous mettrons en place une gestion efficace de l'état des documents, de leurs pièces jointes et des tâches associées.

### 8.2 Introduction à la conception de la base de données

#### 8.2.1 Conception de base et création de la table Documents

Commençons par une conception simple et créons pour la base de connaissances une « table Documents » qui enregistre les informations de tous les documents. Voici les champs clés :

1. **Titre (Title)** : nom du document, au format texte ligne unique.
2. **Contenu (Content)** : contenu détaillé du document, au format texte multilignes prenant en charge le Markdown.
3. **Statut du document (Status)** : marque l'état actuel du document. Quatre options : Brouillon, Publié, Archivé, Supprimé.
4. **Pièces jointes (Attachment)** : permet d'ajouter des fichiers et images pour enrichir le document.
5. **Tâche associée (Related Task)** : champ relationnel plusieurs-à-un pour relier un document à une tâche, ce qui facilite la référence documentaire dans la gestion des tâches.

![](https://static-docs.nocobase.com/2412061730%E6%96%87%E6%A1%A3-%E4%BB%BB%E5%8A%A1er.svg)

Au fil des extensions, nous ajouterons d'autres champs au système de gestion documentaire.

#### 8.2.2 Construction de l'arborescence et gestion des dossiers

> Les tables arborescentes (fournies par le plugin Tree Collection) sont des structures arborescentes : chaque enregistrement peut avoir un ou plusieurs sous-enregistrements, qui peuvent eux-mêmes en avoir.

Pour assurer l'organisation et la hiérarchie des documents, nous choisissons pour notre table Documents la [**table arborescente**](https://docs-cn.nocobase.com/handbook/collection-tree), ce qui facilite la mise en place d'une classification parent-enfant. Lors de la création d'une table arborescente, le système génère automatiquement les champs suivants :

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190010004.png)

- **ID de l'enregistrement parent** : enregistre le document parent du document courant.
- **Enregistrement parent** : champ plusieurs-à-un, pour matérialiser la relation parent-enfant.
- **Enregistrements enfants** : champ un-à-plusieurs, pour consulter tous les sous-documents d'un document.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011580.png)

Ces champs maintiennent la hiérarchie d'une table arborescente, il est donc déconseillé de les modifier.

Nous devons aussi créer une relation [(plusieurs-à-un)](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) avec la table Tâches, en activant la relation inverse pour pouvoir, depuis la popup d'association d'une tâche, créer une liste de documents si nécessaire.

### 8.3 Créer la page Gestion documentaire

#### 8.3.1 Créer le menu Gestion documentaire

Dans le menu principal du système, ajoutez une nouvelle page « Gestion documentaire » et choisissez une icône appropriée. Créez ensuite un bloc Tableau pour notre table Documents. Dans ce bloc, ajoutez les opérations basiques d'ajout, suppression, modification, consultation et saisissez quelques données de test pour vérifier que la conception fonctionne correctement.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011929.gif)

#### Exercice

1. Essayez d'ajouter un document parent nommé « Document 1 » dans la page Gestion documentaire.
2. Ajoutez à « Document 1 » un sous-document nommé « Chapitre 1 ».

#### 8.3.2 Convertir en vue arborescente

Vous vous demandez peut-être pourquoi il ne s'agit pas par défaut d'une arborescence de dossiers ?

Par défaut, le bloc Tableau affiche une vue tableau classique. Activons-la manuellement :

1. Cliquez en haut à droite du bloc Tableau > Tableau arborescent.

   À l'instant où vous cochez l'option, vous remarquerez un nouvel interrupteur « Tout déplier ».

   En même temps, le « Chapitre 1 » créé précédemment a disparu.
2. Cliquez sur l'interrupteur « Tout déplier » sous le tableau arborescent.

   La structure parent-enfant des documents est désormais affichée plus clairement et vous pouvez consulter et déplier facilement tous les niveaux.

   Au passage, ajoutons l'action « Ajouter un sous-enregistrement ».

Conversion en table arborescente réussie !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012338.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012178.png)

### 8.3.3 Configurer « Ajouter un sous-enregistrement »

Définissons le contenu de base nécessaire à l'ajout. À ce stade, si nous cochons le champ d'enregistrement parent, vous remarquerez qu'il est par défaut en « Lecture seule (non éditable) » ; en effet, par défaut, on crée sous le document courant.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012648.png)

Si vous avez beaucoup de tâches, l'attribution d'une tâche peut devenir fastidieuse. Définissons une valeur par défaut pour le filtre de tâche : qu'elle soit égale à la tâche associée à l'enregistrement parent.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012417.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013403.png)

La valeur par défaut peut ne pas s'appliquer immédiatement ; refermez puis cliquez à nouveau, elle se remplit automatiquement !

### 8.4 Configurer le modèle de formulaire et l'association aux tâches

#### 8.4.1 Créer des [modèles](https://docs-cn.nocobase.com/handbook/block-template) de tableau et de formulaire

Pour faciliter la gestion ultérieure, nous [enregistrons en modèle](https://docs-cn.nocobase.com/handbook/block-template) le tableau, le formulaire de création et le formulaire d'édition des documents, afin de les réutiliser sur d'autres pages.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013599.png)

#### 8.4.2 Affichage en copie du bloc Tableau Documents

Dans la popup de consultation de la table Tâches, ajoutez un nouvel [onglet](https://docs-cn.nocobase.com/manual/ui/pages) « Documents ». Dans cet onglet, ajoutez un bloc Formulaire > Autres enregistrements > Table Documents > « Copier le modèle » > cliquez pour intégrer le modèle de formulaire des documents que nous avons créé. (Choisissez impérativement [**Copier le modèle**](https://docs-cn.nocobase.com/handbook/block-template).)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013140.png)

Cette approche facilite la création de toutes les listes de documents.

#### 8.4.3 Adaptation pour l'association aux tâches

Comme le modèle de tableau a été copié depuis l'extérieur sans association à la table Tâches, l'ensemble des données documentaires s'affichent — ce n'est sûrement pas l'effet recherché.

Cas fréquent : si vous n'avez pas de champ relationnel et que vous devez afficher des données associées, il faut associer manuellement les deux. (Vous devez utiliser [**Copier le modèle**](https://docs-cn.nocobase.com/handbook/block-template) et non [Référencer le modèle](https://docs-cn.nocobase.com/handbook/block-template), sinon toutes vos modifications se synchronisent sur les autres blocs Tableau !)

- Association à l'affichage des données

Cliquez en haut à droite du bloc Tableau, puis [« Définir la plage de données »](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/data-scope) :

【Tâche / ID】 = 【Enregistrement de la popup courante / ID】

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014372.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014983.gif)

C'est bon : seuls les documents associés à notre tâche restent désormais dans le tableau.

- Associer le bloc d'ajout (formulaire)

Ouvrez le bloc d'ajout :

Pour le champ associé à la table Tâches, définissez la [valeur par défaut](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/default-value) > 【Enregistrement de la popup parente】.

La popup parente est l'opération « Voir » de la tâche dans laquelle nous nous trouvons : elle est directement liée aux données de la tâche correspondante.

Définissez le champ en [Lecture seule (mode lecture)](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/pattern), pour signifier que dans la popup courante, on ne peut associer que la tâche courante.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014424.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014289.gif)

Voilà ! L'ajout et l'affichage portent désormais sur les documents associés à la tâche en cours.

Si vous êtes attentif(ve), vous pouvez compléter le filtrage associé sur « Éditer » et « Ajouter un sous-enregistrement ».

Pour rendre la structure plus lisible et la colonne d'actions plus harmonieuse, déplaçons le titre en première colonne.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015378.png)

### 8.5 Filtrage et recherche dans la gestion documentaire

#### 8.5.1 Ajouter un [bloc de filtrage](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)

Profitons-en pour ajouter une fonctionnalité de filtrage à la table Documents.

- Sur la page Gestion documentaire, ajoutez un [bloc de filtrage](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form).
- Choisissez le formulaire dans les filtres et placez-le tout en haut.
- Cochez les champs Titre, Statut, champ Tâche, etc., comme conditions de filtrage.
- Ajoutez les actions « Filtrer » et « Réinitialiser ».

Ce formulaire devient notre barre de recherche, pratique pour retrouver rapidement les documents en saisissant des mots-clés.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015868.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015365.gif)

#### 8.5.2 [Connecter les blocs de données](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

À ce stade, vous remarquerez que cliquer ne déclenche rien : il manque une dernière étape, à savoir connecter entre eux les blocs équipés de la fonctionnalité de recherche.

- Cliquez en haut à droite du bloc, configuration > [Connecter les blocs de données](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block).

  ```
  Vous y trouverez la liste des blocs connectables.

  Comme nous avons créé un formulaire pour la table Documents, il recherche tous les blocs de données associés à la table Documents (ici, un seul sur la page) et les propose comme options.

  Pas d'inquiétude pour vous repérer : lorsque vous survolez l'option, la vue à l'écran se concentre automatiquement sur le bloc correspondant.
  ```
- Activez le bloc cible à connecter, puis testez la recherche.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190016981.gif)

En cliquant sur le bouton de configuration en haut à droite du bloc de filtrage, connectez-le au bloc principal de la table Documents. Ainsi, à chaque condition saisie dans le bloc de filtrage, le bloc Tableau actualise les résultats automatiquement.

### 8.6 [Permissions](https://docs-cn.nocobase.com/handbook/acl) de la base de connaissances

Pour assurer la sécurité documentaire et la régularité de la gestion, attribuez les [permissions](https://docs-cn.nocobase.com/handbook/acl) de la bibliothèque documentaire selon les rôles. Suivant la configuration, les utilisateurs peuvent voir, éditer ou supprimer les documents en fonction de leur rôle.

Dans la suite, nous adapterons la table Documents pour intégrer des fonctionnalités d'actualités et d'annonces ; vous pouvez donc desserrer les permissions un peu.

### 8.7 Récapitulatif et suite

Dans ce chapitre, nous avons mis en place une base de connaissances de base, comprenant la table Documents, la [structure arborescente](https://docs-cn.nocobase.com/handbook/collection-tree) et l'affichage associé aux tâches. Grâce au bloc de filtrage et à la réutilisation de modèles, nous avons obtenu une gestion documentaire efficace.

Direction le [chapitre suivant](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-1) : nous apprendrons à bâtir un tableau de bord personnel intégrant des [graphiques d'analyse de données](https://docs-cn.nocobase.com/handbook/data-visualization) et l'affichage d'informations clés !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
