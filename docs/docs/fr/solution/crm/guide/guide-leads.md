---
title: "Gestion des Lead"
description: "Guide d'utilisation de la gestion des Lead du CRM : création des Lead, notation automatique par l'IA, filtrage intelligent, conversion de Lead en Customer et Opportunity."
keywords: "Gestion des Lead, Lead, notation IA, conversion de Lead, entonnoir de vente, NocoBase CRM"
---

# Gestion des Lead

> Le Lead est le point de départ du processus de vente — chaque premier contact avec un client potentiel commence ici. Ce chapitre vous fait parcourir le cycle de vie complet d'un Lead : création, notation, filtrage, suivi, conversion.

![cn_01-leads](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_01-leads.png)

## Aperçu de la page Lead

Dans le menu supérieur, cliquez sur **Ventes → Leads** pour accéder à la page de gestion des Lead.

![01-leads-2026-04-02-00-04-18](https://static-docs.nocobase.com/01-leads-2026-04-02-00-04-18.png)

En haut de la page se trouve une rangée de **boutons de filtrage intelligent** qui vous aident à basculer rapidement entre différentes vues :

Premier groupe :

| Bouton | Description |
|------|------|
| All | Afficher tous les Lead |
| New | Statut nouveau, suivi non encore commencé |
| Working | En cours de suivi |
| Qualified | Confirmé comme Lead qualifié |
| Unqualified | Marqué comme non qualifié |

Deuxième groupe :

| Étiquette | Signification |
|------|------|
| 🔥 Hot | Lead à score élevé avec score IA ≥ 75 |
| Aujourd'hui | Lead créés aujourd'hui |
| Cette semaine | Lead créés cette semaine |
| Ce mois | Lead créés ce mois-ci |
| Non assigné | Lead sans Owner désigné |
| Grands comptes | Lead provenant de clients grands comptes |


![01-leads-2026-04-02-00-06-19](https://static-docs.nocobase.com/01-leads-2026-04-02-00-06-19.gif)


Le tableau permet d'obtenir d'un coup d'œil les informations clés, avec des colonnes composées :

- **Jauge du score IA** : cadran circulaire de 0–100, rouge (faible) → jaune (moyen) → vert (élevé), reflétant intuitivement la qualité du Lead
- **Colonne composée Nom + Entreprise** : nom et nom de l'entreprise affichés ensemble, économisant de l'espace
- **Colonne composée Email + Téléphone** : coordonnées en un coup d'œil
- **Colonne de temps relatif** : affiche des temps relatifs comme « il y a 3 heures » ou « il y a 2 jours », les Lead en retard sont surlignés en rouge pour vous rappeler de les suivre rapidement

![01-leads-2026-04-02-00-07-04](https://static-docs.nocobase.com/01-leads-2026-04-02-00-07-04.gif)

## Créer un Lead

Cliquez sur le bouton **Add new** au-dessus du tableau pour ouvrir le formulaire de création de Lead.

![01-leads-2026-04-02-00-08-08](https://static-docs.nocobase.com/01-leads-2026-04-02-00-08-08.png)

Renseignez les informations suivantes :

| Champ | Description | Obligatoire |
|------|------|---------|
| Name | Nom du Lead | ✅ |
| Company | Entreprise d'appartenance | Recommandé |
| Email | Adresse email | Recommandé |
| Phone | Numéro de téléphone | Recommandé |
| Source | Source du Lead (formulaire web, salon, recommandation, etc.) | Recommandé |
...

### Détection de doublons en temps réel

Pendant que vous remplissez le formulaire, le système effectue en temps réel une détection de doublons sur les champs nom, entreprise, email, téléphone, mobile, etc. À la saisie, si des enregistrements correspondants existent déjà :

- **Avertissement jaune** : un enregistrement similaire a été trouvé, nous vous recommandons de vérifier
- **Avertissement rouge** : un enregistrement totalement identique a été trouvé, vous êtes fortement encouragé à examiner d'abord l'enregistrement existant

![01-leads-2026-04-02-00-11-05](https://static-docs.nocobase.com/01-leads-2026-04-02-00-11-05.png)


Cela évite efficacement qu'une même personne soit saisie plusieurs fois.

### Remplissage du formulaire par IA

Si vous disposez d'un texte de carte de visite ou d'un enregistrement de conversation, inutile de saisir chaque champ manuellement — cliquez sur le bouton IA, sélectionnez « Remplissage du formulaire », collez le texte, et l'IA extraira automatiquement le nom, l'entreprise, l'email, le téléphone, etc., et remplira le formulaire en un clic.

Une fois le remplissage terminé, cliquez sur **Submit** pour enregistrer.

![01-leads-2026-04-02-00-15-14](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-14.png)

### Notation automatique par l'IA

Après l'enregistrement, le système déclenche automatiquement le **workflow de notation IA**. L'IA analyse globalement les différentes informations du Lead et génère les résultats suivants :

| Sortie IA | Description |
|---------|------|
| Score | Note globale de 0–100 |
| Conversion Probability | Probabilité de conversion prédite |
| NBA (action recommandée) | Recommandation de suivi donnée par l'IA, par exemple « Contacter par téléphone dans les 24 heures » |
| Tags | Étiquettes générées automatiquement, comme « Forte intention », « Décideur », etc. |

![01-leads-2026-04-02-00-15-53](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-53.png)

> 💡 **Astuce** : plus le score IA est élevé, meilleure est la qualité du Lead. Nous vous recommandons de suivre en priorité les Lead Hot (≥ 75 points) et de concentrer vos efforts sur les clients les plus susceptibles de signer.

## Filtrage et recherche

Les boutons de filtrage intelligent en haut prennent en charge le **filtrage en temps réel** — l'effet est immédiat au clic, sans nécessité de rafraîchir la page.

Quelques scénarios courants :

- **Démarrage matinal** : cliquez sur « Aujourd'hui » pour voir les Lead arrivés aujourd'hui, puis sur « Hot » pour vérifier s'il y a des Lead à score élevé à suivre immédiatement
- **Attribution des Lead** : cliquez sur « Non assigné » pour trouver les Lead sans Owner, et attribuez-les un par un à vos collègues commerciaux
- **Filtrage de revue** : cliquez sur « Unqualified » pour passer en revue les Lead marqués comme non qualifiés et vérifier s'il n'y a pas d'erreurs de jugement

> 💡 **Astuce** : le système prend en charge le filtrage direct via paramètres d'URL. Par exemple, accéder à la page Lead avec `?status=new` sélectionne automatiquement le bouton de filtre « New ». C'est très pratique lors de sauts depuis d'autres pages.

## Détails du Lead

En cliquant sur n'importe quel Lead dans le tableau, vous ouvrez la popup des détails. Cette popup contient **3 onglets** :

### Onglet Détails

C'est l'onglet le plus riche en informations, contenant de haut en bas :

![01-leads-2026-04-02-00-17-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-36.png)

**Progression d'étape et boutons d'action**

La zone supérieure contient la barre de progression d'étape et les boutons d'action (Edit / Convert / Lost / Assign). Barre de progression d'étape :

```
New → Working → Converted / Lost
```

Vous pouvez **cliquer directement sur l'étape correspondante** pour faire avancer le statut du Lead. Par exemple, lors du début du suivi, cliquez sur « Working » ; après avoir confirmé que le Lead est qualifié, cliquez sur « Converted » pour déclencher le processus de conversion.

![01-leads-2026-04-02-00-23-03](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-03.png)

Si une cible existe déjà (Customer, Contact, Opportunity), recherchez et sélectionnez-la directement. Sinon, cliquez sur le bouton de création à droite de la zone de saisie, ce qui ouvre une popup de création remplie automatiquement avec le contenu associé au Lead.
![01-leads-2026-04-07-00-14-21](https://static-docs.nocobase.com/01-leads-2026-04-07-00-14-21.gif)


Cliquer sur « Lost » ouvre une boîte de dialogue qui vous permet de saisir la raison de la perte — utile pour l'analyse rétrospective ultérieure.

![01-leads-2026-04-02-00-23-25](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-25.png)


**Carte de score IA**

Affiche les détails du score IA, incluant :
- Jauge AI Score (0–100)
- Conversion Probability (probabilité de conversion)
- Pipeline Days (nombre de jours dans le pipeline)
- NBA (action recommandée)

**Zone des badges**

Affiche en badges colorés des attributs clés tels que Rating (évaluation), Status (statut), Source (source).

**Informations de base et boutons d'activité rapide**

Champs de base comme les informations sur l'entreprise et les coordonnées. Cette zone comporte également un groupe de boutons d'activité rapide : Log Call (consigner un appel), Send Email (envoyer un email), Schedule (créer un rendez-vous). Les actions sont automatiquement associées au Lead courant.

**AI Insights**

Insights d'analyse et recommandations de suivi générés par l'IA.

**Zone des commentaires**

Les membres de l'équipe peuvent y laisser des commentaires et discuter ; tous les commentaires sont automatiquement migrés vers le Customer nouvellement créé après la conversion du Lead.

![01-leads-2026-04-02-00-24-10](https://static-docs.nocobase.com/01-leads-2026-04-02-00-24-10.png)

### Onglet Email

Affiche tous les emails échangés avec ce Lead, pour faciliter la révision de l'historique de communication. Permet d'envoyer des emails directement depuis cet onglet, avec un bouton d'assistance IA.

![01-leads-2026-04-02-00-17-57](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-57.png)

### Onglet Historique des changements

Enregistre toutes les modifications de champs de ce Lead, à la précision « qui a changé quel champ de A à B et à quel moment ». Utile pour la traçabilité et l'analyse rétrospective.

![01-leads-2026-04-02-00-22-07](https://static-docs.nocobase.com/01-leads-2026-04-02-00-22-07.png)


## Conversion de Lead

C'est l'opération **la plus centrale** de la gestion des Lead — convertir en un clic un Lead qualifié en Customer, Contact et Opportunity.

### Comment convertir

Dans la popup des détails du Lead, cliquez sur l'étape **Converted** dans le composant de progression d'étape.

![01-leads-2026-04-02-00-26-01](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-01.png)

### Processus de conversion

Le système déclenche automatiquement le **workflow de conversion de Lead**, qui exécute en une seule fois les opérations suivantes :

1. **Créer un Customer** — créer un nouvel enregistrement Customer avec le nom de l'entreprise du Lead, le nom / secteur / taille / adresse étant remplis automatiquement à partir du Lead, avec détection de doublon
2. **Créer un Contact** — créer un Contact avec le nom, l'email, le téléphone et la fonction du Lead, et l'associer au Customer
3. **Créer une Opportunity** — créer un nouvel enregistrement Opportunity, avec nom / source / montant / étape remplis automatiquement à partir du Lead, et associé au Customer
4. **Migrer les commentaires** — tous les commentaires du Lead sont copiés automatiquement vers les enregistrements nouvellement créés
5. **Mettre à jour le statut du Lead** — le statut du Lead est marqué comme Qualified

### Effet après conversion

Une fois la conversion terminée, en revenant à la liste des Lead, vous constatez que la **colonne composée Nom + Entreprise** de ce Lead est devenue un lien cliquable :

- Cliquer sur le nom → saute vers les détails du Contact
- Cliquer sur le nom de l'entreprise → saute vers les détails du Customer

![01-leads-2026-04-02-00-26-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-36.png)

> 💡 **Astuce** : la conversion est une opération irréversible. Avant la conversion, veuillez vous assurer que les informations du Lead sont précises et complètes, en particulier le nom de l'entreprise et les coordonnées — celles-ci deviennent directement les données initiales du Customer et du Contact.

## Attribution automatique

Lorsqu'un Lead n'a pas d'Owner désigné, le système déclenche automatiquement le **workflow d'attribution de Lead**.

La logique d'attribution est simple : **attribuer automatiquement au commercial ayant actuellement le moins de Lead en main**, afin de garantir une charge de travail équilibrée au sein de l'équipe.

Ce workflow s'exécute à la création et à la mise à jour des Lead — si le champ Owner est vide, l'attribution automatique est déclenchée.

> 💡 **Astuce** : si vous souhaitez désigner manuellement l'Owner, modifiez simplement le champ Owner dans les détails. L'attribution manuelle écrase le résultat de l'attribution automatique.

---

Une fois la conversion du Lead terminée, vos Customer et Opportunity sont prêts. Allez maintenant voir comment faire avancer l'entonnoir de vente dans [Opportunity et devis](./guide-opportunities).

## Pages associées

- [Vue d'ensemble du guide d'utilisation du CRM](./index.md)
- [Opportunity et devis](./guide-opportunities)
- [Gestion des Customer](./guide-customers-emails)
