# Chapitre 6 : Workflows — laisser le système travailler

Au chapitre précédent, nous avons posé un système de permissions ; chaque rôle voit ce qui le concerne. Mais toutes les opérations restent manuelles — quand un nouveau ticket arrive, quelqu'un doit le voir ; quand un statut change, personne n'est prévenu.

Dans ce chapitre, nous utilisons le [workflow](/workflow) de NocoBase pour faire **travailler le système tout seul** — configurer une [condition](/workflow/nodes/condition) et un nœud de [mise à jour](/workflow/nodes/update) automatique pour faire avancer le statut des tickets et enregistrer automatiquement la date de complétion.

## 6.1 Qu'est-ce qu'un [workflow](/workflow) ?

Un workflow est un ensemble de règles automatisées du type « si… alors… ».

Pour faire une analogie : votre alarme téléphonique sonne tous les matins à 8 h. C'est le workflow le plus simple — **quand la condition est remplie (8 h), exécution automatique (sonnerie)**.

Le workflow de NocoBase suit la même logique :

![06-workflows-2026-03-20-13-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-20-13-25-38.jpg)

- **[Trigger](/workflow/triggers/collection)** : le point d'entrée du workflow. Par exemple « quelqu'un crée un nouveau ticket » ou « un enregistrement est mis à jour ».
- **Condition** : étape de filtrage facultative. Par exemple « ne continuer que si l'assigné est non vide ».
- **Action** : l'étape qui agit vraiment. Par exemple « envoyer une notification » ou « mettre à jour un champ ».

Les actions d'un workflow peuvent enchaîner plusieurs nœuds. Les types courants :

- **Contrôle de flux** : condition, branches parallèles, boucles, délais
- **Manipulation de données** : créer, mettre à jour, requêter, supprimer
- **Notifications et services externes** : notification, requête HTTP, calcul

Ce tutoriel n'utilise que les plus courants ; une fois leur composition maîtrisée, vous saurez répondre à la plupart des cas.

### Aperçu des types de triggers

NocoBase propose plusieurs triggers, à choisir lors de la création d'un workflow :

| Trigger | Description | Cas typique |
|-------|------|---------|
| [**Collection event**](/workflow/triggers/collection) | Déclenché à la création, mise à jour ou suppression de données | Notification de nouveau ticket, journal de changement de statut |
| [**Schedule**](/workflow/triggers/schedule) | Déclenché par une expression Cron ou une heure fixe | Rapport quotidien, nettoyage périodique |
| [**Post-action event**](/workflow/triggers/action) | Déclenché après une action utilisateur dans l'interface | Notification après soumission, journalisation |
| **Approval** | Lance un processus d'approbation, multi-niveaux | Demande de congé, validation d'achat |
| **Custom action** | Lié à un bouton personnalisé, déclenché au clic | Archivage en un clic, opérations groupées |
| **Pre-action event** | Intercepte une action utilisateur, exécute en synchrone, puis libère | Validation avant soumission, complétion automatique |
| **AI Employees** | Expose un workflow comme outil pour les AI Employees | Action métier exécutée par l'IA |

Ce tutoriel utilise **Collection event** et **Custom action event** ; les autres se configurent de manière similaire — une fois compris, vous pourrez généraliser.

Le workflow de NocoBase est un plugin intégré, prêt à l'emploi sans installation supplémentaire.

## 6.2 Scénario 1 : notifier automatiquement l'assigné lors d'un nouveau ticket

**Besoin** : quand quelqu'un crée un nouveau ticket et que l'assigné est renseigné, le système envoie automatiquement un message interne à l'assigné pour lui signaler « tu as du travail ».

### Étape 1 : créer le workflow

Ouvrez le menu de configuration des plugins en haut à droite et entrez dans **Workflow management**.

![06-workflows-2026-03-14-23-50-45](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-50-45.png)


Cliquez sur **New** ; dans la boîte de dialogue :

- **Nom** : saisissez « Notifier l'assigné d'un nouveau ticket »
- **Trigger type** : choisissez **Collection event**

![06-workflows-2026-03-14-23-53-37](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-53-37.png)


Après soumission, cliquez sur le lien **Configure** dans la liste pour entrer dans l'éditeur de workflow.

### Étape 2 : configurer le trigger

Cliquez sur la carte du trigger en haut pour ouvrir le drawer de configuration :

- **[Collection](/data-sources/data-modeling/collection)** : choisissez Main / « Tickets »
- **Trigger on** : choisissez « After record is created or updated »
- **Changed [fields](/data-sources/data-modeling/collection-fields)** : cochez « Assigné (Assignee) » — ne déclenche que si le champ assigné a changé, pour éviter les notifications inutiles à chaque modification (à la création, tous les champs sont considérés comme modifiés, donc un nouveau ticket déclenche aussi)
- **Trigger condition** : mode « Match **any** in the group », ajoutez deux conditions :
  - `assignee_id` n'est pas vide
  - `Assignee / ID` n'est pas vide

  > Pourquoi deux conditions ? Parce qu'au déclenchement, le contexte peut ne contenir que la foreign key (`assignee_id`) sans l'objet associé chargé, ou inversement. Les deux conditions en OR garantissent le déclenchement dès qu'un assigné est défini.

- **Preload associations** : cochez « Assignee » — les nœuds suivants ont besoin des informations de l'assigné, qu'il faut précharger dans le trigger.

![06-workflows-2026-03-14-23-58-31](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-58-31.png)

Cliquez sur Save. Le trigger réalise lui-même le filtrage — pas besoin de nœud condition.

### Étape 3 : ajouter un nœud de notification

Cliquez sur **+** sous le trigger et choisissez le nœud **Notification**.

![06-workflows-2026-03-15-00-00-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-00-55.png)

Ouvrez la configuration du nœud notification ; le premier champ est le **canal de notification** — mais nous n'en avons pas encore créé, la liste est vide. Allons en créer un.

![06-workflows-2026-03-15-00-10-12](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-10-12.png)


### Étape 4 : créer un canal de notification

NocoBase prend en charge plusieurs types de canaux :

| Type | Description |
|---------|------|
| **In-app message** | Notification dans le navigateur, poussée en temps réel dans le centre de notifications |
| **Email** | Envoi par SMTP, nécessite la configuration du serveur d'envoi |

Ce tutoriel utilise le canal le plus simple : **In-app message** :

1. Ouvrez Settings en haut à droite, entrez dans **Notification management**
2. Cliquez sur **New channel**

![06-workflows-2026-03-15-00-13-07](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-13-07.png)

3. Type : **In-app message**, nom du canal (par ex. « Système — message interne »)
4. Save

![06-workflows-2026-03-15-00-17-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-17-55.png)

### Étape 5 : configurer le nœud de notification

Retournez sur l'éditeur de workflow et ouvrez la configuration du nœud notification.

Le nœud notification a les options suivantes :

- **Canal de notification** : choisissez « Système — message interne » créé précédemment
- **Destinataire** : cliquez et choisissez Query users → « id = Trigger variable / Trigger data / Assignee / ID »
- **Titre** : saisissez le titre, par ex. « Vous avez un nouveau ticket à traiter ». Les variables sont supportées, par ex. en y ajoutant le titre du ticket : `Nouveau ticket : {{Trigger data / Titre}}`
- **Contenu** : saisissez le corps de la notification, avec variables pour priorité, description, etc.

![06-workflows-2026-03-15-20-10-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-10-11.png)

(À l'étape suivante, nous chercherons l'URL du ticket ; n'oubliez pas d'enregistrer avant de quitter le drawer !)

- **Lien de détail desktop** : saisissez le chemin URL de la page de détails du ticket. Comment l'obtenir : ouvrez le drawer de détails d'un ticket dans l'interface, copiez le chemin de la barre d'adresse, du type `/admin/camcwbox2uc/view/d8f8e122d37/filterbytk/353072988225540`. Collez-le dans le champ ; le nombre après `filterbytk/` est l'ID du ticket — remplacez cette partie par la variable ID du trigger (sélecteur de variable → Trigger data → ID). Une fois configuré, l'utilisateur cliquant sur la notification est redirigé vers la page de détail correspondante, et la notification est marquée comme lue.

![06-workflows-2026-03-15-00-28-32](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-28-32.png)

![06-workflows-2026-03-15-20-15-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-15-19.png)

- **Continuer en cas d'échec d'envoi** : facultatif ; cocher pour que le workflow continue même si l'envoi échoue.

> Une fois la notification envoyée, l'assigné la voit dans le **centre de notifications** en haut à droite ; les notifications non lues sont signalées par une pastille rouge. Au clic, il est redirigé vers la page de détails du ticket.

### Étape 6 : tester et activer

> Le workflow du scénario 1 ne contient que deux nœuds : trigger (avec condition) → notification. Simple et direct.

Avant d'activer, le workflow propose une fonctionnalité **Run** pour tester avec une donnée :

1. Cliquez sur **Run** en haut à droite (pas l'interrupteur d'activation)
2. Sélectionnez un ticket existant comme donnée de déclenchement
  > Si le sélecteur de ticket affiche des ID, allez dans Data sources > Collections > Tickets et définissez « Titre » comme champ-titre
![06-workflows-2026-03-15-19-47-57](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-47-57.png)

3. Cliquez sur Run ; le workflow s'exécute et bascule automatiquement vers la nouvelle version dupliquée
![06-workflows-2026-03-15-19-57-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-57-19.png)

4. Cliquez sur les trois points en haut à droite, choisissez Execution history. Vous y voyez votre exécution récente ; cliquez pour voir le détail, dont le contexte de déclenchement, le détail d'exécution de chaque nœud et ses paramètres.
![06-workflows-2026-03-15-19-58-34](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-58-34.png)

![06-workflows-2026-03-15-20-01-02](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-01-02.png)


5. Le ticket testé semble être destiné à Alice ; basculons sur le compte d'Alice pour vérifier — bien reçu !

![06-workflows-2026-03-15-20-16-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-22.png)

Au clic, redirection vers la page du ticket cible, et la notification est automatiquement marquée comme lue.

![06-workflows-2026-03-15-20-16-54](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-54.png)


Une fois le flux validé, cliquez sur l'interrupteur **Activer/Désactiver** en haut à droite pour activer le workflow.

![06-workflows-2026-03-15-20-18-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-18-16.png)

:::warning Attention
Une fois exécuté (y compris en exécution manuelle), le workflow passe en **lecture seule** (grisé) et n'est plus modifiable. Pour modifier, cliquez sur **« Duplicate to new version »** en haut à droite et continuez sur la nouvelle version. L'ancienne se désactive automatiquement.
:::

![06-workflows-2026-03-15-20-19-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-19-11.png)

Retournez à la page Tickets, créez un nouveau ticket en sélectionnant un assigné. Connectez-vous avec le compte de l'assigné et regardez le centre de notifications — une nouvelle notification doit apparaître.

![06-workflows-2026-03-15-20-22-00](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-22-00.gif)

Bravo, votre première automatisation tourne !

## 6.3 Scénario 2 : enregistrer automatiquement la date de complétion à un changement de statut

**Besoin** : quand le statut d'un ticket passe à « Terminé », le système remplit automatiquement le champ « Date de complétion » avec la date courante. Plus besoin de saisir, plus de risque d'oubli.

> Si vous n'avez pas encore créé le champ « Date de complétion » dans la table tickets, allez dans **Data sources → Tickets** et ajoutez un champ de type **Date** nommé « Date de complétion ». Voir le chapitre 2 pour la procédure de création de champ.
> ![06-workflows-2026-03-15-20-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-25-38.png)

### Étape 1 : créer le workflow

Retournez à la page Workflow management, cliquez sur New :

- **Nom** : « Enregistrer la date de complétion d'un ticket »
- **Trigger type** : choisissez **Custom action event** (déclenché lorsque l'utilisateur clique sur un bouton lié à ce workflow)
- **Mode d'exécution** : Synchrone
> À propos du synchrone vs asynchrone :
> - Asynchrone : après l'action, vous pouvez continuer à travailler ; le workflow s'exécute en arrière-plan et vous notifie le résultat
> - Synchrone : après l'action, l'interface attend la fin du workflow avant de vous laisser faire autre chose

![06-workflows-2026-03-19-22-56-34](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-56-34.png)

### Étape 2 : configurer le trigger

Ouvrez la configuration du trigger :

- **Collection** : choisissez « Tickets »
- **Mode d'exécution** : choisissez **Single record** (chaque exécution traite uniquement le ticket sur lequel l'utilisateur a cliqué)

![06-workflows-2026-03-19-22-58-21](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-58-21.png)

<!-- TODO: capture de la configuration du trigger -->


### Étape 3 : ajouter un nœud condition

Contrairement au trigger Collection event qui inclut son propre filtre, il faut ici ajouter un nœud condition :

![06-workflows-2026-03-15-20-39-14](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-39-14.png)

Nous recommandons de choisir « Continuer séparément en cas de “oui” et “non” » pour faciliter l'extension ultérieure.

- Condition : **Trigger data → Statut** différent de **Terminé** (autrement dit, seuls les tickets non terminés passent ; les tickets déjà terminés ne sont pas retraités)

![06-workflows-2026-03-19-22-37-59](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-37-59.png)

### Étape 4 : ajouter un nœud Update record

Sur la branche « oui » du nœud condition, cliquez sur **+** et choisissez le nœud **Update record** :

![06-workflows-2026-03-15-20-46-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-46-22.png)

- **Collection** : choisissez « Tickets »
- **Filtre** : ID égal à Trigger data → ID (pour ne mettre à jour que ce ticket)
- **Champs à mettre à jour** :
  - Statut = **Terminé**
  - Date de complétion = **System variable / System time**

![06-workflows-2026-03-19-22-39-27](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-39-27.png)

> Un seul nœud accomplit ainsi à la fois « changer le statut » et « horodater » — pas besoin de configurer les valeurs de champ sur le bouton.

### Étape 5 : créer le bouton « Terminer »

Le workflow est prêt, mais le « Custom action event » doit être lié à un bouton concret. Créons un bouton dédié « Terminer » dans la colonne d'actions de la liste des tickets :

1. Passez en mode UI Editor, dans la colonne d'actions du tableau des tickets, cliquez sur **« + »** et choisissez l'action **« Trigger workflow »**

![06-workflows-2026-03-19-22-41-31](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-41-31.png)

2. Cliquez sur la configuration du bouton, renommez-le **« Terminer »** et choisissez une petite icône de complétion (par ex. une coche)

![06-workflows-2026-03-19-22-43-39](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-43-39.png)

3. Configurez une **linkage rule** : si le ticket a déjà le statut « Terminé », masquez ce bouton (il n'a plus de sens)
   - Condition : Current record → Statut égal à Terminé
   - Action : masquer

![06-workflows-2026-03-15-21-15-29](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-15-29.png)

4. Dans la configuration du bouton, ouvrez **« Bind workflow »** et choisissez le workflow « Enregistrer la date de complétion d'un ticket »

![06-workflows-2026-03-19-23-00-53](https://static-docs.nocobase.com/06-workflows-2026-03-19-23-00-53.png)

### Étape 6 : configurer l'event flow de rafraîchissement

Le bouton est créé, mais le tableau ne se rafraîchit pas automatiquement après le clic — l'utilisateur ne voit pas le changement. Configurons l'**event flow** du bouton pour rafraîchir le tableau à la fin du workflow.

1. Dans la configuration du bouton, cliquez sur la deuxième icône en forme d'éclair (⚡) pour ouvrir la configuration **Event flow**
2. Configurez l'événement :
   - **Trigger event** : choisissez **Click**
   - **Execution timing** : **After all flows**
3. Cliquez sur **« Append step »**, choisissez **« Refresh target block »**

![06-workflows-2026-03-20-16-46-59](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-46-59.png)

4. Trouvez le tableau des tickets de la page courante, ouvrez son menu de configuration et choisissez tout en bas **« Copy UID »** ; collez l'UID dans le champ « target block » de l'étape de rafraîchissement

![06-workflows-2026-03-20-16-48-39](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-48-39.png)

Ainsi, après le clic sur « Terminer », le workflow s'exécute, le tableau se rafraîchit, et l'utilisateur voit immédiatement le statut et la date de complétion mis à jour.

### Étape 7 : activer et tester

Retournez à la page Workflow management et activez le workflow « Enregistrer la date de complétion d'un ticket ».

Ouvrez ensuite un ticket au statut « En cours » et cliquez sur **« Terminer »** dans la colonne d'actions. Vous verrez :

- La « Date de complétion » du ticket est remplie automatiquement à l'heure courante
- Le tableau se rafraîchit, le bouton « Terminer » disparaît sur cette ligne (la linkage rule a fait son effet)

![06-workflows-2026-03-15-21-25-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-11.gif)

Pratique, non ? C'est l'autre usage classique du workflow — **mettre à jour automatiquement les données**. Et grâce à la combinaison « Custom action event + bouton lié », nous obtenons un mécanisme de déclenchement précis : seul le clic sur ce bouton spécifique déclenche le workflow.

## 6.4 Consulter l'historique d'exécution

Combien de fois le workflow s'est-il exécuté ? Y a-t-il eu des erreurs ? NocoBase mémorise tout.

Dans la liste de Workflow management, chaque workflow affiche un nombre **Executions** cliquable. Au clic, vous voyez le détail de chaque exécution :

- **Statut** : succès (vert) ou échec (rouge), d'un coup d'œil
- **Heure de déclenchement** : quand le workflow a été déclenché
- **Détail des nœuds** : entrée par nœud avec le résultat d'exécution

![06-workflows-2026-03-15-21-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-38.png)

En cas d'échec, vous pouvez identifier le nœud fautif et le message d'erreur précis. C'est l'outil de débogage le plus important pour les workflows.

![06-workflows-2026-03-15-21-36-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-36-16.png)

## Récapitulatif

Dans ce chapitre, nous avons créé deux workflows simples mais utiles :

- **Notifier d'un nouveau ticket** (déclencheur Collection event) : notification automatique à la création ou au changement d'assigné, plus besoin de signaler à la main
- **Enregistrer automatiquement la date de complétion** (déclencheur Custom action event) : un clic sur « Terminer » remplit la date, plus d'oubli humain

Les deux workflows illustrent deux modes de déclenchement différents et ont demandé moins de 10 minutes de configuration. Le système agit déjà tout seul. NocoBase prend en charge bien d'autres types de nœuds (HTTP, calcul, boucle, etc.), mais pour débuter, ces combinaisons couvrent la plupart des cas.

## Au prochain chapitre

Le système agit tout seul, mais il manque encore une « vue d'ensemble » — combien de tickets au total ? Quelle catégorie domine ? Combien en arrive chaque jour ? Au prochain chapitre, nous utiliserons des [blocks](/interface-builder/blocks) graphiques pour bâtir un **tableau de bord**, une vue d'ensemble en un coup d'œil.

## Ressources associées

- [Vue d'ensemble du workflow](/workflow) — concepts clés et cas d'usage
- [Trigger Collection event](/workflow/triggers/collection) — configuration de déclenchement sur changement de données
- [Nœud Update record](/workflow/nodes/update) — configuration de mise à jour automatique
