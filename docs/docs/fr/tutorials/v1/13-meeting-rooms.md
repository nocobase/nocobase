# Chapitre 12 : Réservation de salles de réunion et workflow

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

À ce stade, vous êtes certainement déjà très à l'aise avec **NocoBase**.

Dans ce chapitre, nous allons réaliser ensemble un scénario particulier : un module de gestion des réunions.

Ce module inclut des fonctionnalités telles que la réservation de salles de réunion et les notifications. Au cours de cette démarche, nous allons construire pas à pas un module de gestion des réunions, en partant des bases pour progresser vers des fonctionnalités plus avancées. Commençons par concevoir la structure des tables de données de ce module.

---

### 12.1 Conception de la structure des tables de données

La structure des tables de données peut être considérée comme la fondation du module de gestion des réunions. Nous allons nous concentrer ici sur la **table des salles de réunion** et la **table des réservations**, et nous aborderons également de nouvelles relations, comme la relation [many-to-many](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m) avec les utilisateurs.

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 Table des salles de réunion

La table des salles de réunion sert à stocker les informations de base de toutes les salles de réunion, avec des champs tels que le nom, l'emplacement, la capacité et l'équipement.

##### Exemple de structure de table

```json
Salles de réunion (Rooms)
    ID (clé primaire)
    Nom de la salle (name, Single line text)
    Emplacement précis (location, Long text)
    Capacité (capacity, Integer)
    Équipement (equipment, Long text)
```

#### 12.1.2 Table des réservations

La table des réservations sert à enregistrer toutes les informations de réservation de réunions, avec des champs tels que la salle de réunion, les utilisateurs participants, la plage horaire, le titre et la description de la réunion.

##### Exemple de structure de table

```json
Réservations (Bookings)
    ID (Integer, clé primaire unique)
    Salle de réunion (room, relation many-to-one, clé étrangère room_id liée à l'ID de la salle)
    Utilisateurs (users, many-to-many, lié à l'ID de l'utilisateur)
    Heure de début (start_time, Datetime)
    Heure de fin (end_time, Datetime)
    Titre de la réunion (title, Single line text)
    Description de la réunion (description, Markdown)
```

##### [Relation many-to-many](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

Dans la table des réservations, on rencontre une relation « many-to-many » : un utilisateur peut participer à plusieurs réunions, et une réunion peut accueillir plusieurs utilisateurs. Cette relation many-to-many nécessite la configuration de clés étrangères. Pour faciliter la gestion, nous nommons la table intermédiaire **booking_users**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 Construction du module de gestion des réunions

Une fois la structure des tables conçue, nous pouvons créer les deux tables conformément à la conception et construire le module « Gestion des réunions ». Voici les étapes de création et de configuration :

#### 12.2.1 Création de [blocs Table](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)

Tout d'abord, ajoutez le module « Gestion des réunions » dans la page, en créant respectivement un **bloc Table pour les salles de réunion** et un **[bloc Table](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) pour la table des réservations**. Créez ensuite un [bloc Calendrier](https://docs-cn.nocobase.com/handbook/calendar) pour la table des réservations, en réglant la vue par défaut du calendrier sur « Jour ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### Configurer les associations du bloc Table des salles de réunion

Reliez le bloc Table des salles de réunion aux deux autres blocs, ce qui permet de filtrer automatiquement les enregistrements de réservation correspondant à la salle sélectionnée. Ensuite, vous pouvez tester les fonctions de filtrage, d'ajout, de suppression, de recherche et de modification pour vérifier les interactions de base du module.

> 💡**Connexion entre blocs NocoBase (recommandée !!)** :
>
> En plus du bloc de filtrage précédent, notre bloc Table peut également être connecté à d'autres blocs, ce qui permet d'obtenir un effet de filtrage par clic.
>
> Comme illustré ci-dessous, dans la configuration de la table des salles, nous connectons les deux autres blocs de la table des réservations (bloc Table de la table des réservations, bloc Calendrier de la table des réservations).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> Une fois la connexion réussie, en cliquant sur la table des salles de réunion, vous remarquerez que les deux autres tables se filtrent automatiquement ! Cliquez à nouveau sur l'élément sélectionné pour annuler la sélection.
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 Détection de l'occupation des salles de réunion

Une fois la page configurée, il faut ajouter une fonctionnalité importante : la détection de l'occupation des salles de réunion. Cette fonction vérifie, lors de la création ou de la mise à jour d'une réunion, si la salle cible est occupée pendant la plage horaire spécifiée, afin d'éviter les conflits de réservation.

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 Configuration d'un [workflow](https://docs-cn.nocobase.com/handbook/workflow) « événement avant action »

Pour effectuer la vérification au moment de la réservation, nous utilisons un type particulier de workflow — l'[« événement avant action »](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor) :

- [**Événement avant action**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor) (plugin commercial) : exécute une série d'opérations avant l'ajout, la suppression ou la modification de données, et permet de mettre en pause et d'intercepter à l'avance. Cette approche est très proche de notre flux de développement quotidien !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 Configuration des nœuds

Dans le workflow de détection d'occupation, nous avons besoin des types de nœuds suivants :

- [**Nœud Calcul**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation) (logique de transformation des données, pour gérer les cas de modification et d'ajout)
- [**Opération SQL**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql) (exécution d'une requête SQL)
- [**Analyse JSON**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query) (plugin commercial, pour analyser des données JSON)
- [**Message de réponse**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message) (plugin commercial, pour renvoyer un message d'information)

---

#### 12.3.3 Liaison à la table des réservations et configuration du déclencheur

Maintenant, lions la table des réservations, choisissons « Mode global » comme mode de déclenchement, et sélectionnons les types d'opération « Création d'enregistrement » et « Mise à jour d'enregistrement ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 Configuration du [nœud Calcul](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)

#### 12.4.1 Création d'un nœud de calcul « Convertir un ID vide en -1 »

Nous créons d'abord un nœud de calcul pour convertir un ID vide en -1. Le nœud de calcul permet de transformer les variables selon nos besoins, et propose les trois types d'opération suivants :

- **Math.js** (référence : [Math.js](https://mathjs.org/))
- **Formula.js** (référence : [Formula.js](https://formulajs.info/functions/))
- **Modèle de chaîne de caractères** (pour la concaténation de données)

Ici, nous utilisons **Formula.js** pour effectuer une vérification numérique :

```html
IF(NUMBERVALUE(【Variable du déclencheur/Paramètres/Objet de valeurs soumis/ID】, '', '.'),【Variable du déclencheur/Paramètres/Objet de valeurs soumis/ID】, -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5. Création du [nœud Opération SQL](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)

Ensuite, créez un nœud Opération SQL pour exécuter la requête de vérification des salles de réunion disponibles :

#### 12.5.1 Requête SQL des salles de réunion disponibles

```sql
-- Récupérer toutes les salles de réunion réservables
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- Exclure la réservation actuelle
  AND b.start_time < '{{$context.params.values.end_time}}' -- L'heure de début est antérieure à l'heure de fin recherchée
  AND b.end_time > '{{$context.params.values.start_time}}' -- L'heure de fin est postérieure à l'heure de début recherchée
WHERE b.id IS NULL;
```

> Remarque sur le SQL : les variables sont remplacées directement dans la requête SQL ; veuillez les vérifier soigneusement pour éviter toute injection SQL. Ajoutez des guillemets simples aux endroits appropriés.

Les variables correspondent à :

{{$jobsMapByNodeKey.3a0lsms6tgg}} représente le résultat du nœud précédent, soit 【Données du nœud / Convertir un ID vide en -1】

{{$context.params.values.end_time}} représente 【Variable du déclencheur / Paramètres / Objet de valeurs soumis / Heure de fin】

{{$context.params.values.start_time}} représente 【Variable du déclencheur / Paramètres / Objet de valeurs soumis / Heure de début】

#### 12.5.2 Test du SQL

Notre objectif est de récupérer toutes les salles de réunion qui ne sont pas en conflit avec la plage horaire ciblée.

À ce stade, vous pouvez cliquer sur « Test run » en bas, modifier les valeurs des variables et déboguer le SQL.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [Analyse JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 Configuration du [nœud Analyse JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

Grâce au test précédent, nous constatons que le résultat se présente sous la forme suivante. Il faut alors activer le [**plugin JSON query node**](https://docs-cn.nocobase.com/handbook/workflow-json-query) :

```json
[
  {
    "id": 2,
    "name": "Salle 2"
  },
  {
    "id": 1,
    "name": "Salle 1"
  }
]
```

> JSON propose trois modes d'analyse :
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

Choisissons-en un, par exemple le format [JMESPath](https://jmespath.org/) ; comme nous voulons obtenir la liste des noms de toutes les salles de réunion disponibles, l'expression à saisir est :

```sql
[].name
```

La configuration du mappage des propriétés s'applique à des listes d'objets ; elle n'est pas nécessaire ici et peut être laissée vide.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [Condition](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

Configurez le nœud de condition pour vérifier si la salle de réunion en cours fait partie de la liste des salles disponibles. En fonction du résultat **Oui** ou **Non**, configurez les messages de réponse correspondants :

Pour la condition, choisissez simplement le mode « Basique » :

```json
【Données du nœud / Liste des salles analysées】 contient 【Variable du déclencheur / Paramètres / Objet de valeurs soumis / Salle de réunion / Nom】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 Oui : message de succès

Il faut alors activer le [**plugin Workflow: Response message**](https://docs-cn.nocobase.com/handbook/workflow-response-message) :

```json
【Variable du déclencheur/Paramètres/Objet de valeurs soumis/Salle de réunion/Nom】 disponible, réservation réussie !
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 Non : message d'échec

```json
La salle de réunion cible n'est pas disponible. Liste des salles disponibles : 【Données du nœud/Liste des salles analysées】
```

Notez qu'en cas d'échec de la vérification, vous devez impérativement configurer un nœud « Fin du flux » pour terminer manuellement le processus.

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 Tests de fonctionnement et débogage détaillés

Nous abordons maintenant la phase finale de tests du système de gestion des réunions. L'objectif est de vérifier que notre workflow détecte correctement et bloque les réservations de salles en conflit.

#### 12.8.1 Ajouter une réservation avec une plage horaire en conflit

Tout d'abord, essayons d'ajouter une réservation dont la plage horaire entre en conflit avec une réservation existante, pour voir si le système bloque l'opération et affiche une erreur.

- Définir la plage horaire en conflit

Essayez d'ajouter une nouvelle réservation pour la « Salle 1 », avec la plage horaire :

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

Cette plage couvre toute la journée et nous créons volontairement un conflit avec une réservation existante.

- Confirmer les réservations existantes

Pour la « Salle 1 », il existe déjà deux plages horaires réservées :

1. `2024-11-14 09:00:00 à 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 à 2024-11-14 16:30:00`

Ces deux plages se chevauchent avec celle que nous voulons ajouter

(`2024-11-14 00:00:00 - 2024-11-14 23:00:00`).

Selon la logique, le système doit donc détecter le conflit et bloquer cette réservation.

- Soumettre la réservation et vérifier le retour

Cliquez sur le bouton **Soumettre** : le système exécute le processus de vérification du workflow.

**Retour positif :** après soumission, le système affiche un message de conflit, ce qui prouve que la logique de détection fonctionne. La page nous indique que la réservation ne peut pas être effectuée.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 Ajouter une réservation sans conflit

Testons à présent une réservation sans conflit, pour vérifier que la réservation aboutit lorsque les horaires ne se chevauchent pas !

- Définir la plage horaire sans conflit

Choisissez une plage horaire sans conflit, par exemple

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`.

Cette plage ne chevauche aucune réservation existante, et respecte donc les règles de réservation.

- Soumettre la réservation sans conflit

Cliquez sur le bouton **Soumettre** : le système exécute à nouveau la logique de vérification du workflow.

**Vérifions ensemble :** la soumission est réussie ! Le système affiche un message « Réservation réussie », ce qui prouve que la fonctionnalité fonctionne aussi correctement sans conflit.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 Modifier l'horaire d'une réservation existante

En plus de l'ajout, vous pouvez tester la modification d'une réservation existante.

Par exemple, changez l'horaire d'une réunion existante pour une autre plage sans conflit, puis cliquez à nouveau sur Soumettre.

Cette étape, c'est à vous de la jouer.

---

### 12.9 Optimisation du tableau de bord et panneau d'agenda personnel

Une fois tous les tests fonctionnels validés, nous pouvons embellir et optimiser le tableau de bord pour améliorer l'expérience utilisateur.

#### 12.9.1 Réorganiser la mise en page du tableau de bord

Dans le tableau de bord, vous pouvez réorganiser le contenu de la page en fonction des habitudes des utilisateurs, afin qu'ils puissent consulter plus facilement les données du système.

Pour aller plus loin dans l'expérience utilisateur, vous pouvez créer un panneau d'agenda personnel pour chaque utilisateur. Voici comment procéder :

1. **Créer un nouveau bloc « Agenda personnel »** : ajoutez un bloc Calendrier ou Liste dans le tableau de bord pour afficher l'agenda personnel de l'utilisateur.
2. **Définir la valeur par défaut du membre** : réglez la valeur par défaut du champ membre sur l'utilisateur connecté, afin que les réunions affichées par défaut soient celles qui le concernent.

Cela améliore encore l'expérience d'utilisation du module de gestion des réunions.

Une fois ces réglages effectués, les fonctionnalités et la mise en page du tableau de bord deviennent plus intuitives, et les fonctionnalités sont bien plus riches !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

Grâce à ces étapes, nous avons réussi à mettre en œuvre et à optimiser les principales fonctionnalités du module de gestion des réunions ! Nous espérons qu'au fil des manipulations, vous prendrez progressivement en main les fonctionnalités clés de NocoBase et apprécierez le plaisir de construire un système modulaire.

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de souci, n'oubliez pas que vous pouvez toujours consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
