# Chapitre 9 : Tableau de bord des tâches et graphiques

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Cher lecteur, chère lectrice, voici enfin le chapitre tant attendu sur la visualisation ! Nous allons voir comment, dans un flot d'informations, faire ressortir rapidement ce qui compte vraiment. En tant que manager, on ne peut pas se perdre au milieu de tâches complexes ! Voyons ensemble comment réaliser facilement statistiques de tâches et présentation des informations.

### 9.1 Mettre en avant les informations clés

Nous voulons une vision rapide de l'activité de l'équipe et trouver facilement les tâches dont nous sommes responsables ou qui nous intéressent, sans nous perdre dans une multitude d'informations.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

Voyons d'abord comment créer un [graphique](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) de statistiques d'équipe.

#### 9.1.1 Créer un [bloc de données graphique](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

Créez une nouvelle page (par exemple un Tableau de bord personnel) :

1. Créez un bloc de données graphique. (Notez que ce grand bloc peut héberger de nombreux graphiques.)
2. Dans le bloc graphique, sélectionnez votre cible : la table Tâches. Entrez ensuite dans la configuration du graphique.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 Configurer la statistique de statut

Pour compter le nombre de tâches par statut, comment procéder ? D'abord, nous traitons les données :

- Mesure : choisissez un champ unique, par exemple ID, pour le comptage.
- Dimension : utilisez le statut pour le regroupement.

Ensuite, configurons le graphique :

1. Choisissez un [diagramme à colonnes](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column) ou un [diagramme à barres](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar).
2. Pour l'axe X, choisissez le statut, pour l'axe Y, choisissez l'ID. N'oubliez pas de sélectionner le champ de catégorie « Statut » ! (Sinon, les couleurs du graphique ne pourront pas se distinguer et la lecture sera moins lisible.)

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 Statistiques multidimensionnelles : nombre de tâches par personne

Pour compter le nombre de tâches de chacun par statut, ajoutons une seconde dimension. Ajoutons « Responsable / Pseudonyme ».

1. Cliquez en haut à gauche sur « Exécuter la requête ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. Le graphique peut sembler étrange et ne pas correspondre au résultat attendu. Pas de souci : choisissez « Groupé » pour comparer les responsables côte à côte.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. Si vous préférez visualiser le total empilé, choisissez « Empilé ». Vous voyez alors la part de chaque personne dans le total des tâches !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 Filtrage des données et affichage dynamique

#### 9.2.1 Configuration du filtre de données

Bien sûr, on peut aller plus loin et exclure les statuts « Annulée » et « Archivée » : il suffit de retirer ces deux options dans les conditions de filtre à gauche. Vous êtes désormais bien à l'aise avec ces conditions !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

Une fois le filtrage défini, cliquez sur Confirmer, sortez de la configuration : votre premier graphique est en place sur la page.

#### 9.2.2 [Dupliquer un graphique](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

Vous voulez afficher en parallèle un graphique « Groupé » et un graphique « Empilé » sans tout reconfigurer ?

- Cliquez en haut à droite du premier bloc graphique sur Dupliquer.
- En faisant défiler vers le bas, le second graphique apparaît : glissez-le à droite, supprimez la configuration « Empilé » et changez-la en « Groupé ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 [Filtre](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) dynamique

Peut-on filtrer dynamiquement les données selon différents critères ?

Bien sûr ! Sous le bloc de données graphique, activez « Filtre » : un panneau de filtre apparaît. Affichez les champs souhaités et configurez la condition (par exemple, modifiez le champ date en « Entre »).

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 Créer un champ de filtre personnalisé

Et si nous voulions, dans certains cas, inclure les tâches « Annulée » et « Archivée », tout en prenant en charge le filtrage dynamique et la valeur par défaut ?

Créons un [champ de filtre personnalisé](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5) !

> Champ de filtre personnalisé : vous pouvez choisir un champ d'une table associée ou définir un champ personnalisé (disponible uniquement pour les graphiques).
>
> Vous pouvez modifier le titre, la description, l'opérateur de filtrage du champ, et définir une valeur par défaut (utilisateur courant, date courante, etc.) pour des filtres plus adaptés à vos besoins réels.

1. Renseignez « Statut » comme titre.
2. Laissez le champ source vide.
3. Choisissez « Cases à cocher » comme composant.
4. Renseignez les options selon les valeurs de statut définies à la création de la base (Attention, l'ordre est : libellé d'option - valeur d'option).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

Création réussie. Cliquez sur « Définir la valeur par défaut » et sélectionnez les options souhaitées.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

Une fois la valeur par défaut définie, retournez dans la configuration du graphique et changez la condition de filtre en « Statut - Contient n'importe lequel - Filtre courant / Statut », puis confirmez ! (À faire pour les deux graphiques.)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

C'est fait. Testons le filtrage : les données apparaissent parfaitement.

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 Liens dynamiques et filtrage des tâches

Réalisons maintenant une fonctionnalité très utile : en cliquant sur un nombre statistique, on saute directement vers la liste des tâches filtrée correspondante. Pour cela, ajoutons d'abord des graphiques de comptage par statut, placés tout en haut.

#### 9.3.1 Avec « Non démarrée » comme exemple, créer un [graphique statistique](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)

1. Définissez la mesure : Comptage de l'ID.
2. Définissez la condition de filtre : Statut égal à « Non démarrée ».
3. Renseignez le nom du conteneur « Non démarrée », type « Statistique », laissez vide le nom du graphique en dessous.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

L'indicateur « Non démarrée » s'affiche. Dupliquons-le 5 fois pour les autres statuts et plaçons-les en haut.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 Configurer le lien de filtrage

1. Retournez sur la page contenant le bloc Tableau Gestion des tâches et observez le lien dans la barre du navigateur (en général de la forme `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   Imaginons ici que `xxxxxxxxx` est votre nom de domaine et `/admin/0z9e0um1vcn` le chemin. (Repérez le dernier `/admin`.)
2. Copier une partie du lien

   - Nous allons effectuer une redirection. Pour cela, extrayons une partie spécifique du lien.
   - À partir de `admin/` (sans inclure les caractères `admin/` eux-mêmes), copiez jusqu'à la fin du lien. Dans cet exemple, la partie à copier est : `0z9e0um1vcn`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

En survolant « Non démarrée », vous remarquerez que le curseur prend la forme d'une main : cliquez, la redirection fonctionne.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. Configurer le lien du graphique
   Ajoutons un paramètre de filtre au lien. Vous vous souvenez de l'identifiant en base de données du statut ? Ajoutez ce paramètre à la fin du lien pour filtrer davantage les tâches.
   - Ajoutez `?task_status=Not started` à la fin du lien : il devient `0z9e0um1vcn?task_status=Not started`.
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> Comprendre le format des paramètres URL :
> Lors de l'ajout de paramètres dans un lien, certaines règles de format sont à respecter :
>
> - **Point d'interrogation (?)** : marque le début des paramètres.
> - **Nom et valeur du paramètre** : format `nom=valeur`.
> - **Plusieurs paramètres** : pour ajouter plusieurs paramètres, reliez-les avec `&`, par exemple :
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   Dans cet exemple, `user` est un autre nom de paramètre et `123` sa valeur correspondante.

4. Retournez sur la page, cliquez pour rediriger : succès, l'URL est désormais accompagnée du paramètre voulu.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [Associer la condition de filtre via l'URL](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

Pourquoi le tableau ne réagit-il pas ? Pas d'inquiétude, finissons cette dernière étape !

- Retournez dans la configuration du bloc Tableau et cliquez sur « Définir la plage de données ».
- Choisissez « Statut » égal à « Paramètre URL / status ».

Cliquez sur Confirmer, le filtre fonctionne !

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [Visualisation de données](https://docs-cn.nocobase.com/handbook/data-visualization) : graphiques avancés

> Visualisation de données : [ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts) (plugin commercial, payant).
> ECharts propose davantage d'options de configuration personnalisées : [graphique en ligne](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line) (multidimensionnel), [diagramme radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar), [nuage de mots](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)…

Si vous voulez plus d'options de configuration de graphiques, activez le bloc « Visualisation de données : ECharts » !

#### 9.4.1 Configurer rapidement un [diagramme radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar) attractif

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

Si les données se chevauchent, ajustez la taille ou le rayon pour bien afficher l'ensemble !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

Ajustez ensuite le mode d'affichage par glisser-déposer, c'est terminé !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 Plus de conteneurs graphiques

Il y a encore d'autres graphiques à explorer.

##### [Nuage de mots](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [Entonnoir](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [Indicateurs multiples (graphique double-axes, graphique en ligne ECharts)](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

Pour le graphique double-axes, vous pouvez ajouter d'autres indicateurs.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [Diagramme à barres divergentes](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 Petit défi

Avant de clore ce chapitre, voici un petit défi :

1. Ajoutez les paramètres URL pour les autres statuts (**En cours, En attente de validation, Terminée, Annulée, Archivée**) afin de permettre la redirection avec filtrage.
2. Configurez un champ multi-sélection « Responsable », à l'image du multi-sélection « Statut » que nous avons réalisé, avec comme valeur par défaut le pseudonyme de l'utilisateur courant.

[Le chapitre suivant](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2) poursuivra le sujet du tableau de bord, à très vite !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
