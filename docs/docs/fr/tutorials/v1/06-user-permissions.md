# Chapitre 6 : Utilisateurs et permissions

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113595157318206&bvid=BV1EwiUYYE4f&cid=27181319746&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Dans la collaboration en équipe, chaque membre doit connaître clairement ses responsabilités et ses droits pour que le travail avance sans accroc. Aujourd'hui, nous allons apprendre ensemble à créer des rôles et à gérer les permissions, pour une collaboration plus fluide et mieux organisée.

Pas d'inquiétude, ce processus n'est pas complexe : nous vous accompagnons pas à pas et vous guidons à chaque étape clé. Si vous rencontrez un problème, n'hésitez pas à demander de l'aide sur notre forum officiel.

### Discussion des besoins

Nous avons besoin d'un rôle « Partenaire » (Partner) qui dispose de certaines permissions pour participer à la gestion des tâches, mais qui ne peut pas modifier arbitrairement les tâches d'autrui. Cela permet une attribution et une collaboration flexibles sur les tâches.

![](https://static-docs.nocobase.com/241219-5-er.svg)

> **À propos des rôles et permissions :** les rôles et permissions sont un mécanisme essentiel de gestion des accès et des opérations utilisateurs ; ils garantissent la sécurité du système et l'intégrité des données. Les rôles peuvent être associés aux utilisateurs : un utilisateur peut posséder plusieurs rôles. La configuration des permissions des rôles permet de contrôler les comportements et opérations des utilisateurs dans le système, ainsi que les fonctionnalités et pages affichées, ce qui revêt une importance cruciale en matière de contrôle d'accès.
> En utilisant rôles et permissions liés aux utilisateurs, vous pouvez mieux maîtriser votre système de gestion. En tant qu'administrateur, vous pouvez attribuer à votre guise les droits d'opération système à chacun !

### 6.1 **Création et attribution d'un rôle**

#### 6.1.1 **Créer le rôle « Partenaire (Partner) »**

- Cliquez en haut à droite sur [« **Utilisateurs et permissions** »](https://docs-cn.nocobase.com/handbook/users), puis sur [« **Rôles et permissions** »](https://docs-cn.nocobase.com/handbook/acl). C'est ici que nous configurons les rôles et gérons les permissions.
- Cliquez sur le bouton « **Créer un rôle** » : une fenêtre s'ouvre. Nommez-le **Partenaire (Partner)** et confirmez l'enregistrement.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172222974.gif)

Vous venez de créer un nouveau rôle ! Il faut maintenant attribuer des permissions à ce rôle pour qu'il puisse intervenir dans la gestion des tâches.

#### 6.1.2 **S'attribuer le nouveau rôle**

Pour s'assurer que les permissions configurées prennent effet, attribuons d'abord ce rôle à votre propre compte pour le tester. C'est très simple :

- Dans la gestion des utilisateurs, recherchez votre compte, cliquez pour y entrer, choisissez « **Attribuer un rôle** », sélectionnez « **Partenaire** ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223483.gif)

Vous pouvez désormais simuler avec votre propre compte l'expérience du rôle « Partenaire ». Voyons à présent comment changer de rôle.

#### 6.1.3 **Basculer sur le rôle « Partenaire »**

Maintenant que vous avez le rôle « Partenaire », voyons comment basculer.

- Cliquez sur le **centre personnel** en haut à droite, puis sélectionnez « **Changer de rôle** ».
- Vous remarquerez peut-être que l'option « Partenaire » n'apparaît pas tout de suite. Pas d'inquiétude, **rafraîchissez la page / le cache** et le rôle s'affichera !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223922.gif)

### 6.2 Attribuer les permissions de page au rôle

Après être passé au rôle « Partenaire », vous pourriez constater qu'aucune page ni menu ne s'affiche. C'est parce que nous n'avons pas encore donné à ce rôle l'accès aux pages spécifiques. Pas de souci, configurons les droits d'accès pour le rôle « Partenaire ».

#### 6.2.1 **Donner accès à la page Gestion des tâches au rôle « Partenaire »**

- D'abord, basculez sur le rôle **Root** (super administrateur), puis ouvrez la page « **Rôles et permissions** ».
- Cliquez sur le rôle « Partenaire » pour entrer dans la page de configuration. Vous verrez un onglet « **Menu** » qui représente l'ensemble des pages du système.
- Cochez les permissions de la page « **Gestion des tâches** » : ainsi, le rôle « Partenaire » peut accéder à cette page.

Retournez au **centre personnel**, basculez à nouveau sur « Partenaire » : le menu Gestion des tâches doit désormais être visible.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223592.gif)

#### 6.2.2 Configurer les permissions de table et d'action

Le rôle « Partenaire » a maintenant accès à la page Gestion des tâches, mais il faut limiter davantage ses droits d'action. Nous voulons que « Partenaire » puisse :

- **Consulter et éditer** les tâches qui lui sont attribuées ;
- **Mettre à jour l'avancement des tâches** ;
- mais **ne puisse pas créer ni supprimer de tâche**.

Pour cela, configurons les permissions de la « Table Tâches ». C'est parti !

##### 6.2.2.1 **Configurer les permissions de table pour le rôle « Partenaire »**

- Ouvrez la page « **Rôles et permissions** », cliquez sur le rôle « Partenaire » et passez à l'onglet « **Sources de données** ».
- Vous y trouverez les paramètres « **Permissions sur les tables** ». Trouvez la « **Table Tâches** » et donnez les permissions « Voir » et « Éditer » à « Partenaire ».
- Pourquoi attribuer la permission d'édition à « toutes les données » ?
  Bien que nous donnions ici à Partenaire une permission d'édition complète, nous restreindrons par la suite, dynamiquement, les champs en fonction du « responsable ».
  Garder le maximum de droits au début rendra le contrôle ultérieur plus flexible.
- Nous ne voulons pas ouvrir « Ajouter » et « Supprimer » à d'autres rôles, donc nous ne les attribuons pas dès le départ.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224941.gif)

À ce stade, le rôle Partenaire a le droit de consulter et d'éditer toutes les tâches. Il faut maintenant aller plus loin pour s'assurer qu'il ne peut éditer que les tâches qui lui sont attribuées.

### 6.3 Ajouter le champ « Responsable » à la table Tâches

Nous allons maintenant désigner un responsable pour chaque tâche. En attribuant un responsable, nous nous assurons que seul le responsable de la tâche peut la modifier, les autres ne pouvant que la consulter. Pour cela, nous allons utiliser un **champ relationnel** entre la table Tâches et la table Utilisateurs.

#### 6.3.1 **Créer le champ « Responsable »**

1. Ouvrez la « **Table Tâches** », cliquez sur « **Ajouter un champ** » et choisissez « **Champ relationnel** ».
2. Sélectionnez la relation « **Plusieurs-à-un** » (une tâche n'a qu'un responsable, mais un utilisateur peut être responsable de plusieurs tâches).
3. Nommez le champ « **Responsable (Assignee)** ». Inutile de cocher la relation inverse pour l'instant.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224751.gif)

#### 6.3.2 **Afficher le champ « Responsable »**

Il faut ensuite s'assurer que le champ « Responsable » s'affiche dans le tableau et les formulaires de la page Gestion des tâches, afin d'attribuer facilement un responsable à chaque tâche. (Si le champ affiche par défaut un identifiant, pas de panique : changez le champ titre de l'ID au « Pseudonyme ».)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224547.png)

### 6.4 Contrôler les permissions via la **gestion des permissions**

Place au plat de résistance ! Nous allons utiliser la [**gestion des permissions**](https://docs-cn.nocobase.com/handbook/acl) de NocoBase pour mettre en place une fonctionnalité très puissante : **seuls le responsable et le créateur d'une tâche peuvent la modifier**, les autres ne pouvant que la consulter. La flexibilité de NocoBase va se révéler.

#### 6.4.1 **Premier essai : seul le responsable peut éditer le formulaire**

Nous voulons que seul le responsable d'une tâche puisse l'éditer. Configurons donc les conditions suivantes :

- Retournez aux permissions de table pour « Partenaire », ouvrez la « configuration » de la table Tâches et cliquez sur « Plage de données » derrière « Permissions d'édition ».
- Créez une nouvelle règle personnalisée nommée « Le responsable peut éditer » :
  **Lorsque « Responsable/ID » est égal à « Utilisateur courant/ID »**, l'édition est autorisée ;
  cela signifie que seul le responsable peut modifier la tâche, les autres ne pouvant que la consulter.
- Comme le champ Responsable utilise la table Utilisateurs et que l'utilisateur connecté est aussi dans la table Utilisateurs, cette règle remplit parfaitement notre premier besoin.

Cliquez sur Ajouter, puis Confirmer.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172226879.gif)

Retournons sur la page :

Parfait : basculons en rôle Partenaire et observons. Seules les tâches dont nous sommes responsables exposent l'action Éditer.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227581.gif)

#### 6.4.2 **Conditions complémentaires : le créateur peut modifier le formulaire**

Vous remarquerez peut-être un nouveau problème :

Pour la plupart des tâches dont nous ne sommes pas responsables, nous ne pouvons pas éditer le formulaire et les autres collègues ne peuvent même pas voir les détails !

Pas d'inquiétude. Vous vous souvenez que nous avons accordé à Partenaire la permission « **Voir** » sur toutes les données ?

- Retournons sur la page, dans la configuration cliquez sur « Voir » et ajoutez une nouvelle action de consultation.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227426.png)

- À la manière de la disposition de la popup d'édition, créez une popup de consultation. N'oubliez surtout pas de choisir un bloc « Détail ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227807.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227352.gif)

Voilà, c'est réglé.

### 6.5 **Vérifier le contrôle des permissions**

Si vous basculez vers un autre utilisateur et consultez le formulaire, vous remarquerez que le bloc affiche automatiquement les actions correspondant aux permissions de cet utilisateur. Nos tâches dont on est responsable autorisent l'édition, tandis que les autres ne sont accessibles qu'en lecture.

Lorsque l'on revient au rôle Root, toutes les permissions sont rétablies. C'est toute la puissance du contrôle d'accès dans NocoBase !

Vous pouvez maintenant attribuer librement des responsables aux tâches et appeler vos collègues à collaborer. Ajoutons un nouveau membre à l'équipe pour vérifier que les permissions configurées fonctionnent correctement.

#### 6.5.1 **Créer un nouvel utilisateur et lui attribuer un rôle**

- Créez un nouvel utilisateur, par exemple **Tom**, et attribuez-lui le rôle « **Partenaire** ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228278.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228648.gif)

- Sur la page Gestion des tâches, attribuez quelques tâches à **Tom**.

#### 6.5.2 **Test de connexion**

Connectez-vous avec Tom : il doit pouvoir consulter et éditer les tâches qui lui sont attribuées. Selon les règles configurées, Tom ne peut éditer que les tâches dont il est responsable ; les autres lui sont en lecture seule.

Les permissions des formulaires d'édition sont correctement synchronisées sur toutes les pages !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172229408.gif)

### Récapitulatif

Félicitations ! Vous savez maintenant créer des rôles dans NocoBase, attribuer des permissions et configurer des permissions personnalisées pour vous assurer que les membres de l'équipe ne peuvent éditer que les tâches qui leur sont attribuées. Grâce à ces étapes, vous avez mis en place un système de gestion des permissions clair et structuré pour la collaboration en équipe.

### Défi

Pour le moment, Tom peut consulter et éditer les tâches dont il est responsable. Mais vous avez peut-être remarqué qu'**il ne peut pas encore poster de commentaires** et donc participer aux échanges. Comment lui attribuer les permissions nécessaires pour qu'il puisse s'exprimer librement et participer aux discussions ? Voilà un défi intéressant !

**Indice :**

Vous pouvez retourner dans les paramètres de rôles et ajuster les permissions du rôle « Partenaire » côté table de données, et voir comment donner à Tom les droits sur les commentaires sans affecter ses restrictions sur les autres tâches.

À vos tests ! Nous dévoilerons la solution dans la suite.

Dans le chapitre suivant, nous mettrons aussi en place la fonctionnalité « Activité des membres » et présenterons un autre module puissant : le [**Workflow**](https://docs-cn.nocobase.com/handbook/workflow). Avec les workflows, vous pouvez orchestrer dynamiquement les flux de données, déclencher diverses opérations et automatiser les processus métier les plus fastidieux. Prêt(e) ? Rendez-vous au [chapitre 7 : Workflow — automatisation et gain d'efficacité](https://www.nocobase.com/cn/blog/task-tutorial-workflow) !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
