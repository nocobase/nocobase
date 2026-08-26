# Chapitre 5 : Utilisateurs et permissions — qui voit quoi

Au chapitre précédent, nous avons fini les formulaires et la page de détails ; le système de tickets sait saisir et afficher des données. Mais il y a un problème — tous les utilisateurs voient la même chose après connexion. Un employé qui soumet des tickets verrait les pages d'administration ; un technicien pourrait supprimer des catégories… Ce n'est pas acceptable.

Ce chapitre installe un « contrôle d'accès » : créer des [rôles](/users-permissions/acl/role), configurer les [permissions de menu](/users-permissions/acl/permissions) et les [data scopes](/users-permissions/acl/permissions), pour que **chaque utilisateur voie le bon menu et manipule les bonnes données**.

## 5.1 Comprendre les [rôles](/users-permissions/acl/role) (Role)

Dans NocoBase, **un rôle est un ensemble de [permissions](/users-permissions/acl/role)**. Vous n'attribuez pas les permissions une par une à chaque utilisateur ; vous définissez d'abord quelques rôles, puis vous y placez les utilisateurs.

NocoBase intègre trois rôles par défaut :

- **Root** : super-administrateur, tous les droits, non supprimable
- **Admin** : administrateur, droit de configurer l'interface par défaut
- **Member** : membre standard, peu de permissions par défaut

Mais ces trois rôles ne suffisent pas. Notre système de tickets a besoin d'une granularité plus fine ; nous allons donc créer 3 rôles personnalisés.

## 5.2 Créer trois rôles

Ouvrez le menu Settings en haut à droite et entrez dans **Users & Permissions → Roles**.

Cliquez sur **Add role** et créez successivement :

| Nom du rôle | Identifiant | Description |
|---------|---------|------|
| Administrateur | admin-helpdesk | Voit tous les tickets, gère les catégories, assigne les techniciens |
| Technicien | technician | Ne voit que les tickets qui lui sont assignés, peut traiter et clore |
| Utilisateur standard | user | Ne peut que soumettre des tickets et voir les siens |

![05-roles-and-permissions-2026-03-13-19-03-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-03-14.png)

> **L'identifiant du rôle** est un ID unique utilisé en interne ; il n'est plus modifiable une fois créé. Préférez un identifiant en minuscules anglaises. Le nom du rôle peut être modifié à tout moment.

![05-roles-and-permissions-2026-03-13-18-57-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-18-57-47.png)

Une fois créés, les trois nouveaux rôles apparaissent dans la liste.


## 5.3 Configurer les permissions de menu

Les rôles sont créés ; il faut maintenant indiquer au système quels menus chaque rôle peut voir.

Cliquez sur un rôle pour entrer dans la page de configuration des permissions, puis trouvez l'onglet **Menu access permissions**. Tous les items de menu du système y sont listés ; cocher autorise l'accès, décocher masque l'élément.

**Administrateur (admin-helpdesk)** : tout coché
- Gestion des tickets, gestion des catégories, tableau de bord — tout est visible

**Technicien (technician)** : sélection partielle
- ✅ Gestion des tickets
- ✅ Tableau de bord
- ❌ Gestion des catégories (le technicien n'a pas à gérer les catégories)

**Utilisateur standard (user)** : permissions minimales
- ✅ Gestion des tickets (ne voit que les siens)
- ❌ Gestion des catégories
- ❌ Tableau de bord

![05-roles-and-permissions-2026-03-13-19-09-11](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-09-11.png)

> **Astuce** : NocoBase propose un paramètre pratique « New menu items are accessible by default ». Si vous ne voulez pas cocher manuellement à chaque nouvelle page, activez-le pour le rôle administrateur. Pour un utilisateur standard, il vaut mieux le désactiver.

## 5.4 Configurer les permissions de données

Les permissions de menu contrôlent l'accès « à la page » ; les permissions de données contrôlent « quelles données voir une fois sur la page ».

Concept clé : **[Data scope](/users-permissions/acl/permissions)**.

Dans la configuration de permissions du rôle, basculez sur l'onglet **[Collection](/data-sources/data-modeling/collection) action permissions**. Trouvez la table « Tickets » et cliquez pour la configurer indépendamment.

![05-roles-and-permissions-2026-03-13-19-51-06](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-51-06.png)

### Utilisateur standard : ne voir que ses propres tickets

1. Trouvez la permission **View** de la table « Tickets »
2. Choisissez data scope → **Own data**
3. L'utilisateur standard ne voit alors que les tickets dont il est créateur (par défaut, le filtre s'appuie sur le champ système « Créé par » et non « Demandeur », mais cela peut être modifié)

De la même façon, mettez aussi **Edit** et **Delete** à **Own data** (ou ne donnez tout simplement pas la permission de Delete).

![05-roles-and-permissions-2026-03-13-19-53-02](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-53-02.png)


À propos de la configuration globale : si vous ne configurez que la table tickets, d'autres données et options (table catégories, assigné, etc.) peuvent devenir invisibles. Notre système restant simple, cochez globalement « View all data », puis configurez individuellement les tables sensibles.

![05-roles-and-permissions-2026-03-13-19-57-24](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-57-24.png)


### Technicien : ne voir que les tickets qui lui sont assignés

1. Trouvez la permission **View** de la table « Tickets »
2. Choisissez data scope → **Own data**
3. Mais attention — par défaut, « Own data » filtre sur le créateur. Pour filtrer sur l'assigné, vous pouvez ajuster la [permission d'action](/users-permissions/acl/permissions) globale, ou exploiter la **condition de filtre du [block](/interface-builder/blocks) de données** sur la page front-end.

![05-roles-and-permissions-2026-03-13-20-01-54](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-20-01-54.png)

> **Astuce pratique** : vous pouvez aussi configurer un filtre par défaut sur le bloc de tableau pour aider au contrôle de permissions, par ex. « Assigné = current user ». Mais cette configuration est globale et s'applique aussi à l'administrateur. Compromis : configurer « Assigné = current user **OU** Demandeur = current user » pour couvrir l'utilisateur standard et le technicien ; pour l'administrateur, créer une page dédiée sans filtre.

![05-roles-and-permissions-2026-03-13-22-21-34](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-21-34.png)

### Administrateur : voir toutes les données

Le data scope du rôle administrateur est **All data**, toutes les actions ouvertes. Simple et direct.

![05-roles-and-permissions-2026-03-13-21-45-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-21-45-14.png)

## 5.5 Action d'assignation de ticket

Avant de finir la configuration des permissions, ajoutons une fonctionnalité utile à la liste des tickets : **assigner un technicien**. L'administrateur peut alors assigner directement un ticket à un technicien depuis la liste, sans entrer en édition pour modifier plusieurs champs.

C'est très simple — ajouter un bouton de pop-up personnalisé dans la colonne d'actions :

1. Passez en mode UI Editor, dans la colonne d'actions du tableau, cliquez sur **« + »** et ajoutez une action **« Pop-up »**.

![05-roles-and-permissions-2026-03-14-13-57-31](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-57-31.png)

2. Renommez le bouton en **« Assigner »** (cliquez sur la configuration du bouton pour modifier le titre).

![05-roles-and-permissions-2026-03-14-13-59-22](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-59-22.png)


Comme nous avons juste une information d'assignation simple, une pop-up convient mieux qu'un drawer. Dans les paramètres en haut à droite du bouton, choisissez Pop-up settings → dialog narrow → confirmer.
![05-roles-and-permissions-2026-03-14-14-08-16](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-08-16.png)


3. Cliquez sur « Assigner » pour ouvrir la pop-up. Dans la pop-up, **« Add block → Data block → Form (Edit) »**, puis Current collection.
4. Dans le formulaire, ne cochez que le champ **« Assigné »** et marquez-le comme **obligatoire** dans la configuration du champ.
5. Ajoutez le bouton d'action **« Submit »**.

![05-roles-and-permissions-2026-03-14-14-10-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-10-50.png)

Désormais, dans la liste des tickets, l'administrateur clique sur « Assigner », un mini-formulaire s'ouvre, il choisit le technicien et soumet. Rapide et précis, sans risque de modifier d'autres champs.

### Utiliser une linkage rule pour afficher / masquer le bouton

Le bouton « Assigner » n'a de sens que pour l'administrateur ; le voir crée de la confusion pour les autres rôles. Utilisons une **linkage rule** pour contrôler son affichage selon le rôle de l'utilisateur courant :

1. En mode UI Editor, cliquez sur la configuration du bouton « Assigner », trouvez **« Linkage rules »**.
2. Ajoutez une règle avec la condition : **Current user / Roles / Role name** différent de **Administrateur** (le nom du rôle correspondant à admin-helpdesk).
3. Action si la condition est vraie : **masquer** le bouton.

Ainsi, seul un administrateur voit « Assigner » ; les autres rôles voient le bouton automatiquement masqué.

![05-roles-and-permissions-2026-03-14-14-17-37](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-17-37.png)

## 5.6 Créer des utilisateurs de test et expérimenter

Les permissions sont configurées ; passons à la vérification.

Allez dans **User management** (centre de paramètres ou la page de gestion des utilisateurs que vous avez déjà construite), créez 3 utilisateurs de test :

| Utilisateur | Rôle |
|-------|------|
| Alice | Administrateur (admin-helpdesk) |
| Bob | Technicien (technician) |
| Charlie | Utilisateur standard (user) |

![05-roles-and-permissions-2026-03-13-22-23-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-23-47.png)

Une fois créés, connectez-vous tour à tour avec les trois comptes et vérifiez deux choses :

**1. Les menus s'affichent-ils comme prévu ?**
- Alice → voit tous les menus

![05-roles-and-permissions-2026-03-14-14-19-29](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-19-29.png)

- Bob → ne voit que Gestion des tickets et Tableau de bord

![05-roles-and-permissions-2026-03-13-22-26-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-26-50.png)

- Charlie → ne voit que « Mes tickets »

![05-roles-and-permissions-2026-03-13-22-30-57](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-30-57.png)

**2. Les données sont-elles filtrées comme prévu ?**
- Connectez-vous d'abord avec Alice et créez quelques tickets, en assignant à différents techniciens
- Connectez-vous avec Bob → ne voit que les tickets qui lui sont assignés
- Connectez-vous avec Charlie → ne voit que les tickets qu'il a soumis

Plutôt cool, non ? Le même système, et chaque utilisateur voit un contenu totalement différent ! C'est la puissance des permissions.

## Récapitulatif

Dans ce chapitre, nous avons construit le système de permissions :

- **3 rôles** : administrateur, technicien, utilisateur standard
- **Permissions de menu** : qui accède à quelles pages
- **Permissions de données** : qui voit quelles données (via le data scope)
- **Validation** : connexion avec différents comptes pour confirmer

Le système de tickets est désormais bien charpenté — saisie, consultation, contrôle d'accès par rôle. Mais toutes les opérations restent manuelles.

## Au prochain chapitre

Au prochain chapitre, nous découvrirons les **workflows** — pour faire travailler le système à notre place. Par exemple, notifier automatiquement l'assigné dès qu'un ticket est soumis, ou journaliser les changements de statut.

## Ressources associées

- [Gestion des utilisateurs](/users-permissions/user) — gestion détaillée des utilisateurs
- [Rôles et permissions](/users-permissions/acl/role) — configuration des rôles
- [Data scope](/users-permissions/acl/permissions) — contrôle de permissions au niveau données
