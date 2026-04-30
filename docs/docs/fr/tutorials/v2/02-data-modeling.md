# Chapitre 2 : Modélisation des données — un système de tickets en deux tables

Au chapitre précédent, nous avons installé NocoBase et découvert l'interface. Il est maintenant temps de construire la charpente du système de tickets — définir le **modèle de données**.

Dans ce chapitre, nous allons créer les deux [tables de données](/data-sources/data-modeling/collection) tickets et catégories, configurer les [types de champs](/data-sources/data-modeling/collection-fields) (texte simple, liste déroulante, relation [many-to-one](/data-sources/data-modeling/collection-fields/associations/m2o), etc.) et établir les associations entre les tables. Le modèle de données est les fondations du système : c'est en réfléchissant d'abord clairement aux données à stocker et aux relations entre elles que la suite — la construction d'interfaces, la configuration des permissions — coulera naturellement.


## 2.1 Qu'est-ce qu'une table et un champ

Si vous avez déjà utilisé Excel, comprendre une table de données est facile :

| Concept Excel | Concept NocoBase | Description |
|------------|--------------|------|
| Feuille | Table de données (Collection) | Conteneur d'un type de données |
| En-tête de colonne | Champ (Field) | Décrit une propriété de la donnée |
| Ligne | Enregistrement (Record) | Une donnée concrète |

![02-data-modeling-2026-03-11-08-32-41](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-32-41.png)

Par exemple, la « table tickets » que nous allons créer ressemble à une feuille Excel — chaque colonne est un champ (titre, statut, priorité…), et chaque ligne est un enregistrement de ticket.

NocoBase est cependant beaucoup plus puissant qu'Excel. Il prend en charge plusieurs **types de tables**, chacun apportant des capacités différentes :

| Type de table | Cas d'usage | Exemples |
|--------|---------|------|
| **Table standard** | La plupart des données métier | Tickets, commandes, clients |
| **Table arborescente** | Données hiérarchiques | Arborescence de catégories, organigramme |
| Table calendrier | Événements datés | Réunions, plannings |
| Table de fichiers | Gestion de pièces jointes | Documents, images |

Aujourd'hui, nous utiliserons une **table standard** et une **table arborescente** ; les autres types viendront en temps voulu.

**Accéder à la gestion des data sources** : cliquez sur l'icône **« Data Source Management »** en bas à gauche (l'icône base de données à côté de la roue dentée). Vous verrez le « [data source principal](/data-sources) » — toutes nos tables seront créées ici.

![02-data-modeling-2026-03-11-08-35-08](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-35-08.png)


## 2.2 Créer la table principale : tickets

Allons droit au but : commençons par créer le cœur du système — la table tickets.

### Créer la table

1. Sur la page de gestion des data sources, cliquez sur **Main** pour entrer

![02-data-modeling-2026-03-11-08-36-06](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-36-06.png)

2. Cliquez sur **« Créer une table »**, puis sélectionnez **« Table standard »**

![02-data-modeling-2026-03-11-08-38-52](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-38-52.png)

3. Nom de la table : `tickets`, titre de la table : `Tickets`

![02-data-modeling-2026-03-11-08-40-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-40-34.png)

Lors de la création d'une table, le système coche par défaut un ensemble de **champs système** qui enregistrent automatiquement les métadonnées de chaque enregistrement :

| Champ | Description |
|------|------|
| ID | Clé primaire, identifiant unique distribué |
| Date de création | Date de création de l'enregistrement |
| Créé par | Qui a créé cet enregistrement |
| Date de dernière modification | Dernière mise à jour |
| Modifié par | Dernier utilisateur ayant modifié l'enregistrement |

Ces champs système peuvent rester par défaut, sans gestion manuelle. Vous pouvez les décocher si certains scénarios n'en ont pas besoin.

### Ajouter les champs de base

La table est créée, ajoutons maintenant les champs. Cliquez sur **« Configure fields »** sur la table tickets ; vous verrez les champs système cochés par défaut déjà présents dans la liste.

![02-data-modeling-2026-03-11-08-58-48](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-58-48.png)

![02-data-modeling-2026-03-11-08-59-47](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-59-47.png)

Cliquez sur le bouton **« Add field »** en haut à droite, une liste déroulante de types de champs s'ouvre — choisissez-y le type à ajouter.

![02-data-modeling-2026-03-11-09-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-00-22.png)

Commençons par ajouter les champs propres au ticket ; les champs de relation viendront ensuite.

**1. Titre (texte simple)**

Chaque ticket a besoin d'un titre court qui résume le problème. Cliquez sur **« Add field »** → choisissez **[« Single line text »](/data-sources/data-modeling/collection-fields/basic/input)** :

![02-data-modeling-2026-03-11-09-01-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-01-00.png)

- Nom du champ : `title`, titre du champ : `Titre`
- Cliquez sur **« Set validation rules »** et ajoutez une règle **« Required »**

![02-data-modeling-2026-03-11-09-02-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-02-40.png)

**2. Description (Markdown(Vditor))**

Pour décrire le problème en détail, avec mise en forme, captures et code. Sous **« Add field » → « Media »** vous avez trois options :

| Type de champ | Particularités |
|---------|------|
| Markdown | Markdown basique, mise en forme simple |
| Rich Text | Texte enrichi, mise en forme simple + pièces jointes |
| **Markdown(Vditor)** | Le plus complet : modes WYSIWYG, rendu instantané et édition source |

Nous choisissons **Markdown(Vditor)**.

![02-data-modeling-2026-03-11-09-09-58](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-09-58.png)

- Nom du champ : `description`, titre du champ : `Description`

![02-data-modeling-2026-03-11-09-10-50](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-10-50.png)

**3. Statut (Single select)**

Du dépôt au traitement final, un ticket a besoin d'un statut pour suivre sa progression.

![02-data-modeling-2026-03-11-09-12-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-12-00.png)

- Nom du champ : `status`, titre du champ : `Statut`
- Ajoutez les options (chaque option a une « valeur » et un « libellé », la couleur est facultative) :

| Valeur | Libellé | Couleur |
|--------|---------|------|
| pending | En attente | Orange (Sunset) |
| in_progress | En cours | Blue (Daybreak) |
| completed | Terminé | Green (Polar Green) |

![02-data-modeling-2026-03-11-09-17-44](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-17-44.png)

Renseignez d'abord les options et enregistrez. Cliquez ensuite à nouveau sur **« Edit »** sur ce champ pour pouvoir choisir **« En attente »** dans **« Default value »**.

![02-data-modeling-2026-03-11-09-20-28](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-20-28.png)

![02-data-modeling-2026-03-11-09-22-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-22-34.png)

> Lors de la création initiale, il n'y a pas encore de données d'options, donc la valeur par défaut ne peut pas être sélectionnée — il faut enregistrer puis revenir la configurer.

> Pourquoi un Single select ? Parce que le statut a un nombre fixe de valeurs ; la [liste déroulante](/data-sources/data-modeling/collection-fields/choices/select) empêche les utilisateurs de saisir n'importe quoi et garantit la cohérence des données.

**4. Priorité (Single select)**

Pour indiquer le niveau d'urgence du ticket et permettre aux opérateurs de trier par priorité.

- Nom du champ : `priority`, titre du champ : `Priorité`
- Ajoutez les options :

| Valeur | Libellé | Couleur |
|--------|---------|------|
| low | Basse | |
| medium | Moyenne | |
| high | Haute | Orange (Sunset) |
| urgent | Urgente | Red (Dust Red) |

À ce stade, la table tickets a 4 champs de base. Mais — un ticket devrait avoir une « catégorie », non ? Comme « Problème réseau » ou « Panne logicielle » ?

Faire de la catégorie une liste déroulante fonctionnerait. Mais vous découvrirez vite qu'une catégorie peut avoir des sous-catégories (« Problème matériel » > « Écran », « Clavier », « Imprimante ») — la liste déroulante ne suffit plus.

Il nous faut **une autre table** dédiée à la gestion des catégories. Et cette table, le mieux est de la créer en **table arborescente** de NocoBase.


## 2.3 Créer la table arborescente des catégories : la hiérarchie

### Qu'est-ce qu'une table arborescente

Une table arborescente est une table spéciale qui intègre nativement une **relation parent-enfant** — chaque enregistrement peut avoir un « nœud parent ». Cela convient parfaitement aux données hiérarchiques :

```
Problème matériel        ← catégorie de niveau 1
├── Écran                ← catégorie de niveau 2
├── Clavier / souris
└── Imprimante
Panne logicielle
├── Logiciels bureautiques
└── Problème système
Problème réseau
Compte / permissions
```

Avec une table standard, il faudrait créer manuellement un champ « catégorie parente » pour modéliser cette relation. La **table arborescente le gère pour vous**, en plus de l'affichage en arbre, de l'ajout d'enregistrements enfants, etc. Beaucoup plus pratique.

### Créer la table

1. Retournez à la gestion des data sources, cliquez sur **« Créer une table »**
2. Cette fois, choisissez **« Table arborescente »** (et pas table standard !)
![02-data-modeling-2026-03-11-09-26-07](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-07.png)

3. Nom de la table : `categories`, titre de la table : `Catégories de tickets`

![02-data-modeling-2026-03-11-09-26-55](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-55.png)

> Notez qu'après la création, en plus des champs système, deux champs de relation **« Parent »** et **« Children »** apparaissent automatiquement — c'est la spécificité de la table arborescente. Parent permet d'accéder au nœud parent, Children à tous les nœuds enfants ; vous n'avez rien à ajouter manuellement.

![02-data-modeling-2026-03-11-09-27-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-27-40.png)

### Ajouter les champs

Cliquez sur **« Configure fields »** pour entrer dans la liste des champs ; vous voyez les champs système ainsi que Parent et Children générés automatiquement.
Cliquez sur **« Add field »** en haut à droite :

**Champ 1 : nom de la catégorie**

1. Choisissez **« Single line text »**
2. Nom du champ : `name`, titre du champ : `Nom de la catégorie`
3. Cliquez sur **« Set validation rules »**, ajoutez la règle **« Required »**

**Champ 2 : couleur**

1. Choisissez **« Color »**
2. Nom du champ : `color`, titre du champ : `Couleur`

![02-data-modeling-2026-03-11-09-28-59](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-28-59.png)

Le champ couleur permet à chaque catégorie d'avoir sa propre couleur identifiante, ce qui rend l'affichage plus visuel par la suite.

![02-data-modeling-2026-03-11-09-29-23](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-29-23.png)

À ce stade, les champs de base des deux tables sont configurés. Il reste à les associer.


## 2.4 Retour à la table tickets : ajouter les champs de relation

> **Les champs de relation peuvent sembler abstraits au premier abord.** Si cela vous semble difficile à comprendre, vous pouvez sauter au [Chapitre 3 : Construire des pages](./03-building-pages) pour voir comment les données s'affichent dans une page concrète, puis revenir compléter les champs de relation.

Un ticket doit être lié à une catégorie, à un demandeur et à un assigné. Ces champs sont des **champs de relation** — ils ne stockent pas une chaîne de caractères comme « titre », mais l'ID d'un enregistrement d'une autre table, et retrouvent l'enregistrement correspondant via cet ID.

Prenons un ticket concret — à gauche, ses propriétés ; pour « Catégorie » et « Demandeur », ce ne sont pas des chaînes mais des ID. Le système retrouve via cet ID l'enregistrement correspondant dans la table de droite :


![02-data-modeling-2026-03-12-00-50-10](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-50-10.png)

À l'écran, vous voyez un nom (« Problème réseau », « Zhang San »), mais en interne tout est lié par ID. **Plusieurs tickets peuvent pointer vers la même catégorie ou le même utilisateur** — cette relation s'appelle [**many-to-one**](/data-sources/data-modeling/collection-fields/associations/m2o).

### Ajouter les champs de relation

Retournez à **« Configure fields »** de la table tickets → **« Add field »**, choisissez **« Many to one »**.
![02-data-modeling-2026-03-12-00-52-39](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-52-39.png)

À la création, vous verrez ces options :

| Option | Description | Comment remplir |
|--------|------|--------|
| Source collection | Table actuelle (rempli automatiquement) | Ne pas modifier |
| **Target collection** | La table à associer | Sélectionnez la table cible |
| **Foreign key** | Nom de la colonne de relation stockée dans la table actuelle | Donnez un nom parlant |
| Target collection title field | `id` par défaut | Conservez la valeur par défaut |
| ON DELETE | Comportement à la suppression de l'enregistrement cible | Conservez la valeur par défaut |

![02-data-modeling-2026-03-12-00-58-38](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-58-38.png)

> La foreign key reçoit par défaut un nom aléatoire (par ex. `f_xxxxx`) ; il vaut mieux la renommer en quelque chose de parlant pour faciliter la maintenance. Utilisez un nom en minuscules avec underscores (par ex. `category_id`), sans mélange de casse.

Ajoutez ainsi successivement trois champs :

**5. Catégorie → table catégories**

- Titre du champ : `Catégorie`
- Target collection : sélectionnez **« Catégories de tickets »** (si elle n'apparaît pas dans la liste, saisir directement le nom la créera)
- Foreign key : `category_id`

**6. Demandeur → table users**

Pour mémoriser qui a soumis ce ticket. NocoBase intègre une table users que l'on associe directement.

- Titre du champ : `Demandeur`
- Target collection : sélectionnez **« Users »**
- Foreign key : `submitter_id`
![02-data-modeling-2026-03-12-01-00-09](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-09.png)

**7. Assigné → table users**

Pour mémoriser qui s'occupe du ticket.

- Titre du champ : `Assigné`
- Target collection : sélectionnez **« Users »**
- Foreign key : `assignee_id`

![02-data-modeling-2026-03-12-01-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-22.png)


## 2.5 Vue d'ensemble du modèle de données

Récapitulatif du modèle complet que nous avons construit :

![02-data-modeling-2026-03-16-00-30-35](https://static-docs.nocobase.com/02-data-modeling-2026-03-16-00-30-35.png)

`}o--||` représente une relation many-to-one : « many » à gauche, « one » à droite.


## Récapitulatif

Dans ce chapitre, nous avons construit le modèle de données — la charpente complète du système de tickets :

1. **Table tickets** : 4 champs de base + 3 champs de relation, en **table standard**
2. **Table catégories** : 2 champs personnalisés + les champs Parent/Children automatiques, en **table arborescente**, avec hiérarchie native

Plusieurs concepts importants ont été abordés :

- **Table de données (Collection)** = conteneur d'un type de données
- **Type de table** = différents types pour différents scénarios (table standard, table arborescente…)
- **Champ (Field)** = propriété d'une donnée, créé via « Configure fields » → « Add field »
- **Champs système** = ID, date de création, créé par, etc., cochés automatiquement
- **Champ de relation (many-to-one)** = pointe vers un enregistrement d'une autre table, établissant l'association entre tables

> Vous avez peut-être remarqué que les captures suivantes contiennent déjà des données — ce sont des données de test que nous avons saisies à l'avance pour la démonstration, ne vous inquiétez pas. Dans NocoBase, la création, la mise à jour, la lecture et la suppression de données passent par les pages front-end. Le chapitre 3 construira un tableau pour afficher les données, le chapitre 4 un formulaire pour les saisir — pas à pas.


## Au prochain chapitre

La charpente est en place, mais les tables sont vides. Au chapitre suivant, nous allons construire des pages pour rendre les données vraiment visibles.

À bientôt au prochain chapitre !

## Ressources associées

- [Vue d'ensemble des data sources](/data-sources) — concepts clés de la modélisation NocoBase
- [Champs de table](/data-sources/data-modeling/collection-fields) — détail de tous les types de champs
- [Relation many-to-one](/data-sources/data-modeling/collection-fields/associations/m2o) — configuration des relations
