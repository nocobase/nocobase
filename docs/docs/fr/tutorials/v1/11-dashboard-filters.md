# Chapitre 10 : Filtres et conditions du tableau de bord

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Dans ce chapitre, nous allons réaliser pas à pas la suite du tableau de bord des tâches. En cas de question, n'hésitez pas à venir échanger sur le forum.

Commençons par une révision du chapitre précédent et entamons ensemble cette étape !

### 10.1 Solution du chapitre précédent

#### 10.1.1 Statuts et liens

Nous voulons d'abord ajouter des liens de redirection pour chaque statut, afin de naviguer rapidement. Voici la structure de lien pour chaque statut :

(En supposant que le lien est `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x`.)

##### Réponse au défi


| Statut<br/>                       | Lien<br/>                                            |
| --------------------------------- | ---------------------------------------------------- |
| Non démarrée<br/>                 | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>  |
| En cours<br/>                     | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>  |
| En attente de validation<br/>     | hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br> |
| Terminée<br/>                     | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>    |
| Annulée<br/>                      | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>    |
| Archivée<br/>                     | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>     |

#### 10.1.2 Ajouter un filtre multi-sélection « Responsable »

1. **Créer un [champ personnalisé](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)** : créons un champ « Responsable », type multi-sélection, et renseignons les pseudonymes (ou noms d'utilisateur) des membres pour faciliter l'attribution rapide.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **Dans la configuration du rapport** : définissez « Responsable / Pseudonyme contient Filtre courant / Responsable » comme condition de filtre. Vous pourrez ainsi retrouver rapidement les tâches du responsable courant.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

Lancez quelques filtrages de test pour confirmer le bon fonctionnement.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 Lier le tableau de bord à l'utilisateur

Vous pouvez afficher différents contenus selon l'utilisateur. Voici comment :

1. **Définir la valeur par défaut du champ « Responsable » sur « Utilisateur courant / Pseudonyme »** : le système affichera automatiquement les tâches liées à l'utilisateur courant, gain d'efficacité garanti.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **Après rafraîchissement** : le tableau de bord charge automatiquement les données associées à l'utilisateur connecté. (N'oubliez pas d'ajouter la condition de filtre utilisateur sur les graphiques concernés.)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 Refondre le filtrage des tâches

Vous avez peut-être remarqué une incohérence :

Lorsque l'on saute directement via la « plage de données » du bloc Tableau, les tâches sont déjà restreintes au statut correspondant. Si l'on filtre alors un autre statut, les données apparaissent vides !

Comment faire ? Supprimons le filtre de plage de données et adoptons une autre approche.

1. **Supprimer le filtre par plage de données** : cela évite de figer les données sur la plage de statuts en cours et permet de les filtrer librement.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **Configurer la valeur par défaut du bloc de filtrage formulaire.**

Vous vous souvenez du [bloc de filtrage](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) ?

Créez un nouveau formulaire de filtrage pour la table Tâches, configurez **Statut** et les autres champs souhaités. Ils serviront à recevoir les variables passées via l'URL. (N'oubliez pas de connecter le bloc Tableau cible à filtrer.)

- Définissez la valeur par défaut du champ Statut sur `Paramètre de recherche URL / task_status`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **Tester la nouvelle fonctionnalité de filtrage** : vous pouvez à tout moment changer le statut filtré, en toute liberté.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **Optionnel** : pour que chaque utilisateur se concentre sur ses propres tâches, définissez la valeur par défaut du champ « Responsable » sur « Utilisateur courant ».

---

### 10.4 Actualités, notifications et informations clés

Adaptons à présent la bibliothèque documentaire ! Affichons sur le tableau de bord les informations qui nous intéressent.

Avec une gestion documentaire à long terme, on accumule de plus en plus de documents. Plusieurs besoins apparaissent peu à peu :

- News : se concentrer sur l'actualité, les succès et les jalons du projet
- Annonces / rappels temporaires

#### 10.4.1 Informations à la une (News)

1. **Ajouter le champ « Informations à la une »** : ajoutez à la table Documents un champ à cocher « Informations à la une », pour signaler qu'un document constitue une actualité importante.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **Compléter et sélectionner l'information du document** : choisissez librement un article, ajoutez-y le champ « Informations à la une » dans le formulaire d'édition et cochez-le.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **Créer un bloc « Liste »** : sur le tableau de bord, créez un nouveau [bloc « Liste »](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) > sélectionnez la table Documents.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

Glissez-le à droite, affichez « Date de création » et « Titre », ajustez la largeur des champs et désactivez « Afficher le titre ».

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **Afficher les informations à la une** :

Pour souligner la fraîcheur, affichons aussi l'heure.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

Triez par date de création décroissante pour mettre en avant les actualités les plus récentes.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

Voilà un système d'actualités simple ! Les membres peuvent suivre à tout moment les avancées importantes du projet.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 Annonces / notifications

Voici une fonctionnalité d'annonce publique simple, que vous avez sans doute déjà rencontrée à maintes reprises dans notre démo en ligne. Pour ces annonces temporaires, nous ne souhaitons pas les afficher en permanence ni enregistrer l'avancement du projet : il s'agit simplement de rappeler ou notifier des événements ponctuels.

1. **Créer un [bloc Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)** : choisissez une zone du tableau de bord et ajoutez le contenu de l'annonce en Markdown.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

Pour l'utilisation pratique de Markdown, vous pouvez consulter notre démo officielle, la documentation officielle ou le [tutoriel « Documentation légère »](https://www.nocobase.com/cn/tutorials).

À titre d'exemple simple, illustrons la puissance du [bloc Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) avec « une annonce élégante » écrite en HTML.

- Code d'exemple :

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Annonce importante</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Chers collègues :</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Afin d'améliorer l'efficacité, une formation pour tous se tiendra le <span style="color: red; font-weight: bold; font-size: 1.5em;">10 novembre</span>.</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Merci pour votre coopération !</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cordialement,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">L'équipe de direction</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 Récapitulatif

Grâce aux étapes précédentes, nous avons réussi à créer un tableau de bord personnalisé qui permet aux membres de l'équipe de gérer leurs tâches plus efficacement, de suivre l'avancement du projet et de recevoir rapidement les annonces et notifications.

Du filtrage par statut aux paramètres de responsable, en passant par l'affichage des actualités à la une : tout vise à optimiser l'expérience utilisateur et à rendre le système plus pratique et flexible.

Notre tableau de bord personnalisé est désormais prêt. À vous de l'expérimenter et de l'adapter à vos besoins réels ! Direction le [chapitre suivant](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation) !

---

Continuez à explorer et laissez libre cours à votre créativité ! En cas de problème, n'oubliez pas que vous pouvez consulter la [documentation officielle de NocoBase](https://docs-cn.nocobase.com/) ou rejoindre la [communauté NocoBase](https://forum.nocobase.com/) pour en discuter.
