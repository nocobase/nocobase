# Chapitre 4 : Plugins de tâches et de commentaires

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113532393752067&bvid=BV16XB2YqERC&cid=26937593203&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe

## Retour sur la section précédente

Vous vous souvenez du défi proposé ? Nous devions configurer les champs **Statut** et **Pièce jointe** sur la table Tâches et les afficher dans la liste des tâches. Pas d'inquiétude, voici la solution !

1. **Configuration du champ Statut** :
   - Choisissez le champ [**Liste déroulante (choix unique)**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select), saisissez les libellés d'options : **Non démarrée, En cours, En attente de validation, Terminée, Annulée, Archivée**. Pour les couleurs, c'est selon vos préférences ; ajoutez un peu de couleur à vos tâches !

![Configuration du champ Statut](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162341275.png)

2. **Configuration du champ Pièce jointe** :
   - Créez un champ [**Pièce jointe**](https://docs-cn.nocobase.com/handbook/file-manager/field-attachment), donnez-lui un nom, par exemple « Pièce jointe », cliquez sur Soumettre. C'est fait, simplement.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162343470.png)

3. **Afficher le créateur et le statut dans la liste des tâches** :
   - Dans le bloc Tableau, cochez les champs « Créé par », « Statut » et « Pièce jointe » pour enrichir la liste avec ces informations clés.

![Afficher des champs dans la liste des tâches](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162344570.png)

4. **Afficher les champs dans les formulaires d'ajout et d'édition** :
   - Dans les formulaires en popup, n'oubliez pas de cocher les champs Statut et Pièce jointe : ainsi, qu'il s'agisse d'ajouter ou d'éditer une tâche, vous y aurez facilement accès.

![Afficher des champs dans le formulaire](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162345053.gif)

Bien joué, n'est-ce pas ? Pas d'inquiétude, en répétant l'opération quelques fois, vous maîtriserez progressivement les principes fondamentaux de NocoBase. Chaque manipulation pose des bases solides pour la suite de la gestion des tâches. Continuons !

---

## 4.1 Contenu et commentaires des tâches : interactions de gestion

Pour le moment, votre système de gestion de tâches sait porter les informations de base d'une tâche. Cependant, la gestion ne se limite pas à quelques lignes de texte : il nous faut parfois un contenu plus riche et des interactions en temps réel entre les membres de l'équipe.

### 4.1.1 Markdown (Vditor) : enrichir le contenu des tâches

Vous avez sans doute remarqué les éditeurs [**Texte enrichi**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/rich-text) et [**Markdown**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/markdown) fournis par NocoBase. Mais leurs fonctionnalités peuvent ne pas vous suffire.
L'éditeur Texte enrichi reste relativement limité ; l'éditeur Markdown, bien pratique, ne propose pas la prévisualisation en temps réel.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162346447.png)

Existe-t-il un éditeur qui prévisualise en temps réel et qui soit riche en fonctionnalités ? Oui ! [**Markdown (Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor) est l'éditeur de texte le plus puissant de NocoBase : prévisualisation en temps réel, upload d'images, et même enregistrement audio. De plus, il est intégré nativement et entièrement gratuit !

> **À propos des plugins :** les plugins sont l'une des fonctionnalités centrales de NocoBase. Ils permettent d'ajouter des fonctionnalités personnalisées ou d'intégrer des services tiers selon les besoins du projet.
> Grâce aux extensions par plugins, on peut réaliser des intégrations pratiques voire inattendues, ce qui simplifie davantage votre travail de création et de développement.

Je vais vous accompagner pas à pas pour activer ce puissant éditeur. Vous vous souvenez du gestionnaire de plugins ? Eh oui, c'est exactement là qu'il se trouve.

> **Markdown (Vditor)** : sert à stocker du Markdown et utilise l'éditeur Vditor pour le rendu, en supportant la syntaxe Markdown courante (listes, code, citations, etc.) et l'upload d'images, l'enregistrement audio, etc. Il propose un rendu instantané, en mode WYSIWYG.

1. **Activer le plugin Markdown (Vditor)** :
   - Ouvrez le **gestionnaire de plugins** en haut à droite, recherchez « markdown » et activez [**Markdown (Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor). Pas d'inquiétude si la page se rafraîchit brièvement : tout reviendra à la normale en quelques secondes.

![Activer le plugin Markdown](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162348237.png)

2. **Créer un champ Markdown** :

   - Retournez à la table Tâches et cliquez sur « Créer un champ ». Notre Markdown Pro Plus est apparu !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162349275.png)

- Donnez-lui un nom, par exemple « Détails de la tâche (task_detail) », et cochez toutes les options disponibles.

3. Vous remarquerez peut-être l'option « Table de fichiers ». Si elle n'est pas sélectionnée, l'envoi de fichiers est-il impacté ? Pas d'inquiétude : les fichiers seront stockés dans notre espace de stockage par défaut. Vous pouvez l'utiliser sereinement.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162350389.gif)

4. **Tester le champ Markdown** :
   - Retournez à la page Gestion des tâches et écrivez votre premier texte Markdown ! Essayez ensuite de coller une image ou de téléverser un fichier : c'est plutôt impressionnant, non ?

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162351380.gif)

Notre table Tâches s'enrichit ! À chaque étape, votre système se renforce. Voyons à présent comment ajuster la disposition des champs pour rendre l'interface plus harmonieuse.

### 4.1.2 Ajuster la disposition des champs

Avec l'augmentation des champs, la mise en page peut sembler désordonnée. Pas d'inquiétude, la flexibilité de NocoBase vous permet d'ajuster facilement la position des champs.

**Repositionner un champ** :

- Survolez l'icône en croix en haut à droite du champ, cliquez et faites glisser le champ à l'endroit souhaité, puis relâchez. Essayez : la page est instantanément plus claire !

![Repositionner un champ](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162352077.gif)

Cette manipulation rend l'interface plus conforme à vos besoins. Ajoutons maintenant la fonctionnalité de commentaires à la table Tâches pour faciliter les interactions au sein de l'équipe.

## 4.2 Fonctionnalité de commentaires

Une description de tâche ne suffit pas toujours : nous avons parfois besoin que les membres de l'équipe ajoutent des commentaires, discutent et consignent du feedback. C'est parti.

### 4.2.1 Méthode 1 : utiliser le plugin de commentaires

#### 4.2.1.1 Installer le plugin de commentaires

> **Plugin de commentaires (plugin commercial) :** fournit un modèle de table de commentaires et un bloc, pour ajouter des commentaires aux données de n'importe quelle table.
>
> Lors de l'ajout de commentaires, pensez à associer la table cible via un champ relationnel pour éviter les conflits de données.

Dans le [**gestionnaire de plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager), téléversez et activez le **plugin de commentaires**. Une fois activé, une nouvelle option « Table Commentaires » apparaît dans la source de données.
Cliquez sur Ajouter > Téléverser le plugin > Glissez-déposez l'archive > Soumettre.
Recherchez « commentaires », le plugin est apparu ! Une fois activé, dans la source de données, l'option Table Commentaires est visible : installation réussie !

![Installer le plugin de commentaires](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162353550.gif)

#### 4.2.1.2 Créer la table Commentaires

Allons dans la source de données et créons la table de commentaires **Table Commentaires (Comments)**.

#### 4.2.1.3 Réflexion sur la relation entre la table Commentaires et la table Tâches

Nous avons créé la **Table Commentaires (Comments)** : peut-être pensez-vous pouvoir directement dessiner la zone de commentaires sur la page ? Pas si vite : prenons un instant pour réfléchir. **Chaque tâche possède sa propre zone de commentaires** ; la relation entre commentaires et tâches doit être **plusieurs-à-un**. Comment relier les commentaires aux tâches ?

**Eh oui ! C'est ici qu'interviennent les [« champs relationnels »](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations) !**

NocoBase permet d'établir des relations entre les tables au niveau des données via des champs relationnels, comme on dresserait un pont pour relier les données associées.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162355370.gif)

**Pourquoi une relation plusieurs-à-un ?**

Pourquoi choisir une relation [**plusieurs-à-un**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) plutôt que [**un-à-plusieurs**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/o2m) ou un autre type de relation ? Souvenez-vous : **chaque tâche peut avoir plusieurs commentaires**, donc plusieurs commentaires pointent vers la même tâche. Dans ce cas, nous créons sur la table Commentaires un champ **plusieurs-à-un** qui pointe vers la tâche dans la table Tâches.

> Vous pourriez aussi penser :
> Puisque commentaires et tâches sont en plusieurs-à-un, ne pourrait-on pas créer un champ **un-à-plusieurs** sur la table Tâches qui pointe vers la table Commentaires ?
> **Bingo, parfaitement exact !** Un-à-plusieurs et plusieurs-à-un sont des relations inverses l'une de l'autre. Vous pouvez tout aussi bien créer un champ un-à-plusieurs sur la table Tâches qui s'associe à la table Commentaires. Vous êtes excellent(e) !

#### 4.2.1.4 Configurer le champ relationnel plusieurs-à-un

Maintenant, nous allons créer dans la table Commentaires un champ plusieurs-à-un pour la lier à la table Tâches. Nous le nommerons **Tâche associée (belong_task)**. Quelques points clés à la configuration :

1. **Table source** : d'où provient la relation ? Ici, on choisit la **Table Commentaires**.
2. **Table cible** : avec quelle table établir la relation ? Ici, la **Table Tâches**.

> **Clé étrangère et identifiant du champ de la table cible — illustration :**
> Vient ensuite la partie clé : la **clé étrangère** et l'**identifiant du champ de la table cible**.
> Ce concept paraît un peu complexe ? Pas de panique, prenons un exemple détaillé pour vous le rendre limpide.
>
> **Imaginez** que vous avez en main de nombreuses fiches de notes du Gaokao (concours national d'entrée à l'université). Notre tâche : associer chaque fiche au bon élève. Comment procéder ?
> Vous prenez une fiche avec les informations suivantes :
>
> - **Nom** : Zhang San
> - **Classe** : Terminale S 15
> - **Numéro de candidat** : 202300000001
> - **Numéro d'identification** : 111111111111
>   Maintenant, vous voulez retrouver Zhang San via son **nom** et sa **classe**. Mais voilà : dans le même lycée, beaucoup d'élèves portent le même nom ; rien que la classe Terminale S 15 compte **20 élèves nommés Zhang San** ! Avec le seul nom et la seule classe, impossible d'identifier précisément lequel.
>   **C'est là qu'il nous faut un identifiant unique pour les distinguer.** Le **numéro de candidat**, par exemple, est un excellent choix : chaque élève a un numéro unique. Avec ce numéro, on retrouve précisément l'élève correspondant à la fiche. Par exemple, vous lancez une requête sur le numéro 202300000001, et un lycée vous répond peu après : « Cette fiche appartient à Zhang San, le 3e du rang en partant de la gauche en Terminale S 15, celui qui porte des lunettes ! »
>   **Le même principe s'applique** au scénario de relation des **commentaires** : dans la table Tâches, choisissons un champ identifiant unique (par exemple **id**), et stockons-le dans le commentaire pour déterminer à quelle tâche il appartient.
>   C'est exactement le concept central de la mise en œuvre d'une relation plusieurs-à-un : la **clé étrangère**. Simple, n'est-ce pas, hahaha.

Dans la table Commentaires, nous stockons cet identifiant unique de la table Tâches, que nous nommons **task_id** : grâce à task_id, le commentaire est lié à la tâche.

#### 4.2.1.5 Stratégie de gestion de la clé étrangère lors de la suppression

Dans NocoBase, après avoir défini une relation plusieurs-à-un, il faut décider du comportement à la suppression d'une tâche pour les commentaires associés. Plusieurs choix s'offrent à vous :

- **CASCADE** : si vous supprimez la tâche, tous les commentaires associés sont également supprimés.
- **SET NULL** (par défaut) : à la suppression de la tâche, les commentaires sont conservés mais le champ de clé étrangère associé est mis à null.
- **RESTRICT et NO ACTION** : si la tâche a des commentaires liés, le système empêchera sa suppression pour éviter la perte des commentaires.

#### 4.2.1.7 Créer la relation inverse dans la table Tâches

Enfin, cochez « **Créer le champ de relation inverse dans la table cible** » pour pouvoir consulter directement, depuis une tâche, l'ensemble des commentaires associés. Cela rend la gestion des données plus pratique.

Dans NocoBase, l'emplacement du champ relationnel détermine la manière dont les données sont récupérées. Donc, si nous voulons voir les commentaires correspondants depuis la table Tâches, nous devons créer dans la table Tâches un champ de relation **un-à-plusieurs** vers la table Commentaires.

Lorsque vous rouvrirez la table Tâches, le système aura généré automatiquement un champ associé aux commentaires, marqué « **un-à-plusieurs** » : vous pouvez ainsi consulter et gérer aisément tous les commentaires associés !

## 4.3 Construction des pages

### 4.3.1 Activer la table Commentaires

Moment palpitant : retournez dans la popup d'édition, créez le bloc de la table Commentaires, cochez les fonctionnalités souhaitées, et c'est tout !

![demov3N-16.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162357118.gif)

### 4.3.2 Ajuster la page

Embellissons un peu le style. Survolez en haut à droite du bouton Éditer, choisissez une popup plus large. En réutilisant ce que nous avons appris, glissez le bloc Commentaires à droite de la popup. Parfait !

![demov3N-17.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162358300.gif)

Certains lecteurs lorgnent peut-être du côté de cette fonctionnalité : moi aussi je veux des commentaires ! Pas de souci, voici une seconde solution gratuite.

### 4.2.2 Méthode 2 : table de commentaires personnalisée

Si vous n'avez pas acheté le plugin de commentaires, vous pouvez réaliser une fonctionnalité similaire en créant une table standard.

1. **Créer la table Commentaires** :

   - Créez la **table Commentaires (comments2)**, ajoutez les champs **Contenu du commentaire (content)** (type Markdown) et **Tâche associée (belong_task)** (type plusieurs-à-un).
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170001040.gif)
2. **Créer un bloc Liste de commentaires sur la page** :

   - Dans la popup d'édition de la table Tâches, ajoutez un bloc [**Liste**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) (notre troisième type de bloc fait son entrée ; la liste affiche aussi les détails des champs), choisissez les commentaires et testez :
     ![Créer un bloc Liste de commentaires](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170003544.gif)

## Récapitulatif

Vous avez appris à enrichir le contenu des tâches avec Markdown (Vditor) et à ajouter des commentaires aux tâches ! Le système de gestion de tâches dispose désormais d'une base fonctionnelle complète. Vous sentez-vous plus proche d'un véritable outil professionnel de gestion de tâches ?

N'oubliez pas de continuer à explorer et à manipuler : NocoBase regorge de possibilités. En cas de problème, ne paniquez pas, je serai là pour vous accompagner pas à pas.

[Chapitre suivant (chapitre 5 : Onglets & blocs — des vues riches, un rendu éclatant)](https://www.nocobase.com/cn/tutorials/task-tutorial-tabs-blocks) : nous explorerons en profondeur d'autres fonctionnalités de blocs de NocoBase, pour faire passer votre système à un nouveau niveau. Bon courage !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
