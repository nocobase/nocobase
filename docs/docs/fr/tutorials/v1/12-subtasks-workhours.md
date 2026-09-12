# Chapitre 11 : Sous-tâches et calcul des heures de travail

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Voici enfin un nouveau chapitre ! Avec la croissance de l'activité, les tâches deviennent plus nombreuses et plus complexes ; nous réalisons peu à peu qu'une simple gestion de tâches ne suffit plus. Il nous faut désormais gérer les tâches plus finement et les décomposer en plusieurs niveaux pour aider chacun à terminer son travail plus efficacement !

### 11.1 Planification des tâches : du global au détail

Nous allons décomposer les tâches complexes en sous-tâches plus gérables. Grâce au suivi de l'avancement, nous aurons une vision claire de la complétude des tâches, et grâce à la gestion multi-niveaux, nous prendrons en charge plusieurs niveaux de sous-tâches. Allons-y !

---

### 11.2 Créer la table des sous-tâches

#### 11.2.1 Concevoir la structure des sous-tâches

D'abord, créons une « table des sous-tâches » (Sub Tasks, [**table arborescente**](https://docs-cn.nocobase.com/handbook/collection-tree)) avec une structure d'arbre. Les attributs des sous-tâches ressemblent à ceux des tâches principales : « Nom de la tâche », « Statut », « Responsable », « Avancement », etc. En fonction des besoins, on peut ajouter des commentaires, des documents, etc.

Pour relier sous-tâches et tâches principales, nous établissons une relation plusieurs-à-un afin que chaque sous-tâche appartienne à une tâche principale. Nous activons aussi la relation inverse pour pouvoir consulter et gérer les sous-tâches directement depuis la tâche principale.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> :::tip Astuce
> Nous recommandons de créer les sous-tâches via un bloc associé sur la page de la tâche principale : c'est plus pratique !
> :::

#### 11.2.2 Afficher les sous-tâches dans l'interface de gestion des tâches

Dans l'interface de gestion des tâches, configurons la consultation de la « Table Tâches » en [mode **page**](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

Sur la page, créez un nouvel onglet « Gestion des sous-tâches », puis ajoutez le tableau de la table des sous-tâches que nous avons créée et utilisez l'affichage en arborescence. Vous pouvez ainsi gérer et consulter les sous-tâches sur la même page.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3 Graphique de comparaison des heures : estimer la charge globale et l'avancement (optionnel)

Profitons de l'élan pour créer le détail des heures et un graphique comparatif, afin d'estimer la charge globale et l'avancement.

#### 11.3.1 Ajouter les informations de date et d'heures aux sous-tâches

Dans la table des sous-tâches, ajoutez les champs suivants :

- **Date de début**
- **Date de fin**
- **Heures totales**
- **Heures restantes**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

Avec ces champs, nous pourrons calculer dynamiquement la durée de la tâche et les heures travaillées.

#### 11.3.2 Calculer la durée de la tâche

Dans la table des sous-tâches, créons un nouveau [champ formule](https://docs-cn.nocobase.com/handbook/field-formula) « Jours » pour calculer la durée de la tâche.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

Plusieurs modes de calcul sont disponibles :

- Math.js

  > Utilise la bibliothèque [math.js](https://mathjs.org/) pour calculer des formules numériques complexes.
  >
- Formula.js

  > Utilise la bibliothèque [Formula.js](https://formulajs.info/functions/) pour calculer les formules courantes. Si vous êtes à l'aise avec les formules Excel, ce sera très simple !
  >
- Modèle de chaîne

  > Comme son nom l'indique, c'est un mode de concaténation de chaînes : pratique pour des descriptions ou numérotations dynamiques.
  >

Ici, nous pouvons utiliser la bibliothèque `Formula.js`, similaire aux formules Excel, pratique pour les calculs courants.

La formule du champ « Jours » est la suivante :

```html
DAYS(date de fin, date de début)
```

Veillez à utiliser le format minuscule en anglais pour éviter les erreurs.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

Une fois fait, testons sur la page : le nombre de jours évolue dynamiquement en fonction des dates de début et de fin !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 Saisie quotidienne des heures : suivre l'avancement réel (optionnel)

#### 11.4.1 Créer la table de saisie quotidienne des heures

Créons une table de saisie quotidienne des heures pour enregistrer la progression journalière des tâches. Ajoutez les champs :

- **Heures du jour** (hours, entier recommandé)
- **Date**
- **Heures idéales** (ideal_hours, entier recommandé)
- **Sous-tâche associée** : relation [plusieurs-à-un](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) avec les sous-tâches.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 Afficher les heures quotidiennes sur la page de la sous-tâche

Sur la page d'édition de la sous-tâche, configurez la table des heures quotidiennes en mode [sous-tableau](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table) et organisez les autres champs par glisser-déposer. Vous pouvez ainsi remplir et consulter facilement les heures quotidiennes directement depuis la page de la sous-tâche.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 Calculs clés et règles d'interaction (optionnel)

Pour estimer plus précisément l'avancement et les heures restantes, configurons quelques règles clés.

#### 11.5.1 Définir les champs des sous-tâches comme [obligatoires](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required)

Marquez **Date de début**, **Date de fin** et **Heures estimées** comme [obligatoires](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required) afin d'assurer la complétude des données pour les calculs.

#### 11.5.2 Définir les [règles d'interaction](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule) pour le pourcentage d'avancement et les heures restantes

Dans la table des sous-tâches, ajoutez les règles de calcul suivantes :

- **Pourcentage d'avancement** : somme des heures quotidiennes / Heures estimées

```html
SUM(【Formulaire courant / Heures quotidiennes / Heures du jour】)  /  【Formulaire courant / Heures estimées】
```

- **Heures restantes** : Heures estimées - somme des heures quotidiennes

```html
【Formulaire courant / Heures estimées】 - SUM(【Formulaire courant / Heures quotidiennes / Heures du jour】)
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- De la même manière, configurons la règle des heures idéales dans la règle d'interaction des heures quotidiennes :

```html
  【Formulaire courant / Heures estimées】 / 【Formulaire courant / Durée de la tâche】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

Nous pouvons ainsi calculer en temps réel l'avancement et les heures restantes.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 Construire un graphique de proportion d'avancement (optionnel)

#### 11.6.1 Créer le [graphique](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) d'avancement

Créons un nouveau bloc graphique pour suivre l'évolution de **la somme des heures quotidiennes** et **la somme des heures idéales**, en affichant l'avancement par dimension de date.

Limitez 【Tâche associée / ID】 égal à 【Enregistrement de la popup courante / ID】 pour que le graphique reflète bien l'état réel de la tâche en cours.

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 Afficher les informations de base et l'évolution

Enfin, vous vous souvenez de notre [bloc Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) ? Utilisons un bloc `markdown` pour afficher les informations de base et l'évolution de l'avancement.

Utilisez le moteur de templates [`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars) pour afficher le pourcentage d'avancement :

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

La syntaxe de rendu dynamique choisie est [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars) ; consultez la documentation officielle pour découvrir les détails de la syntaxe.

---

### 11.7 Conclusion

Bravo ! Nous avons terminé la décomposition en sous-tâches. Avec la gestion multi-niveaux, la saisie quotidienne des heures et l'affichage graphique, vous voyez plus clairement l'avancement des tâches et l'équipe travaille plus efficacement. Merci de votre lecture attentive, continuez sur votre lancée et préparons-nous pour le [chapitre suivant](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking) !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
