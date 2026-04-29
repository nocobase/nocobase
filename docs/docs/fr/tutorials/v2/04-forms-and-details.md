# Chapitre 4 : Formulaires et détails — saisir, afficher, en un seul mouvement

Au chapitre précédent, nous avons construit la liste des tickets et saisi quelques données de test grâce à un formulaire simple. Dans ce chapitre, nous **améliorons l'expérience du formulaire** — disposition des champs du [bloc de formulaire](/interface-builder/blocks/data-blocks/form), ajout d'un [bloc de détails](/interface-builder/blocks/data-blocks/details), configuration des [règles de liaison](/interface-builder/linkage-rules), et utilisation de l'[historique des modifications](https://docs.nocobase.com/cn/record-history/) pour suivre chaque modification d'un ticket.

:::tip
La fonctionnalité « [Historique des modifications](https://docs.nocobase.com/cn/record-history/) » de la section 4.4 est incluse dans la [version Pro](https://www.nocobase.com/cn/commercial). Sauter cette section n'affecte pas la suite du tutoriel.
:::

## 4.1 Améliorer le formulaire de création de ticket

Au chapitre précédent, nous avons rapidement créé un formulaire fonctionnel. Améliorons-le maintenant — ordre des champs, valeurs par défaut, mise en page. Si vous avez sauté la partie formulaire rapide du chapitre précédent, ce n'est pas grave : nous repartons ici depuis le début.

### Ajouter le bouton d'action « Add new »

1. Assurez-vous d'être en mode UI Editor (interrupteur en haut à droite activé).
2. Sur la page « Liste des tickets », cliquez sur **« [Actions](/interface-builder/actions) »** au-dessus du bloc de tableau.
3. Cochez le bouton **« Add new »**.
4. Un bouton « Add new » apparaît au-dessus du tableau ; au clic, une [pop-up](/interface-builder/actions/pop-up) s'ouvre.

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### Configurer le formulaire de la pop-up

1. Cliquez sur « Add new » pour ouvrir la pop-up.
2. Dans la pop-up, cliquez sur **« Add [block](/interface-builder/blocks) → Data block → Form (Add New) »**.
3. Choisissez **« Current [collection](/data-sources/data-modeling/collection) »**. La pop-up est déjà liée à la table correspondante via le contexte, inutile de la spécifier manuellement.

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. Dans le formulaire, cliquez sur **« [Fields](/data-sources/data-modeling/collection-fields) »** et cochez les champs suivants :

| Champ | Configuration |
|------|---------|
| Titre | Obligatoire (suit la définition globale) |
| Description | Texte long |
| Statut | Liste déroulante (la valeur par défaut sera définie via une règle de liaison) |
| Priorité | Liste déroulante |
| Catégorie | Champ relationnel, automatiquement présenté en sélecteur |
| Demandeur | Champ relationnel (la valeur par défaut sera définie via une règle de liaison) |
| Assigné | Champ relationnel |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

Vous remarquerez que le champ « Titre » est automatiquement marqué d'un astérisque rouge `*` — parce qu'il a été défini comme obligatoire au chapitre 2. Le formulaire hérite automatiquement des règles obligatoires définies au niveau de la table, sans configuration supplémentaire.

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **Astuce** : si un champ n'est pas obligatoire au niveau de la table mais que vous voulez le rendre obligatoire dans ce formulaire, vous pouvez le configurer individuellement dans les paramètres du champ.
>
![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### Ajouter le bouton « Submit »

1. Sous le bloc de formulaire, cliquez sur **« Actions »**.
2. Cochez le bouton **« Submit »**.

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. Une fois le formulaire rempli, l'utilisateur clique sur Submit pour créer un nouveau ticket.

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 Linkage rules : valeurs par défaut et liaison de champs

Certains champs doivent être pré-remplis (statut « En attente »), d'autres doivent évoluer dynamiquement selon les conditions (description obligatoire pour un ticket urgent). La fonctionnalité de valeur par défaut de la 2.0 est encore en évolution ; ce tutoriel utilise systématiquement les **linkage rules** pour configurer valeurs par défaut et liaisons de champs.

1. Cliquez sur les **paramètres du block** (icône à trois traits) en haut à droite du bloc de formulaire.
2. Trouvez **« Linkage rules »** et cliquez : un panneau de configuration s'ouvre dans la barre latérale.

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### Définir les valeurs par défaut

Définissons d'abord les valeurs par défaut de « Statut » et « Demandeur » :

1. Cliquez sur **« Add linkage rule »**.
2. **Ne mettez pas de condition** (laissez vide) — une linkage rule sans condition s'exécute immédiatement au chargement du formulaire.

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. Configurez les actions :
   - Champ Statut → **Set default value** → En attente
   - Champ Demandeur → **Set default value** → Current user

> **Attention au choix de la valeur** : sélectionnez d'abord **« Current form »** comme source. Pour les champs relationnels (catégorie, demandeur, assigné, etc., champs many-to-one), choisissez la propriété de l'objet elle-même, et non un sous-champ développé.
>
> Pour choisir une variable (par ex. « Current user »), il faut **un clic** pour sélectionner la variable, puis un **double-clic** pour la placer dans le champ de saisie.

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)


![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)


Si vous voulez qu'un champ ne puisse pas être modifié par le demandeur (par exemple le statut), passez **« Display mode »** sur **« Readonly »** dans la configuration du champ.

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **Trois modes d'affichage** : Editable, Readonly (édition désactivée mais apparence du champ conservée), Easy-reading (affichage en texte uniquement).

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### Description obligatoire pour les tickets urgents

Ajoutons maintenant une linkage rule conditionnelle : quand la priorité est « Urgente », la description devient **obligatoire** pour rappeler au demandeur de bien décrire la situation.

1. Cliquez sur **« Add linkage rule »**.

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. Configurez la règle :
   - **Condition** : Current form / Priorité **égal à** Urgente
   - **Actions** : Champ Description → **Required**

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. Enregistrez la règle.

Testons : choisissez la priorité « Urgente », un astérisque rouge `*` apparaît à côté de la description (obligatoire). Pour les autres priorités, le champ redevient facultatif.

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

Pour finir, ajustez un peu la mise en page selon ce que nous avons appris :
![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **Que peut-on faire d'autre avec les linkage rules ?** En plus des valeurs par défaut et de la contrainte d'obligation, vous pouvez contrôler l'affichage / le masquage des champs et faire des affectations dynamiques. Par exemple : masquer le champ « Assigné » quand le statut est « Closed ». Nous verrons d'autres cas plus loin.

## 4.3 [Bloc de détails](/interface-builder/blocks/data-blocks/details)

Au chapitre précédent, nous avons ajouté un bouton « View » sur chaque ligne, qui ouvre un drawer. Configurons maintenant son contenu.

1. Sur une ligne, cliquez sur **« View »** pour ouvrir le drawer.
2. Dans le drawer, cliquez sur **« Add block → Data block → Details »**.
3. Choisissez **« Current collection »**.

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. Dans le bloc de détails, **« Fields »**, mise en page proposée :


| Zone | Champs |
|------|------|
| Haut | Titre, Statut (style tag) |
| Corps | Description (grand texte) |
| Latéral | Nom de la catégorie, Priorité, Demandeur, Assigné, Date de création |

Comment placer un grand titre ?
Choisissez Fields > markdown > éditer le markdown > dans la zone d'édition, choisissez la variable > Current record > Titre
Le titre de l'enregistrement est ainsi inséré dynamiquement dans le bloc markdown.
Supprimez le texte par défaut et utilisez la syntaxe markdown pour transformer le contenu en titre de niveau 2 (préfixe `## ` + espace).

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

Le champ titre original peut être retiré ; ajustez la mise en page du formulaire de détails.

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)


> **Astuce** : plusieurs champs peuvent être disposés sur la même ligne par glisser-déposer pour une mise en page plus compacte.


1. Dans **« Actions »** du bloc de détails, cochez **« Edit »**, pour pouvoir basculer en édition directement depuis les détails.

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### Configurer le formulaire d'édition

Au clic sur « Edit », une nouvelle pop-up s'ouvre — où il faut placer un formulaire d'édition. Les champs sont presque identiques à ceux du formulaire de création ; faut-il tout reconfigurer ?

Non. Souvenez-vous du formulaire de création — sauvegardons-le comme **template**, le formulaire d'édition pourra le référencer.

**Étape 1 : revenir au formulaire de création et enregistrer comme template**

1. Fermez la pop-up actuelle, retournez à la liste des tickets, cliquez sur « Add new » pour ouvrir le formulaire de création.
2. Dans les **paramètres du block** (icône à trois traits) du bloc de formulaire, trouvez **« Save as template »**.

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. Cliquez pour enregistrer ; le mode par défaut est **« Reference »** — tous les formulaires qui référencent ce template partagent la même configuration ; modifier l'un les modifie tous.

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> Notre formulaire de tickets reste simple ; le mode « Reference » centralise la maintenance. Avec « Duplicate », chaque formulaire reçoit une copie indépendante, modifiable séparément.

**Étape 2 : référencer le template dans la pop-up d'édition**

1. Retournez au drawer de détails ou à la colonne d'actions du tableau, cliquez sur « Edit » pour ouvrir la pop-up d'édition.

Vous pourriez vous dire : il suffit d'utiliser **« Add block → Other blocks → Block template »** ? Si vous essayez, vous verrez que cela crée un **formulaire d'ajout** et que les champs ne sont pas pré-remplis. C'est un piège classique.

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

La bonne méthode est :

2. Dans la pop-up, cliquez sur **« Add block → Data block → Form (Edit) »** pour créer normalement un bloc de formulaire d'édition.
3. Dans le formulaire d'édition, cliquez sur **« Fields → Field templates »**, choisissez le template enregistré.
4. Tous les champs sont remplis en un clic, identiques à ceux du formulaire de création.
5. N'oubliez pas d'ajouter le bouton « Submit » pour permettre d'enregistrer les modifications.

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

À l'avenir, pour ajouter un champ : modifiez une seule fois le template, les formulaires de création et d'édition se mettent à jour ensemble.

### Quick editing : modifier les données sans ouvrir de pop-up

Outre l'édition par pop-up, NocoBase prend en charge la **quick editing** dans le tableau — pas de pop-up à ouvrir, il suffit de survoler la cellule pour la modifier.

L'activation se fait à deux endroits :

- **Au niveau du bloc de tableau** : cliquez sur les **paramètres du block** (icône à trois traits), trouvez **« Quick editing »** ; une fois activée, tous les champs du tableau prennent en charge la quick editing.
- **Au niveau d'un champ** : cliquez sur la configuration d'une colonne, trouvez **« Quick editing »**, pour activer ou non champ par champ.

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

Une fois activé, en survolant une cellule, une petite icône crayon apparaît ; un clic ouvre l'éditeur du champ, et la modification est enregistrée automatiquement.

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **Pour quels scénarios ?** La quick editing est très adaptée aux modifications massives de statut, d'assigné, etc. Par exemple, en parcourant la liste des tickets, un administrateur peut directement passer un ticket de « En attente » à « En cours » en cliquant sur la colonne « Statut », sans ouvrir de pop-up un par un.

## 4.4 Activer l'historique des modifications

:::info Plugin commercial
« [Record History](https://docs.nocobase.com/cn/record-history/) » est un plugin de la [version Pro](https://www.nocobase.com/cn/commercial) de NocoBase et nécessite une licence commerciale. Si vous utilisez la version communautaire, vous pouvez sauter cette section sans incidence sur la suite.
:::

Pour un système de tickets, le point essentiel est le suivant : **qui a changé quoi à quel moment doit être traçable**. Le plugin « Record History » de NocoBase enregistre automatiquement chaque modification.

### Configurer l'historique des modifications

1. Allez dans **Settings → Plugin manager**, vérifiez que le plugin « Record History » est activé.

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. Sur la page de configuration du plugin, cliquez sur **« Add collection »**, choisissez **« Tickets »**.
3. Sélectionnez les champs à suivre : **Titre, Statut, Priorité, Assigné, Description**, etc.

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **Conseil** : il n'est pas nécessaire de tout suivre. Les champs comme ID ou date de création, qui ne sont pas modifiés manuellement, n'ont pas besoin d'être suivis. Ne suivez que les champs métiers significatifs.

4. Revenez à la configuration et cliquez sur **« Synchronize history snapshots »** : le plugin crée automatiquement la première entrée d'historique pour chaque ticket existant ; chaque modification ultérieure ajoute une entrée.

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### Consulter l'historique sur la page de détails

1. Retournez sur le drawer de détails du ticket (cliquez sur « View » sur une ligne).
2. Dans le drawer, cliquez sur **« Add block → Record History »**.
3. Choisissez **« Current collection »** et data **« Current record »**.
4. Une chronologie apparaît en bas du drawer, montrant clairement chaque modification : qui, quand, quel champ, valeur avant / après.

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

Ainsi, même si plusieurs personnes traitent un ticket, toutes les modifications sont parfaitement traçables.

## Récapitulatif

Dans ce chapitre, nous avons couvert tout le cycle de vie de la donnée :

- **Formulaire** — l'utilisateur peut soumettre un nouveau ticket, avec valeurs par défaut et validations
- **Linkage rules** — un ticket urgent oblige à remplir la description
- **Bloc de détails** — afficher clairement l'enregistrement complet
- **Record History** — suivi automatique de chaque modification, audit serein (plugin commercial, optionnel)

De « voir » à « saisir », puis à « retrouver » — notre système de tickets est désormais utilisable.

## Ressources associées

- [Bloc de formulaire](/interface-builder/blocks/data-blocks/form) — configuration détaillée
- [Bloc de détails](/interface-builder/blocks/data-blocks/details) — configuration du bloc de détails
- [Linkage rules](/interface-builder/linkage-rules) — règles de liaison de champs
