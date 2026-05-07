---
title: "Présentation du système et tableaux de bord"
description: "Vue d'ensemble du CRM 2.0 : structure des menus, multilingue et thèmes, tableau de bord d'analyse Analytics, espace de travail Overview."
keywords: "Présentation CRM, tableau de bord, analyse de données, KPI, NocoBase CRM"
---

# Présentation du système et tableaux de bord

> Ce chapitre se concentre sur deux tableaux de bord — Analytics (analyse de données) et Overview (espace de travail quotidien).

## Vue d'ensemble du système

Le CRM 2.0 est un système complet de gestion commerciale, couvrant l'ensemble du processus, de l'acquisition de Lead à la livraison des commandes. Une fois connecté, la barre de menu supérieure constitue votre point d'entrée principal pour la navigation.


### Multilingue et thèmes

Le système prend en charge le changement de langue (en haut à droite), et tous les blocs JS et graphiques ont été adaptés pour le multilingue.

Côté thème, le mode clair et le mode sombre sont tous deux pris en charge, mais nous **recommandons actuellement le mode clair + mode compact**, qui offre une plus grande densité d'informations. Quelques problèmes d'affichage sous le thème sombre seront corrigés ultérieurement.

![00-overview-2026-04-01-23-38-28](https://static-docs.nocobase.com/00-overview-2026-04-01-23-38-28.png)

---

## Analytics — Centre d'analyse de données

Analytics est la première page de la barre de menu, et c'est aussi la première interface que vous voyez chaque jour en ouvrant le système.

### Filtre global

En haut de la page se trouve une barre de filtre comportant deux conditions : **plage de dates** et **responsable (Owner)**. Après filtrage, toutes les cartes KPI et tous les graphiques de la page sont actualisés de manière liée.

![00-overview-2026-04-01-23-40-45](https://static-docs.nocobase.com/00-overview-2026-04-01-23-40-45.png)


### Cartes KPI

Sous la barre de filtre se trouvent 4 cartes KPI :

| Carte | Signification | Comportement au clic |
|------|------|---------|
| **Revenu total** | Montant des revenus cumulés | Popup : graphique en camembert de l'état de paiement + tendance mensuelle des revenus |
| **Nouveaux Lead** | Nombre de nouveaux Lead sur la période | Saute vers la page Lead, filtre automatiquement le statut « New » |
| **Taux de conversion** | Ratio Lead vers transaction | Popup : graphique en camembert de la répartition par étape + graphique en barres des montants |
| **Cycle moyen de transaction** | Nombre moyen de jours entre la création et la transaction | Popup : distribution des cycles + tendance mensuelle des affaires gagnées |

Chaque carte est **cliquable et permet la pénétration** — la popup affiche des graphiques d'analyse plus détaillés. Si vous avez les capacités de personnalisation, vous pouvez continuer à descendre dans le détail (entreprise → département → individu).

![00-overview-2026-04-01-23-42-33](https://static-docs.nocobase.com/00-overview-2026-04-01-23-42-33.gif)

:::tip[Les données ont diminué après le saut ?]
Lorsque vous cliquez sur un KPI pour sauter vers une page de liste, l'URL contient des paramètres de filtre (par exemple `?status=new`). Si vous constatez que les données de la liste sont réduites, c'est parce que ce paramètre est encore actif. Revenez au tableau de bord puis rentrez à nouveau dans la page de liste pour retrouver toutes les données.
:::

![00-overview-2026-04-01-23-44-19](https://static-docs.nocobase.com/00-overview-2026-04-01-23-44-19.png)


### Zone des graphiques

Sous les KPI se trouvent 5 graphiques principaux :

| Graphique | Type | Description | Comportement au clic |
|------|------|------|---------|
| **Distribution des étapes des Opportunity** | Graphique en barres | Quantité, montant, probabilité pondérée de chaque étape | Popup : pénétration en trois dimensions par client / responsable / mois |
| **Entonnoir de vente** | Entonnoir | Conversion Lead → Opportunity → Quotation → Order | Saut vers la page de l'entité correspondante |
| **Tendance mensuelle des ventes** | Barres + courbe | Revenus mensuels, nombre de commandes, prix moyen unitaire | Saut vers la page Orders (avec paramètre de mois) |
| **Tendance de croissance des clients** | Barres + courbe | Nouveaux clients mensuels, clients cumulés | Saut vers la page Customers |
| **Répartition par secteur** | Camembert | Répartition des clients par secteur d'activité | Saut vers la page Customers |

![00-overview-2026-04-01-23-46-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-46-36.png)

#### Entonnoir de vente

Affiche le taux de conversion du pipeline complet Lead → Opportunity → Quotation → Order. Chaque niveau est cliquable et saute vers la page de liste de l'entité correspondante (par exemple, cliquer sur le niveau Opportunity → saut vers la liste des Opportunity).

#### Tendance mensuelle des ventes

Le graphique en barres affiche les revenus de chaque mois, avec une courbe superposée pour le nombre de commandes et le prix moyen par client. Cliquer sur la barre d'un mois → saute vers la page Orders avec le filtre temporel automatique de ce mois (par exemple `?month=2026-02`), pour voir directement les détails des commandes du mois.

#### Tendance de croissance des clients

Le graphique en barres affiche le nombre de nouveaux clients par mois, avec une courbe représentant le total cumulé. Cliquer sur la barre d'un mois → saute vers la page Customers et filtre les nouveaux clients de ce mois.

#### Répartition par secteur

Le camembert affiche la répartition des clients par secteur ainsi que les montants des commandes associés. Cliquer sur un secteur → saute vers la page Customers et filtre les clients de ce secteur.

### Pénétration des étapes d'Opportunity

Cliquer sur la barre d'une étape dans le graphique de distribution des étapes d'Opportunity ouvre une analyse approfondie de cette étape :

- **Tendance mois par mois** : évolution mensuelle des Opportunity à cette étape
- **Par responsable** : qui suit ces Opportunity
- **Par client** : quels clients ont des Opportunity à cette étape
- **Récapitulatif en bas** : cocher des clients permet de voir le montant cumulé

![00-overview-2026-04-01-23-49-04](https://static-docs.nocobase.com/00-overview-2026-04-01-23-49-04.png)


Le contenu de la pénétration de chaque étape (Prospecting / Analysis / Proposal / Negotiation / Won / Lost) est différent et reflète les points d'attention propres à chaque étape.

La question principale à laquelle ce graphique répond est : **À quelle étape l'entonnoir perd-il le plus ?** Si l'étape Proposal accumule un grand nombre d'Opportunity mais que peu passent en Negotiation, cela suggère un possible problème dans le processus de devis.

![00-overview-2026-04-01-23-48-21](https://static-docs.nocobase.com/00-overview-2026-04-01-23-48-21.gif)

### Configuration des graphiques (avancé)

Chaque graphique repose sur trois dimensions de configuration :

1. **Source de données SQL** : détermine ce que le graphique affiche, vérifiable dans le constructeur SQL
2. **Style du graphique** : configuration JSON dans la zone personnalisée, contrôle l'apparence du graphique
3. **Événements** : comportement au clic (popup OpenView / saut de page)

![00-overview-2026-04-01-23-51-00](https://static-docs.nocobase.com/00-overview-2026-04-01-23-51-00.png)


### Filtrage lié

Lorsque vous modifiez n'importe quelle condition dans la barre de filtre supérieure, **toutes les cartes KPI et tous les graphiques de la page sont actualisés simultanément**, sans avoir à les configurer un par un. Cas d'usage typiques :

- **Voir les performances d'une personne** : Owner sélectionné « Zhang San » → toutes les données de la page basculent vers les Lead, Opportunity et Order dont Zhang San est responsable
- **Comparer des périodes** : la date passe de « ce mois-ci » à « ce trimestre » → la plage des graphiques de tendance change en conséquence

La liaison entre la barre de filtre et les graphiques est implémentée via le **flux d'événements de la page** — les variables du formulaire sont injectées avant le rendu, et le SQL des graphiques référence ces variables pour récupérer les valeurs de filtrage.

![00-overview-2026-04-01-23-52-29](https://static-docs.nocobase.com/00-overview-2026-04-01-23-52-29.png)

![00-overview-2026-04-01-23-53-57](https://static-docs.nocobase.com/00-overview-2026-04-01-23-53-57.png)
:::note
Les modèles SQL ne prennent actuellement en charge que la syntaxe `if` pour les jugements conditionnels. Nous vous recommandons de vous référer aux modèles existants dans le système pour les rédiger, ou de demander à l'IA de vous aider à les modifier.
:::

---

## Overview — Espace de travail quotidien

Overview est le second tableau de bord, orienté opérations quotidiennes plutôt qu'analyse de données. Il répond à la question centrale : **Que dois-je faire aujourd'hui ? Quels Lead méritent un suivi ?**

![00-overview-2026-04-01-23-56-07](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-07.png)


### Lead à score élevé

Filtre automatique des Lead avec un score IA ≥ 75 et un statut New / Working (Top 5). Chaque entrée affiche :

- **Jauge du score IA** : un cadran circulaire représente intuitivement la qualité du Lead (vert = score élevé = à suivre en priorité)
- **Prochaine action recommandée par l'IA** : action de suivi recommandée automatiquement par le système en fonction des caractéristiques du Lead (par exemple « Schedule a demo »)
- **Informations de base sur le Lead** : nom, entreprise, source, date de création

Cliquer sur le nom du Lead saute vers les détails, cliquer sur « Voir tout » saute vers la page de liste des Lead. Un coup d'œil chaque matin sur ce tableau et vous savez qui contacter en priorité aujourd'hui.

![00-overview-2026-04-01-23-56-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-36.png)

### Tâches du jour

Liste des activités du jour (réunions, appels, tâches, etc.), avec prise en charge de :

- **Validation en un clic** : cliquez sur « Done » pour marquer la tâche comme terminée, elle apparaît grisée
- **Rappel de retard** : les tâches en retard non terminées sont surlignées en rouge
- **Voir les détails** : cliquez sur le nom de la tâche pour accéder aux détails
- **Créer une nouvelle tâche** : créez directement une nouvelle activité ici

![00-overview-2026-04-01-23-57-09](https://static-docs.nocobase.com/00-overview-2026-04-01-23-57-09.png)

### Calendrier des activités

Vue calendrier FullCalendar, avec couleurs distinctes par type d'activité (réunion / appel / tâche / email / note). Prend en charge le basculement mois / semaine / jour, le glisser-déposer pour reprogrammer, et le clic pour voir les détails.

![00-overview-2026-04-01-23-58-02](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-02.gif)

---

## Autres tableaux de bord (More Charts)

Le menu propose également trois tableaux de bord destinés à différents rôles, fournis à titre de référence et que vous pouvez conserver ou masquer selon vos besoins :

| Tableau de bord | Utilisateur cible | Particularités |
|--------|---------|------|
| **SalesManager** | Responsable des ventes | Classement de l'équipe, nuage de points des risques, objectifs mensuels |
| **SalesRep** | Commercial | Données filtrées automatiquement par utilisateur courant, ne voit que ses propres performances |
| **Executive** | Direction | Prévision de revenus, santé client, tendances Win/Loss |

![00-overview-2026-04-01-23-58-39](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-39.png)

Les tableaux de bord inutiles peuvent être masqués dans le menu, sans impact sur les fonctionnalités du système.

![00-overview-2026-04-02-00-02-39](https://static-docs.nocobase.com/00-overview-2026-04-02-00-02-39.png)

---

## Pénétration des KPI (Drill-through)

Vous avez peut-être déjà remarqué que presque chaque chiffre, chaque graphique présenté ci-dessus est « cliquable ». C'est le mode d'interaction central du CRM — la **pénétration des KPI** : cliquer sur un chiffre récapitulatif → voir les données détaillées qui se cachent derrière.

La pénétration prend deux formes :

| Forme | Cas d'usage | Exemple |
|------|---------|------|
| **Pénétration en popup** | Analyse comparative multidimensionnelle | Cliquer sur « Revenu total » → popup affichant camembert + tendance |
| **Saut de page** | Voir et opérer sur les enregistrements détaillés | Cliquer sur « Nouveaux Lead » → saute vers la liste Leads |

**Exemple d'opération** : dans le graphique « Tendance mensuelle des ventes » d'Analytics, vous remarquez que la barre des revenus de février est nettement plus basse → vous cliquez sur cette barre → le système saute vers la page Orders avec automatiquement `mois = 2026-02` → vous voyez directement le détail de toutes les commandes de février et pouvez en analyser la cause.

> Le tableau de bord ne sert pas seulement à « regarder », c'est le centre de navigation de tout le système. Chaque chiffre est un point d'entrée qui vous guide du macro au micro, couche après couche, jusqu'à la racine du problème.

---

Maintenant que vous avez compris la vue d'ensemble du système et les tableaux de bord, passons au processus métier principal — en commençant par la [gestion des Lead](./guide-leads).

## Pages associées

- [Guide d'utilisation du CRM](./index.md)
- [Gestion des Lead](./guide-leads)
- [Employés IA](./guide-ai)
