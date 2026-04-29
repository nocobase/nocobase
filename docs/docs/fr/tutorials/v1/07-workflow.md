# Chapitre 7 : Workflow

<iframe  width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113600643469156&bvid=BV1qqidYQER8&cid=27196394345&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Bravo d'avoir atteint ce dernier chapitre ! Nous allons présenter et explorer ici la puissante fonctionnalité de **workflow** de **NocoBase**. Grâce à elle, vous pouvez automatiser des opérations dans le système, gagner du temps et accroître l'efficacité.

### Solution du défi précédent

Avant de commencer, revenons sur le défi de la section précédente ! Nous avons configuré avec succès les **permissions de commentaires** pour le rôle « Partenaire », comme suit :

1. **Permission d'ajouter** : autorise l'utilisateur à publier des commentaires.
2. **Permission de voir** : autorise l'utilisateur à voir tous les commentaires.
3. **Permission d'éditer** : l'utilisateur ne peut éditer que ses propres commentaires.
4. **Permission de supprimer** : l'utilisateur ne peut supprimer que ses propres commentaires.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172247599.gif)

Avec cette configuration, Tom peut publier librement des commentaires, consulter ceux des autres membres tout en garantissant qu'il ne peut éditer ou supprimer que ses propres messages.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248463.gif)

---

Place à présent à une fonctionnalité d'automatisation : **chaque fois que le responsable d'une tâche change, le système publie automatiquement une notification au nouveau responsable pour l'avertir de la prise en main**.

> **Workflow :** le plugin de workflow est un outil d'automatisation puissant, courant dans le domaine du Business Process Management (BPM).
>
> Il sert à concevoir et orchestrer des processus métier basés sur le modèle de données. À travers la configuration de conditions de déclenchement et de nœuds de processus, il permet l'automatisation des flux. Ce type de plugin est particulièrement adapté aux tâches répétitives et pilotées par les données.

### 7.1 Création d'un workflow

#### 7.1.1 Créer un workflow depuis la page d'administration

D'abord, basculez sur le rôle **Root**, l'administrateur système qui possède toutes les permissions. Ensuite, ouvrez le [**module Workflow**](https://docs-cn.nocobase.com/handbook/workflow).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248323.png)

Cliquez sur le bouton **« Ajouter »** en haut à droite, créez un nouveau workflow, renseignez les informations de base :

- **Nom** : Notification système lors d'un changement de responsable.
- **Mode de déclenchement** : choisissez « Événement de table ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248425.png)

#### 7.1.2 Présentation des modes de déclenchement :

1. [**Événement de table**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection) : déclenché lorsque les données d'une table changent (ajout, modification, suppression). Ce mode est idéal pour suivre les modifications de champs sur une tâche, comme un changement de responsable.
2. [**Tâche planifiée**](https://docs-cn.nocobase.com/handbook/workflow/triggers/schedule) : déclenchée automatiquement à un moment précis. Plus adaptée aux opérations liées au calendrier.
3. [**Événement post-action**](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action) : lié à un bouton d'action ; déclenché après que l'utilisateur a effectué une action. Par exemple, déclencher une tâche après un clic sur Enregistrer.

À l'usage, vous découvrirez d'autres modes : « Événement pré-action », « Action personnalisée », « Approbation »… tous activables via les plugins correspondants.

Dans ce scénario, nous utilisons l'[**événement de table**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection) pour suivre les changements du « Responsable » dans la « Table Tâches ». Après soumission du workflow, cliquez sur **Configurer** pour entrer dans la page de configuration.

![demov3N-37.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248988.gif)

---

### 7.2 Configuration des nœuds du workflow

#### 7.2.1 Configurer la condition de déclenchement

Sans plus attendre, construisons le flux de notification automatique !

Configurons d'abord le premier nœud : les conditions qui activeront automatiquement le workflow.

- **Table de données** : choisissez « Table Tâches ». (Quelle table déclenche ce workflow ? Les données associées seront aussi disponibles dans le workflow. Naturellement, c'est lorsque la « Table Tâches » change que le workflow doit s'enclencher.)
- **Moment du déclenchement** : choisissez « Après ajout ou mise à jour de données ».
- **Champ déclencheur** : choisissez « Responsable ».
- **Condition de déclenchement** : choisissez « Responsable / ID existe », pour que la notification ne soit envoyée que si la tâche a un responsable.
- **Données préchargées** : choisissez « Responsable », pour utiliser ses informations dans la suite du processus.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172249330.gif)

---

#### 7.2.2 Activer le canal « Message in-app »

Étape suivante : créer un nœud d'envoi de notification.

Avant cela, créons un [canal « Message in-app »](https://docs-cn.nocobase.com/handbook/notification-in-app-message) pour l'envoi des notifications.

- Retournez à la page de gestion des plugins, choisissez « Notification », créez la notification de tâche (task_message).
- Le canal créé, nous retournons dans le workflow et créons un nœud « Notification ».
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250497.gif)
- Configuration du nœud :
  **Canal :** choisissez « Notification de tâche ».
  **Destinataire :** choisissez « Variable du déclencheur / Données déclenchantes / Responsable / ID » : on cible ainsi le nouveau responsable.
  **Titre du message :** « Rappel de changement de responsable ».
  **Contenu du message :** « Vous avez été désigné(e) comme nouveau responsable ».

Une fois terminé, cliquez sur l'interrupteur en haut à droite pour activer le workflow.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250472.gif)

C'est configuré !

#### 7.2.3 Tester la notification

Place au moment palpitant ! Retournez sur la page, cliquez pour éditer une tâche, changez son responsable et soumettez : le système envoie déjà la notification !

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250461.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250998.gif)

---

Voilà comment se configure un workflow. Mais il nous reste un peu de travail :

La notification générée doit insérer dynamiquement les informations de la tâche, sans quoi personne ne saura quel travail vient de lui être transmis.

### 7.3 Améliorer le workflow

#### 7.3.1 Gestion des versions

Retournez à la configuration du workflow : vous remarquerez que l'interface est désormais grisée et non éditable.

Pas d'inquiétude. Cliquez sur les trois points en haut à droite > [**Copier vers une nouvelle version**](https://docs-cn.nocobase.com/handbook/workflow/advanced/revisions) : vous arrivez sur la nouvelle page de configuration. Bien entendu, l'ancienne version est conservée. Cliquez sur le bouton **Versions** pour basculer à tout moment vers une version historique (Attention : les versions de workflow déjà exécutées ne peuvent plus être modifiées !).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251594.gif)

#### 7.3.2 Optimiser le contenu de la notification

Personnalisons à présent le contenu de la notification en y ajoutant les détails du transfert.

- **Éditer le nœud de notification.**

Modifiez le contenu du message en : « La tâche « [Nom de la tâche] » a un nouveau responsable : [Pseudonyme du responsable] ».

- Cliquez sur les variables à droite pour insérer le nom de la tâche et le responsable.
- Puis cliquez en haut à droite pour activer cette nouvelle version.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251780.gif)

Une fois la nouvelle version activée, retestons : la notification système affiche désormais le nom de la tâche.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251734.gif)

---

### Récapitulatif

Bravo ! Vous avez créé avec succès un workflow automatisé basé sur le changement de responsable d'une tâche. Cette fonctionnalité fait gagner du temps et améliore l'efficacité de la collaboration en équipe. À ce stade, notre système de gestion de tâches dispose déjà de capacités puissantes.

---

### Conclusion et perspectives

Vous voilà au bout : depuis zéro, vous avez réalisé un système de gestion de tâches complet, qui couvre la création de tâches, les commentaires, la configuration des rôles et permissions, ainsi que les workflows et les notifications système.

La flexibilité et l'extensibilité de NocoBase vous offriront des possibilités infinies. À l'avenir, vous pourrez explorer d'autres plugins, personnaliser des fonctionnalités, ou bâtir des logiques métier plus complexes. À travers cet apprentissage, vous maîtrisez les bases et les concepts clés de NocoBase.

Hâte de découvrir votre prochaine création ! Pour toute question, n'hésitez pas à consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou à rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.

Continuez à explorer, créez sans limite !
