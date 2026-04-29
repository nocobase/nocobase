# Chapitre 7 : Tableau de bord — une vue d'ensemble

Au chapitre précédent, nous avons utilisé des workflows pour notifier et horodater automatiquement. Le système est de plus en plus intelligent, mais il lui manque encore une chose — **une vue d'ensemble**.

Combien y a-t-il de tickets ? Combien sont traités ? Quelles catégories dominent ? Combien arrivent chaque jour ? Impossible de répondre en parcourant la liste. Dans ce chapitre, nous utilisons les [blocs graphiques](/data-visualization) (camembert, courbe, histogramme) et le [bloc Markdown](/interface-builder/blocks/other-blocks/markdown) pour bâtir un **tableau de bord** qui transforme les données en images compréhensibles d'un coup d'œil.

## 7.1 Ajouter une page tableau de bord

Commençons par ajouter un nouvel item de menu dans la barre de navigation.

Passez en [mode configuration](/get-started/how-nocobase-works), dans la barre supérieure cliquez sur **« Add menu item »** (icône `+`), choisissez **« Modern page (v2) »** et nommez-la « Tableau de bord ».

![07-dashboard-2026-03-15-21-39-35](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-39-35.png)

Cette page accueillera nos graphiques — c'est notre tableau de bord principal.

## 7.2 Camembert : répartition des statuts de tickets

Premier graphique : un camembert pour afficher la répartition « En attente, En cours, Terminé ».

Sur la page du tableau de bord, cliquez sur **Add [block](/interface-builder/blocks) → [Chart](/data-visualization)**.

Une fois ajouté, cliquez sur le bouton **Configure** en haut à droite du bloc ; un panneau de configuration s'ouvre à droite.

### Configurer la requête de données

- **[Collection](/data-sources/data-modeling/collection)** : choisissez « Tickets »
- **Measures** : choisissez n'importe quel [champ](/data-sources/data-modeling/collection-fields) non répété (par ex. ID), agrégation **Count**
- **Dimensions** : choisissez le champ « Statut »

![07-dashboard-2026-03-15-21-44-32](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-44-32.png)

Cliquez sur **Run query** pour prévisualiser les données ci-dessous.

### Configurer les options du graphique

- **Type de graphique** : choisissez **Pie**
- **Mappage** : Category = « Statut », Value = la valeur de count
- **Labels** : activez

À gauche, un joli camembert apparaît. Chaque part représente un statut, avec sa quantité et son pourcentage.

![07-dashboard-2026-03-15-21-45-40](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-45-40.png)

Cliquez sur **Save** ; premier graphique terminé.

## 7.3 Courbe : tendance des nouveaux tickets par jour

Le camembert montre « la répartition actuelle » ; la courbe montre « la tendance dans le temps ».

Ajoutez un nouveau bloc Chart :

### Requête

- **Collection** : « Tickets »
- **Measures** : ID, Count
- **Dimensions** : choisissez « Date de création », format **YYYY-MM-DD** (groupement par jour)

> **Astuce** : le format d'une dimension date est important. `YYYY-MM-DD` regroupe par jour, `YYYY-MM` regroupe par mois. Choisissez la granularité selon le volume de données.

### Options

- **Type** : **Line**
- **Mappage** : xField = « Date de création », yField = la valeur de count

![07-dashboard-2026-03-15-21-48-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-48-33.png)

Une fois enregistré, vous voyez la courbe de l'évolution du volume de tickets dans le temps. Un pic soudain signale un incident à investiguer.

## 7.4 Histogramme : nombre de tickets par catégorie

Troisième graphique : voir quelle catégorie compte le plus de tickets. On utilise un **histogramme horizontal** plutôt que vertical — quand il y a beaucoup de catégories, les libellés de l'axe X se chevauchent ; le format horizontal est plus lisible.

Ajoutez un troisième bloc Chart :

### Requête

- **Collection** : « Tickets »
- **Measures** : ID Count
- **Dimensions** : choisissez le champ relationnel « Catégorie » (sélectionnez le nom de la catégorie)

### Options

- **Type** : **Bar**
- **Mappage** : xField = la valeur de count (ID Count), yField = « Nom de la catégorie »

![07-dashboard-2026-03-15-22-05-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-05-11.png)

Une fois enregistré, la catégorie dominante saute aux yeux. Si « Problème réseau » dépasse largement les autres, c'est peut-être qu'il faut moderniser le réseau.

## 7.5 Bloc de tableau : tickets non terminés

Les graphiques donnent une vue agrégée, mais l'administrateur veut souvent voir le détail. Ajoutons un tableau **Tickets non terminés** qui liste tous les tickets encore ouverts.

Ajoutez un **bloc de tableau** sur la page, choisissez la table « Tickets ».

### Configurer le filtre

Dans la configuration du bloc en haut à droite, trouvez **Set data scope** et ajoutez une condition de [filtre](/interface-builder/blocks/filter-blocks/form) :

- **Statut** différent de **Terminé**

Le tableau n'affiche que les tickets en cours ; dès qu'un ticket est terminé, il disparaît automatiquement.

### Configurer les champs

Choisissez les colonnes à afficher : Titre, Statut, Priorité, Assigné, Date de création.

![07-dashboard-2026-03-15-22-20-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-20-11.png)

> **Astuce** : ajoutez un **tri par défaut** (date de création décroissante) pour avoir les nouveaux tickets en premier.

## 7.6 Bloc Markdown : annonces système

Au-delà des graphiques, on peut afficher du texte sur le tableau de bord.

Ajoutez un **[bloc Markdown](/interface-builder/blocks/other-blocks/markdown)** avec une annonce système ou un mode d'emploi :

```markdown
## Système de tickets IT

Bienvenue ! En cas de problème, soumettez un ticket ; l'équipe technique le traitera rapidement.

Pour les **urgences**, appelez la hotline IT : 8888
```

![07-dashboard-2026-03-15-21-53-54](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-53-54.png)

Placé en haut du tableau de bord, le bloc Markdown sert à la fois de message de bienvenue et de panneau d'affichage. Le contenu peut être modifié à tout moment, c'est très flexible.

![07-dashboard-2026-03-15-22-30-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-30-57.png)

## 7.7 Bloc JS : bannière d'accueil personnalisée

Le format Markdown est assez figé ; pour des effets plus riches, NocoBase fournit le **bloc JS (JavaScript Block)**, qui permet de personnaliser librement le contenu en code.

Utilisons-le pour faire une bannière d'accueil au style business — qui affiche un message personnalisé selon l'utilisateur connecté et l'heure du jour.

Ajoutez un **bloc JS** sur la page (Add block → Other blocks → JS Block).

![07-dashboard-2026-03-15-22-33-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-33-24.png)

Le bloc JS récupère le nom d'utilisateur courant via `ctx.getVar("ctx.user.username")`. Voici une bannière au style business simple :

```js
const uname = await ctx.getVar("ctx.user.username")
const name = uname || 'utilisateur';
const hour = new Date().getHours();
const hi = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const week = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][d.getDay()];

ctx.render(`
<div style="padding: 24px 32px; background: #f7f8fa; border-radius: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div style="font-size: 22px; font-weight: 600; color: #1d2129;">${hi}, ${name}</div>
      <div style="font-size: 14px; color: #86909c; margin-top: 4px;">Bienvenue sur le système de tickets IT</div>
    </div>
    <div style="font-size: 14px; color: #86909c;">${date}　${week}</div>
  </div>
</div>`);
```

![07-dashboard-2026-03-15-22-51-27](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-51-27.png)

Le rendu : une carte au fond gris clair, salutation à gauche, date à droite. Sobre, utile, sans en faire trop.

> **Astuce** : `ctx.getVar("ctx.user.xxx")` est la manière de récupérer les informations de l'utilisateur courant dans un bloc JS ; les champs courants sont `nickname`, `username`, `email`, etc. Le bloc JS peut aussi appeler des API pour requêter des données — vous pouvez l'utiliser pour des contenus très personnalisés.

## 7.8 Action panel : raccourcis + réutilisation de pop-up

Le tableau de bord n'est pas qu'un endroit où l'on consulte les données ; il devrait aussi être un point de départ pour agir. Ajoutons un **Action panel** qui permet de soumettre un ticket ou de basculer vers la liste, directement depuis l'accueil.

Ajoutez un bloc **Action panel** sur la page (Add block → Other blocks → Action panel) puis ajoutez deux [actions](/interface-builder/actions) :

![07-dashboard-2026-03-15-22-54-06](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-54-06.png)

1. **Lien : aller à la liste des tickets** — ajoutez une action « Link » avec une URL pointant vers la page de la liste des tickets (par ex. `/admin/camcwbox2uc`)

![07-dashboard-2026-03-15-22-57-49](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-57-49.png)

2. **Bouton : ajouter un ticket** — ajoutez une action « Pop-up », titre « Ajouter un ticket »

![07-dashboard-2026-03-15-23-00-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-00-36.png)

Mais quand on clique sur « Ajouter un ticket », la pop-up est vide ; il faut configurer son contenu. Reconstruire un formulaire à la main serait fastidieux — c'est l'occasion d'introduire une fonctionnalité très utile : la **réutilisation de pop-up**.

### Sauvegarder une pop-up comme template

> Attention : ce template de pop-up n'a rien à voir avec le « template de block » du chapitre 4. Le template de block enregistre les champs et la disposition d'un seul bloc de formulaire ; le template de pop-up enregistre **toute la pop-up** — tous les blocs, champs et boutons d'action qu'elle contient.

1. Allez sur la **page Liste des tickets**, trouvez le bouton « Add new »
2. Cliquez sur sa configuration, trouvez **« Save as template »**, enregistrez la pop-up courante
3. Donnez un nom au template (par ex. « Pop-up — création de ticket »)

![07-dashboard-2026-03-15-23-05-17](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-05-17.png)

### Réutiliser la pop-up sur l'accueil

1. Retournez sur la page Tableau de bord, cliquez sur la configuration du bouton « Ajouter un ticket » dans l'action panel
2. Trouvez **« Pop-up settings »** et choisissez le template « Pop-up — création de ticket »
3. Une fois enregistré, le clic sur le bouton ouvre la même pop-up que sur la liste des tickets

![07-dashboard-2026-03-15-23-06-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-06-33.png)

![07-dashboard-2026-03-15-23-07-20](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-07-20.gif)

### Cliquer sur le titre pour ouvrir le détail

De la même façon, on peut rendre cliquables les titres dans le tableau Tickets non terminés pour ouvrir directement le détail :

1. Retournez sur la page **Liste des tickets**, trouvez le bouton « View » et **« Save as template »** (par ex. « Pop-up — détail de ticket »)

![07-dashboard-2026-03-15-23-08-02](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-08-02.png)

2. Sur le Tableau de bord, dans le tableau des tickets non terminés, cliquez sur la configuration du champ « Titre »
3. Activez le commutateur **« Enable click to open »** — l'option « Pop-up settings » apparaît
4. Dans Pop-up settings, choisissez le template « Pop-up — détail de ticket »

![07-dashboard-2026-03-15-23-11-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-11-24.png)

Désormais, l'utilisateur clique sur le titre d'un ticket dans le tableau de bord pour voir directement les détails, sans passer par la page Liste des tickets. L'ensemble est plus compact et plus efficace.

![07-dashboard-2026-03-15-23-12-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-12-36.png)

> **Avantages de la réutilisation de pop-up** : le même template peut être utilisé sur plusieurs pages ; modifier le template met à jour toutes les références. C'est la même logique que le mode « Reference » du chapitre 4 — on maintient une seule fois, l'effet se propage partout.

## 7.9 Ajuster la mise en page

La page contient maintenant 6 blocs (bannière JS + action panel + 3 graphiques + tableau de tickets) ; ajustons la mise en page pour la rendre plus jolie.

En mode configuration, vous pouvez **glisser-déposer** pour ajuster la position et la taille de chaque bloc :

Suggestion de mise en page :

- **Première ligne** : bannière JS (gauche) + action panel (droite)
- **Deuxième ligne** : camembert (gauche) + tableau des tickets (droite)
- **Troisième ligne** : courbe (gauche) + histogramme (droite)

![07-dashboard-2026-03-15-23-14-19](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-14-19.png)

Vous remarquerez peut-être que les hauteurs des blocs ne sont pas alignées ; vous pouvez les régler manuellement via Block settings > Block height. Par exemple, j'ai fixé les deux blocs de la deuxième ligne à 500 px.

Le glissement des bords permet d'ajuster la largeur, pour que deux graphiques occupent chacun la moitié. À force d'expérimenter, vous trouverez la disposition qui vous convient.

![07-dashboard-2026-03-15-23-18-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-18-57.png)

## Récapitulatif

Dans ce chapitre, nous avons construit un tableau de bord riche et utile avec 6 blocs :

- **Bannière JS** : message d'accueil personnalisé selon l'utilisateur et l'heure
- **Action panel** : accès rapide à la liste des tickets et création en un clic (réutilisation de pop-up)
- **Camembert** : répartition des statuts en un coup d'œil
- **Courbe** : suivi des tendances dans le temps
- **Histogramme** : comparaison horizontale entre catégories, sans soucis de chevauchement de libellés
- **Tableau des tickets non terminés** : vue d'ensemble, clic sur le titre pour le détail (réutilisation de pop-up)

Nous avons aussi appris la **réutilisation de pop-up**, technique importante — sauver la pop-up d'une page comme template pour la réutiliser ailleurs et éviter la duplication.

La data visualization est un plugin intégré à NocoBase, sans installation supplémentaire. La configuration est aussi simple que la construction de pages — choisir les données, le type de graphique, mapper les champs : trois étapes.

## Et la suite ?

À ce stade, le système de tickets est très complet : modélisation, pages, formulaires, permissions, automatisations, tableau de bord. La suite prévue est un **tutoriel basé sur AI Agent** — laisser un agent IA construire automatiquement le système en local. Restez à l'écoute.

## Ressources associées

- [Data visualization](/data-visualization) — configuration détaillée des graphiques
- [Bloc Markdown](/interface-builder/blocks/other-blocks/markdown) — usage du bloc Markdown
- [Mise en page des blocks](/interface-builder/blocks) — disposition de page et configuration des blocks
