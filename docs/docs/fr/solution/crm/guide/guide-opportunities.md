---
title: "Opportunity et devis"
description: "Guide d'utilisation de la gestion des Opportunity du CRM : vue Kanban, progression d'étape, création de devis, prise en charge multi-devises, processus d'approbation."
keywords: "Gestion des Opportunity, entonnoir de vente, Kanban, approbation de devis, multi-devises, NocoBase CRM"
---

# Opportunity et devis

> L'Opportunity est le cœur de l'ensemble du processus de vente — elle représente une affaire potentielle à signer. Dans ce chapitre, vous apprendrez à utiliser le Kanban pour faire progresser les étapes de l'Opportunity, à créer des devis, à mener à bien le processus d'approbation, puis à transformer le devis en commande officielle.

![cn_02-opportunities](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_02-opportunities.png)

## Aperçu de la page Opportunity

Depuis le menu de gauche, accédez à **Ventes → Opportunities**. Vous verrez deux onglets en haut de la page :

- **Pipeline Kanban** : présente toutes les Opportunity sous forme de Kanban par étape, idéal pour le suivi quotidien et la progression rapide.
- **Vue tableau** : présente les Opportunity sous forme de liste, idéale pour le filtrage en lot et l'export de données.

Par défaut, le Pipeline Kanban est ouvert — c'est aussi la vue la plus utilisée par les commerciaux.

![02-opportunities-2026-04-07-00-56-47](https://static-docs.nocobase.com/02-opportunities-2026-04-07-00-56-47.png)

## Pipeline Kanban

### Barre de filtrage

En haut du Kanban se trouve une rangée de boutons de filtrage qui vous aident à vous concentrer rapidement sur différentes plages d'Opportunity :

| Bouton | Effet |
|------|------|
| **All Pipeline** | Affiche toutes les Opportunity en cours |
| **My Deals** | Affiche uniquement les Opportunity qui vous sont attribuées |
| **Big Deals** | Grosses affaires d'un montant ≥ 50 000 $ |
| **Closing Soon** | Opportunity prévues pour clôture dans les 30 jours |

La barre de filtrage contient également **2 cartes statistiques** — Open Deals (nombre d'Opportunity en cours) et Pipeline Value (valeur totale du pipeline) — ainsi qu'une **zone de recherche en temps réel** : saisissez le nom de l'Opportunity, du client ou du responsable pour la localiser rapidement.

:::tip
Ces boutons de filtrage utilisent les capacités d'interaction inter-blocs de NocoBase (`initResource` + `addFilterGroup`) pour filtrer les données du Kanban en temps réel, sans rafraîchissement de page.
:::

![02-opportunities-2026-04-07-01-00-37](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-00-37.gif)

### Colonnes du Kanban

Le Kanban est divisé en **6 colonnes**, correspondant aux 6 étapes d'une Opportunity :

```
Prospecting → Analysis → Proposal → Negotiation → Won → Lost
  Premier contact   Analyse des besoins   Proposition   Négociation commerciale   Gagné   Perdu
```

L'en-tête de chaque colonne affiche : nom de l'étape, nombre d'Opportunity à cette étape, montant total, ainsi qu'un bouton « + » d'ajout rapide.

Chaque carte affiche les informations suivantes :

- **Nom de l'Opportunity** : par exemple « Projet ERP de XYZ Tech »
- **Nom du client** : le Customer associé
- **Montant prévisionnel** : par exemple 50 000 $
- **Probabilité de gain** : affichée sous forme d'étiquette colorée (vert = forte probabilité, jaune = moyen, rouge = faible probabilité)
- **Avatar du responsable** : qui suit cette Opportunity

### Faire progresser l'étape par glisser-déposer

L'opération la plus intuitive : **glissez directement la carte d'une colonne vers une autre**, et le système met à jour automatiquement l'étape de l'Opportunity.

Par exemple, lorsque vous avez terminé l'analyse des besoins et que vous êtes prêt à soumettre une proposition, glissez la carte de Analysis vers Proposal.

![02-opportunities-2026-04-07-01-02-09](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-02-09.gif)

## Vue tableau

En basculant vers l'onglet de vue tableau, vous verrez un tableau de données standard.

### Boutons de filtrage

Au-dessus du tableau se trouve également un ensemble de boutons de filtrage, comprenant :

- **All** : toutes les Opportunity
- **In Pipeline** : Opportunity en cours (excluant celles signées et perdues)
- **Closing Soon** : à échéance prochaine
- **Won** : déjà signées
- **Lost** : déjà perdues

Chaque bouton est accompagné d'un **compteur**, vous permettant de voir d'un coup d'œil la répartition des Opportunity par statut.

En bas du tableau se trouve une **ligne de récapitulatif** : affichant le total des montants des Opportunity sélectionnées / totales, ainsi que les étiquettes de répartition par étape, pour une vue d'ensemble rapide.

### Voir les détails

En cliquant sur n'importe quelle ligne du tableau, vous ouvrez la popup des détails de l'Opportunity — c'est l'interface principale pour gérer une Opportunity individuelle.

![02-opportunities-2026-04-07-01-05-05](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-05.png)

## Détails de l'Opportunity

La popup des détails d'Opportunity est l'interface la plus dense en informations, contenant de haut en bas les modules suivants :

![02-opportunities-2026-04-07-01-05-42](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-42.png)


### Barre de progression d'étape

En haut des détails se trouve une **barre d'étape interactive** (composant Steps) qui affiche clairement l'étape actuelle de l'Opportunity.

Vous pouvez **cliquer directement sur une étape de la barre** pour faire progresser l'Opportunity. Lorsque vous cliquez sur **Won** ou **Lost**, le système ouvre une boîte de dialogue de confirmation, car ce sont des opérations à état terminal qui, une fois confirmées, ne peuvent pas être annulées librement.

![02-opportunities-2026-04-07-01-06-54](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-06-54.gif)

### Indicateurs clés

Sous la barre d'étape sont affichés quatre indicateurs principaux :

| Indicateur | Description |
|------|------|
| **Montant prévisionnel** | Montant estimé de cette Opportunity |
| **Date de clôture prévue** | À quelle date la clôture est planifiée |
| **Jours dans l'étape actuelle** | Depuis combien de temps l'Opportunity est restée à l'étape actuelle (utile pour identifier les Opportunity stagnantes) |
| **Probabilité de gain IA** | Probabilité de signature calculée par le système à partir de données multidimensionnelles |

### Analyse des risques par IA

C'est l'une des fonctionnalités phares du CRM. Le système analyse automatiquement la santé de l'Opportunity et affiche :

- **Anneau de probabilité de gain** : graphique en anneau intuitif présentant la probabilité de signature
- **Liste des facteurs de risque** : par exemple « plus de 14 jours depuis le dernier contact client », « le concurrent propose un prix plus bas », etc.
- **Action recommandée** : suggestion donnée par l'IA pour la prochaine étape, par exemple « organiser une démonstration produit »


### Liste des devis
![02-opportunities-2026-04-07-01-16-19](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-16-19.png)
La partie centrale des détails affiche **tous les devis associés à cette Opportunity**, sous forme de tableau imbriqué. Chaque ligne affiche le numéro de devis, le montant, le statut, etc., et le statut d'approbation est présenté sous forme d'étiquette visuelle (brouillon, en cours d'approbation, approuvé, rejeté).

### Commentaires et pièces jointes

À droite des détails se trouvent les zones de commentaires et de pièces jointes, où les membres de l'équipe peuvent échanger sur l'avancement et téléverser les fichiers associés.
![02-opportunities-2026-04-07-01-17-01](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-17-01.png)

## Créer un devis

Prêt à proposer un devis au client ? Voici la procédure :

**Étape 1** : ouvrez les détails de l'Opportunity et trouvez la zone de liste des devis.

**Étape 2** : cliquez sur le bouton **Add new** (Ajouter), le système ouvre le formulaire de devis.

**Étape 3** : renseignez les informations de base du devis, dont le nom du devis, la date de validité, etc.

**Étape 4** : dans le **tableau imbriqué de détail produit**, ajoutez les lignes du devis :

| Champ | Description |
|------|------|
| **Produit** | Sélectionner depuis le catalogue de produits |
| **Spécification** | En lecture seule, rempli automatiquement après sélection du produit |
| **Unité** | En lecture seule, remplie automatiquement |
| **Quantité** | Quantité du devis |
| **Prix de référence** | En lecture seule, prix de référence du catalogue de produits |
| **Prix unitaire** | En lecture seule, correspond automatiquement au tarif par paliers selon la quantité |
| **Taux de remise** | En lecture seule, remise selon la tarification par paliers |
| **Montant de la ligne** | Calculé automatiquement |

Le système exécute automatiquement la chaîne de calcul des montants : sous-total → remise → taxes → frais de port → montant total → équivalent en USD. Le formulaire contient un bloc JS d'aide qui présente les règles de remplissage automatique et les formules de calcul.

**Étape 5** : si le client effectue ses transactions dans une devise autre que le dollar US, sélectionnez la devise correspondante. Le système **verrouille le taux de change** au moment de la création et convertit automatiquement en équivalent USD, garantissant que les rapprochements ultérieurs ne soient pas affectés par les fluctuations des taux de change.

**Étape 6** : après avoir vérifié l'exactitude des informations, cliquez sur Soumettre pour enregistrer le devis. À ce stade, le statut du devis est **Draft (brouillon)**.

![02-opportunities-2026-04-07-01-09-11](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-11.gif)

## Processus d'approbation des devis

Une fois créé, le devis n'entre pas immédiatement en vigueur — il doit passer par un processus d'approbation pour s'assurer que la tarification est cohérente et que la remise reste dans la fourchette autorisée.

### Vue d'ensemble du processus d'approbation

```
Draft (brouillon) → Pending Approval (en attente d'approbation) → Manager Review (revue par le manager) → Approved / Rejected / Returned
```

![02-opportunities-2026-04-07-01-09-38](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-38.png)

### Soumettre pour approbation

**Étape 1** : dans les détails de l'Opportunity, trouvez le devis au statut Draft et cliquez sur le bouton **Submit for Approval** (Soumettre pour approbation).

:::note
Ce bouton n'est **visible que lorsque le statut du devis est Draft**. Les devis déjà soumis ou approuvés n'affichent pas ce bouton.
:::

**Étape 2** : le système met automatiquement à jour le statut du devis en **Pending Approval** et déclenche le workflow d'approbation.

**Étape 3** : le manager d'approbation désigné reçoit dans le système une notification de tâche d'approbation.

![02-opportunities-2026-04-07-01-12-20](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-12-20.png)

### Approbation par le manager

Le manager d'approbation, en ouvrant la tâche d'approbation, voit les éléments suivants :

**Carte d'approbation** : présente les informations clés du devis — numéro, nom, montant (devise locale + équivalent USD) et statut actuel.

**Détails de l'approbation** : affichage complet en lecture seule du contenu du devis, comprenant :
- Informations de base (nom du devis, date de validité, devise)
- Association au client et à l'Opportunity
- Tableau imbriqué des produits (produit, quantité, prix unitaire, remise, sous-total)
- Montants récapitulatifs
- Conditions et notes

**Boutons d'action** : le manager d'approbation peut effectuer les opérations suivantes :

| Action | Effet |
|------|------|
| **Approve (Approuver)** | Le statut du devis devient Approved |
| **Reject (Rejeter)** | Le statut du devis devient Rejected, une justification est requise |
| **Return (Retourner)** | Le devis est retourné à son créateur pour modification, statut revient à Draft |
| **Add Approver (Co-signature)** | Ajouter un approbateur supplémentaire |
| **Transfer (Transférer)** | Transférer la tâche d'approbation à une autre personne |

![02-opportunities-2026-04-07-01-13-04](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-04.png)

### Traitement du résultat de l'approbation

- **Approuvé** : le statut du devis devient Approved, vous pouvez passer à l'étape suivante — le transformer en commande officielle.
- **Rejeté / Retourné** : le statut du devis revient à Draft, le créateur peut le modifier et le soumettre à nouveau pour approbation.

![02-opportunities-2026-04-07-01-13-25](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-25.png)

## Du devis à la commande

Lorsque le statut du devis devient **Approved (approuvé)**, un bouton **New Order** (Créer une commande) apparaît dans la zone d'actions du devis.

:::note
Ce bouton n'est **visible que lorsque le statut du devis est Approved**. Les devis en brouillon ou en cours d'approbation ne l'affichent pas.
:::

En cliquant sur **New Order**, le système crée automatiquement un brouillon de commande basé sur les données du devis, incluant les détails produit, montants, informations client, etc., évitant ainsi la double saisie.

![02-opportunities-2026-04-07-01-14-41](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-14-41.png)

---

Une fois le devis approuvé, vous pouvez le transformer en commande officielle. Allez ensuite voir la suite du processus de commande dans [Gestion des commandes](./guide-products-orders).

## Pages associées

- [Guide d'utilisation du CRM](./index.md)
- [Gestion des Lead](./guide-leads)
- [Gestion des commandes](./guide-products-orders)
