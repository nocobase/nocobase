# Chapitre 2 : Concevoir le système de gestion de tâches

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113593597037138&bvid=BV1oCi2YdEAU&cid=27174896249&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Concevoir un système de gestion de tâches peut sembler complexe, mais avec l'aide de NocoBase, ce processus devient simple et même amusant. Nous allons clarifier les besoins étape par étape, concevoir la structure des données et planifier les futures fonctionnalités. Rassurez-vous, nous n'allons pas nous perdre dans des montagnes de code ; nous adopterons l'approche la plus directe et la plus intuitive pour bâtir votre propre système de gestion de tâches.

### 2.1 Analyse des besoins

Avant de mettre les mains dans le cambouis, clarifions les fonctionnalités attendues de ce système de gestion de tâches. Pensez à votre manière habituelle de gérer vos tâches, ou au système idéal selon vous :

- **Gestion des tâches** : les utilisateurs peuvent créer, éditer, supprimer des tâches, les attribuer à différentes personnes et suivre leur progression à tout moment.
- **Vues multiples** : les tâches peuvent être présentées sous forme de liste, mais aussi en vue Kanban, diagramme de Gantt ou calendrier.
- **Documentation en ligne** : il doit être possible de modifier la documentation d'une tâche en ligne, pour aider l'équipe à en comprendre les détails.
- **Gestion des pièces jointes** : possibilité d'ajouter des pièces jointes aux tâches : images, vidéos, notes importantes, etc.
- **Commentaires** : les personnes concernées peuvent commenter une tâche, partager leur avis et garder trace des discussions.

Voyons à présent un schéma simple décrivant les relations entre ces modules fonctionnels :
![](https://static-docs.nocobase.com/20241219-0-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER.drawio.svg)

Tout devient bien plus clair, n'est-ce pas ?

---

> **À propos des tables de données :** NocoBase utilise une définition appelée « Collection » pour décrire la structure des données, ce qui permet d'unifier des données provenant de sources différentes et fournit une base solide pour leur gestion et leur analyse.
>
> Elle prend en charge plusieurs types de tables : table standard, table par héritage, table arborescente, table calendrier, table fichiers, table d'expression, table SQL, vue, table externe, etc., afin de répondre à divers besoins de traitement. Cette conception rend les opérations sur les données plus flexibles et plus efficaces.

### 2.2 Conception des tables de données

Bien, à nous de réfléchir un peu maintenant. Pour prendre en charge ces fonctionnalités, nous devons planifier les tables du système. Pas d'inquiétude, il ne nous faut pas une base complexe : quelques tables simples suffiront.

D'après l'analyse précédente, on conçoit généralement les tables suivantes :

1. **Table Utilisateurs (Users)** : enregistre les utilisateurs du système. Qui réalise les tâches ? Qui les supervise ?
2. **Table Tâches (Tasks)** : enregistre les détails de chaque tâche, dont son nom, sa documentation, son responsable et son état d'avancement.
3. **Table Pièces jointes (Attachments)** : enregistre toutes les pièces jointes liées aux tâches, comme images et fichiers.
4. **Table Commentaires (Comments)** : enregistre les commentaires des utilisateurs sur les tâches, pour faciliter les échanges au sein de l'équipe.

Les relations entre ces tables sont simples : chaque tâche peut avoir plusieurs pièces jointes et plusieurs commentaires, et ceux-ci sont créés ou téléversés par un utilisateur. Voilà la structure centrale de notre système de gestion de tâches.

Le schéma ci-dessous illustre les relations principales entre ces tables :
![](https://static-docs.nocobase.com/%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER241219-0.drawio.svg)

### 2.3 Conception des tables dans NocoBase

Alors, pour réaliser ce système de gestion de tâches dans NocoBase, quelles tables devons-nous concevoir concrètement ? En réalité, c'est plus simple que vous ne le pensez :

- **Table Tâches** : c'est le cœur du système, elle contient les détails de chaque tâche.
- **Table Commentaires** : elle stocke les commentaires liés aux tâches, ce qui permet aux membres de l'équipe d'apporter du feedback.

Pour les autres fonctionnalités complexes, comme la gestion des pièces jointes ou les informations utilisateur, NocoBase a déjà tout préparé pour vous : pas besoin de les créer manuellement. C'est tout de suite plus léger, non ?

Nous partirons d'un système de gestion de tâches très simple, puis nous l'enrichirons progressivement. Par exemple, nous concevrons d'abord les champs de base d'une tâche, puis nous ajouterons les commentaires : tout le processus reste flexible et maîtrisable.

La structure d'ensemble ressemble à ceci, avec les champs dont nous avons besoin :
![](https://static-docs.nocobase.com/241219-1.svg)

### Récapitulatif

Grâce à cette partie, vous savez désormais comment concevoir un système de gestion de tâches de base. Dans NocoBase, nous commençons par l'analyse des besoins et nous planifions les tables et les champs. Vous découvrirez ensuite que la mise en œuvre est encore plus simple que la conception.

Par exemple, le début de la table des tâches peut être très concis :

```text
Table Tâches (Tasks) :
        Nom de la tâche (task_name) Texte ligne unique
        Description de la tâche (task_description) Texte multilignes
```

Pratique, non ? Prêt(e) pour le [chapitre suivant (chapitre 3 : Gestion des données de tâches — orchestrer les opérations en toute simplicité)](https://www.nocobase.com/cn/tutorials/task-tutorial-data-management-guide) ?

---

Continuez à explorer, créez sans limite ! Si vous rencontrez un problème, n'oubliez pas que vous pouvez à tout moment consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour obtenir de l'aide. À très bientôt !
