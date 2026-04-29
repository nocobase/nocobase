# Chapitre 3 : Construire des pages — du blanc à l'utilisable

Au chapitre précédent, nous avons posé la charpente des tables, mais les données ne vivent encore qu'en « back-office » — l'utilisateur ne voit rien. Dans ce chapitre, nous allons **mettre les données en scène** : créer un [bloc de tableau](/interface-builder/blocks/data-blocks/table) pour afficher les tickets, configurer l'affichage des champs, le tri, les [filtres](/interface-builder/blocks/filter-blocks/form) et la pagination, pour transformer cela en une vraie liste de tickets utilisable.

## 3.1 Qu'est-ce qu'un block

Dans NocoBase, un **block** est une « brique » sur la page. Vous voulez afficher un tableau ? Posez un [bloc de tableau](/interface-builder/blocks/data-blocks/table). Un formulaire ? Posez un bloc de formulaire. Une page peut combiner librement plusieurs blocks et leur disposition se règle par glisser-déposer.

Types de blocks courants :

| Type | Usage |
|------|------|
| Table | Afficher plusieurs enregistrements en lignes et colonnes |
| Form | Permettre la saisie ou l'édition de données |
| Details | Afficher l'intégralité d'un enregistrement |
| Filter Form | Fournir des conditions de filtrage qui s'appliquent à d'autres blocks |
| Chart | Visualisations type camembert, courbe, etc. |
| Markdown | Afficher un texte personnalisé ou des explications |

Retenez la métaphore : **block = brique**. Nous allons assembler ces briques pour construire la page de gestion des tickets.

## 3.2 Ajouter un menu et une page

D'abord, créons l'entrée « Gestion des tickets » dans le système.

1. Cliquez sur l'interrupteur **UI Editor** en haut à droite pour entrer en [mode configuration](/get-started/how-nocobase-works) (la page se borde de cadres orange éditables).
2. Survolez le bouton **« Add menu item »** dans la barre de navigation, choisissez **« Add group »** et nommez-le **« Gestion des tickets »**.

![03-building-pages-2026-03-12-09-38-36](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-38-36.png)


3. Le menu « Gestion des tickets » apparaît immédiatement dans la barre. **Cliquez dessus** ; le menu de groupe s'ouvre à gauche.
4. Dans le menu de gauche, cliquez sur le bouton orange **« Add menu item »** et choisissez **« Modern page (v2) »** pour ajouter successivement deux sous-pages :
   - **Liste des tickets** — afficher tous les tickets
   - **Catégories de tickets** — gérer les catégories

![03-building-pages-2026-03-12-09-41-26](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-41-26.png)

> **Remarque** : à l'ajout d'une page, vous voyez deux options « Legacy page (v1) » et « Modern page (v2) ». Ce tutoriel utilise systématiquement **v2**.

## 3.3 Ajouter un bloc de tableau

Entrez maintenant dans la page « Liste des tickets » et ajoutez-y un bloc de tableau :

1. Sur la page vide, cliquez sur **« Add block »**.
2. Choisissez **Data block → Table**.
3. Dans la liste des tables qui apparaît, choisissez **« Tickets »** (la table tickets créée au chapitre précédent).

![03-building-pages-2026-03-13-08-44-07](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-07.png)

Une fois le bloc de tableau ajouté, un tableau vide apparaît sur la page.

![03-building-pages-2026-03-13-08-44-29](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-29.png)

Un tableau vide n'est pas pratique pour déboguer ; ajoutons rapidement un bouton de création pour saisir quelques données de test :

1. Cliquez sur **« Configure actions »** en haut à droite du tableau, cochez **« Add new »**.

![03-building-pages-2026-03-17-14-58-39](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-58-39.png)

2. Cliquez sur le bouton **« Add new »** qui vient d'apparaître. Dans la pop-up, choisissez **Add block → Form (Add New) → Current collection**.

![03-building-pages-2026-03-17-14-59-42](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-59-42.png)

3. Dans la pop-up, cliquez sur **« Configure fields »** et cochez les champs titre, statut, priorité, etc. ; cliquez sur **« Configure actions »** et activez le bouton **« Submit »**.

![03-building-pages-2026-03-17-15-00-54](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-00-54.png)

![03-building-pages-2026-03-17-15-01-49](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-01-49.png)

4. Saisissez quelques tickets et soumettez ; vous voyez ensuite leur contenu dans le tableau.

![03-building-pages-2026-03-17-15-03-04](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-03-04.png)

> La configuration détaillée des formulaires (règles de liaison, formulaires d'édition, pop-up de détails…) est traitée au [Chapitre 4](/tutorials/v2/04-forms-and-details). Pour l'instant, savoir saisir suffit.

## 3.4 Configurer les colonnes affichées

Par défaut, le tableau n'affiche pas tous les champs ; vous devez choisir manuellement les colonnes :

1. À droite de l'en-tête du tableau, cliquez sur **« [Fields](/data-sources/data-modeling/collection-fields) »**.
2. Cochez les champs à afficher :
   - **Titre** — sujet du ticket, repérable d'un coup d'œil
   - **Statut** — progression
   - **Priorité** — degré d'urgence
   - **Catégorie** — champ relationnel, affichera le nom de la catégorie
   - **Demandeur** — qui a soumis le ticket
   - **Assigné** — qui s'en occupe
3. Les champs inutiles (ID, date de création) restent décochés pour garder le tableau lisible.

![03-building-pages-2026-03-13-08-47-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-47-18.png)

> **Astuce** : l'ordre d'affichage des colonnes se règle par glisser-déposer. Placez « Titre » et « Statut » en premier pour saisir l'essentiel d'un coup d'œil.

### Le champ relationnel affiche un ID

Une fois « Catégorie » coché, le tableau affiche l'ID de la catégorie (un nombre) et non son nom. C'est parce que le champ de relation utilise par défaut l'ID comme champ-titre. Deux solutions :

**Méthode 1 : modifier dans la configuration de la colonne (uniquement ce tableau)**

Cliquez sur la configuration de la colonne « Catégorie », trouvez **« Title field »** et passez-la d'ID à **Nom**. Cela n'affecte que ce bloc de tableau.

![03-building-pages-2026-03-13-09-23-03](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-03.png)

![03-building-pages-2026-03-13-09-57-40](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-57-40.gif)

**Méthode 2 : modifier au niveau de la data source (global, recommandé)**

Allez dans **Settings → [Data sources](/data-sources) → [Collections](/data-sources/data-modeling/collection) → table catégories**, et changez **« Title field »** pour **Nom**. Tous les endroits référençant la table catégories afficheront alors le nom par défaut, une fois pour toutes. Après modification, retournez sur la page et rajoutez le champ pour que le changement soit appliqué.
![03-building-pages-2026-03-13-09-23-41](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-41.png)

## 3.5 Ajouter filtres et tri

À mesure que les tickets s'accumulent, il faut pouvoir retrouver rapidement un ticket donné. NocoBase propose plusieurs approches ; commençons par la plus utilisée : le **bloc de filter form**.

### Ajouter un filter form

1. Sur la page « Liste des tickets », cliquez sur **« Add block »**, puis sur **Filter block → Filter form**.
2. Dans une page v2, il n'est pas nécessaire de choisir une table — le filter form s'ajoute directement à la page.
3. Dans le filter form, cliquez sur **« Fields »** ; la liste des blocks de données filtrables sur la page s'affiche, par exemple `Table: Tickets #c48b` (le code à la fin est l'UID du block, pour distinguer plusieurs blocks d'une même table).

![03-building-pages-2026-03-13-08-48-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-48-37.png)

4. Survolez le nom du block pour voir la liste de ses champs filtrables. Cliquez sur un champ pour l'ajouter comme filtre : **Statut**, **Priorité**, **Catégorie**.

![03-building-pages-2026-03-13-09-25-44](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-25-44.png)

5. Une fois ajoutés, l'utilisateur saisit ses critères dans le filter form, et le tableau **se filtre automatiquement en temps réel**.

![03-building-pages-2026-03-13-10-00-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-10-00-25.gif)

### Recherche floue multi-champs

Et si l'on veut un seul champ de recherche qui interroge plusieurs champs ?

Cliquez sur la configuration en haut à droite du champ de recherche et vous verrez l'option **« Connect fields »**. En la déployant, vous voyez les champs reliables de chaque block — par défaut, seul « Titre » est connecté.
![03-building-pages-2026-03-13-09-30-06](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-30-06.png)

On peut sélectionner plus de champs, par exemple **Description**, pour que la recherche couvre aussi ces champs.

On peut même filtrer via les champs d'un objet associé — cliquez sur « Catégorie », puis dans le sous-niveau cochez « Nom de la catégorie » : la recherche couvrira aussi le nom de la catégorie.

![03-building-pages-2026-03-13-09-31-35](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-31-35.png)
![03-building-pages-2026-03-13-09-32-20](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-32-20.png)

> **« Connect fields » est très puissant** : la connexion peut couvrir plusieurs blocks et plusieurs champs. S'il y a plusieurs blocs de données sur la page, n'hésitez pas à créer d'autres blocks pour tester !

### Pas envie de filtrer automatiquement ?

Pour que le filtrage ne s'exécute qu'au clic d'un bouton, dans le coin inférieur droit du filter form, cliquez sur **« [Actions](/interface-builder/actions) »** et cochez **« Filter »** et **« Reset »**. L'utilisateur devra alors valider manuellement après avoir saisi ses critères.
![03-building-pages-2026-03-13-09-33-15](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-33-15.png)

### Une autre méthode : l'action filtre intégrée au tableau

En plus du filter form indépendant, le bloc de tableau a aussi un bouton d'action **« Filter »**. Au-dessus du bloc, cliquez sur **« Actions »**, cochez **« Filter »** ; un bouton de filtre apparaît dans la barre d'outils du tableau. Au clic, un panneau de conditions s'ouvre où l'utilisateur filtre directement par champ.
![03-building-pages-2026-03-13-09-34-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-34-25.png)
![03-building-pages-2026-03-13-09-36-09](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-36-09.png)

Pour éviter à l'utilisateur de chercher des champs à chaque clic, vous pouvez préconfigurer des champs de filtre par défaut dans la configuration du bouton ; ainsi, il voit directement les filtres usuels en ouvrant le panneau.
![03-building-pages-2026-03-13-09-38-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-38-37.png)

> **Remarque** : le filtre intégré du tableau **ne prend pas en charge la recherche floue multi-champs**. Pour cela, utilisez le filter form combiné à la fonctionnalité « Connect fields ».

### Définir un tri par défaut

Nous voulons que les tickets les plus récents apparaissent en premier :

1. Cliquez sur les **paramètres du block** (icône à trois traits) en haut à droite du tableau.
2. Trouvez **« Set [sorting](/interface-builder/blocks/data-blocks/table) rules »**.
3. Ajoutez un champ de tri : sélectionnez **Date de création**, ordre **descendant**.

![03-building-pages-2026-03-13-09-40-54](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-40-54.png)

Ainsi, les nouveaux tickets restent toujours en haut, ce qui les rend plus faciles à traiter.

## 3.6 Configurer les actions de ligne

Voir la liste ne suffit pas ; il faut pouvoir cliquer pour consulter le détail et éditer un ticket.

1. Au-dessus de la colonne d'actions, cliquez sur le second « + ».
2. Cliquez sur les actions : **View**, **[Edit](/interface-builder/actions/edit)**, **[Delete](/interface-builder/actions/delete)**.
3. Chaque ligne affiche désormais les boutons « View », « Edit » et « Delete » dans la colonne d'actions.

![03-building-pages-2026-03-13-09-42-42](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-42-42.png)

Au clic sur « View », un drawer s'ouvre où l'on pourra placer un bloc de détails pour afficher l'enregistrement complet — nous le configurerons en détail au chapitre suivant.
Un clic sur « Delete » supprime cette ligne.

## 3.7 Ajuster la mise en page

À ce stade, la page contient deux blocs (filter form et table) empilés verticalement par défaut, ce qui n'est pas forcément joli. NocoBase permet de **glisser-déposer** pour ajuster la position et la disposition des blocks.

En mode configuration, survolez la poignée en haut à gauche du block (le curseur devient une croix), maintenez et déplacez.

**Placer le filter form au-dessus du tableau** : maintenez le bloc filter form, déplacez-le sur le bord supérieur du tableau ; quand la ligne bleue apparaît, relâchez. Le filter form passe au-dessus.

![03-building-pages-2026-03-13-11-50-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-18.gif)

**Aligner les champs de filtre sur la même ligne** : à l'intérieur du filter form, les champs sont par défaut alignés verticalement. Faites glisser « Priorité » à droite de « Statut » ; quand la ligne verticale apparaît, relâchez. Les deux champs partagent la même ligne, gain d'espace vertical.

![03-building-pages-2026-03-13-11-50-58](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-58.gif)

> Presque tous les éléments de NocoBase peuvent être déplacés — boutons d'action, colonnes de tableau, items de menu, etc. Explorez !

## 3.8 Configurer la page Catégories de tickets

N'oubliez pas la sous-page « Catégories de tickets » créée à la section 3.2 ; ajoutons-y du contenu. La démarche est identique à la liste des tickets — ajouter un bloc de tableau, cocher les champs, configurer les actions — nous ne la répéterons donc pas, sauf pour une particularité.

Vous vous souvenez de la table « Catégories de tickets » créée au chapitre 2 ? C'est une **table arborescente** (avec hiérarchie parent-enfant). Pour qu'un tableau affiche correctement la structure arborescente, il faut activer une option :

1. Dans la page « Catégories de tickets », ajoutez un bloc de tableau et choisissez la table « Catégories de tickets ».
2. Cliquez sur les **paramètres du block** (icône à trois traits), trouvez **« Tree table »** et activez-la.


Une fois activée, le tableau affiche les catégories en arborescence avec indentation, au lieu d'une liste plate.

3. Cochez les champs à afficher (nom, description, etc.) et configurez les actions de ligne (ajouter, éditer, supprimer).
4. **Conseil de mise en page** : placez « Nom » en première colonne et « Actions » en seconde. Comme la table catégories a peu de champs, cette mise en page sur deux colonnes est plus compacte.

![03-building-pages-2026-03-13-18-51-36](https://static-docs.nocobase.com/03-building-pages-2026-03-13-18-51-36.png)

## Récapitulatif

Bravo ! Notre système de tickets dispose maintenant d'une **interface de gestion** présentable :

- Une structure de menu claire (Gestion des tickets → Liste des tickets / Catégories de tickets)
- Un **bloc de tableau** affichant les tickets
- Un **filter form** pour filtrer rapidement par statut, priorité, catégorie
- Une **règle de tri** par date de création décroissante
- Des **boutons d'action de ligne** pour consulter et éditer
- Un **tableau arborescent** affichant la hiérarchie des catégories

Plus simple que prévu, non ? Tout cela sans une ligne de code, uniquement par configuration et glisser-déposer.

## Au prochain chapitre

Pouvoir « voir » ne suffit pas — l'utilisateur doit aussi pouvoir **soumettre un nouveau ticket**. Au chapitre suivant, nous allons construire les blocs de formulaire, configurer les règles de liaison de champs, et activer l'historique des enregistrements pour suivre chaque modification.

## Ressources associées

- [Vue d'ensemble des blocks](/interface-builder/blocks) — tous les types de blocks
- [Bloc de tableau](/interface-builder/blocks/data-blocks/table) — configuration détaillée du bloc de tableau
- [Bloc de filtre](/interface-builder/blocks/filter-blocks/form) — configuration du filter form
