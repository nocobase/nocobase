# Chapitre 5 : Onglets et blocs dynamiques

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113544406238001&bvid=BV1RfzNYLES5&cid=27009811403&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Bienvenue au chapitre 5 ! Le contenu est passionnant : nous allons enrichir la page Gestion des tâches avec davantage de fonctionnalités et prendre en charge plusieurs modes d'affichage. Vous attendiez ce moment, n'est-ce pas ? Pas d'inquiétude, je vais vous guider pas à pas, comme d'habitude, et nous allons tout réaliser sereinement ensemble !

### 5.1 Les onglets, conteneurs polyvalents pour les blocs

Nous avons déjà créé la page Gestion des tâches, mais pour une expérience plus intuitive, nous voulons pouvoir basculer entre différents modes d'affichage des tâches dans la même page : [**Tableau**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table), [**Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**Calendrier**](https://docs-cn.nocobase.com/handbook/calendar), voire [**Diagramme de Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt). La fonctionnalité d'onglets de NocoBase nous permet d'organiser plusieurs configurations de blocs au sein de la même page. Pas d'inquiétude, allons-y doucement.

- Créer un onglet
  Commençons par créer des onglets.

1. **Ajouter un sous-onglet** :

   - Ouvrez votre page Gestion des tâches, puis créez-y un sous-onglet. Le premier onglet peut être nommé **« Vue Tableau »** : il affichera le bloc de liste des tâches que nous avons déjà configuré.
2. **Créer un autre onglet** :

   - Ensuite, créons un autre onglet, nommé **« Vue Kanban »**. Nous y créerons le bloc Kanban des tâches.
     ![Créer des onglets](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172155490.gif)

Prêt(e) ? Place à la création des différents blocs !

> **À propos des blocs :** un bloc est le porteur des données et du contenu. Il présente les données de la manière appropriée sur le site et peut être placé dans une page, une fenêtre modale (Modal) ou un tiroir (Drawer). Plusieurs blocs peuvent être déplacés et réorganisés librement par glisser-déposer ; les opérations successives sur les données dans les blocs permettent diverses configurations et présentations.
> Dans ce parcours d'apprentissage, l'utilisation des blocs vous permet de construire et de gérer plus rapidement les pages et fonctionnalités du système. Les blocs peuvent également être enregistrés en tant que modèles, ce qui facilite la copie et la réutilisation et réduit considérablement le temps de création.

### 5.2 Bloc Kanban : voir l'état des tâches d'un coup d'œil

Le [**Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban) est une fonctionnalité essentielle d'un système de gestion de tâches : il permet, par glisser-déposer, de gérer visuellement le statut des tâches. Vous pouvez par exemple regrouper par statut et voir à quelle étape se trouve chaque tâche.

#### 5.2.1 Créer le bloc Kanban

1. **Créer un nouveau bloc Kanban** :

- Dans l'onglet **Vue Kanban**, cliquez sur « Créer un bloc », sélectionnez la table Tâches. Une option vous demande alors par quel champ regrouper les tâches.

2. **Choisir le champ de regroupement** :

- Choisissons le champ **Statut** créé précédemment, pour regrouper par statut. (Attention : le champ de regroupement doit être de type [« Liste déroulante (choix unique) »](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select) ou [« Boutons radio »](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/radio-group).)

3. **Ajouter un champ de tri** :

- Les cartes du Kanban peuvent être réordonnées via un champ de tri. Pour cela, créons un nouveau champ. Cliquez sur « Ajouter un champ » et créez un champ nommé **Tri par statut (status_sort)**.
- Ce champ sert à positionner les cartes lors du glisser-déposer dans le Kanban : il agit comme une coordonnée. La latérale (gauche-droite) correspond aux différents statuts, la position verticale correspond à la valeur de tri. Une fois la carte déplacée, vous pouvez observer l'évolution de la valeur de tri via le formulaire.
  ![Créer le bloc Kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156926.gif)

#### 5.2.2 Cocher les champs et les actions

- Enfin, n'oubliez pas de cocher les champs à afficher dans le Kanban, par exemple le nom de la tâche, le statut, etc., afin que les cartes soient suffisamment informatives.

![Affichage des champs du Kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156326.gif)

### 5.3 Utiliser les modèles : copier ou référencer

Une fois le bloc Kanban créé, nous devons créer un **formulaire d'ajout**. NocoBase propose une fonctionnalité très pratique : vous pouvez [**copier ou référencer**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) un modèle de formulaire précédemment créé, ce qui évite de tout reconfigurer à chaque fois.

#### 5.3.1 **Enregistrer le formulaire en modèle**

- Sur le formulaire d'ajout précédent, survolez la configuration du formulaire et cliquez sur « Enregistrer comme modèle ». Donnez un nom au modèle, par exemple « Table Tâches_formulaire d'ajout ».

![Enregistrer le formulaire en modèle](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156356.gif)

#### 5.3.2 **Copier ou référencer un modèle**

Lorsque vous créez un formulaire dans la vue Kanban, deux options s'offrent à vous : « **Copier le modèle** » et « **Référencer le modèle** ». Quelle est la différence ?

- [**Copier le modèle**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) : équivaut à dupliquer une copie du formulaire, modifiable indépendamment, sans impact sur l'original.
- [**Référencer le modèle**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) : « emprunte » directement le formulaire d'origine. Toute modification est synchronisée partout où ce modèle est référencé. Si vous modifiez l'ordre des champs, par exemple, tous les formulaires qui référencent ce modèle changent à leur tour.

![Copier et référencer un modèle](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157435.gif)

Vous choisissez selon vos besoins. En général, **Référencer le modèle** est plus pratique : une seule modification se répercute partout, ce qui fait gagner beaucoup de temps.

### 5.4 Bloc Calendrier : suivre l'avancement d'un coup d'œil

Créons à présent un [**bloc Calendrier**](https://docs-cn.nocobase.com/handbook/calendar) pour mieux gérer la planification des tâches.

#### 5.4.1 Créer la vue Calendrier

##### 5.4.1.1 **Ajouter des champs Date** :

La vue Calendrier doit connaître les **dates de début** et **de fin** des tâches. Ajoutons donc deux champs à la table Tâches :

- **Date de début (start_date)** : marque le début de la tâche.
- **Date de fin (end_date)** : marque la fin de la tâche.

![Ajouter des champs Date](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157585.png)

#### 5.4.2 Créer le bloc Calendrier :

Retournez à la vue Calendrier, créez un bloc Calendrier, choisissez la table Tâches, puis utilisez les champs **Date de début** et **Date de fin** que vous venez de créer. Ainsi, la tâche s'affiche dans le calendrier comme une plage de temps qui rend l'avancement évident.

![Construction de la vue Calendrier](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157957.gif)

#### 5.4.3 Manipuler le calendrier :

Sur le calendrier, vous pouvez glisser-déposer librement les tâches, cliquer pour éditer le détail (n'oubliez pas de copier ou référencer le modèle).

![Manipulation du calendrier](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158379.gif)

### 5.5 Bloc Diagramme de Gantt : un outil incontournable pour le suivi de l'avancement

Le dernier bloc est le [**bloc Diagramme de Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt), un outil classique de gestion de projet qui aide à suivre l'avancement des tâches et leurs dépendances.

#### 5.5.1 Créer l'onglet « Vue Gantt »

#### 5.5.2 **Ajouter le champ « Pourcentage d'avancement »** :

Pour que le Gantt présente correctement la progression des tâches, ajoutons un champ **Pourcentage d'avancement (complete_percent)**. Ce champ enregistre l'avancement de la tâche, valeur par défaut 0 %.

![Ajouter le champ pourcentage d'avancement](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158044.gif)

#### 5.5.3 **Créer le bloc Gantt** :

Dans la vue Gantt, créez un bloc Gantt, sélectionnez la table Tâches et configurez les champs Date de début, Date de fin et Pourcentage d'avancement.

![Construction de la vue Gantt](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158860.gif)

#### 5.5.4 **Tester le glisser-déposer du Gantt** :

Dans le Gantt, vous pouvez ajuster l'avancement et la durée d'une tâche par glisser-déposer ; la date de début, la date de fin et le pourcentage d'avancement se mettent à jour en conséquence.

![Glisser-déposer dans le Gantt](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172159140.gif)

### Récapitulatif

Bravo ! Vous savez désormais utiliser dans NocoBase plusieurs blocs pour présenter les données de tâches : [**bloc Kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**bloc Calendrier**](https://docs-cn.nocobase.com/handbook/calendar) et [**bloc Diagramme de Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt). Ces blocs rendent la gestion des tâches plus visuelle et apportent une grande flexibilité.

Mais ce n'est qu'un début ! Imaginez : dans une équipe, chaque membre peut avoir des responsabilités différentes. Comment garantir une collaboration sans accroc ? Comment maintenir la sécurité des données tout en s'assurant que chacun ne voie et ne manipule que ce qui le concerne ?

Prêt(e) ? Direction le chapitre suivant : [Chapitre 6 : Partenaires — collaboration sans faille, contrôle flexible](https://www.nocobase.com/cn/tutorials/task-tutorial-user-permissions).

Voyons comment, grâce à de simples manipulations, faire passer la collaboration de votre équipe au niveau supérieur !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
